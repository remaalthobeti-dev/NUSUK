-- ============================================================
-- Development Seed Data
-- seed_development.sql
--
-- Run AFTER 001_baseline.sql on a fresh development database.
-- Creates sample teams and employees for testing.
--
-- IMPORTANT: Employees are created WITHOUT user_id links.
-- To link an employee to a Supabase auth user (so they can log in):
--   UPDATE employees SET user_id = '<auth.users.id>' WHERE email = 'admin@nusuk.sa';
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Teams
-- ─────────────────────────────────────────────────────────────

INSERT INTO teams (id, name, name_en, description, color, icon, is_active)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'فريق مسار العلاقات',   'Relations Track',    'إدارة علاقات الحجاج والمعتمرين',         '#0ea5e9', 'handshake', true),
  ('11111111-0000-0000-0000-000000000002', 'فريق التوزيع الميداني', 'Distribution Track', 'توزيع بطاقات نسك في المواقع المختلفة',   '#10b981', 'truck',     true),
  ('11111111-0000-0000-0000-000000000003', 'الفريق التقني',          'Technical Track',    'الدعم التقني وإدارة الأنظمة',             '#8b5cf6', 'cpu',       true),
  ('11111111-0000-0000-0000-000000000004', 'فريق إدارة التشغيل',    'Operations Track',   'الإشراف على سير العمليات اليومية',        '#f59e0b', 'settings',  true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Employees
-- ─────────────────────────────────────────────────────────────

INSERT INTO employees (id, team_id, full_name, email, role, job_title, is_active)
VALUES
  -- Super Admin
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'مدير النظام',        'admin@nusuk.sa',               'super_admin',   'مدير عمليات البطاقات',     true),

  -- Track Managers
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'سارة الزهراني',     'sara.zahrani@nusuk.sa',        'track_manager', 'مشرفة مسار العلاقات',      true),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002',
   'خالد المطيري',      'khaled.mutairi@nusuk.sa',      'track_manager', 'مشرف فريق التوزيع',        true),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003',
   'نورة الحربي',       'nora.harbi@nusuk.sa',          'track_manager', 'مشرفة الفريق التقني',      true),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000004',
   'عبدالرحمن القحطاني','abdulrahman.qahtani@nusuk.sa', 'track_manager', 'مشرف إدارة التشغيل',       true),

  -- Team Members — Relations
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001',
   'فاطمة الشمري',      'fatima.shamri@nusuk.sa',       'team_member',   'أخصائية علاقات عملاء',     true),
  ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001',
   'عمر الدوسري',       'omar.dosari@nusuk.sa',         'team_member',   'أخصائي علاقات عملاء',      true),

  -- Team Members — Distribution
  ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000002',
   'منيرة العتيبي',     'munira.otaibi@nusuk.sa',       'team_member',   'موظفة توزيع ميداني',       true),
  ('22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000002',
   'بندر الغامدي',      'bandar.ghamdi@nusuk.sa',       'team_member',   'موظف توزيع ميداني',        true),

  -- Team Members — Technical
  ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000003',
   'ريم العنزي',        'reem.anazi@nusuk.sa',          'team_member',   'مهندسة أنظمة',             true),
  ('22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000003',
   'سلطان الرشيدي',     'sultan.rashidi@nusuk.sa',      'team_member',   'مهندس دعم تقني',           true),

  -- Team Members — Operations
  ('22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000004',
   'هيا المالكي',       'haya.maliki@nusuk.sa',         'team_member',   'محللة أداء تشغيلي',        true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Employee Presence (initial availability)
-- ─────────────────────────────────────────────────────────────

INSERT INTO employee_presence (employee_id, availability_status, workload_percent, notes, started_at)
VALUES
  ('22222222-0000-0000-0000-000000000001', 'available',  20,  null, now()),
  ('22222222-0000-0000-0000-000000000002', 'available',  40,  null, now()),
  ('22222222-0000-0000-0000-000000000003', 'in_meeting', 60,  null, now()),
  ('22222222-0000-0000-0000-000000000004', 'available',  30,  null, now()),
  ('22222222-0000-0000-0000-000000000005', 'busy',       80,  null, now()),
  ('22222222-0000-0000-0000-000000000006', 'available',  50,  null, now()),
  ('22222222-0000-0000-0000-000000000007', 'field_work', 70,  null, now()),
  ('22222222-0000-0000-0000-000000000008', 'available',  20,  null, now()),
  ('22222222-0000-0000-0000-000000000009', 'remote',     45,  null, now()),
  ('22222222-0000-0000-0000-000000000010', 'available',  35,  null, now()),
  ('22222222-0000-0000-0000-000000000011', 'offline',     0,  null, now()),
  ('22222222-0000-0000-0000-000000000012', 'available',  55,  null, now())
ON CONFLICT (employee_id) DO NOTHING;
