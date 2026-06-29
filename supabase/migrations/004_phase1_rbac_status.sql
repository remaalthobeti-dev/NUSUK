-- ============================================================
-- MIGRATION 004 — Phase 1: RBAC Roles + Status System Redesign
-- ============================================================
-- Run this on top of migrations 001–003.
-- Safe to run multiple times (idempotent where possible).
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- STEP 1: Rename user_role enum
--   admin      → super_admin
--   supervisor → track_manager
--   employee   → team_member
-- ──────────────────────────────────────────────────────────────

-- Create replacement enum
CREATE TYPE user_role_v2 AS ENUM ('super_admin', 'track_manager', 'team_member');

-- Migrate employees.role column
ALTER TABLE employees
  ALTER COLUMN role TYPE user_role_v2
  USING CASE role::text
    WHEN 'admin'      THEN 'super_admin'::user_role_v2
    WHEN 'supervisor' THEN 'track_manager'::user_role_v2
    WHEN 'employee'   THEN 'team_member'::user_role_v2
  END;

-- Swap enum names
DROP TYPE user_role;
ALTER TYPE user_role_v2 RENAME TO user_role;

-- ──────────────────────────────────────────────────────────────
-- STEP 2: Rename availability_status enum
--   break        → offline    (break is not in new spec)
--   meeting      → in_meeting
--   outside_office → field_work
--   available / busy / remote → unchanged
-- ──────────────────────────────────────────────────────────────

CREATE TYPE availability_status_v2 AS ENUM (
  'available',
  'busy',
  'in_meeting',
  'field_work',
  'remote',
  'offline'
);

ALTER TABLE employee_presence
  ALTER COLUMN availability_status TYPE availability_status_v2
  USING CASE availability_status::text
    WHEN 'available'     THEN 'available'::availability_status_v2
    WHEN 'busy'          THEN 'busy'::availability_status_v2
    WHEN 'break'         THEN 'offline'::availability_status_v2
    WHEN 'meeting'       THEN 'in_meeting'::availability_status_v2
    WHEN 'outside_office' THEN 'field_work'::availability_status_v2
    WHEN 'remote'        THEN 'remote'::availability_status_v2
    ELSE                      'available'::availability_status_v2
  END;

DROP TYPE availability_status;
ALTER TYPE availability_status_v2 RENAME TO availability_status;

-- ──────────────────────────────────────────────────────────────
-- STEP 3: Add new columns
-- ──────────────────────────────────────────────────────────────

-- employees: job title
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS job_title TEXT;

-- employee_presence: when the current status started + structured context
ALTER TABLE employee_presence
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE employee_presence
  ADD COLUMN IF NOT EXISTS context JSONB;

-- Backfill started_at from updated_at for existing rows
UPDATE employee_presence SET started_at = updated_at WHERE started_at IS NULL;

-- ──────────────────────────────────────────────────────────────
-- STEP 4: Recreate helper functions with new role names
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
-- STEP 5: Recreate RLS policies with new role values
-- ──────────────────────────────────────────────────────────────

-- Teams
DROP POLICY IF EXISTS "teams_insert" ON teams;
DROP POLICY IF EXISTS "teams_update" ON teams;
DROP POLICY IF EXISTS "teams_delete" ON teams;

CREATE POLICY "teams_insert" ON teams FOR INSERT TO authenticated
  WITH CHECK (current_employee_role() = 'super_admin');
CREATE POLICY "teams_update" ON teams FOR UPDATE TO authenticated
  USING (current_employee_role() = 'super_admin');
CREATE POLICY "teams_delete" ON teams FOR DELETE TO authenticated
  USING (current_employee_role() = 'super_admin');

-- Employees
DROP POLICY IF EXISTS "employees_insert" ON employees;
DROP POLICY IF EXISTS "employees_update" ON employees;
DROP POLICY IF EXISTS "employees_delete" ON employees;

CREATE POLICY "employees_insert" ON employees FOR INSERT TO authenticated
  WITH CHECK (current_employee_role() = 'super_admin');
