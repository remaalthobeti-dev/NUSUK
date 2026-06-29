-- ============================================================
-- MIGRATION 004 — Phase 1: RBAC Roles + Status System Redesign
-- ============================================================
-- Run this on top of migrations 001–003.
-- Idempotent: safe to re-run after any partial failure.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- STEP 0: Tear down ALL objects that depend on the enum types
-- being changed.  Must happen BEFORE any ALTER COLUMN TYPE or
-- DROP TYPE, and BEFORE any DROP FUNCTION / DROP VIEW.
--
-- Dependency chain:
--   RLS policies → current_employee_role() → user_role type
--   v_employee_stats view → employees.role column (user_role type)
--   v_employee_stats view → employee_presence.availability_status (availability_status type)
--   v_team_stats view     → employee_presence.availability_status (availability_status type)
-- ──────────────────────────────────────────────────────────────

-- Drop every policy that calls current_employee_role() or uses
-- old enum literals.  IF EXISTS makes each line a no-op on re-run.
DROP POLICY IF EXISTS "teams_insert"         ON teams;
DROP POLICY IF EXISTS "teams_update"         ON teams;
DROP POLICY IF EXISTS "teams_delete"         ON teams;
DROP POLICY IF EXISTS "employees_insert"     ON employees;
DROP POLICY IF EXISTS "employees_update"     ON employees;
DROP POLICY IF EXISTS "employees_delete"     ON employees;
DROP POLICY IF EXISTS "tasks_update"         ON tasks;
DROP POLICY IF EXISTS "tasks_delete"         ON tasks;
DROP POLICY IF EXISTS "statuses_insert"      ON statuses;
DROP POLICY IF EXISTS "statuses_update"      ON statuses;
DROP POLICY IF EXISTS "statuses_delete"      ON statuses;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
DROP POLICY IF EXISTS "presence_update"      ON employee_presence;
DROP POLICY IF EXISTS "activity_logs_select" ON activity_logs;

-- Drop views that reference enum-typed columns
-- (view columns inherit the column type; PostgreSQL won't alter the
-- underlying column type while a view holds a dependency on it)
DROP VIEW IF EXISTS v_employee_stats;
DROP VIEW IF EXISTS v_team_stats;

-- Drop the helper function whose return type is user_role
-- (blocks DROP TYPE user_role; must come after policies are gone)
DROP FUNCTION IF EXISTS current_employee_role();

-- Drop column defaults — executed as TOP-LEVEL statements, outside any
-- DO block, so they are guaranteed to commit to the catalog before the
-- ALTER COLUMN TYPE runs.  Both are no-ops if the default was already
-- removed by a previous run.
ALTER TABLE employees        ALTER COLUMN role                DROP DEFAULT;
ALTER TABLE employee_presence ALTER COLUMN availability_status DROP DEFAULT;

-- Clean up any orphaned v2 types left behind by a previous failed run
DROP TYPE IF EXISTS user_role_v2;
DROP TYPE IF EXISTS availability_status_v2;

-- ──────────────────────────────────────────────────────────────
-- STEP 1: Migrate user_role enum values
--   admin      → super_admin
--   supervisor → track_manager
--   employee   → team_member
-- ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Guard: only run when old enum labels still exist
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'admin'
  ) THEN

    CREATE TYPE user_role_v2 AS ENUM ('super_admin', 'track_manager', 'team_member');

    -- Default is already dropped by the top-level statement above;
    -- the USING clause handles all existing row values.
    ALTER TABLE employees
      ALTER COLUMN role TYPE user_role_v2
      USING CASE role::text
        WHEN 'admin'      THEN 'super_admin'::user_role_v2
        WHEN 'supervisor' THEN 'track_manager'::user_role_v2
        WHEN 'employee'   THEN 'team_member'::user_role_v2
        ELSE                   'team_member'::user_role_v2
      END;

    -- No dependencies on user_role remain; safe to drop
    DROP TYPE user_role;
    ALTER TYPE user_role_v2 RENAME TO user_role;

  END IF;
END $$;

-- Restore default (SET is idempotent; safe on first run and re-run)
ALTER TABLE employees ALTER COLUMN role SET DEFAULT 'team_member'::user_role;

