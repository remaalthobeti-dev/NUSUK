-- ============================================================
-- 003_bootstrap_admin.sql
-- Fix handle_new_auth_user so that a signup whose email already
-- matches an active employees row (seeded without user_id) is
-- treated as a pre-approved admin rather than a new applicant.
--
-- Without this, every seeded employee who signs up via Supabase
-- Auth ends up in pending-approval instead of the dashboard,
-- because:
--   1. seed rows are inserted with user_id = NULL
--   2. the trigger blindly inserts a registration_request
--   3. layout.tsx queries employees by user_id → zero rows
--   4. layout redirects to /pending-approval
--
-- Fix logic (runs inside the existing AFTER INSERT ON auth.users
-- trigger):
--   IF employees.email = NEW.email AND user_id IS NULL EXISTS
--     → UPDATE employees SET user_id = NEW.id
--     → do NOT insert registration_request (user is pre-approved)
--   ELSE
--     → INSERT registration_request with status = 'pending' (normal flow)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id uuid;
BEGIN
  -- Check for a pre-seeded employee row with the same email and no
  -- auth link yet.  is_active check ensures deactivated/removed
  -- employees don't bypass the approval flow.
  SELECT id INTO v_employee_id
  FROM employees
  WHERE email = NEW.email
    AND user_id IS NULL
    AND is_active = true
  LIMIT 1;

  IF v_employee_id IS NOT NULL THEN
    -- Pre-approved: link the auth account to the existing employee row.
    -- No registration_request is created — this user goes straight to
    -- the dashboard on first login.
    UPDATE employees
    SET user_id = NEW.id
    WHERE id = v_employee_id;
  ELSE
    -- Normal signup flow: create a pending registration request.
    INSERT INTO registration_requests (auth_user_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Backfill: fix any already-signed-up accounts that are stuck in
-- pending because the old trigger ran before this migration.
--
-- For each auth.users row whose email matches an employees row
-- with user_id IS NULL, link them now.  Also delete the spurious
-- pending registration_request that the old trigger created.
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT au.id AS auth_id, e.id AS emp_id, au.email
    FROM auth.users au
    JOIN employees e
      ON e.email = au.email
     AND e.user_id IS NULL
     AND e.is_active = true
  LOOP
    -- Link the employee row to the auth account.
    UPDATE employees
    SET user_id = r.auth_id
    WHERE id = r.emp_id;

    -- Remove the spurious pending request created by the old trigger.
    -- Only remove 'pending' rows — leave 'approved'/'rejected' ones
    -- untouched in case an admin manually acted on them.
    DELETE FROM registration_requests
    WHERE auth_user_id = r.auth_id
      AND status = 'pending';

    RAISE NOTICE 'Linked auth user % to employee % (%)', r.auth_id, r.emp_id, r.email;
  END LOOP;
END;
$$;
