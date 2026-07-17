-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 007: Row Level Security for task sub-tables
-- Tables: task_participants, task_comments, task_activity, task_requests
--
-- Background
-- ──────────
-- These four tables were created post-baseline and had RLS disabled.
-- All mutations already pass through server actions that call
-- requireAuthenticated() and verify team membership in application code.
-- Enabling RLS adds a defence-in-depth layer that protects data even if the
-- application layer is bypassed (direct API calls, Realtime subscriptions, etc.)
--
-- Roles in this system (stored in employees.role, NOT PostgreSQL roles):
--   super_admin   – unrestricted access to everything
--   track_manager – manages their team's tasks; elevated read/write
--   team_member   – regular employee; scoped to their team and participation
--
-- Helper functions available (SECURITY DEFINER, defined in 001_baseline.sql):
--   current_employee_id()   → UUID of the employee row for auth.uid()
--   current_employee_role() → user_role enum value for that employee
--
-- Principle of Least Privilege
-- ────────────────────────────
-- SELECT policies are deliberately broad for task_participants, task_comments,
-- and task_activity because the parent "tasks" table already uses USING (true)
-- for SELECT (every authenticated employee can read every task). Making the
-- sub-tables more restrictive than the parent would create an inconsistency:
-- a user could see a task but not its comments. The documented rationale for
-- USING (true) on those three SELECT policies is therefore: consistency with
-- the tasks_select policy and the shared-workspace nature of this data.
--
-- task_requests SELECT is intentionally stricter — requests reveal who is
-- seeking collaboration or review from whom, warranting a targeted audience.
--
-- WRITE policies are strict in all cases: a user may only write rows that
-- record their own identity (employee_id / requester_id = current_employee_id()).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1 – Enable RLS on all four tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE task_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity     ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests     ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2 – task_participants
--
-- Schema: id, task_id, employee_id, joined_at, left_at
-- Used for: tracking who collaborates on a task (soft-deleted via left_at)
--
-- Read: any authenticated user
--   Rationale: tasks are visible to all (tasks_select: USING (true)).
--   Participant lists are shared collaborative context, not sensitive data.
--   Blocking reads here while allowing task reads would break the assignments
--   page which embeds participants in the task list query.
--
-- Insert: a user may only add themselves (employee_id = their own id)
--   This is the path triggered by respondToRequestAction accepting a request.
--
-- Update: a user may only update their own record, OR super_admin can act
--   on any record. Required because the application uses an UPSERT (onConflict
--   task_id,employee_id) which hits the UPDATE policy when the row exists.
--
-- Delete: denied for all (app uses soft-delete via left_at, no hard deletes)
-- ─────────────────────────────────────────────────────────────────────────────

-- SELECT: open to all authenticated users (see rationale above)
CREATE POLICY "task_participants_select"
  ON task_participants
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: a user may only enrol themselves as a participant
CREATE POLICY "task_participants_insert"
  ON task_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = current_employee_id());

-- UPDATE: a user may only update their own participant row;
--         super_admin can manage any record (e.g., force-removing a stale entry)
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

-- DELETE: no policy → implicitly denied for all authenticated users.
--         Hard deletes are not used by the application.


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3 – task_comments
--
-- Schema: id, task_id, employee_id, comment, created_at
-- Used for: team discussion threads on a task
--
-- Read: any authenticated user
--   Rationale: same as task_participants (consistency with tasks_select).
--   Comment threads are a shared workspace resource; hiding them from any
--   team member who can already read the parent task adds no security value.
--
-- Insert: a user may only post a comment attributed to themselves.
--   Enforced by requiring employee_id = current_employee_id().
--   The addCommentAction server action additionally verifies the task is in
--   the user's team before calling insert, providing defence-in-depth.
--
-- Update / Delete: denied for all (app does not support editing or deleting
--   comments; the absence of UPDATE/DELETE policies enforces this at DB level).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "task_comments_select"
  ON task_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "task_comments_insert"
  ON task_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = current_employee_id());

