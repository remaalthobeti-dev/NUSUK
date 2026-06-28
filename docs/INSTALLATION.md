# دليل التثبيت — نسك

## المتطلبات المسبقة

| الأداة | الإصدار الأدنى |
|---|---|
| Node.js | 18.17+ |
| npm | 9+ |
| Git | أي إصدار |
| حساب Supabase | مجاني أو مدفوع |

---

## 1. استنساخ المشروع

```bash
git clone https://github.com/your-org/nusuk.git
cd nusuk
```

## 2. تثبيت الاعتماديات

```bash
npm install
```

## 3. إعداد Supabase

### إنشاء مشروع Supabase
1. اذهب إلى [supabase.com](https://supabase.com) وسجّل الدخول
2. أنشئ مشروعاً جديداً
3. انتظر حتى تكتمل الإعداد (حوالي دقيقة)

### الحصول على المفاتيح
من لوحة تحكم Supabase → **Settings** → **API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. إعداد متغيرات البيئة

انسخ الملف النموذجي:
```bash
cp .env.example .env.local
```

أو أنشئ `.env.local` يدوياً:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. تشغيل مايجريشن قاعدة البيانات

في لوحة تحكم Supabase → **SQL Editor**، شغّل الملفات بالترتيب:

```sql
-- 1. المخطط الأساسي
-- المحتوى من: supabase/migrations/001_initial_schema.sql

-- 2. جدول التواجد
-- المحتوى من: supabase/migrations/002_employee_presence.sql

-- 3. Views والتحليلات
-- المحتوى من: supabase/migrations/003_phase4.sql
```

## 6. إضافة بيانات تجريبية (اختياري)

```sql
-- بيانات الفرق والموظفين الأساسية
-- المحتوى من: supabase/seed.sql

-- بيانات الحضور والمهام
-- المحتوى من: supabase/seed_phase2.sql

-- بيانات الإشعارات
-- المحتوى من: supabase/seed_phase4.sql
```

## 7. إعداد المصادقة (Supabase Auth)

في لوحة تحكم Supabase → **Authentication** → **URL Configuration**:

```
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000/auth/callback
```

### تفعيل موفر البريد الإلكتروني
**Authentication** → **Providers** → **Email** → تفعيل

### إنشاء أول حساب مدير
في **SQL Editor**:
```sql
-- بعد تسجيل الدخول الأول، اربط الحساب بسجل الموظف
UPDATE employees
SET user_id = auth.uid()
WHERE email = 'admin@nusuk.sa';
```

## 8. تشغيل المشروع محلياً

```bash
npm run dev
```

افتح المتصفح على: [http://localhost:3000](http://localhost:3000)

---

## استكشاف الأخطاء

### خطأ في الاتصال بـ Supabase
- تأكد من صحة `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- تأكد أن مشروع Supabase نشط وغير متوقف

### عدم ظهور الجداول
- تأكد من تشغيل جميع ملفات الـ migration بالترتيب الصحيح
- تحقق من وجود أخطاء في **SQL Editor**

### مشكلة في المصادقة
- تأكد من إعداد `Redirect URLs` بشكل صحيح
- في بيئة الإنتاج، استبدل `localhost` بنطاقك الفعلي