CREATE POLICY "employees_update" ON employees FOR UPDATE TO authenticated
  USING (
    current_employee_role() IN ('super_admin', 'track_manager')
    OR id = current_employee_id()
  );
CREATE POLICY "employees_delete" ON employees FOR DELETE TO authenticated
  USING (current_employee_role() = 'super_admin');

-- Tasks
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated
  USING (current_employee_role() IN ('super_admin', 'track_manager'));

-- Statuses
DROP POLICY IF EXISTS "statuses_insert" ON statuses;
DROP POLICY IF EXISTS "statuses_update" ON statuses;
DROP POLICY IF EXISTS "statuses_delete" ON statuses;

CREATE POLICY "statuses_insert" ON statuses FOR INSERT TO authenticated
  WITH CHECK (current_employee_role() = 'super_admin');
CREATE POLICY "statuses_update" ON statuses FOR UPDATE TO authenticated
  USING (current_employee_role() = 'super_admin');
CREATE POLICY "statuses_delete" ON statuses FOR DELETE TO authenticated
  USING (current_employee_role() = 'super_admin');

-- Activity logs
DROP POLICY IF EXISTS "activity_logs_select" ON activity_logs;

CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT TO authenticated
  USING (
    current_employee_role() IN ('super_admin', 'track_manager')
    OR actor_id = current_employee_id()
  );

-- ──────────────────────────────────────────────────────────────
-- STEP 6: Recreate analytics views
-- ──────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS v_employee_stats;
DROP VIEW IF EXISTS v_team_stats;

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
  ep.started_at AS status_started_at,
  ep.context    AS status_context,
  ep.updated_at AS presence_updated_at,
  COUNT(tk.id) FILTER (WHERE tk.status = 'in_progress') AS active_tasks,
  COUNT(tk.id) FILTER (WHERE tk.status = 'completed')   AS completed_tasks
FROM employees e
LEFT JOIN teams t              ON t.id = e.team_id
LEFT JOIN employee_presence ep ON ep.employee_id = e.id
LEFT JOIN tasks tk             ON tk.assigned_to = e.id
WHERE e.is_active = true
GROUP BY e.id, e.full_name, e.email, e.role, e.job_title, e.team_id,
         t.name, t.color, ep.availability_status, ep.workload_percent,
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
-- STEP 7: Update seed employees with job titles
-- ──────────────────────────────────────────────────────────────

UPDATE employees SET job_title = 'مدير عمليات البطاقات'
  WHERE email = 'admin@nusuk.sa';
UPDATE employees SET job_title = 'مشرفة مسار العلاقات'
  WHERE email = 'sara.zahrani@nusuk.sa';
UPDATE employees SET job_title = 'مشرف فريق التوزيع'
  WHERE email = 'khaled.mutairi@nusuk.sa';
UPDATE employees SET job_title = 'مشرفة الفريق التقني'
  WHERE email = 'nora.harbi@nusuk.sa';
UPDATE employees SET job_title = 'مشرف إدارة التشغيل'
  WHERE email = 'abdulrahman.qahtani@nusuk.sa';
UPDATE employees SET job_title = 'أخصائية علاقات عملاء'
  WHERE email = 'fatima.shamri@nusuk.sa';
UPDATE employees SET job_title = 'أخصائي علاقات عملاء'
  WHERE email = 'omar.dosari@nusuk.sa';
UPDATE employees SET job_title = 'موظفة توزيع ميداني'
  WHERE email = 'munira.otaibi@nusuk.sa';
UPDATE employees SET job_title = 'موظف توزيع ميداني'
  WHERE email = 'bandar.ghamdi@nusuk.sa';
UPDATE employees SET job_title = 'مهندسة أنظمة'
  WHERE email = 'reem.anazi@nusuk.sa';
UPDATE employees SET job_title = 'مهندس دعم تقني'
  WHERE email = 'sultan.rashidi@nusuk.sa';
UPDATE employees SET job_title = 'محللة أداء تشغيلي'
  WHERE email = 'haya.maliki@nusuk.sa';
