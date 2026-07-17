-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 007: Row Level Security for task sub-tables
-- Tables: task_participants, task_comments, task_activity, task_requests
--
-- Background
-- ──────────
-- These four tables existed without RLS. All mutations already go through
-- server actions guarded by requireAuthenticated(), which additionally verify
-- team ownership in application code. RLS here adds defence-in-depth that
-- protects data even if the application layer is bypassed (direct API calls,
-- leaked anon key usage, Realtime subscriptions, etc.)
--
-- Roles (stored in employees.role — these are NOT PostgreSQL roles):
--   super_admin   – full unrestricted access
--   track_manager – manages their own team; elevated read/write within that team
--   team_member   – regular employee; scoped strictly to their team
--
-- Helper functions (SECURITY DEFINER, defined in 001_baseline.sql):
--   current_employee_id()   → UUID of the employees row for auth.uid()
--   current_employee_role() → user_role enum value for that employee
--
-- Why USING (true) was REJECTED for task_participants / task_comments / task_activity
-- ─────────────────────────────────────────────────────────────────────────────────
-- The previous draft used USING (true) for SELECT on these three tables,
-- citing consistency with tasks_select. That reasoning was rejected after
-- closer review for the following reasons:
--
-- 1. tasks_select using USING (true) is itself a broad existing policy that
--    is out of scope for this migration. We should not inherit its permissiveness
--    as a justification for new policies.
--
-- 2. The application already enforces team isolation at the loader layer:
--    getTaskDetail() filters by .eq("team_id", teamId) before any sub-table
--    fetch. A user from Team A cannot reach Team B's comments through the UI.
--
-- 3. Collaboration (task_participants) is strictly within-team:
--    sendTaskRequestAction() explicitly verifies requestee.team_id === user.team_id.
--    Cross-team participants are architecturally impossible in this system.
--
-- 4. Therefore: the correct SELECT boundary is team membership, not "any
--    authenticated user". USING (true) would expose all team data to all
--    employees in the organisation even though the application never needs
--    cross-team access to these tables.
--
-- SELECT policy used for task_participants / task_comments / task_activity:
--   The task must belong to the same team as the current employee.
--   super_admin bypasses the team check.
--
-- task_requests SELECT is intentionally more restrictive still — see §5.
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 0 – Helper function: current employee's team_id
--
-- Caches the team_id lookup as a STABLE SECURITY DEFINER function so
-- PostgreSQL can call it once per query rather than once per row when
-- it is used inside RLS USING expressions.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_employee_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id
  FROM   employees
  WHERE  id = current_employee_id()
  LIMIT  1;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1 – Enable RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE task_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity     ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests     ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2 – task_participants
--
-- Schema:  id, task_id, employee_id, joined_at, left_at
-- Purpose: records who is actively collaborating on a task (soft-delete
--          via left_at; hard DELETE is never used by the application).
--
-- SELECT
-- ──────
-- A user may read participant records for tasks that belong to their team.
-- Rationale:
--   • All tasks are fetched with .eq("team_id", teamId) before sub-tables
--     are queried (getTaskDetail line 91).
--   • sendTaskRequestAction() rejects any requestee not on the same team,
--     so all participants are guaranteed to be team members.
--   • A user who is not in the team has no legitimate reason to enumerate
--     who is working on that team's tasks.
--   • super_admin bypasses the team check for operational oversight.
--
-- INSERT
-- ──────
-- A user may only enrol themselves (employee_id = their own id).
-- Triggered exclusively by respondToRequestAction on acceptance.
-- The server action additionally verifies the task is in the user's team.
--
-- UPDATE
-- ──────
-- Required because the application uses UPSERT (onConflict task_id,employee_id).
-- When the row already exists PostgreSQL evaluates the UPDATE policy.
-- A user may only update their own record; super_admin can manage any.
--
-- DELETE
-- ──────
-- No DELETE policy → implicitly denied. App uses soft-delete (left_at).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "task_participants_select"
  ON task_participants
  FOR SELECT
  TO authenticated
  USING (
    current_employee_role() = 'super_admin'
    OR EXISTS (
      SELECT 1
      FROM   tasks t
      WHERE  t.id      = task_participants.task_id
        AND  t.team_id = current_employee_team_id()
    )
  );

