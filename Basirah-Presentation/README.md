# بصيرة AI — Executive Interactive Presentation

عرض تقديمي تفاعلي (ليس PowerPoint) لمشروع **بصيرة AI** — العقل التشغيلي الذكي للحج.

## البنية

```
Basirah-Presentation/
├── index.html      # 15 شريحة (Section) بالكامل
├── style.css       # نظام تصميم Executive / Glassmorphism / Luxury
├── script.js       # التفاعلات: تنقّل، عدادات، Typewriter، سيناريوهات What-If
├── assets/         # ملفات وسائط إضافية (اختياري)
└── slides/         # مساحة لأي أصول خاصة بشريحة محددة
```

## التشغيل

لا حاجة لأي بناء (build). افتح الملف مباشرة أو شغّل خادمًا محليًا:

```bash
cd Basirah-Presentation
python3 -m http.server 8080
```

ثم افتح `http://localhost:8080`.

## التقنية

- **Tailwind CSS** (عبر CDN) — بدون Bootstrap.
- **RTL** بالكامل، خط **IBM Plex Sans Arabic / Tajawal**.
- رسومات SVG + CSS مبنية يدويًا (بدون صور جاهزة إلا عند الضرورة).
- كل شريحة `100vh` مع `scroll-snap`، وتنقّل جانبي بالنقاط.
- حركات: Fade / Scale / Float / Glow / Parallax خفيف عبر `IntersectionObserver`.

## الألوان

| الاسم | القيمة |
|---|---|
| Primary | `#083A2F` |
| Secondary | `#0F5C4B` |
| Gold | `#C9A227` |
| Background | `#F6F8F6` |
