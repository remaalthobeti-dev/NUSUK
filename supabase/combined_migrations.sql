-- ============================================================
-- Nusuk Cards Operations Dashboard
-- Combined Migration + Seed File
-- Run this entire file once in Supabase SQL Editor
-- All UUIDs are valid RFC-4122 (hex only: 0-9, a-f)
-- ============================================================


-- ============================================================
-- MIGRATION 001 — Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS

CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'employee');

CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'on_hold'
);

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'task_updated',
  'task_completed',
  'comment_added',
  'mention',
  'system'
);

-- TEAMS

CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  name_en     TEXT,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#0ea5e9',
  icon        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_is_active ON teams (is_active);

-- EMPLOYEES

CREATE TABLE employees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  team_id     UUID REFERENCES teams (id) ON DELETE SET NULL,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT,
  role        user_role NOT NULL DEFAULT 'employee',
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_user_id   ON employees (user_id);
CREATE INDEX idx_employees_team_id   ON employees (team_id);
CREATE INDEX idx_employees_role      ON employees (role);
CREATE INDEX idx_employees_is_active ON employees (is_active);
CREATE INDEX idx_employees_email     ON employees (email);

-- TASKS

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  status       task_status NOT NULL DEFAULT 'pending',
  priority     task_priority NOT NULL DEFAULT 'medium',
  team_id      UUID REFERENCES teams (id) ON DELETE SET NULL,
  assigned_to  UUID REFERENCES employees (id) ON DELETE SET NULL,
  created_by   UUID REFERENCES employees (id) ON DELETE SET NULL,
  due_date     TIMESTAMPTZ,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_status      ON tasks (status);
CREATE INDEX idx_tasks_priority    ON tasks (priority);
CREATE INDEX idx_tasks_team_id     ON tasks (team_id);
CREATE INDEX idx_tasks_assigned_to ON tasks (assigned_to);
CREATE INDEX idx_tasks_created_by  ON tasks (created_by);
CREATE INDEX idx_tasks_due_date    ON tasks (due_date);
CREATE INDEX idx_tasks_title_trgm  ON tasks USING gin (title gin_trgm_ops);

-- STATUSES

CREATE TABLE statuses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  name_en     TEXT,
  color       TEXT NOT NULL DEFAULT '#6b7280',
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_statuses_sort_order ON statuses (sort_order);

-- NOTIFICATIONS

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES employees (id) ON DELETE SET NULL,
  type         notification_type NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  data         JSONB,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_id ON notifications (recipient_id);
CREATE INDEX idx_notifications_is_read      ON notifications (is_read);
CREATE INDEX idx_notifications_created_at   ON notifications (created_at DESC);

-- ACTIVITY LOGS

CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES employees (id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_actor_id   ON activity_logs (actor_id);
CREATE INDEX idx_activity_logs_entity     ON activity_logs (entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at DESC);

-- UPDATED_AT TRIGGER

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ROW LEVEL SECURITY

ALTER TABLE teams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_employee_role()
RETURNS user_role AS $$
  SELECT role FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_employee_id()
RETURNS UUID AS $$
  SELECT id FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "teams_select" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT TO authenticated WITH CHECK (current_employee_role() = 'admin');
CREATE POLICY "teams_update" ON teams FOR UPDATE TO authenticated USING (current_employee_role() = 'admin');
CREATE POLICY "teams_delete" ON teams FOR DELETE TO authenticated USING (current_employee_role() = 'admin');

CREATE POLICY "employees_select" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_insert" ON employees FOR INSERT TO authenticated WITH CHECK (current_employee_role() = 'admin');
CREATE POLICY "employees_update" ON employees FOR UPDATE TO authenticated
  USING (current_employee_role() IN ('admin', 'supervisor') OR id = current_employee_id());
CREATE POLICY "employees_delete" ON employees FOR DELETE TO authenticated USING (current_employee_role() = 'admin');

CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
  USING (current_employee_role() IN ('admin', 'supervisor') OR assigned_to = current_employee_id() OR created_by = current_employee_id());
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated USING (current_employee_role() IN ('admin', 'supervisor'));

CREATE POLICY "statuses_select" ON statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "statuses_insert" ON statuses FOR INSERT TO authenticated WITH CHECK (current_employee_role() = 'admin');
CREATE POLICY "statuses_update" ON statuses FOR UPDATE TO authenticated USING (current_employee_role() = 'admin');
CREATE POLICY "statuses_delete" ON statuses FOR DELETE TO authenticated USING (current_employee_role() = 'admin');

CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (recipient_id = current_employee_id() OR current_employee_role() = 'admin');
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (recipient_id = current_employee_id());
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated
  USING (recipient_id = current_employee_id() OR current_employee_role() = 'admin');

CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT TO authenticated
  USING (current_employee_role() IN ('admin', 'supervisor') OR actor_id = current_employee_id());
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- REALTIME

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;


-- ============================================================
-- MIGRATION 002 — Employee Presence
-- ============================================================

CREATE TYPE availability_status AS ENUM (
  'available',
  'busy',
  'break',
  'meeting',
  'outside_office',
  'remote'
);

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

CREATE TRIGGER trg_employee_presence_updated_at
  BEFORE UPDATE ON employee_presence FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE employee_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presence_select" ON employee_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "presence_insert" ON employee_presence FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "presence_update" ON employee_presence FOR UPDATE TO authenticated
  USING (employee_id = current_employee_id() OR current_employee_role() IN ('admin', 'supervisor'));

ALTER PUBLICATION supabase_realtime ADD TABLE employee_presence;


-- ============================================================
-- MIGRATION 003 — Analytics Views & Functions
-- ============================================================

CREATE OR REPLACE VIEW v_employee_stats AS
SELECT
  e.id,
  e.full_name,
  e.email,
  e.role,
  e.team_id,
  t.name  AS team_name,
  t.color AS team_color,
  ep.availability_status,
  ep.workload_percent,
  ep.updated_at AS presence_updated_at,
  COUNT(tk.id) FILTER (WHERE tk.status = 'in_progress') AS active_tasks,
  COUNT(tk.id) FILTER (WHERE tk.status = 'completed')   AS completed_tasks
FROM employees e
LEFT JOIN teams t              ON t.id = e.team_id
LEFT JOIN employee_presence ep ON ep.employee_id = e.id
LEFT JOIN tasks tk             ON tk.assigned_to = e.id
WHERE e.is_active = true
GROUP BY e.id, e.full_name, e.email, e.role, e.team_id,
         t.name, t.color, ep.availability_status, ep.workload_percent, ep.updated_at;

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

CREATE OR REPLACE FUNCTION get_today_activity_count(p_employee_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::INTEGER FROM activity_logs
  WHERE actor_id = p_employee_id AND created_at >= CURRENT_DATE;
$$;

GRANT SELECT ON v_employee_stats TO authenticated;
GRANT SELECT ON v_team_stats     TO authenticated;


-- ============================================================
-- SEED DATA
-- UUID key:
--   aa000001-0000-4000-8000-0000000000xx  = teams      (xx: 01-04)
--   bb000001-0000-4000-8000-0000000000xx  = statuses   (xx: 01-06)
--   cc000001-0000-4000-8000-0000000000xx  = employees  (xx: 01-12)
--   dd000001-0000-4000-8000-0000000000xx  = tasks p1   (xx: 01-06)
--   ee000001-0000-4000-8000-0000000000xx  = tasks p2   (xx: 01-03)
-- All segments contain only 0-9 and a-f.
-- ============================================================

INSERT INTO teams (id, name, name_en, description, color, icon, is_active) VALUES
  ('aa000001-0000-4000-8000-000000000001', 'فريق مسار العلاقات',  'Relations Track Team',       'الفريق المسؤول عن إدارة علاقات العملاء ومسارات التواصل', '#3b82f6', 'handshake', true),
  ('aa000001-0000-4000-8000-000000000002', 'فريق التوزيع',         'Distribution Team',          'الفريق المسؤول عن توزيع البطاقات وعمليات التسليم',       '#10b981', 'truck',     true),
  ('aa000001-0000-4000-8000-000000000003', 'الفريق التقني',        'Technical Team',             'الفريق المسؤول عن الدعم التقني وأنظمة المعلومات',       '#8b5cf6', 'cpu',       true),
  ('aa000001-0000-4000-8000-000000000004', 'فريق إدارة التشغيل',  'Operations Management Team', 'الفريق المسؤول عن إدارة العمليات والتنسيق العام',       '#f59e0b', 'settings',  true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO statuses (id, name, name_en, color, icon, sort_order, is_default) VALUES
  ('bb000001-0000-4000-8000-000000000001', 'جديد',         'New',          '#6b7280', 'plus-circle',  0, true),
  ('bb000001-0000-4000-8000-000000000002', 'قيد التنفيذ',  'In Progress',  '#3b82f6', 'loader',       1, false),
  ('bb000001-0000-4000-8000-000000000003', 'قيد المراجعة', 'Under Review', '#f59e0b', 'eye',          2, false),
  ('bb000001-0000-4000-8000-000000000004', 'مكتمل',        'Completed',    '#10b981', 'check-circle', 3, false),
  ('bb000001-0000-4000-8000-000000000005', 'ملغي',         'Cancelled',    '#ef4444', 'x-circle',     4, false),
  ('bb000001-0000-4000-8000-000000000006', 'معلق',         'On Hold',      '#8b5cf6', 'pause-circle', 5, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO employees (id, user_id, team_id, full_name, email, phone, role, is_active) VALUES
  ('cc000001-0000-4000-8000-000000000001', NULL, 'aa000001-0000-4000-8000-000000000004', 'محمد عبدالله السعيد',     'admin@nusuk.sa',               '+966500000001', 'admin',      true),
  ('cc000001-0000-4000-8000-000000000002', NULL, 'aa000001-0000-4000-8000-000000000001', 'سارة أحمد الزهراني',     'sara.zahrani@nusuk.sa',        '+966500000002', 'supervisor', true),
  ('cc000001-0000-4000-8000-000000000003', NULL, 'aa000001-0000-4000-8000-000000000002', 'خالد عمر المطيري',       'khaled.mutairi@nusuk.sa',      '+966500000003', 'supervisor', true),
  ('cc000001-0000-4000-8000-000000000004', NULL, 'aa000001-0000-4000-8000-000000000003', 'نورة يوسف الحربي',       'nora.harbi@nusuk.sa',          '+966500000004', 'supervisor', true),
  ('cc000001-0000-4000-8000-000000000005', NULL, 'aa000001-0000-4000-8000-000000000004', 'عبدالرحمن فهد القحطاني', 'abdulrahman.qahtani@nusuk.sa', '+966500000005', 'supervisor', true),
  ('cc000001-0000-4000-8000-000000000006', NULL, 'aa000001-0000-4000-8000-000000000001', 'فاطمة علي الشمري',       'fatima.shamri@nusuk.sa',       '+966500000006', 'employee',   true),
  ('cc000001-0000-4000-8000-000000000007', NULL, 'aa000001-0000-4000-8000-000000000001', 'عمر حسن الدوسري',        'omar.dosari@nusuk.sa',         '+966500000007', 'employee',   true),
  ('cc000001-0000-4000-8000-000000000008', NULL, 'aa000001-0000-4000-8000-000000000002', 'منيرة سلمان العتيبي',    'munira.otaibi@nusuk.sa',       '+966500000008', 'employee',   true),
  ('cc000001-0000-4000-8000-000000000009', NULL, 'aa000001-0000-4000-8000-000000000002', 'بندر عبدالعزيز الغامدي', 'bandar.ghamdi@nusuk.sa',       '+966500000009', 'employee',   true),
  ('cc000001-0000-4000-8000-000000000010', NULL, 'aa000001-0000-4000-8000-000000000003', 'ريم محمد العنزي',         'reem.anazi@nusuk.sa',          '+966500000010', 'employee',   true),
  ('cc000001-0000-4000-8000-000000000011', NULL, 'aa000001-0000-4000-8000-000000000003', 'سلطان إبراهيم الرشيدي',  'sultan.rashidi@nusuk.sa',      '+966500000011', 'employee',   true),
  ('cc000001-0000-4000-8000-000000000012', NULL, 'aa000001-0000-4000-8000-000000000004', 'هيا عبدالله المالكي',    'haya.maliki@nusuk.sa',         '+966500000012', 'employee',   true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO tasks (id, title, description, status, priority, team_id, assigned_to, created_by, due_date) VALUES
  ('dd000001-0000-4000-8000-000000000001', 'مراجعة طلبات إصدار البطاقات الجديدة',   'مراجعة وتدقيق طلبات إصدار البطاقات الواردة هذا الأسبوع',       'pending',     'high',   'aa000001-0000-4000-8000-000000000001', 'cc000001-0000-4000-8000-000000000006', 'cc000001-0000-4000-8000-000000000002', now() + INTERVAL '3 days'),
  ('dd000001-0000-4000-8000-000000000002', 'تحديث قاعدة بيانات العملاء',             'تحديث معلومات الاتصال للعملاء المسجلين',                         'in_progress', 'medium', 'aa000001-0000-4000-8000-000000000001', 'cc000001-0000-4000-8000-000000000007', 'cc000001-0000-4000-8000-000000000002', now() + INTERVAL '7 days'),
  ('dd000001-0000-4000-8000-000000000003', 'تسليم دفعة البطاقات - المنطقة الشمالية', 'توزيع الدفعة الشهرية على نقاط الاستلام في المنطقة الشمالية',    'pending',     'urgent', 'aa000001-0000-4000-8000-000000000002', 'cc000001-0000-4000-8000-000000000008', 'cc000001-0000-4000-8000-000000000003', now() + INTERVAL '1 day'),
  ('dd000001-0000-4000-8000-000000000004', 'صيانة نظام الطباعة',                     'إجراء الصيانة الدورية على أجهزة طباعة البطاقات',                'completed',   'medium', 'aa000001-0000-4000-8000-000000000003', 'cc000001-0000-4000-8000-000000000010', 'cc000001-0000-4000-8000-000000000004', now() - INTERVAL '2 days'),
  ('dd000001-0000-4000-8000-000000000005', 'إعداد تقرير الأداء الشهري',              'تجميع وتحليل بيانات الأداء التشغيلي لشهر نوفمبر',               'in_progress', 'high',   'aa000001-0000-4000-8000-000000000004', 'cc000001-0000-4000-8000-000000000012', 'cc000001-0000-4000-8000-000000000001', now() + INTERVAL '5 days'),
  ('dd000001-0000-4000-8000-000000000006', 'اختبار التحديث الجديد للتطبيق',          'اختبار وظائف الإصدار 2.4 قبل الطرح للإنتاج',                   'pending',     'high',   'aa000001-0000-4000-8000-000000000003', 'cc000001-0000-4000-8000-000000000011', 'cc000001-0000-4000-8000-000000000004', now() + INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

UPDATE tasks
  SET started_at   = now() - INTERVAL '2 hours'
  WHERE id = 'dd000001-0000-4000-8000-000000000002';

UPDATE tasks
  SET started_at   = now() - INTERVAL '1 hour 15 minutes'
  WHERE id = 'dd000001-0000-4000-8000-000000000005';

UPDATE tasks
  SET completed_at = now() - INTERVAL '1 day'
  WHERE id = 'dd000001-0000-4000-8000-000000000004';

INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, new_values) VALUES
  ('cc000001-0000-4000-8000-000000000001', 'created',  'team', 'aa000001-0000-4000-8000-000000000001', '{"name": "فريق مسار العلاقات"}'::jsonb),
  ('cc000001-0000-4000-8000-000000000001', 'created',  'team', 'aa000001-0000-4000-8000-000000000002', '{"name": "فريق التوزيع"}'::jsonb),
  ('cc000001-0000-4000-8000-000000000002', 'assigned', 'task', 'dd000001-0000-4000-8000-000000000001', '{"assigned_to": "cc000001-0000-4000-8000-000000000006"}'::jsonb);


-- ============================================================
-- SEED PHASE 2 — Employee Presence & Extra Tasks
-- ============================================================

INSERT INTO employee_presence (employee_id, availability_status, workload_percent, notes) VALUES
  ('cc000001-0000-4000-8000-000000000001', 'meeting',        85, 'اجتماع مع الإدارة العليا'),
  ('cc000001-0000-4000-8000-000000000002', 'available',      40, NULL),
  ('cc000001-0000-4000-8000-000000000003', 'busy',           90, 'متابعة عمليات التوزيع'),
  ('cc000001-0000-4000-8000-000000000004', 'available',      55, NULL),
  ('cc000001-0000-4000-8000-000000000005', 'remote',         70, 'عمل عن بُعد هذا الأسبوع'),
  ('cc000001-0000-4000-8000-000000000006', 'busy',           75, 'قيد مراجعة الطلبات'),
  ('cc000001-0000-4000-8000-000000000007', 'available',      30, NULL),
  ('cc000001-0000-4000-8000-000000000008', 'outside_office', 60, 'في موقع التوزيع - حي النزهة'),
  ('cc000001-0000-4000-8000-000000000009', 'break',          50, NULL),
  ('cc000001-0000-4000-8000-000000000010', 'available',      20, NULL),
  ('cc000001-0000-4000-8000-000000000011', 'busy',           80, 'اختبار النظام الجديد'),
  ('cc000001-0000-4000-8000-000000000012', 'meeting',        65, 'اجتماع متابعة الأداء الشهري')
ON CONFLICT (employee_id) DO UPDATE
  SET availability_status = EXCLUDED.availability_status,
      workload_percent     = EXCLUDED.workload_percent,
      notes                = EXCLUDED.notes,
      updated_at           = now();

INSERT INTO tasks (id, title, description, status, priority, team_id, assigned_to, created_by, due_date, started_at) VALUES
  ('ee000001-0000-4000-8000-000000000001', 'الرد على استفسارات العملاء المعلقة', 'مراجعة وإغلاق قائمة استفسارات العملاء المفتوحة منذ أكثر من 48 ساعة', 'in_progress', 'medium', 'aa000001-0000-4000-8000-000000000001', 'cc000001-0000-4000-8000-000000000007', 'cc000001-0000-4000-8000-000000000002', now() + INTERVAL '6 hours',  now() - INTERVAL '45 minutes'),
  ('ee000001-0000-4000-8000-000000000002', 'تحضير قوائم التوزيع لمنطقة الرياض',  'إعداد وتدقيق قوائم المستفيدين في دائرة الرياض للدفعة القادمة',       'in_progress', 'high',   'aa000001-0000-4000-8000-000000000002', 'cc000001-0000-4000-8000-000000000009', 'cc000001-0000-4000-8000-000000000003', now() + INTERVAL '3 hours',  now() - INTERVAL '30 minutes'),
  ('ee000001-0000-4000-8000-000000000003', 'تحديث شهادات SSL للخوادم',             'تجديد شهادات الأمان لجميع خوادم الإنتاج قبل انتهاء صلاحيتها',        'in_progress', 'urgent', 'aa000001-0000-4000-8000-000000000003', 'cc000001-0000-4000-8000-000000000011', 'cc000001-0000-4000-8000-000000000004', now() + INTERVAL '2 hours',  now() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, new_values, created_at) VALUES
  ('cc000001-0000-4000-8000-000000000006', 'started_task',   'task',     'dd000001-0000-4000-8000-000000000001', '{"task": "مراجعة طلبات إصدار البطاقات"}'::jsonb,               now() - INTERVAL '3 hours'),
  ('cc000001-0000-4000-8000-000000000006', 'status_changed', 'employee', 'cc000001-0000-4000-8000-000000000006', '{"status": "busy"}'::jsonb,                                     now() - INTERVAL '3 hours'),
  ('cc000001-0000-4000-8000-000000000006', 'added_note',     'task',     'dd000001-0000-4000-8000-000000000001', '{"note": "تم الانتهاء من مراجعة 12 طلباً"}'::jsonb,            now() - INTERVAL '1 hour 30 minutes'),
  ('cc000001-0000-4000-8000-000000000007', 'status_changed', 'employee', 'cc000001-0000-4000-8000-000000000007', '{"status": "available"}'::jsonb,                                now() - INTERVAL '2 hours'),
  ('cc000001-0000-4000-8000-000000000007', 'started_task',   'task',     'ee000001-0000-4000-8000-000000000001', '{"task": "الرد على استفسارات العملاء"}'::jsonb,                 now() - INTERVAL '45 minutes'),
  ('cc000001-0000-4000-8000-000000000008', 'status_changed', 'employee', 'cc000001-0000-4000-8000-000000000008', '{"status": "outside_office", "location": "حي النزهة"}'::jsonb, now() - INTERVAL '4 hours'),
  ('cc000001-0000-4000-8000-000000000009', 'started_task',   'task',     'ee000001-0000-4000-8000-000000000002', '{"task": "تحضير قوائم التوزيع"}'::jsonb,                       now() - INTERVAL '30 minutes'),
  ('cc000001-0000-4000-8000-000000000009', 'status_changed', 'employee', 'cc000001-0000-4000-8000-000000000009', '{"status": "break"}'::jsonb,                                    now() - INTERVAL '10 minutes'),
  ('cc000001-0000-4000-8000-000000000010', 'completed_task', 'task',     'dd000001-0000-4000-8000-000000000004', '{"task": "صيانة نظام الطباعة"}'::jsonb,                        now() - INTERVAL '5 hours'),
  ('cc000001-0000-4000-8000-000000000011', 'started_task',   'task',     'ee000001-0000-4000-8000-000000000003', '{"task": "تحديث شهادات SSL"}'::jsonb,                          now() - INTERVAL '1 hour'),
  ('cc000001-0000-4000-8000-000000000012', 'status_changed', 'employee', 'cc000001-0000-4000-8000-000000000012', '{"status": "meeting"}'::jsonb,                                  now() - INTERVAL '30 minutes'),
  ('cc000001-0000-4000-8000-000000000001', 'status_changed', 'employee', 'cc000001-0000-4000-8000-000000000001', '{"status": "meeting"}'::jsonb,                                  now() - INTERVAL '2 hours');


-- ============================================================
-- SEED PHASE 4 — Notifications
-- ============================================================

INSERT INTO notifications (recipient_id, sender_id, type, title, body, is_read, created_at)
SELECT
  e.id, NULL, 'system',
  'مرحباً في نظام بطاقات نسك',
  'تم إعداد حسابك بنجاح. يمكنك الآن الوصول إلى لوحة التحكم ومتابعة مهامك اليومية.',
  false,
  NOW() - INTERVAL '1 day'
FROM employees e WHERE e.is_active = true;

INSERT INTO notifications (recipient_id, sender_id, type, title, body, is_read, created_at)
SELECT
  t.assigned_to, t.created_by, 'task_assigned',
  'تم تكليفك بمهمة جديدة: ' || t.title,
  'المهمة: ' || t.title || COALESCE('. الوصف: ' || t.description, ''),
  CASE WHEN RANDOM() > 0.5 THEN true ELSE false END,
  t.created_at + INTERVAL '5 minutes'
FROM tasks t
WHERE t.assigned_to IS NOT NULL AND t.status = 'in_progress'
LIMIT 8;

INSERT INTO notifications (recipient_id, sender_id, type, title, body, is_read, created_at)
SELECT
  e.id, NULL, 'system',
  'تنبيه: وقت الاستراحة تجاوز المدة المحددة',
  'لقد تجاوزت مدة الاستراحة المسموح بها (30 دقيقة). يرجى تحديث حالتك.',
  false,
  NOW() - INTERVAL '2 hours'
FROM employees e
JOIN employee_presence ep ON ep.employee_id = e.id
WHERE ep.availability_status = 'break'
LIMIT 2;

INSERT INTO notifications (recipient_id, sender_id, type, title, body, is_read, created_at)
SELECT
  t.created_by, t.assigned_to, 'task_completed',
  'تم إنجاز المهمة: ' || t.title,
  'أنهى الموظف المهمة المكلف بها بنجاح.',
  true,
  t.completed_at
FROM tasks t
WHERE t.status = 'completed'
  AND t.created_by IS NOT NULL
  AND t.assigned_to IS NOT NULL
  AND t.completed_at IS NOT NULL
LIMIT 4;
