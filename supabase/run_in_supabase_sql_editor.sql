-- ============================================================
-- توزيع بطاقة نسك — تشغيل هذا الملف كاملاً في Supabase SQL Editor
-- متوافق 100% مع PostgreSQL / Supabase — آمن للتكرار (Idempotent)
-- لا يحتوي على DROP / TRUNCATE / DELETE
-- ============================================================

-- ── 1. إنشاء الجداول (IF NOT EXISTS) ─────────────────────────

CREATE TABLE IF NOT EXISTS distribution_companies (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('inside', 'outside')),
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS distribution_team_configs (
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  page_role  text NOT NULL CHECK (page_role IN ('distribution', 'corporate')),
  PRIMARY KEY (team_id)
);

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

-- ── 2. UNIQUE constraint + Indexes (محمية بـ DO block) ────────

DO $$
BEGIN
  -- UNIQUE constraint على اسم الشركة (يمكّن UPSERT)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'distribution_companies_name_key'
      AND conrelid = 'distribution_companies'::regclass
  ) THEN
    ALTER TABLE distribution_companies
      ADD CONSTRAINT distribution_companies_name_key UNIQUE (name);
  END IF;

  -- Index على name
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_dist_companies_name'
  ) THEN
    CREATE INDEX idx_dist_companies_name ON distribution_companies (name);
  END IF;

  -- Index على type
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_dist_companies_type'
  ) THEN
    CREATE INDEX idx_dist_companies_type ON distribution_companies (type);
  END IF;
END $$;

-- ── 3. RLS ────────────────────────────────────────────────────

ALTER TABLE distribution_companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_team_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_requests     ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'dist_companies_select'
      AND tablename  = 'distribution_companies'
  ) THEN
    CREATE POLICY "dist_companies_select" ON distribution_companies
      FOR SELECT TO authenticated USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'dist_team_configs_select'
      AND tablename  = 'distribution_team_configs'
  ) THEN
    CREATE POLICY "dist_team_configs_select" ON distribution_team_configs
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'dist_requests_select'
      AND tablename  = 'distribution_requests'
  ) THEN
    CREATE POLICY "dist_requests_select" ON distribution_requests
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'dist_requests_insert'
      AND tablename  = 'distribution_requests'
  ) THEN
    CREATE POLICY "dist_requests_insert" ON distribution_requests
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'dist_requests_update'
      AND tablename  = 'distribution_requests'
  ) THEN
    CREATE POLICY "dist_requests_update" ON distribution_requests
      FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ── 4. UPSERT الشركات (لا يحذف أي بيانات — آمن للتكرار) ──────

