-- ============================================================
-- 005_distribution.sql
-- توزيع بطاقة نسك — Distribution & Corporate Relations
-- ============================================================

-- ── Companies table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS distribution_companies (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('inside', 'outside')),
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Team roles config ──────────────────────────────────────────
-- Maps a team to its role within the distribution page.
-- page_role: 'distribution' | 'corporate'
CREATE TABLE IF NOT EXISTS distribution_team_configs (
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  page_role  text NOT NULL CHECK (page_role IN ('distribution', 'corporate')),
  PRIMARY KEY (team_id)
);

-- ── Requests table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS distribution_requests (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id        uuid        NOT NULL REFERENCES distribution_companies(id) ON DELETE CASCADE,
  company_name      text        NOT NULL,
  company_type      text        NOT NULL CHECK (company_type IN ('inside', 'outside')),
  request_type      text        NOT NULL CHECK (request_type IN ('new_batches', 'alert_late', 'alert_no_auth')),
  status            text        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'received', 'delivered', 'reported')),
  created_by        uuid        NOT NULL REFERENCES employees(id),
  created_by_name   text        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  processed_by      uuid        REFERENCES employees(id),
  processed_by_name text,
  processed_at      timestamptz,
  delegate_name     text,
  delegate_phone    text,
  notes             text
);

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE distribution_companies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_team_configs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_requests       ENABLE ROW LEVEL SECURITY;

-- Companies: all authenticated can read
CREATE POLICY "dist_companies_select" ON distribution_companies
  FOR SELECT TO authenticated USING (is_active = true);

-- Team configs: all authenticated can read (sidebar / page role check)
CREATE POLICY "dist_team_configs_select" ON distribution_team_configs
  FOR SELECT TO authenticated USING (true);

-- Requests: all authenticated can read / insert / update (business logic in actions)
CREATE POLICY "dist_requests_select" ON distribution_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dist_requests_insert" ON distribution_requests
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "dist_requests_update" ON distribution_requests
  FOR UPDATE TO authenticated USING (true);

-- ── Sample companies ──────────────────────────────────────────
INSERT INTO distribution_companies (name, type, sort_order) VALUES
  ('الشركة الأهلية للتأمين',      'inside',  1),
  ('شركة ولاء للتأمين',           'inside',  2),
  ('شركة بوبا العربية',           'inside',  3),
  ('شركة أليانز السعودية',        'inside',  4),
  ('شركة ملاذ للتأمين',           'inside',  5),
  ('شركة المتحدة للتأمين',        'inside',  6),
  ('شركة تكافل الراجحي',          'inside',  7),
  ('شركة أيادي السعودية',         'outside', 1),
  ('شركة الخليج للتأمين',         'outside', 2),
  ('شركة ريلاكس للتأمين',         'outside', 3),
  ('شركة ميدغلف للتأمين',         'outside', 4),
  ('شركة إيس للتأمين',            'outside', 5)
ON CONFLICT DO NOTHING;