-- No UPDATE or DELETE policies → both operations implicitly denied.


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4 – task_activity
--
-- Schema: id, task_id, employee_id (nullable), event_type, description, created_at
-- Used for: append-only audit timeline (task created, assigned, commented, etc.)
--
-- Read: any authenticated user
--   Rationale: same as above; activity timelines are shared operational context.
--
-- Insert: a user may only log events under their own employee_id.
--   super_admin may also insert (e.g., for system-generated events that need
--   an admin attribution). employee_id IS nullable in the schema; however, all
--   current application code sets employee_id to context.employee.id, so the
--   policy allows super_admin as the only exception to own-identity writes.
--
-- Update / Delete: denied for all — activity is an immutable audit log.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "task_activity_select"
  ON task_activity
  FOR SELECT
  TO authenticated
  USING (true);

-- A user may log an event under their own id.
-- super_admin may also log system events (the only role ever needing to write
-- activity on behalf of an automated process).
CREATE POLICY "task_activity_insert"
  ON task_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = current_employee_id()
    OR current_employee_role() = 'super_admin'
  );

-- No UPDATE or DELETE policies → both operations implicitly denied.


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 5 – task_requests
--
-- Schema: id, task_id, requester_id, requestee_id, request_type, status,
--         created_at, updated_at
-- Used for: collaboration and review requests between employees
--
-- This table is intentionally MORE restrictive than the other three because
-- request records reveal interpersonal collaboration dynamics that not every
-- team member needs to see.
--
-- SELECT: visible to the parties directly involved or to those with oversight
--   • super_admin and track_manager — operational oversight of their team
--   • requester or requestee — the two parties in the request
--   • the task's assigned_to or created_by — the task owner(s) who need to
--     see who is requesting to work on their task
--   • active participants on the task — already collaborating, so seeing new
--     incoming requests is reasonable operational context
--
--   Note: task_participants_select is USING (true) so the EXISTS subquery
--   below will NOT cause a circular RLS evaluation.
--
-- Insert: only the requester may open a request under their own id.
--   The server action additionally validates: same team, not self-request,
--   requestee is active.
--
-- Update: only the requestee (accepting/rejecting) or super_admin.
--   The respondToRequestAction additionally confirms requestee == caller
--   and status == 'pending' before calling update.
--
-- Delete: denied for all — requests are retained as history.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "task_requests_select"
  ON task_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Unrestricted oversight roles
    current_employee_role() IN ('super_admin', 'track_manager')

    -- The two parties in the request
    OR requester_id  = current_employee_id()
    OR requestee_id  = current_employee_id()

    -- The task's primary stakeholders (owner and assignee)
    OR EXISTS (
      SELECT 1
      FROM   tasks t
      WHERE  t.id          = task_requests.task_id
        AND  (
          t.assigned_to = current_employee_id()
          OR t.created_by = current_employee_id()
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

-- Only the requester may open a request; they cannot impersonate another employee.
CREATE POLICY "task_requests_insert"
  ON task_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = current_employee_id());

-- Only the requestee may accept or reject a request; super_admin can intervene.
-- USING clause restricts which rows can be targeted for update.
-- WITH CHECK clause validates the new row state after the update.
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

-- No DELETE policy → hard deletes implicitly denied.


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 6 – Add tables to Realtime publication
--
-- The task-detail client (task-detail-client.tsx) subscribes to live changes
-- on all four tables filtered by task_id. With RLS enabled, Supabase Realtime
-- automatically enforces the SELECT policies above: each subscriber only
-- receives events for rows their policy allows them to read.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE task_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE task_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE task_requests;


-- ─────────────────────────────────────────────────────────────────────────────
-- Verification checklist (run in Supabase SQL editor after applying)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- 1. Confirm RLS is enabled on all four tables:
--    SELECT tablename, rowsecurity
--    FROM   pg_tables
--    WHERE  schemaname = 'public'
--      AND  tablename IN (
--             'task_participants', 'task_comments',
--             'task_activity', 'task_requests'
--           );
--    Expected: rowsecurity = true for all four rows.
--
-- 2. Confirm policies exist:
--    SELECT tablename, policyname, cmd
--    FROM   pg_policies
--    WHERE  schemaname = 'public'
--      AND  tablename IN (
--             'task_participants', 'task_comments',
--             'task_activity', 'task_requests'
--           )
--    ORDER BY tablename, cmd;
--
-- 3. Confirm Realtime publication includes the tables:
--    SELECT tablename
--    FROM   pg_publication_tables
--    WHERE  pubname = 'supabase_realtime'
--      AND  tablename IN (
--             'task_participants', 'task_comments',
--             'task_activity', 'task_requests'
--           );
--    Expected: 4 rows.
-- ─────────────────────────────────────────────────────────────────────────────