CREATE POLICY "task_participants_insert"
  ON task_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = current_employee_id());

CREATE POLICY "task_participants_update"
  ON task_participants
  FOR UPDATE
  TO authenticated
  USING (
    employee_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  )
  WITH CHECK (
    employee_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3 – task_comments
--
-- Schema:  id, task_id, employee_id, comment, created_at
-- Purpose: team discussion thread for a task.
--
-- SELECT
-- ──────
-- A user may read comments for tasks in their team only.
-- Rationale: identical to task_participants — all commenting occurs within
-- a team context; getTaskDetail enforces team scope before fetching comments.
--
-- INSERT
-- ──────
-- A user may only post a comment attributed to themselves.
-- The server action (addCommentAction) additionally verifies the task is
-- in the user's team — double enforcement.
--
-- UPDATE / DELETE
-- ───────────────
-- No policies → both implicitly denied. The application does not support
-- editing or deleting comments; RLS makes this an enforceable guarantee.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "task_comments_select"
  ON task_comments
  FOR SELECT
  TO authenticated
  USING (
    current_employee_role() = 'super_admin'
    OR EXISTS (
      SELECT 1
      FROM   tasks t
      WHERE  t.id      = task_comments.task_id
        AND  t.team_id = current_employee_team_id()
    )
  );

CREATE POLICY "task_comments_insert"
  ON task_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = current_employee_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4 – task_activity
--
-- Schema:  id, task_id, employee_id (nullable), event_type, description, created_at
-- Purpose: append-only audit timeline; records every lifecycle event on a task.
--
-- SELECT
-- ──────
-- A user may read activity for tasks in their team only.
-- Rationale: same as task_comments. Activity logs contain operational detail
-- (who changed what, when) that is relevant to the task's team but has no
-- legitimate use across team boundaries.
--
-- INSERT
-- ──────
-- A user may only log events under their own employee_id.
-- employee_id IS nullable in the schema, but every INSERT in the codebase
-- sets it to context.employee.id. The super_admin exception is present
-- because admin server actions may need to log system-level events.
--
-- UPDATE / DELETE
-- ───────────────
-- No policies → both implicitly denied. Activity is an immutable audit log.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "task_activity_select"
  ON task_activity
  FOR SELECT
  TO authenticated
  USING (
    current_employee_role() = 'super_admin'
    OR EXISTS (
      SELECT 1
      FROM   tasks t
      WHERE  t.id      = task_activity.task_id
        AND  t.team_id = current_employee_team_id()
    )
  );

CREATE POLICY "task_activity_insert"
  ON task_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 5 – task_requests
--
-- Schema:  id, task_id, requester_id, requestee_id, request_type, status,
--          created_at, updated_at
-- Purpose: collaboration and review requests between employees.
--
-- SELECT
-- ──────
-- More restrictive than the other three tables because request records
-- expose interpersonal collaboration dynamics (who asked whom for what).
-- Even within a team, not every member needs to see every pending request.
--
-- Permitted audience:
--   • super_admin / track_manager — operational oversight of team activity
--   • The requester — to track the status of requests they sent
--   • The requestee — to see and respond to incoming requests
--   • The task's assigned_to or created_by — the task's primary stakeholders
--     who need visibility into who is requesting to collaborate on their task
--     (the task-detail page renders a pending-requests panel for this purpose)
--   • Active participants — already collaborating; seeing new incoming requests
--     is reasonable operational context within shared task ownership
--
-- The EXISTS subquery references task_participants. PostgreSQL evaluates
-- task_participants_select for that inner read. The inner filter is:
--   WHERE tp.task_id = task_requests.task_id AND tp.employee_id = current_employee_id()
-- A participant's own record will always pass the team check (the task is in
-- the same team as the participant by construction), so the inner RLS never
-- blocks the outer policy from evaluating. No infinite recursion: the two
-- policies reference different tables.
--
-- INSERT
-- ──────
-- Only the requester may open a request attributed to themselves.
-- sendTaskRequestAction() further validates: same team, not self-request,
-- requestee is active — providing defence-in-depth.
--
-- UPDATE
-- ──────
-- Only the requestee (accepting/rejecting) or super_admin.
-- respondToRequestAction() additionally enforces requestee == caller and
-- status == 'pending' before calling update.
--
-- DELETE
-- ──────
-- No policy → implicitly denied. Requests are retained as history.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "task_requests_select"
  ON task_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Oversight roles
    current_employee_role() IN ('super_admin', 'track_manager')

    -- The two parties directly involved
    OR requester_id = current_employee_id()
    OR requestee_id = current_employee_id()

    -- Primary task stakeholders
    OR EXISTS (
      SELECT 1
      FROM   tasks t
      WHERE  t.id = task_requests.task_id
        AND  (
          t.assigned_to = current_employee_id()
          OR t.created_by  = current_employee_id()
        )
    )

    -- Active collaborators on the task
    OR EXISTS (
      SELECT 1
      FROM   task_participants tp
      WHERE  tp.task_id     = task_requests.task_id
        AND  tp.employee_id = current_employee_id()
        AND  tp.left_at     IS NULL
    )
  );

