# دليل النشر على Vercel — نسك

## النشر على Vercel (الطريقة الموصى بها)

### المتطلبات
- حساب [Vercel](https://vercel.com)
- حساب [Supabase](https://supabase.com) مع مشروع مُعَدّ
- مستودع GitHub/GitLab/Bitbucket

---

## الخطوة 1: رفع الكود إلى GitHub

```bash
git init
git add .
git commit -m "feat: initial production build"
git remote add origin https://github.com/your-org/nusuk.git
git push -u origin main
```

---

## الخطوة 2: إنشاء مشروع Vercel

1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. اختر **Import Git Repository**
3. اختر مستودع `nusuk`
4. **Framework Preset**: Next.js (يُكتشف تلقائياً)
5. **Root Directory**: `.` (الجذر)

---

## الخطوة 3: إعداد متغيرات البيئة

في صفحة إعداد المشروع على Vercel، أضف:

| المتغير | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح `anon public` من Supabase |

---

## الخطوة 4: إعداد Supabase للإنتاج

في لوحة تحكم Supabase → **Authentication** → **URL Configuration**:

```
Site URL: https://your-app.vercel.app
Redirect URLs:
  https://your-app.vercel.app/auth/callback
  https://your-custom-domain.com/auth/callback
```

---

## الخطوة 5: النشر

اضغط **Deploy** وانتظر اكتمال البناء (2-3 دقائق).

---

## نطاق مخصص (Custom Domain)

1. في لوحة تحكم Vercel → **Settings** → **Domains**
2. أضف نطاقك: `nusuk.yourdomain.com`
3. اتبع تعليمات إعداد DNS
4. حدّث `Site URL` في Supabase لتعكس النطاق الجديد

---

## إعدادات الإنتاج الموصى بها

### Supabase
```sql
-- تفعيل RLS على جميع الجداول (مُفعَّل بالفعل في المايجريشن)
-- تأكد من وجود policies مناسبة

-- تفعيل Realtime للجداول المطلوبة
-- (مُفعَّل في المايجريشن: employee_presence, tasks)
```

### Vercel
- **Region**: `fra1` (فرانكفورت) أو `sin1` (سنغافورة) — الأقرب لمنطقة الخليج
- **Node.js Version**: 20.x
- **Build Command**: `npm run build` (افتراضي)
- **Output Directory**: `.next` (افتراضي)

---

## CI/CD التلقائي

بعد الإعداد، كل `git push` إلى `main` سيُطلق نشراً تلقائياً على Vercel.

```bash
# تطوير على فرع منفصل
git checkout -b feature/new-feature
# ... تعديلات ...
git push origin feature/new-feature
# Vercel ينشئ Preview URL تلقائياً لكل فرع
```

---

## المراقبة والأداء

### Vercel Analytics
في **Settings** → **Analytics** → تفعيل Web Analytics المجاني.

### Supabase Monitoring
- **Database** → **Reports**: مراقبة الاستعلامات البطيئة
- **Auth** → **Users**: مراقبة المستخدمين النشطين
- **Realtime** → **Inspector**: تتبع الاشتراكات النشطة

---

## النسخ الاحتياطي

```sql
-- نسخ احتياطي يدوي من Supabase Dashboard
-- Settings → Database → Backups

-- أو عبر pg_dump:
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" \
  --schema=public \
  -f backup_$(date +%Y%m%d).sql
```