INSERT INTO distribution_companies (name, type, is_active, sort_order) VALUES
  -- شركات الخارج
  ('شركة إثراء الخير',                                                          'outside', true,  1),
  ('شركة الرفادة',                                                               'outside', true,  2),
  ('شركة إثراء الجود',                                                          'outside', true,  3),
  ('شركة مشارق المتميزة',                                                       'outside', true,  4),
  ('شركة مشارق الماسية',                                                        'outside', true,  5),
  ('شركة مشارق الذهبية',                                                        'outside', true,  6),
  ('شركة رحلات ومنافع',                                                         'outside', true,  7),
  ('شركة الراجحي',                                                              'outside', true,  8),
  ('شركة إكرام الضيف',                                                          'outside', true,  9),
  ('شركة مناسك المشاعر',                                                        'outside', true, 10),
  ('شركة بشرى الضيافة',                                                         'outside', true, 11),
  ('شركة رواف منى',                                                             'outside', true, 12),
  ('شركة ضيوف البيت',                                                           'outside', true, 13),
  ('شركة أبراج مكة',                                                            'outside', true, 14),
  ('شركة الرفاد',                                                               'outside', true, 15),
  ('شركة طيران ناس',                                                            'outside', true, 16),
  ('شركة الخطوط السعودية',                                                      'outside', true, 17),
  ('شركة ميلينيوم',                                                             'outside', true, 18),
  ('شركة دليل الزوار',                                                          'outside', true, 19),
  ('شركة هوليداي',                                                              'outside', true, 20),
  ('شركة مكارم أجياد',                                                          'outside', true, 21),
  ('شركة يسر المشاعر',                                                          'outside', true, 22),
  ('شركة سيرا',                                                                 'outside', true, 23),
  ('شركة أنجم',                                                                 'outside', true, 24),
  -- شركات الداخل
  ('شركة الركن الخامس للحج',                                                    'inside', true,   1),
  ('شركة الإسلام المتحدة لخدمة حجاج الداخل',                                   'inside', true,   2),
  ('شركة الافاضة المتحده للخدمات المحدودة',                                     'inside', true,   3),
  ('شركة حملة الفرقان للحج',                                                    'inside', true,   4),
  ('شركة سماء الفاروق لخدمات حجاج الداخل',                                     'inside', true,   5),
  ('شركة قافلة الهاشم لخدمات حجاج الداخل المحدودة',                            'inside', true,   6),
  ('شركة المنهاج لخدمات الحجاج',                                                'inside', true,   7),
  ('شركة الظافرة لخدمة حجاج الداخل',                                           'inside', true,   8),
  ('شركة نسك المشاعر لخدمات حجاج الداخل',                                      'inside', true,   9),
  ('شركة اعمال السكينة لخدمات حجاج الداخل',                                    'inside', true,  10),
  ('شركة الإتقان للحج',                                                         'inside', true,  11),
  ('شركة أضواء الإيمان لخدمات الحجاج',                                          'inside', true,  12),
  ('شركة رفاق الصفوة التجارية',                                                 'inside', true,  13),
  ('شركة بيان لخدمة حجاج الداخل',                                              'inside', true,  14),
  ('شركة تفويج المحدودة لخدمة حجاج الداخل',                                    'inside', true,  15),
  ('شركة خالد بن زامل الغيثي الشريف لحجاج الداخل',                             'inside', true,  16),
  ('شركة البدر القادم لخدمات حجاج الداخل',                                      'inside', true,  17),
  ('شركة طوى الشرق لحجاج الداخل',                                              'inside', true,  18),
  ('شركة نور حراء المحدودة لخدمات حجاج الداخل',                                 'inside', true,  19),
  ('شركة طريق الهجرتين لخدمات حجاج الداخل المحدودة',                           'inside', true,  20),
  ('شركة سدانة لخدمات حجاج الداخل',                                            'inside', true,  21),
  ('شركة قافلة الملبي لخدمات حجاج الداخل',                                     'inside', true,  22),
  ('شركة محمد عمر بالي فلمبان وشريكه لخدمة حجاج الداخل',                      'inside', true,  23),
  ('شركة فهد البطي وشركاه التضامنية',                                           'inside', true,  24),
  ('شركة باب السلام لخدمات حجاج الداخل المحدودة',                              'inside', true,  25),
  ('شركة الهجرة العربية المحدودة',                                              'inside', true,  26),
  ('شركة محسن بن سالم الأحمدي وشركائه لخدمات حجاج الداخل',                    'inside', true,  27),
  ('شركة قافلة الإتمام لخدمات حجاج الداخل',                                    'inside', true,  28),
  ('شركة الأطياف لخدمات حجاج الداخل',                                          'inside', true,  29),
  ('شركة مخيم رفادة المحدودة',                                                  'inside', true,  30),
  ('شركة احمد سالم الخزاعي وشريكه',                                            'inside', true,  31),
  ('شركة سعود عابد المجنوني وشريكه لخدمات حجاج الداخل',                        'inside', true,  32),
  ('شركة قافلة الخير لخدمات حجاج الداخل والمعتمرين',                           'inside', true,  33),
  ('شركة فجر الهدى',                                                            'inside', true,  34),
  ('شركة الحمراء المحدودة لخدمات حجاج الداخل',                                  'inside', true,  35),
  ('شركة عبد المجيد بن عبدالرحمن الجريسي',                                      'inside', true,  36),
  ('شركة رحاب المشاعر لخدمات الحجاج',                                          'inside', true,  37),
  ('شركة الراجحي لخدمات حجاج الداخل',                                           'inside', true,  38),
  ('شركة العهد الوطنيه لخدمات حجاج الداخل المحدودة',                           'inside', true,  39),
  ('شركة مواكب الأهلة لخدمات حجاج الداخل',                                     'inside', true,  40),
  ('شركة المعالي لخدمات حجاج الداخل',                                           'inside', true,  41),
  ('شركة المأمونية المحدودة للحج والعمرة',                                       'inside', true,  42),
  ('شركة صفا المشاعر لخدمة حجاج الداخل',                                       'inside', true,  43),
  ('شركة السلام المتحدة لخدمة حجاج الداخل',                                    'inside', true,  44),
  ('شركة حملة المحمل لخدمات حجاح الداخل',                                      'inside', true,  45),
  ('شركة هداية الراجحون لخدمات حجاج الداخل',                                   'inside', true,  46),
  ('شركة مواكب اليسر لخدمات حجاج الداخل المحدودة',                             'inside', true,  47),
  ('شركة فوج مكة لخدمات حجاج الداخل',                                          'inside', true,  48),
  ('شركة نسك لخدمات حجاج الداخل',                                              'inside', true,  49),
  ('شركة آفاق المشاعر التجارية لخدمات حجاج الداخل',                            'inside', true,  50),
  ('شركة حسن القرشي ومحمد القرشي لخدمة حجاج الداخل',                          'inside', true,  51),
  ('مؤسسة ريادة الوطن لخدمات الحجاج',                                           'inside', true,  52),
  ('شركة الطائفين لخدمة حجاج الداخل',                                           'inside', true,  53),
  ('شركة شمس طيبة لخدمات حجاج الداخل',                                         'inside', true,  54),
  ('شركة بيت المشاعر لخدمات حجاج الداخل',                                      'inside', true,  55),
  ('شركة الأسواف المحدودة',                                                     'inside', true,  56),
  ('شركة المهابة لخدمات حجاج الداخل المحدودة',                                  'inside', true,  57),
  ('شركة مخيمات الخيرات لخدمات حجاج الداخل',                                   'inside', true,  58),
  ('شركة عبد الوهاب صالح الراجحي وشركائه لخدمات حجاج الداخل',                 'inside', true,  59),
  ('شركة افاضة لخدمات حجاج الداخل',                                            'inside', true,  60),
  ('شركة نماء البركة لخدمات حجاج الداخل',                                       'inside', true,  61),
  ('شركة الفجر لخدمات حجاج الداخل',                                            'inside', true,  62),
  ('شركة مشاعل النور لخدمات حجاج الداخل والمعتمرين',                           'inside', true,  63),
  ('شركة محمد العلياني المحدودة لخدمة حجاج الداخل',                             'inside', true,  64),
  ('شركة مخيم الرشاد لخدمات حجاج الداخل المحدوده',                             'inside', true,  65),
  ('شركة سيف الإسلام لخدمات حجاج الداخل',                                      'inside', true,  66),
  ('شركة الخير المكية لخدمات حجاج الداخل',                                      'inside', true,  67),
  ('شركة عالم البشائر لخدمات حجاج الداخل',                                      'inside', true,  68),
  ('شركة سلفا للحج والعمرة',                                                    'inside', true,  69),
  ('شركة ركن الحطيم للحج',                                                      'inside', true,  70),
  ('شركة أخوان السعودية لخدمة حجاج الداخل',                                    'inside', true,  71),
  ('شركة وفود الحرمين لخدمة حجاج الداخل',                                      'inside', true,  72),
  ('شركة أعمال الشاطئ لخدمات حجاج الداخل',                                     'inside', true,  73),
  ('شركة منابر الإيمان لخدمة حجاج الداخل',                                      'inside', true,  74),
  ('شركة حمد معيوف اللحياني وحمد حماد العتيبي لخدمات حجاج الداخل',             'inside', true,  75),
  ('شركة سعود بن عبدالعزيز الجمعية لخدمة حجاج الداخل',                         'inside', true,  76),
  ('شركة المقام السعودية لخدمات الحج المحدودة',                                  'inside', true,  77),
  ('شركة بشائر الإسلام لخدمات حجاج الداخل',                                    'inside', true,  78),
  ('شركة جمال يوسف حمد الذوادي وشركاه',                                         'inside', true,  79),
  ('شركة محمد عبدالله القرشي وشركاه التضامنية',                                 'inside', true,  80),
  ('شركة حملة الرسالة لخدمات حجاج الداخل',                                     'inside', true,  81),
  ('شركة صالح الملحم وشركاه',                                                   'inside', true,  82),
  ('شركة عبدالله علي عبدالله بن محفوظ وشركاه لخدمات حجاج الداخل',              'inside', true,  83),
  ('شركة الإخلاص المتحدة لخدمة حجاج الداخل',                                   'inside', true,  84),
  ('مؤسسة قافلة مكة لخدمات الحجاج',                                             'inside', true,  85),
  ('شركة الفرقان المكية لخدمات حجاج الداخل',                                    'inside', true,  86),
  ('شركة الفارس لخدمات حجاج الداخل',                                           'inside', true,  87),
  ('شركة أبناء محمد شافعي وأبناء إبراهيم الدباب لخدمة حجاج الداخل',            'inside', true,  88),
  ('شركة عبد الهادي بن رويزن وشريكة لخدمة حجاج الداخل',                        'inside', true,  89),
  ('شركة الأبرار لخدمات حجاج الداخل',                                          'inside', true,  90),
  ('شركة عرفة لخدمات حجاج الداخل المحدودة',                                    'inside', true,  91),
  ('شركة الجليس الصالح لخدمة حجاج الداخل',                                     'inside', true,  92),
  ('شركة المحيميد للحج',                                                        'inside', true,  93),
  ('شركة السلوان المحدودة لخدمة حجاج الداخل',                                   'inside', true,  94),
  ('شركة الذاكرين لخدمات حجاج الداخل',                                          'inside', true,  95),
  ('شركة فوج الهدى لخدمات حجاج الداخل',                                        'inside', true,  96),
  ('شركة الخباري لخدمات حجاج الداخل',                                           'inside', true,  97),
  ('شركة رواحل الحج المحدودة لخدمات حجاج الداخل',                              'inside', true,  98),
  ('شركة الفردوس المتحدة لخدمة حجاج الداخل المحدودة',                           'inside', true,  99),
  ('شركة صالح بن غازي الظفيري وشركاه لخدمات حجاج الداخل المحدوده',             'inside', true, 100),
  ('شركة محمد خالد قديمي وشركاؤه لحجاج الداخل',                                'inside', true, 101),
  ('شركة عبدالله بريك العماري وشريكه لخدمات حجاج الداخل',                      'inside', true, 102),
  ('شركة فاخر منصور السهيمي وشريكه لخدمة حجاج الداخل',                         'inside', true, 103),
  ('شركة قوافل الحجيج المحدودة',                                                'inside', true, 104),
  ('شركة حملة البشائر لخدمات حجاج الداخل',                                     'inside', true, 105),
  ('شركة التيسير للحج والعمرة المحدودة',                                         'inside', true, 106),
  ('شركة المنار لخدمة حجاج الداخل والمعتمرين',                                  'inside', true, 107),
  ('شركة حملة أهالي القصيم للحج',                                               'inside', true, 108),
  ('شركة سعد جميل القرشي المحدودة لخدمات حجاج الداخل',                         'inside', true, 109),
  ('شركة صالح شاهر زيني وشركاه لخدمات حجاج الداخل',                           'inside', true, 110),
  ('شركة السندس المحدودة لحجاج الداخل',                                         'inside', true, 111),
  ('شركة ركن الأجور لخدمات حجاج الداخل',                                       'inside', true, 112),
  ('شركة قاصد المشاعر لخدمة حجاج الداخل',                                      'inside', true, 113),
  ('شركة الرحلة المباركة المحدودة لخدمات حجاج الداخل',                          'inside', true, 114),
  ('شركة سلمان ويوسف غازي الظفيري لخدمات حجاج الداخل',                         'inside', true, 115),
  ('شركة مخيم الوفاء لخدمات حجاج الداخل',                                      'inside', true, 116),
  ('شركة مدى الجنوب التجارية',                                                  'inside', true, 117),
  ('شركة جوهرة القوافل للحج والعمرة',                                            'inside', true, 118),
  ('شركة حملة الإحسان لخدمة حجاج الداخل',                                      'inside', true, 119),
  ('شركة فجر المناسك لخدمات حجاج الداخل',                                      'inside', true, 120),
  ('شركة المناسك لخدمات الحج والعمرة',                                           'inside', true, 121),
  ('شركة ناصر نصار الحازمي وشركاه',                                            'inside', true, 122),
  ('شركة محمد وعبدالرحمن احمد الحميري للحج',                                    'inside', true, 123),
  ('شركة المكرمون لخدمات حجاج الداخل المحدودة',                                 'inside', true, 124),
  ('شركة عبدالله الرويزن ومشعل الرويزن التضامنية',                              'inside', true, 125),
  ('مؤسسة عطا الله مجول الهذلي',                                                'inside', true, 126),
  ('شركة العطير لخدمة حجاج الداخل المحدودة',                                    'inside', true, 127),
  ('شركة قافلة المنار لخدمات حجاج الداخل',                                      'inside', true, 128),
  ('شركة سعد إبراهيم الحويجي وشركاه',                                           'inside', true, 129),
  ('شركة عبد الله احمد العصفور وشركاه لخدمات حجاج الداخل',                     'inside', true, 130),
  ('شركة الخماسية السعودية للتنمية التجارية',                                    'inside', true, 131),
  ('شركة حملة الصفوة التجارية لخدمات حجاج الداخل',                              'inside', true, 132),
  ('شركة ركاز المتقين المحدودة لخدمات حجاج الداخل',                             'inside', true, 133),
  ('شركة المسار العمراني لخدمة حجاج الداخل المحدودة',                           'inside', true, 134),
  ('شركة رواحل الإيمان المحدودة لخدمات حجاج الداخل',                            'inside', true, 135),
  ('شركة مواسم الغفران المحدودة لخدمة حجاج الداخل',                             'inside', true, 136),
  ('شركة فيض المشاعر لخدمة الحجاج',                                            'inside', true, 137),
  ('شركة مكارم لخدمات الحجاج',                                                  'inside', true, 138),
  ('شركة منازل الرافدين لخدمات حجاج الداخل',                                    'inside', true, 139),
  ('شركة قريش المحدودة',                                                        'inside', true, 140),
  ('شركة آذان لخدمات حجاج الداخل المحدودة',                                     'inside', true, 141),
  ('شركة هشام بن بدوي سكيك وشركاه',                                            'inside', true, 142),
  ('شركة الفرائض المحدودة لخدمات الحجاج',                                       'inside', true, 143),
  ('شركة الناصرية النموذجية لخدمات الحجاج',                                     'inside', true, 144),
  ('شركة المكتب الأول لخدمات الحجاج',                                           'inside', true, 145),
  ('مؤسسة عبداللطيف عبدالوهاب الحماد لخدمات الحجاج',                            'inside', true, 146),
  ('شركة الأنهار المتحدة لخدمة حجاج الداخل',                                   'inside', true, 147),
  ('شركة إيثار لخدمات حجاج الداخل المحدودة',                                    'inside', true, 148),
  ('شركة القصواء للحج والعمرة',                                                  'inside', true, 149),
  ('شركة الحمله الراقية لخدمات حجاج الداخل',                                   'inside', true, 150),
  ('شركة حج لخدمات حجاج الداخل',                                               'inside', true, 151),
  ('شركة الأخيار لخدمات حجاج الداخل',                                           'inside', true, 152),
  ('شركة بلاد الحرمين المحدودة لخدمات حجاج الداخل المحدودة',                   'inside', true, 153),
  ('شركة فجر النسك لخدمات',                                                     'inside', true, 154),
  ('شركة دار الإيمان الأولى للحج',                                              'inside', true, 155),
  ('عمر عبدالله سهيل وشركاه لخدمات حجاج الداخل',                               'inside', true, 156),
  ('شركة الميعاد السعودية لخدمات حجاج الداخل',                                  'inside', true, 157),
  ('مؤسسة سعود دهيران دخيل الله الشلوي لخدمات الحجاج',                         'inside', true, 158),
  ('شركة المستجار لخدمات حجاج الداخل',                                          'inside', true, 159),
  ('شركة عبدالله صالح الكاف وشركاه',                                            'inside', true, 160),
  ('شركة حملة العراجة للحج وخدمات حجاج الداخل',                                 'inside', true, 161),
  ('شركة مخيم النور لخدمات حجاج الداخل المحدودة',                               'inside', true, 162),
  ('شركة عبدالرحمن عثمان الكليب وشركاه',                                        'inside', true, 163),
  ('شركة محمد بن عبدالله الرويس لخدمة حجاج الداخل',                             'inside', true, 164),
  ('شركة التقوي لخدمات حجاج الداخل المحدودة',                                   'inside', true, 165),
  ('شركة نور النسك لخدمات الحجاج',                                              'inside', true, 166),
  ('شركة طوائف لخدمات حجاج الداخل',                                            'inside', true, 167),
  ('شركة قافلة النخبة لخدمات الحجاج',                                           'inside', true, 168),
  ('مؤسسة فهيد القرشي لخدمات حجاج الداخل',                                     'inside', true, 169),
  ('شركة المقام الأمين لخدمات حجاج الداخل',                                     'inside', true, 170),
  ('شركة الميقات السعودية لخدمة حجاج الداخل والعمرة المحدودة',                  'inside', true, 171),
  ('شركة سرهد لخدمات حجاج الداخل',                                             'inside', true, 172),
  ('شركة المشاعر المتحدة لخدمات حجاج الداخل المحدودة',                          'inside', true, 173),
  ('شركة الفلاح لخدمات الحجاج',                                                 'inside', true, 174),
  ('شركة ركب الهدى المحدودة',                                                   'inside', true, 175),
  ('شركة ملتقى الغدير لحجاج الداخل',                                            'inside', true, 176)
ON CONFLICT (name) DO UPDATE SET
  type       = EXCLUDED.type,
  is_active  = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;
  -- created_at غير مدرج في DO UPDATE — يبقى كما هو للشركات الموجودة

-- ── 5. تحقق من النتيجة ────────────────────────────────────────
SELECT
  type,
  count(*)   AS total,
  min(name)  AS first_alphabetically,
  max(name)  AS last_alphabetically
FROM distribution_companies
WHERE is_active = true
GROUP BY type
ORDER BY type;
