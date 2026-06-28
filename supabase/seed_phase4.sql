-- Phase 4 Seed Data
-- Sample notifications for all active employees
-- Run AFTER seed.sql and seed_phase2.sql

-- ─────────────────────────────────────────────────────
-- System welcome notifications
-- ─────────────────────────────────────────────────────
INSERT INTO notifications (recipient_id, sender_id, type, title, body, is_read, created_at)
SELECT
  e.id,
  NULL,
  'system',
  'مرحباً في نظام بطاقات نسك',
  'تم إعداد حسابك بنجاح. يمكنك الآن الوصول إلى لوحة التحكم ومتابعة مهامك اليومية.',
  false,
  NOW() - INTERVAL '1 day'
FROM employees e
WHERE e.is_active = true;

-- Task assigned notifications (for employees with in_progress tasks)
INSERT INTO notifications (recipient_id, sender_id, type, title, body, is_read, created_at)
SELECT
  t.assigned_to,
  t.created_by,
  'task_assigned',
  'تم تكليفك بمهمة جديدة: ' || t.title,
  'المهمة: ' || t.title || COALESCE('. الوصف: ' || t.description, ''),
  CASE WHEN RANDOM() > 0.5 THEN true ELSE false END,
  t.created_at + INTERVAL '5 minutes'
FROM tasks t
WHERE t.assigned_to IS NOT NULL
  AND t.status = 'in_progress'
LIMIT 8;

-- Break exceeded notification example
INSERT INTO notifications (recipient_id, sender_id, type, title, body, is_read, created_at)
SELECT
  e.id,
  NULL,
  'system',
  'تنبيه: وقت الاستراحة تجاوز المدة المحددة',
  'لقد تجاوزت مدة الاستراحة المسموح بها (30 دقيقة). يرجى تحديث حالتك.',
  false,
  NOW() - INTERVAL '2 hours'
FROM employees e
JOIN employee_presence ep ON ep.employee_id = e.id
WHERE ep.availability_status = 'break'
LIMIT 2;

-- Task completed notification
INSERT INTO notifications (recipient_id, sender_id, type, title, body, is_read, created_at)
SELECT
  t.created_by,
  t.assigned_to,
  'task_completed',
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
