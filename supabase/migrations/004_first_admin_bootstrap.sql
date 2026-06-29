-- ============================================================
-- 004_first_admin_bootstrap.sql
-- First-admin bootstrap for handle_new_auth_user trigger.
--
-- Problem this solves:
--   Every signup unconditionally created a pending
--   registration_request, even for the very first user who
--   should become the Super Admin.  That user ended up stuck
--   on /pending-approval with no way to self-approve.
--
-- Solution:
--   On each new auth.users INSERT, check whether an active,
--   linked Super Admin already exists.  If not, this is the
--   first real user — create their employees row directly as
--   super_admin and skip the registration_request entirely.
--   Once one linked Super Admin exists the gate closes and
--   every subsequent signup follows the normal approval flow.
--
-- Race-condition safety:
--   pg_advisory_xact_lock(2026000004) serializes the EXISTS
--   check + INSERT inside the trigger.  Two concurrent signups
--   cannot both pass the check before either commits: the second
--   transaction blocks on the lock, then re-evaluates EXISTS()
--   after the first commits and correctly takes the normal path.
--   The lock is transaction-scoped and released automatically on
--   commit or rollback.
--
-- Idempotency:
--   CREATE OR REPLACE on the function and the DO block guards
--   make this safe to run multiple times on the same database.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. Replace the trigger function
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_linked_admin_exists boolean;
BEGIN
  -- Serialize the bootstrap critical section across concurrent
  -- transactions.  Without this lock, two simultaneous signups
  -- on an empty database could both pass the EXISTS() check
  -- before either commits, producing two super_admin rows.
  --
  -- The lock key (2026000004) is an arbitrary fixed bigint that
  -- must not collide with any other advisory lock in the system.
  -- It is transaction-scoped: released automatically on commit
  -- or rollback, so it cannot cause a permanent deadlock.
  PERFORM pg_advisory_xact_lock(2026000004);

  -- Determine whether a Super Admin with a live auth link exists.
  -- Evaluated AFTER acquiring the lock so concurrent transactions
  -- see each other's committed rows.
  -- user_id IS NOT NULL is the gate: seeded placeholder rows
  -- (user_id = NULL) are intentionally invisible to this check.
  SELECT EXISTS (
    SELECT 1
    FROM employees
    WHERE role      = 'super_admin'
      AND user_id   IS NOT NULL
      AND is_active = true
  ) INTO v_linked_admin_exists;

  IF NOT v_linked_admin_exists THEN
    -- ── Bootstrap path ────────────────────────────────────────
    -- No Super Admin exists yet.  This signup is the first real
    -- user; promote them immediately.
    --
    -- Insert a new employees row rather than reusing any seeded
    -- placeholder, so the bootstrap works on databases that were
    -- never seeded and on those that were.
    INSERT INTO employees (
      user_id,
      full_name,
      email,
      role,
      is_active
    ) VALUES (
      NEW.id,
      COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        split_part(NEW.email, '@', 1)
      ),
      NEW.email,
      'super_admin',
      true
    );
    -- Deliberately do NOT insert into registration_requests.

  ELSE
    -- ── Normal approval path ──────────────────────────────────
    -- A Super Admin already exists.  This user must wait for
    -- approval before accessing the dashboard.
    INSERT INTO registration_requests (auth_user_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        split_part(NEW.email, '@', 1)
      ),
      NEW.email
    )
    ON CONFLICT DO NOTHING;

  END IF;

  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 2. Ensure the trigger is attached (idempotent)
-- ─────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();


-- ─────────────────────────────────────────────────────────────
-- 3. One-time backfill
--
-- Fixes accounts that signed up before this migration and are
-- now stuck in /pending-approval because the old trigger created
-- a pending request instead of promoting them.
--
-- Logic:
--   • Skip entirely if a linked Super Admin already exists
--     (safe re-run guard).
--   • Otherwise find the earliest auth.users row that has a
--     pending registration_request and no employees link.
--     That is the first real user who was incorrectly deferred.
--   • Create their employees row as super_admin.
--   • Delete their pending registration_request.
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_linked_admin_exists boolean;
  v_auth_id             uuid;
  v_email               text;
  v_full_name           text;
  v_emp_id              uuid;
BEGIN
  -- Re-run guard: if a linked Super Admin already exists, nothing to do.
  SELECT EXISTS (
    SELECT 1
    FROM employees
    WHERE role      = 'super_admin'
      AND user_id   IS NOT NULL
      AND is_active = true
  ) INTO v_linked_admin_exists;

  IF v_linked_admin_exists THEN
    RAISE NOTICE '004_backfill: linked super_admin already exists — skipping.';
    RETURN;
  END IF;

  -- Find the earliest signup that is pending and has no employee link.
  SELECT au.id, au.email,
         COALESCE(
           NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
           split_part(au.email, '@', 1)
         )
  INTO   v_auth_id, v_email, v_full_name
  FROM   auth.users au
  JOIN   registration_requests rr
    ON   rr.auth_user_id = au.id
   AND   rr.status       = 'pending'
  WHERE  NOT EXISTS (
           SELECT 1 FROM employees e WHERE e.user_id = au.id
         )
  ORDER BY au.created_at ASC
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RAISE NOTICE '004_backfill: no pending unlinked signup found — nothing to do.';
    RETURN;
  END IF;

  -- Create the Super Admin employee row.
  INSERT INTO employees (user_id, full_name, email, role, is_active)
  VALUES (v_auth_id, v_full_name, v_email, 'super_admin', true)
  RETURNING id INTO v_emp_id;

  -- Remove the spurious pending request.
  DELETE FROM registration_requests
  WHERE  auth_user_id = v_auth_id
    AND  status       = 'pending';

  RAISE NOTICE '004_backfill: promoted % (auth %, employee %) to super_admin.',
    v_email, v_auth_id, v_emp_id;
END;
$$;
