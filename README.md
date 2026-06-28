# 🕌 نسك — نظام إدارة بطاقات العمليات

**Nusuk Cards Operations Dashboard** — A production-ready, real-time operations dashboard for internal team management, built with Next.js 15, Supabase, and TypeScript.

---

## ✨ المميزات الرئيسية

### لوحة التحكم الرئيسية
- عرض شامل لجميع الفرق مع إحصائيات الحضور اللحظية
- شريط إحصائيات عالمي (متاح / مشغول / استراحة / اجتماع / عن بُعد / خارج المكتب)
- بطاقات الفرق مع مؤشرات عبء العمل

### لوحة تفاصيل الفريق
- شبكة بطاقات الموظفين مع الحالة والمهمة الحالية ونسبة الإشغال
- درج تفاصيل الموظف: العد التنازلي، التقدم، جدول النشاط اليومي
- تحديث الحالة اللحظي عبر Supabase Realtime
- بحث وتصفية بالحالة

### التحليلات والتقارير
- المهام المكتملة اليوم، المهام النشطة، متوسط مدة المهمة
- رسم بياني لعبء عمل الموظفين
- مقارنة أداء الفرق
- توزيع حالات المهام (Pie Chart)
- تصدير إلى Excel و PDF

### الإعدادات
- إدارة الفرق (إنشاء / تعديل / تفعيل)
- إدارة الموظفين (إضافة / تعديل / تغيير الفريق والدور)
- عرض الأدوار والصلاحيات
- عرض حالات التواجد

### مركز الإشعارات
- عرض جميع الإشعارات مع التصفية حسب الحالة
- تعليم كمقروء / تعليم الكل كمقروء
- تصدير الإشعارات إلى Excel

### سجل النشاط والمراجعة
- جدول مُرقَّم لجميع إجراءات النظام
- بحث وتصفية
- تصدير إلى Excel وطباعة PDF

---

## 🛠 التقنيات المستخدمة

| التقنية | الإصدار | الغرض |
|---|---|---|
| **Next.js** | 15 | إطار العمل (App Router) |
| **TypeScript** | 5 | سلامة الأنواع |
| **Tailwind CSS** | 3 | التنسيق |
| **shadcn/ui** | — | مكونات الواجهة (Radix UI) |
| **Supabase** | 2 | قاعدة البيانات + Auth + Realtime |
| **Recharts** | 2 | الرسوم البيانية |
| **XLSX (SheetJS)** | — | تصدير Excel |
| **next-themes** | — | الوضع الداكن |
| **React Hook Form + Zod** | — | التحقق من النماذج |

---

## 🗂 هيكل المشروع

```
NUSUK/
├── app/
│   ├── (auth)/login/          # صفحة تسجيل الدخول
│   ├── (dashboard)/
│   │   ├── layout.tsx          # حارس المصادقة + التخطيط
│   │   └── dashboard/
│   │       ├── page.tsx        # لوحة التحكم الرئيسية
│   │       ├── [teamId]/       # تفاصيل الفريق
│   │       ├── analytics/      # التحليلات
│   │       ├── settings/       # الإعدادات
│   │       ├── notifications/  # الإشعارات
│   │       └── activity/       # سجل النشاط
│   ├── auth/callback/          # معالج OAuth
│   ├── globals.css
│   └── layout.tsx              # التخطيط الجذري (RTL + Dark mode)
│
├── components/
│   ├── admin/                  # مكونات لوحة التحكم الإدارية
│   ├── analytics/              # مكونات التحليلات والرسوم البيانية
│   ├── audit/                  # سجل النشاط
│   ├── auth/                   # مكونات المصادقة
│   ├── dashboard/              # مكونات الفريق (بطاقات، درج، إلخ)
│   ├── layout/                 # الشريط الجانبي + شريط التنقل
│   ├── notifications/          # مركز الإشعارات
│   ├── providers/              # موفرو السياق
│   ├── settings/               # إدارة الفرق والموظفين
│   ├── shared/                 # مكونات مشتركة (هياكل التحميل، الحالات الفارغة)
│   └── ui/                     # مكونات shadcn/ui
│
├── hooks/
│   ├── use-realtime-team.ts    # اشتراك Supabase Realtime
│   ├── use-alert-checker.ts    # فحص التنبيهات الدورية
│   ├── use-auth.ts
│   └── use-sidebar.ts
│
├── lib/
│   ├── data/
│   │   ├── dashboard.ts        # جلب بيانات الفريق
│   │   └── admin.ts            # جلب بيانات الإدارة والتحليلات
│   ├── supabase/               # عملاء Supabase (browser/server/middleware)
│   └── utils.ts                # دوال مساعدة
│
├── types/
│   └── database.ts             # أنواع TypeScript لقاعدة البيانات
│
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   ├── 002_employee_presence.sql
    │   └── 003_phase4.sql      # Views + Analytics functions
    ├── seed.sql
    ├── seed_phase2.sql
    └── seed_phase4.sql
```

---

## 🗄 مخطط قاعدة البيانات

```
teams            employees          tasks
─────────        ─────────          ─────
id               id                 id
name             user_id (FK→auth)  title
name_en          team_id (FK→teams) description
description      full_name          status
color            email              priority
icon             phone              team_id
is_active        role               assigned_to
created_at       avatar_url         created_by
updated_at       is_active          due_date
                 created_at         started_at
                 updated_at         completed_at

employee_presence    activity_logs       notifications
─────────────────    ─────────────       ─────────────
id                   id                  id
employee_id (FK)     actor_id (FK)       recipient_id
availability_status  action              sender_id
workload_percent     entity_type         type
notes                entity_id           title
updated_at           old_values          body
                     new_values          is_read
                     created_at          read_at
                                         created_at
```

---

## 🔐 الأدوار والصلاحيات

| الدور | الصلاحيات |
|---|---|
| **admin** | صلاحيات كاملة، إدارة الفرق والموظفين والإعدادات |
| **supervisor** | إدارة فريقه، تكليف المهام، متابعة الموظفين |
| **employee** | تحديث حالته الشخصية، عرض مهامه |

---

## 🚀 البدء السريع

راجع [دليل التثبيت](docs/INSTALLATION.md) و [دليل النشر](docs/DEPLOYMENT.md).

---

## 📄 الترخيص

هذا المشروع مخصص للاستخدام الداخلي في منظومة نسك. جميع الحقوق محفوظة.
