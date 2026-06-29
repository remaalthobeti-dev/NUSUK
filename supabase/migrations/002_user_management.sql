-- ============================================================
-- 002_user_management.sql
-- User registration, approval workflow, and pending-access gate.
-- Run AFTER 001_baseline.sql.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Enum
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Table: registration_requests
-- One row per auth.users signup. Approved rows become employees.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS registration_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text NOT NULL,
  email            text NOT NULL,
  status           request_status NOT NULL DEFAULT 'pending',
  -- filled by super_admin when approving:
  approved_role    user_role,
  approved_team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  approved_title   text,
  -- filled on rejection:
  rejection_reason text,
  -- audit
  reviewed_by      uuid REFERENCES employees(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_requests_auth_user   ON registration_requests(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_reg_requests_status      ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_reg_requests_email       ON registration_requests(email);

-- ─────────────────────────────────────────────────────────────
-- Trigger: auto-create request on new auth signup
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO registration_requests (auth_user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Applicant sees their own request
CREATE POLICY "reg_requests_select_own" ON registration_requests
  FOR SELECT USING (auth_user_id = auth.uid());

-- Super admin sees all
CREATE POLICY "reg_requests_select_admin" ON registration_requests
  FOR SELECT USING (current_employee_role() = 'super_admin');

-- Super admin can update (approve / reject)
CREATE POLICY "reg_requests_update_admin" ON registration_requests
  FOR UPDATE USING (current_employee_role() = 'super_admin');

-- Service role can insert (trigger runs as service role)
CREATE POLICY "reg_requests_insert_service" ON registration_requests
  FOR INSERT WITH CHECK (true);
