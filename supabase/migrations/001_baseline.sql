-- ============================================================
-- Nusuk Cards Operations Dashboard — Baseline Schema
-- Migration: 001_baseline.sql
--
-- Apply to a completely empty Supabase database.
-- This is the single source of truth; run it once.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'track_manager',
  'team_member'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'on_hold'
);

CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'task_updated',
  'task_completed',
  'comment_added',
  'mention',
  'system'
);

CREATE TYPE availability_status AS ENUM (
  'available',
  'busy',
  'in_meeting',
  'field_work',
  'remote',
  'offline'
);

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

CREATE TABLE teams (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  name_en     TEXT,
  description TEXT,
  color       TEXT        NOT NULL DEFAULT '#0ea5e9',
  icon        TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employees (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        REFERENCES auth.users (id) ON DELETE SET NULL,
  team_id     UUID        REFERENCES teams (id) ON DELETE SET NULL,
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  phone       TEXT,
  role        user_role   NOT NULL DEFAULT 'team_member',
  job_title   TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT          NOT NULL,
  description  TEXT,
  status       task_status   NOT NULL DEFAULT 'pending',
  priority     task_priority NOT NULL DEFAULT 'medium',
  team_id      UUID          REFERENCES teams (id) ON DELETE SET NULL,
  assigned_to  UUID          REFERENCES employees (id) ON DELETE SET NULL,
  created_by   UUID          REFERENCES employees (id) ON DELETE SET NULL,
  due_date     TIMESTAMPTZ,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata     JSONB,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE statuses (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  name_en     TEXT,
  color       TEXT        NOT NULL DEFAULT '#6b7280',
  icon        TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id           UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID              NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  sender_id    UUID              REFERENCES employees (id) ON DELETE SET NULL,
  type         notification_type NOT NULL,
  title        TEXT              NOT NULL,
  body         TEXT,
  data         JSONB,
  is_read      BOOLEAN           NOT NULL DEFAULT false,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID        REFERENCES employees (id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   UUID        NOT NULL,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employee_presence (
  id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id         UUID                NOT NULL UNIQUE REFERENCES employees (id) ON DELETE CASCADE,
  availability_status availability_status NOT NULL DEFAULT 'available',
  workload_percent    INTEGER             NOT NULL DEFAULT 0
                        CHECK (workload_percent >= 0 AND workload_percent <= 100),
  notes               TEXT,
  started_at          TIMESTAMPTZ         NOT NULL DEFAULT now(),
  context             JSONB,
  updated_at          TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX idx_teams_is_active              ON teams (is_active);

CREATE INDEX idx_employees_user_id            ON employees (user_id);
CREATE INDEX idx_employees_team_id            ON employees (team_id);
CREATE INDEX idx_employees_role               ON employees (role);
CREATE INDEX idx_employees_is_active          ON employees (is_active);
CREATE INDEX idx_employees_email              ON employees (email);

CREATE INDEX idx_tasks_status                 ON tasks (status);
CREATE INDEX idx_tasks_priority               ON tasks (priority);
CREATE INDEX idx_tasks_team_id                ON tasks (team_id);
CREATE INDEX idx_tasks_assigned_to            ON tasks (assigned_to);
CREATE INDEX idx_tasks_created_by             ON tasks (created_by);
CREATE INDEX idx_tasks_due_date               ON tasks (due_date);
CREATE INDEX idx_tasks_title_trgm             ON tasks USING gin (title gin_trgm_ops);

CREATE INDEX idx_statuses_sort_order          ON statuses (sort_order);

CREATE INDEX idx_notifications_recipient_id   ON notifications (recipient_id);
CREATE INDEX idx_notifications_is_read        ON notifications (is_read);
CREATE INDEX idx_notifications_created_at     ON notifications (created_at DESC);

CREATE INDEX idx_activity_logs_actor_id       ON activity_logs (actor_id);
CREATE INDEX idx_activity_logs_entity         ON activity_logs (entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at     ON activity_logs (created_at DESC);

CREATE INDEX idx_employee_presence_employee_id ON employee_presence (employee_id);
CREATE INDEX idx_employee_presence_status      ON employee_presence (availability_status);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_employee_presence_updated_at
  BEFORE UPDATE ON employee_presence
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Helper functions
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_employee_role()
RETURNS user_role AS $$
  SELECT role FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_employee_id()
RETURNS UUID AS $$
  SELECT id FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_today_activity_count(p_employee_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM activity_logs
  WHERE actor_id = p_employee_id
    AND created_at >= CURRENT_DATE;
$$ LANGUAGE sql STABLE;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_presence ENABLE ROW LEVEL SECURITY;

-- teams
CREATE POLICY "teams_select" ON teams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_insert" ON teams
  FOR INSERT TO authenticated WITH CHECK (current_employee_role() = 'super_admin');
CREATE POLICY "teams_update" ON teams
  FOR UPDATE TO authenticated USING (current_employee_role() = 'super_admin');
CREATE POLICY "teams_delete" ON teams
  FOR DELETE TO authenticated USING (current_employee_role() = 'super_admin');

-- employees
CREATE POLICY "employees_select" ON employees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_insert" ON employees
  FOR INSERT TO authenticated WITH CHECK (current_employee_role() = 'super_admin');
CREATE POLICY "employees_update" ON employees
  FOR UPDATE TO authenticated
  USING (
    current_employee_role() IN ('super_admin', 'track_manager')
    OR id = current_employee_id()
  );
CREATE POLICY "employees_delete" ON employees
  FOR DELETE TO authenticated USING (current_employee_role() = 'super_admin');

-- tasks
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (
    current_employee_role() IN ('super_admin', 'track_manager')
    OR assigned_to = current_employee_id()
    OR created_by  = current_employee_id()
  );
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (current_employee_role() IN ('super_admin', 'track_manager'));

-- statuses
CREATE POLICY "statuses_select" ON statuses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "statuses_insert" ON statuses
  FOR INSERT TO authenticated WITH CHECK (current_employee_role() = 'super_admin');
CREATE POLICY "statuses_update" ON statuses
  FOR UPDATE TO authenticated USING (current_employee_role() = 'super_admin');
CREATE POLICY "statuses_delete" ON statuses
  FOR DELETE TO authenticated USING (current_employee_role() = 'super_admin');

-- notifications
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT TO authenticated
  USING (
    recipient_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  );
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated USING (recipient_id = current_employee_id());
CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE TO authenticated
  USING (
    recipient_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  );

-- activity_logs
CREATE POLICY "activity_logs_select" ON activity_logs
  FOR SELECT TO authenticated
  USING (
    current_employee_role() IN ('super_admin', 'track_manager')
    OR actor_id = current_employee_id()
  );
CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- employee_presence
CREATE POLICY "presence_select" ON employee_presence
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "presence_insert" ON employee_presence
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "presence_update" ON employee_presence
  FOR UPDATE TO authenticated
  USING (
    employee_id = current_employee_id()
    OR current_employee_role() IN ('super_admin', 'track_manager')
  );

-- ─────────────────────────────────────────────────────────────
-- Analytics views
-- ─────────────────────────────────────────────────────────────

CREATE VIEW v_employee_stats AS
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

CREATE VIEW v_team_stats AS
SELECT
  t.id,
  t.name,
  t.color,
  t.icon,
  COUNT(DISTINCT e.id)                                                         AS employee_count,
  COUNT(DISTINCT e.id) FILTER (WHERE ep.availability_status IS NOT NULL)       AS present_count,
  ROUND(AVG(ep.workload_percent) FILTER (WHERE ep.workload_percent IS NOT NULL)) AS avg_workload,
  COUNT(tk.id) FILTER (WHERE tk.status = 'in_progress')                        AS active_tasks,
  COUNT(tk.id) FILTER (WHERE tk.status = 'completed'
                          AND tk.completed_at >= CURRENT_DATE)                 AS completed_today
FROM teams t
LEFT JOIN employees e          ON e.team_id = t.id AND e.is_active = true
LEFT JOIN employee_presence ep ON ep.employee_id = e.id
LEFT JOIN tasks tk             ON tk.team_id = t.id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.color, t.icon;

GRANT SELECT ON v_employee_stats TO authenticated;
GRANT SELECT ON v_team_stats     TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- Realtime
-- ─────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE employee_presence;
