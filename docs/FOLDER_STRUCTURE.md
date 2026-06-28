# هيكل مجلدات المشروع الكامل

```
NUSUK/
│
├── app/                                    # Next.js App Router
│   ├── (auth)/                             # مجموعة مسارات المصادقة
│   │   └── login/
│   │       └── page.tsx                    # صفحة تسجيل الدخول
│   │
│   ├── (dashboard)/                        # مجموعة مسارات لوحة التحكم
│   │   ├── layout.tsx                      # حارس المصادقة + التخطيط
│   │   └── dashboard/
│   │       ├── page.tsx                    # الصفحة الرئيسية (جميع الفرق)
│   │       ├── [teamId]/
│   │       │   └── page.tsx                # تفاصيل الفريق + الموظفين
│   │       ├── analytics/
│   │       │   └── page.tsx                # التحليلات والرسوم البيانية
│   │       ├── settings/
│   │       │   └── page.tsx                # إعدادات النظام (Tabs)
│   │       ├── notifications/
│   │       │   └── page.tsx                # مركز الإشعارات
│   │       └── activity/
│   │           └── page.tsx                # سجل النشاط والمراجعة
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                    # معالج OAuth callback
│   │
│   ├── globals.css                         # المتغيرات العامة + Tailwind
│   ├── layout.tsx                          # التخطيط الجذري (lang=ar, RTL)
│   └── page.tsx                            # الصفحة الافتراضية (redirect)
│
├── components/
│   │
│   ├── admin/
│   │   └── admin-overview.tsx              # نظرة عامة على جميع الفرق
│   │
│   ├── analytics/
│   │   └── analytics-dashboard.tsx         # رسوم بيانية + بطاقات المؤشرات
│   │
│   ├── audit/
│   │   └── audit-log-view.tsx              # جدول سجل النشاط مع التصفية والتصدير
│   │
│   ├── auth/
│   │   └── login-form.tsx                  # نموذج تسجيل الدخول
│   │
│   ├── dashboard/
│   │   ├── alerts-panel.tsx                # لوحة التنبيهات (فاق الاستراحة، إلخ)
│   │   ├── assign-task-dialog.tsx          # حوار تكليف مهمة جديدة
│   │   ├── countdown-timer.tsx             # مؤقت العد التنازلي
│   │   ├── employee-card.tsx               # بطاقة الموظف في الشبكة
│   │   ├── employee-drawer.tsx             # درج تفاصيل الموظف
│   │   ├── search-filters.tsx              # البحث والتصفية بالحالة
│   │   ├── status-config.ts                # إعدادات الحالات والألوان
│   │   ├── team-card.tsx                   # بطاقة الفريق في الصفحة الرئيسية
│   │   ├── team-dashboard.tsx              # لوحة تحكم الفريق (Realtime)
│   │   ├── team-stats.tsx                  # شريط إحصائيات الفريق
│   │   └── update-status-dialog.tsx        # حوار تحديث حالة الموظف
│   │
│   ├── layout/
│   │   ├── dashboard-layout.tsx            # المنسق الرئيسي (Sidebar + Navbar)
│   │   ├── navbar.tsx                      # شريط التنقل العلوي
│   │   └── sidebar.tsx                     # الشريط الجانبي (قابل للطي)
│   │
│   ├── notifications/
│   │   └── notification-center.tsx         # قائمة الإشعارات مع mark-as-read
│   │
│   ├── providers/
│   │   └── theme-provider.tsx              # موفر الوضع الداكن
│   │
│   ├── settings/
│   │   └── settings-dashboard.tsx          # Tabs: الفرق | الموظفون | الأدوار | الحالات
│   │
│   ├── shared/
│   │   ├── empty-state.tsx                 # حالة البيانات الفارغة
│   │   ├── loading-skeleton.tsx            # هياكل التحميل
│   │   ├── page-header.tsx                 # رأس الصفحة مع Breadcrumb
│   │   └── stats-card.tsx                  # بطاقة مؤشر KPI
│   │
│   └── ui/                                 # مكونات shadcn/ui (Radix UI)
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx                       # Drawer component (RTL-ready)
│       ├── skeleton.tsx
│       ├── switch.tsx
│       ├── table.tsx                       # جدول البيانات
│       ├── tabs.tsx                        # تبويبات Radix UI
│       ├── textarea.tsx
│       └── tooltip.tsx
│
├── hooks/
│   ├── use-alert-checker.ts                # فحص تنبيهات الاستراحة والمهام
│   ├── use-auth.ts                         # حالة المصادقة
│   ├── use-realtime-team.ts                # Supabase Realtime subscription
│   └── use-sidebar.ts                      # حالة الشريط الجانبي
│
├── lib/
│   ├── data/
│   │   ├── admin.ts                        # جلب بيانات الإدارة والتحليلات
│   │   └── dashboard.ts                    # جلب بيانات الفريق
│   ├── supabase/
│   │   ├── client.ts                       # عميل المتصفح (Browser Client)
│   │   ├── middleware.ts                   # حارس المسارات
│   │   └── server.ts                       # عميل الخادم (Server Client)
│   └── utils.ts                            # cn(), formatDate(), getRoleLabel()
│
├── types/
│   └── database.ts                         # أنواع TypeScript لجميع جداول DB
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql          # الجداول الأساسية + RLS + Enums
│   │   ├── 002_employee_presence.sql       # جدول التواجد + العد التنازلي
│   │   └── 003_phase4.sql                  # Views + Analytics functions
│   ├── seed.sql                            # 4 فرق + 12 موظف + مهام
│   ├── seed_phase2.sql                     # بيانات الحضور + سجل اليوم
│   └── seed_phase4.sql                     # بيانات الإشعارات
│
├── docs/
│   ├── INSTALLATION.md                     # دليل التثبيت
│   ├── DEPLOYMENT.md                       # دليل النشر على Vercel
│   └── FOLDER_STRUCTURE.md                 # هذا الملف
│
├── .env.example                            # نموذج متغيرات البيئة
├── .env.local                              # متغيرات البيئة المحلية (لا تُرفع)
├── .gitignore
├── components.json                         # إعدادات shadcn/ui
├── middleware.ts                           # Next.js Middleware
├── next.config.ts                          # إعدادات Next.js
├── package.json
├── postcss.config.mjs
├── README.md                               # توثيق المشروع الرئيسي
├── tailwind.config.ts                      # إعدادات Tailwind + Nusuk colors
└── tsconfig.json                           # إعدادات TypeScript
```

---

## أنماط المسارات

| المسار | النوع | الوصف |
|---|---|---|
| `/` | Static | إعادة توجيه → `/dashboard` |
| `/login` | Static | صفحة تسجيل الدخول |
| `/auth/callback` | Dynamic | معالج OAuth |
| `/dashboard` | Dynamic | لوحة التحكم الرئيسية |
| `/dashboard/[teamId]` | Dynamic | تفاصيل الفريق |
| `/dashboard/analytics` | Dynamic | التحليلات |
| `/dashboard/settings` | Dynamic | الإعدادات |
| `/dashboard/notifications` | Dynamic | الإشعارات |
| `/dashboard/activity` | Dynamic | سجل النشاط |

---

## أنماط المكونات

```
صفحة (Server Component)
  └── يجلب البيانات من lib/data/
      └── يمرر إلى مكون عميل (Client Component)
          └── يدير الحالة والتفاعلية
              └── يستخدم مكونات UI المشتركة
```
