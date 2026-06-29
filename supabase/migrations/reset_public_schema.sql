-- ============================================================
-- Development Database Reset
-- reset_public_schema.sql
--
-- Run this ONCE in the Supabase SQL Editor to wipe the public
-- schema and restore the required grants.
-- Then run 001_baseline.sql immediately after.
--
-- Safe for development databases with no production data.
-- DO NOT run against production.
-- ============================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

GRANT ALL    ON SCHEMA public TO postgres;
GRANT ALL    ON SCHEMA public TO service_role;
GRANT USAGE  ON SCHEMA public TO anon;
GRANT USAGE  ON SCHEMA public TO authenticated;