CREATE POLICY "task_requests_insert"
  ON task_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = current_employee_id());

CREATE POLICY "task_requests_update"
  ON task_requests
  FOR UPDATE
  TO authenticated
  USING (
    requestee_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  )
  WITH CHECK (
    requestee_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 6 – Performance indexes
--
-- The team-based SELECT policies evaluate:
--   EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND team_id = ?)
-- for every row returned. The tasks.id index (PK) handles the id lookup.
-- task_participants also needs a fast path for the participant-check in
-- task_requests_select (tp.task_id + tp.employee_id + tp.left_at).
-- ─────────────────────────────────────────────────────────────────────────────

-- Covering index for the participant EXISTS check in task_requests_select
CREATE INDEX IF NOT EXISTS idx_task_participants_employee_task
  ON task_participants (employee_id, task_id)
  WHERE left_at IS NULL;

-- Support fast task_id lookups from comments and activity tables
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id
  ON task_comments (task_id);

CREATE INDEX IF NOT EXISTS idx_task_activity_task_id
  ON task_activity (task_id);

CREATE INDEX IF NOT EXISTS idx_task_requests_task_id
  ON task_requests (task_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 7 – Realtime publication
--
-- task-detail-client.tsx subscribes to all four tables filtered by task_id.
-- With RLS enabled, Supabase Realtime automatically applies SELECT policies
-- to broadcast events: each subscriber only receives events for rows they
-- are permitted to read under the policies above.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE task_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE task_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE task_requests;


-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries (run in Supabase SQL editor after applying)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. RLS enabled on all four tables
-- SELECT tablename, rowsecurity
-- FROM   pg_tables
-- WHERE  schemaname = 'public'
--   AND  tablename IN (
--          'task_participants', 'task_comments',
--          'task_activity',     'task_requests'
--        );
-- Expected: rowsecurity = true for all 4 rows.

-- 2. Policy inventory
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM   pg_policies
-- WHERE  schemaname = 'public'
--   AND  tablename IN (
--          'task_participants', 'task_comments',
--          'task_activity',     'task_requests'
--        )
-- ORDER BY tablename, cmd;
-- Expected: 9 policies total (participants: 3, comments: 2, activity: 2, requests: 3).

-- 3. No USING (true) policies on these tables
-- SELECT tablename, policyname
-- FROM   pg_policies
-- WHERE  schemaname = 'public'
--   AND  tablename IN (
--          'task_participants', 'task_comments',
--          'task_activity',     'task_requests'
--        )
--   AND  qual = 'true';
-- Expected: 0 rows.

-- 4. Realtime publication
-- SELECT tablename
-- FROM   pg_publication_tables
-- WHERE  pubname  = 'supabase_realtime'
--   AND  tablename IN (
--          'task_participants', 'task_comments',
--          'task_activity',     'task_requests'
--        );
-- Expected: 4 rows.
