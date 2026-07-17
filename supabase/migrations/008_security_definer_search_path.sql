-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 008: Harden SECURITY DEFINER helper functions
--
-- Problem
-- ───────
-- Two SECURITY DEFINER functions defined in 001_baseline.sql lack an explicit
-- SET search_path clause:
--
--   current_employee_id()   – returns the employees.id for the current user
--   current_employee_role() – returns the employees.role for the current user
--
-- Without a pinned search_path, a database user who can CREATE objects in any
-- schema that appears earlier in the default search_path could shadow the
-- `employees` table or the `auth` schema's `uid()` function, causing the
-- SECURITY DEFINER function to read attacker-controlled data instead of the
-- real table. PostgreSQL's Security Advisor flags any SECURITY DEFINER
-- function that omits SET search_path as a vulnerability.
--
-- Fix
-- ───
-- Re-declare both functions with CREATE OR REPLACE. Everything is identical to
-- the original definition except for the addition of SET search_path = public.
-- This is a no-op from the application's perspective: signatures, return types,
-- volatility (STABLE), and access privileges are unchanged.
--
-- current_employee_team_id() (introduced in 007_task_subtables_rls.sql) already
-- carries SET search_path = public and needs no change here.
--
-- handle_new_auth_user() (004_first_admin_bootstrap.sql) already carries
-- SET search_path = public and needs no change here.
--
-- Scope
-- ─────
-- This migration touches only function metadata. It does not alter any table,
-- index, RLS policy, trigger, or row. No existing RLS policy breaks because
-- CREATE OR REPLACE preserves the function OID that the policies reference.
--
-- Post-apply verification
-- ───────────────────────
-- Run in Supabase SQL editor to confirm:
--
--   SELECT proname, prosecdef, proconfig
--   FROM   pg_proc
--   WHERE  proname IN ('current_employee_id', 'current_employee_role')
--     AND  pronamespace = 'public'::regnamespace;
--
-- Expected: prosecdef = true, proconfig contains 'search_path=public' for both.
--
-- After applying, re-run the Supabase Security Advisor. The two warnings for
-- "Function with mutable search_path" should no longer appear.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- current_employee_id()
--
-- Returns the employees.id (UUID) for the currently authenticated user by
-- looking up auth.uid() in the employees table.
--
-- STABLE: safe — auth.uid() is constant within a transaction and the employees
-- table is not modified within a single RLS evaluation pass.
--
-- SECURITY DEFINER: required — the function must be able to read the employees
-- table even when called from an RLS USING expression on a table whose own
-- policies would otherwise restrict the read.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM   employees
  WHERE  user_id = auth.uid()
  LIMIT  1;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- current_employee_role()
--
-- Returns the user_role enum value for the currently authenticated user.
--
-- Same STABLE + SECURITY DEFINER rationale as current_employee_id() above.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_employee_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM   employees
  WHERE  user_id = auth.uid()
  LIMIT  1;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Explicit EXECUTE grants
--
-- PostgreSQL's default grants EXECUTE on new functions to PUBLIC. CREATE OR
-- REPLACE preserves existing grants, so no re-grant is strictly necessary.
-- These are written out explicitly so the Security Advisor can see that the
-- grants are intentional and so future reviewers understand the access model.
--
-- authenticated: the Supabase PostgREST role used for logged-in users.
--   These functions are called exclusively from RLS policies that are already
--   scoped to TO authenticated, so granting EXECUTE to this role is correct.
--
-- anon: the unauthenticated Supabase role. Granted so that Supabase's internal
--   policy-evaluation machinery can invoke the function even in edge cases
--   where the role has not yet been resolved; the functions themselves return
--   NULL for unauthenticated callers (auth.uid() returns NULL → no row found).
-- ─────────────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION current_employee_id()   TO authenticated, anon;
GRANT EXECUTE ON FUNCTION current_employee_role() TO authenticated, anon;
