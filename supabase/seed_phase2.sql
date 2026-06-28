-- ============================================================
-- Seed Phase 2 — Employee Presence & Task Time Data
-- Run AFTER seed.sql (Phase 1) and migration 002
-- ============================================================

-- Update in_progress tasks with started_at timestamps
UPDATE tasks SET started_at = now() - INTERVAL '2 hours'
  WHERE id = 't0000001-0002-0002-0002-000000000002'; -- تحديث قاعدة بيانات

UPDATE tasks SET started_at = now() - INTERVAL '1 hour 15 minutes'
  WHERE id = 't0000001-0005-0005-0005-000000000005'; -- تقرير الأداء

-- ============================================================
-- EMPLOYEE PRESENCE
-- ============================================================

INSERT INTO employee_presence (employee_id, availability_status, workload_percent, notes)
VALUES
  -- Admin
  ('e0000001-0001-0001-0001-000000000001', 'meeting',       85, 'اجتماع مع الإدارة العليا'),

  -- Supervisors
  ('e0000001-0002-0002-0002-000000000002', 'available',     40, NULL),
  ('e0000001-0003-0003-0003-000000000003', 'busy',          90, 'متابعة عمليات التوزيع'),
  ('e0000001-0004-0004-0004-000000000004', 'available',     55, NULL),
  ('e0000001-0005-0005-0005-000000000005', 'remote',        70, 'عمل عن بُعد هذا الأسبوع'),

  -- Relations Track Team
  ('e0000001-0006-0006-0006-000000000006', 'busy',          75, 'قيد مراجعة الطلبات'),
  ('e0000001-0007-0007-0007-000000000007', 'available',     30, NULL),

  -- Distribution Team
  ('e0000001-0008-0008-0008-000000000008', 'outside_office', 60, 'في موقع التوزيع - حي النزهة'),
  ('e0000001-0009-0009-0009-000000000009', 'break',          50, NULL),

  -- Technical Team
  ('e0000001-0010-0010-0010-000000000010', 'available',      20, NULL),
  ('e0000001-0011-0011-0011-000000000011', 'busy',           80, 'اختبار النظام الجديد'),

  -- Operations Management Team
  ('e0000001-0012-0012-0012-000000000012', 'meeting',        65, 'اجتماع متابعة الأداء الشهري')

ON CONFLICT (employee_id) DO UPDATE
  SET availability_status = EXCLUDED.availability_status,
      workload_percent     = EXCLUDED.workload_percent,
      notes                = EXCLUDED.notes,
      updated_at           = now();

-- ============================================================
-- ADD MORE TASKS (for richer team pages)
-- ============================================================

INSERT INTO tasks (id, title, description, status, priority, team_id, assigned_to, created_by, due_date, started_at) VALUES

  -- Relations team extra tasks
  (
    't0000002-0001-0001-0001-000000000001',
    'الرد على استفسارات العملاء المعلقة',
    'مراجعة وإغلاق قائمة استفسارات العملاء المفتوحة منذ أكثر من 48 ساعة',
    'in_progress', 'medium',
    'a1b2c3d4-0001-0001-0001-000000000001',
    'e0000001-0007-0007-0007-000000000007',
    'e0000001-0002-0002-0002-000000000002',
    now() + INTERVAL '6 hours',
    now() - INTERVAL '45 minutes'
  ),

  -- Distribution team extra tasks
  (
    't0000002-0002-0002-0002-000000000002',
    'تحضير قوائم التوزيع لمنطقة الرياض',
    'إعداد وتدقيق قوائم المستفيدين في دائرة الرياض للدفعة القادمة',
    'in_progress', 'high',
    'a1b2c3d4-0002-0002-0002-000000000002',
    'e0000001-0009-0009-0009-000000000009',
    'e0000001-0003-0003-0003-000000000003',
    now() + INTERVAL '3 hours',
    now() - INTERVAL '30 minutes'
  ),

  -- Technical team extra task
  (
    't0000002-0003-0003-0003-000000000003',
    'تحديث شهادات SSL للخوادم',
    'تجديد شهادات الأمان لجميع خوادم الإنتاج قبل انتهاء صلاحيتها',
    'in_progress', 'urgent',
    'a1b2c3d4-0003-0003-0003-000000000003',
    'e0000001-0011-0011-0011-000000000011',
    'e0000001-0004-0004-0004-000000000004',
    now() + INTERVAL '2 hours',
    now() - INTERVAL '1 hour'
  )

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ACTIVITY LOGS — Today's timeline entries
-- ============================================================

INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, new_values, created_at) VALUES

  ('e0000001-0006-0006-0006-000000000006', 'started_task',    'task', 't0000001-0001-0001-0001-000000000001',
   '{"task": "مراجعة طلبات إصدار البطاقات"}'::jsonb,
   now() - INTERVAL '3 hours'),

  ('e0000001-0006-0006-0006-000000000006', 'status_changed',  'employee', 'e0000001-0006-0006-0006-000000000006',
   '{"status": "busy"}'::jsonb,
   now() - INTERVAL '3 hours'),

  ('e0000001-0006-0006-0006-000000000006', 'added_note',      'task', 't0000001-0001-0001-0001-000000000001',
   '{"note": "تم الانتهاء من مراجعة 12 طلباً"}'::jsonb,
   now() - INTERVAL '1 hour 30 minutes'),

  ('e0000001-0007-0007-0007-000000000007', 'status_changed',  'employee', 'e0000001-0007-0007-0007-000000000007',
   '{"status": "available"}'::jsonb,
   now() - INTERVAL '2 hours'),

  ('e0000001-0007-0007-0007-000000000007', 'started_task',    'task', 't0000002-0001-0001-0001-000000000001',
   '{"task": "الرد على استفسارات العملاء"}'::jsonb,
   now() - INTERVAL '45 minutes'),

  ('e0000001-0008-0008-0008-000000000008', 'status_changed',  'employee', 'e0000001-0008-0008-0008-000000000008',
   '{"status": "outside_office", "location": "حي النزهة"}'::jsonb,
   now() - INTERVAL '4 hours'),

  ('e0000001-0009-0009-0009-000000000009', 'started_task',    'task', 't0000002-0002-0002-0002-000000000002',
   '{"task": "تحضير قوائم التوزيع"}'::jsonb,
   now() - INTERVAL '30 minutes'),

  ('e0000001-0009-0009-0009-000000000009', 'status_changed',  'employee', 'e0000001-0009-0009-0009-000000000009',
   '{"status": "break"}'::jsonb,
   now() - INTERVAL '10 minutes'),

  ('e0000001-0010-0010-0010-000000000010', 'completed_task',  'task', 't0000001-0004-0004-0004-000000000004',
   '{"task": "صيانة نظام الطباعة"}'::jsonb,
   now() - INTERVAL '5 hours'),

  ('e0000001-0011-0011-0011-000000000011', 'started_task',    'task', 't0000002-0003-0003-0003-000000000003',
   '{"task": "تحديث شهادات SSL"}'::jsonb,
   now() - INTERVAL '1 hour'),

  ('e0000001-0012-0012-0012-000000000012', 'status_changed',  'employee', 'e0000001-0012-0012-0012-000000000012',
   '{"status": "meeting"}'::jsonb,
   now() - INTERVAL '30 minutes'),

  ('e0000001-0001-0001-0001-000000000001', 'status_changed',  'employee', 'e0000001-0001-0001-0001-000000000001',
   '{"status": "meeting"}'::jsonb,
   now() - INTERVAL '2 hours');
