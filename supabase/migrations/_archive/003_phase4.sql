-- Phase 4: Analytics views + notification seed helpers
-- Run after 001_initial_schema.sql and 002_employee_presence.sql

-- ─────────────────────────────────────────────────────
-- View: v_employee_stats
-- Aggregates employee data with presence and task info
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_employee_stats AS
SELECT
  e.id,
  e.full_name,
  e.email,
  e.role,
  e.team_id,
  t.name AS team_name,
  t.color AS team_color,
  ep.availability_status,
  ep.workload_percent,
  ep.updated_at AS presence_updated_at,
  COUNT(tk.id) FILTER (WHERE tk.status = 'in_progress') AS active_tasks,
  COUNT(tk.id) FILTER (WHERE tk.status = 'completed') AS completed_tasks
FROM employees e
LEFT JOIN teams t ON t.id = e.team_id
LEFT JOIN employee_presence ep ON ep.employee_id = e.id
LEFT JOIN tasks tk ON tk.assigned_to = e.id
WHERE e.is_active = true
GROUP BY e.id, e.full_name, e.email, e.role, e.team_id,
         t.name, t.color, ep.availability_status,
         ep.workload_percent, ep.updated_at;

-- ─────────────────────────────────────────────────────
-- View: v_team_stats
-- Per-team aggregated statistics
-- ─────────────────────────────────────────────────────
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
LEFT JOIN employees e ON e.team_id = t.id AND e.is_active = true
LEFT JOIN employee_presence ep ON ep.employee_id = e.id
LEFT JOIN tasks tk ON tk.team_id = t.id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.color, t.icon;

-- ─────────────────────────────────────────────────────
-- Function: get_today_activity_count(employee_id)
-- Returns count of activity logs for an employee today
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_today_activity_count(p_employee_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM activity_logs
  WHERE actor_id = p_employee_id
    AND created_at >= CURRENT_DATE;
$$;

-- ─────────────────────────────────────────────────────
-- Grant view access (adjust RLS as needed)
-- ─────────────────────────────────────────────────────
GRANT SELECT ON v_employee_stats TO authenticated;
GRANT SELECT ON v_team_stats TO authenticated;