-- ──────────────────────────────────────────────────────────────
-- STEP 2: Migrate availability_status enum values
--   break          → offline
--   meeting        → in_meeting
--   outside_office → field_work
--   available / busy / remote — unchanged
-- ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'availability_status' AND e.enumlabel = 'meeting'
  ) THEN

    CREATE TYPE availability_status_v2 AS ENUM (
      'available', 'busy', 'in_meeting', 'field_work', 'remote', 'offline'
    );

    ALTER TABLE employee_presence
      ALTER COLUMN availability_status TYPE availability_status_v2
      USING CASE availability_status::text
        WHEN 'available'      THEN 'available'::availability_status_v2
        WHEN 'busy'           THEN 'busy'::availability_status_v2
        WHEN 'break'          THEN 'offline'::availability_status_v2
        WHEN 'meeting'        THEN 'in_meeting'::availability_status_v2
        WHEN 'outside_office' THEN 'field_work'::availability_status_v2
        WHEN 'remote'         THEN 'remote'::availability_status_v2
        ELSE                       'available'::availability_status_v2
      END;

    DROP TYPE availability_status;
    ALTER TYPE availability_status_v2 RENAME TO availability_status;

  END IF;
END $$;

ALTER TABLE employee_presence
  ALTER COLUMN availability_status SET DEFAULT 'available'::availability_status;

-- ──────────────────────────────────────────────────────────────
-- STEP 3: Add new columns (idempotent via IF NOT EXISTS)
-- ──────────────────────────────────────────────────────────────

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS job_title TEXT;

ALTER TABLE employee_presence
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

ALTER TABLE employee_presence
  ADD COLUMN IF NOT EXISTS context JSONB;

-- Backfill started_at from updated_at for any existing rows
UPDATE employee_presence
  SET started_at = updated_at
  WHERE started_at IS NULL;

-- Enforce NOT NULL + default going forward
ALTER TABLE employee_presence
  ALTER COLUMN started_at SET DEFAULT now();

ALTER TABLE employee_presence
  ALTER COLUMN started_at SET NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- STEP 4: Recreate helper functions with new type signatures
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_employee_role()
RETURNS user_role AS $$
  SELECT role FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_employee_id()
RETURNS UUID AS $$
  SELECT id FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ──────────────────────────────────────────────────────────────
-- STEP 5: Recreate ALL RLS policies with new role values
-- Covers every policy dropped in Step 0, including policies
-- originally created in migrations 001 and 002.
-- ──────────────────────────────────────────────────────────────

-- Teams
CREATE POLICY "teams_insert" ON teams FOR INSERT TO authenticated
  WITH CHECK (current_employee_role() = 'super_admin');
CREATE POLICY "teams_update" ON teams FOR UPDATE TO authenticated
  USING (current_employee_role() = 'super_admin');
CREATE POLICY "teams_delete" ON teams FOR DELETE TO authenticated
  USING (current_employee_role() = 'super_admin');

-- Employees
CREATE POLICY "employees_insert" ON employees FOR INSERT TO authenticated
  WITH CHECK (current_employee_role() = 'super_admin');
CREATE POLICY "employees_update" ON employees FOR UPDATE TO authenticated
  USING (
    current_employee_role() IN ('super_admin', 'track_manager')
    OR id = current_employee_id()
  );
CREATE POLICY "employees_delete" ON employees FOR DELETE TO authenticated
  USING (current_employee_role() = 'super_admin');

-- Tasks (update + delete; select/insert policies have no enum dependency)
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
  USING (
    current_employee_role() IN ('super_admin', 'track_manager')
    OR assigned_to = current_employee_id()
    OR created_by = current_employee_id()
  );
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated
  USING (current_employee_role() IN ('super_admin', 'track_manager'));

-- Statuses
CREATE POLICY "statuses_insert" ON statuses FOR INSERT TO authenticated
  WITH CHECK (current_employee_role() = 'super_admin');
CREATE POLICY "statuses_update" ON statuses FOR UPDATE TO authenticated
  USING (current_employee_role() = 'super_admin');
CREATE POLICY "statuses_delete" ON statuses FOR DELETE TO authenticated
  USING (current_employee_role() = 'super_admin');

-- Notifications (select + delete dropped in Step 0)
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (
    recipient_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  );
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated
  USING (
    recipient_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  );

-- Employee presence (update dropped in Step 0)
CREATE POLICY "presence_update" ON employee_presence FOR UPDATE TO authenticated
  USING (
    employee_id = current_employee_id()
    OR current_employee_role() IN ('super_admin', 'track_manager')
  );

-- Activity logs
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT TO authenticated
  USING (
    current_employee_role() IN ('super_admin', 'track_manager')
    OR actor_id = current_employee_id()
  );

