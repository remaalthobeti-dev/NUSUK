-- ============================================================
-- Migration 002 — Employee Presence & Task Time Tracking
-- ============================================================

-- New enum for availability status
CREATE TYPE availability_status AS ENUM (
  'available',
  'busy',
  'break',
  'meeting',
  'outside_office',
  'remote'
);

-- Add started_at column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- ============================================================
-- EMPLOYEE PRESENCE TABLE
-- Tracks current availability status, workload, and notes
-- One row per employee (UNIQUE constraint on employee_id)
-- ============================================================

CREATE TABLE employee_presence (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id         UUID NOT NULL UNIQUE REFERENCES employees (id) ON DELETE CASCADE,
  availability_status availability_status NOT NULL DEFAULT 'available',
  workload_percent    INTEGER NOT NULL DEFAULT 0
                      CHECK (workload_percent >= 0 AND workload_percent <= 100),
  notes               TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employee_presence_employee_id ON employee_presence (employee_id);
CREATE INDEX idx_employee_presence_status      ON employee_presence (availability_status);

-- Auto-update updated_at on change
CREATE TRIGGER trg_employee_presence_updated_at
  BEFORE UPDATE ON employee_presence
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE employee_presence ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "presence_select" ON employee_presence
  FOR SELECT TO authenticated USING (true);

-- Employees update their own; admins/supervisors update any
CREATE POLICY "presence_insert" ON employee_presence
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "presence_update" ON employee_presence
  FOR UPDATE TO authenticated
  USING (
    employee_id = current_employee_id()
    OR current_employee_role() IN ('admin', 'supervisor')
  );

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE employee_presence;