-- ──────────────────────────────────────────────────────────────
-- STEP 6: Recreate analytics views with updated column list
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_employee_stats AS
SELECT
  e.id,
  e.full_name,
  e.email,
  e.role,
  e.job_title,
  e.team_id,
  t.name  AS team_name,
  t.color AS team_color,
  ep.availability_status,
  ep.workload_percent,
  ep.started_at  AS status_started_at,
  ep.context     AS status_context,
  ep.updated_at  AS presence_updated_at,
  COUNT(tk.id) FILTER (WHERE tk.status = 'in_progress') AS active_tasks,
  COUNT(tk.id) FILTER (WHERE tk.status = 'completed')   AS completed_tasks
FROM employees e
LEFT JOIN teams t              ON t.id = e.team_id
LEFT JOIN employee_presence ep ON ep.employee_id = e.id
LEFT JOIN tasks tk             ON tk.assigned_to = e.id
WHERE e.is_active = true
GROUP BY
  e.id, e.full_name, e.email, e.role, e.job_title, e.team_id,
  t.name, t.color,
  ep.availability_status, ep.workload_percent,
  ep.started_at, ep.context, ep.updated_at;

CREATE OR REPLACE VIEW v_team_stats AS
SELECT
  t.id,
  t.name,
  t.color,
  t.icon,
  COUNT(DISTINCT e.id) AS employee_count,
  COUNT(DISTINCT e.id) FILTER (WHERE ep.availability_status IS NOT NULL) AS present_count,
  ROUND(AVG(ep.workload_percent) FILTER (WHERE ep.workload_percent IS NOT NULL)) AS avg_workload,
  COUNT(tk.id) FILTER (WHERE tk.status = 'in_progress') AS active_tasks,
  COUNT(tk.id) FILTER (WHERE tk.status = 'completed' AND tk.completed_at >= CURRENT_DATE) AS completed_today
FROM teams t
LEFT JOIN employees e          ON e.team_id = t.id AND e.is_active = true
LEFT JOIN employee_presence ep ON ep.employee_id = e.id
LEFT JOIN tasks tk             ON tk.team_id = t.id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.color, t.icon;

GRANT SELECT ON v_employee_stats TO authenticated;
GRANT SELECT ON v_team_stats     TO authenticated;

-- ──────────────────────────────────────────────────────────────
-- STEP 7: Seed job titles (AND job_title IS NULL prevents
-- overwriting values set manually on re-run)
-- ──────────────────────────────────────────────────────────────

UPDATE employees SET job_title = 'مدير عمليات البطاقات'     WHERE email = 'admin@nusuk.sa'               AND job_title IS NULL;
UPDATE employees SET job_title = 'مشرفة مسار العلاقات'       WHERE email = 'sara.zahrani@nusuk.sa'        AND job_title IS NULL;
UPDATE employees SET job_title = 'مشرف فريق التوزيع'         WHERE email = 'khaled.mutairi@nusuk.sa'      AND job_title IS NULL;
UPDATE employees SET job_title = 'مشرفة الفريق التقني'       WHERE email = 'nora.harbi@nusuk.sa'          AND job_title IS NULL;
UPDATE employees SET job_title = 'مشرف إدارة التشغيل'        WHERE email = 'abdulrahman.qahtani@nusuk.sa' AND job_title IS NULL;
UPDATE employees SET job_title = 'أخصائية علاقات عملاء'      WHERE email = 'fatima.shamri@nusuk.sa'       AND job_title IS NULL;
UPDATE employees SET job_title = 'أخصائي علاقات عملاء'       WHERE email = 'omar.dosari@nusuk.sa'         AND job_title IS NULL;
UPDATE employees SET job_title = 'موظفة توزيع ميداني'         WHERE email = 'munira.otaibi@nusuk.sa'       AND job_title IS NULL;
UPDATE employees SET job_title = 'موظف توزيع ميداني'          WHERE email = 'bandar.ghamdi@nusuk.sa'       AND job_title IS NULL;
UPDATE employees SET job_title = 'مهندسة أنظمة'              WHERE email = 'reem.anazi@nusuk.sa'          AND job_title IS NULL;
UPDATE employees SET job_title = 'مهندس دعم تقني'            WHERE email = 'sultan.rashidi@nusuk.sa'      AND job_title IS NULL;
UPDATE employees SET job_title = 'محللة أداء تشغيلي'         WHERE email = 'haya.maliki@nusuk.sa'         AND job_title IS NULL;
