/* ===================================================================
   Basirah AI — Executive Presentation — Motion & Interactions
   =================================================================== */
(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const navDotsContainer = document.getElementById("nav-dots");
  const progressBar = document.getElementById("progress-bar");

  /* ---------------- Opening cinematic curtain: fade from black → logo → hero ---------------- */
  const introCurtain = document.getElementById("intro-curtain");
  const curtainLogo = document.getElementById("curtain-logo");
  if (introCurtain) {
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => {
      setTimeout(() => curtainLogo.classList.add("show"), 250);
      setTimeout(() => {
        introCurtain.classList.add("fade-out");
        document.documentElement.style.overflow = "";
      }, 1700);
      setTimeout(() => introCurtain.remove(), 3000);
    });
  }

  /* ---------------- Hero live intro conversation (Slide 1) ---------------- */
  (function () {
    const heroSection = document.getElementById("slide-01");
    const heroThread = document.getElementById("hero-thread");
    if (!heroSection || !heroThread) return;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let token = 0;

    function el(html) {
      const wrap = document.createElement("div");
      wrap.innerHTML = html.trim();
      return wrap.firstElementChild;
    }

    function scrollThread() {
      heroThread.scrollTo({ top: heroThread.scrollHeight, behavior: "smooth" });
    }

    async function typeAssistant(text, myToken) {
      const bubble = el(`<div class="chat-bubble ai in text-sm"></div>`);
      heroThread.appendChild(bubble);
      scrollThread();
      let i = 0;
      while (i <= text.length) {
        if (myToken !== token) return;
        bubble.textContent = text.slice(0, i);
        i++;
        scrollThread();
        await sleep(20);
      }
    }

    async function typeUser(text, myToken) {
      const bubble = el(`<div class="chat-bubble user in text-sm"></div>`);
      heroThread.appendChild(bubble);
      scrollThread();
      let i = 0;
      while (i <= text.length) {
        if (myToken !== token) return;
        bubble.textContent = text.slice(0, i);
        i++;
        scrollThread();
        await sleep(38);
      }
    }

    async function showTyping(myToken) {
      const bubble = el(`
        <div class="chat-bubble ai loading-bubble">
          <div class="typing-row"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>
          <span class="text-white/50 text-xs font-semibold">بصيرة يكتب...</span>
        </div>`);
      heroThread.appendChild(bubble);
      requestAnimationFrame(() => bubble.classList.add("in"));
      scrollThread();
      await sleep(1100);
      if (myToken !== token) return false;
      bubble.remove();
      return true;
    }

    const ACTIVITY = [
      {
        label: "تحليل الاحتياجات...",
        icon: `<polygon points="12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5 12 2" fill="currentColor" stroke="none"/>`,
      },
      {
        label: "تحليل البيانات...",
        icon: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
      },
      {
        label: "توزيع الموارد...",
        icon: `<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M17 3.13a4 4 0 0 1 0 7.75"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>`,
      },
      {
        label: "تخطيط النقل...",
        icon: `<rect x="3" y="6" width="18" height="11" rx="2"/><path d="M3 12h18"/><circle cx="7.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/>`,
      },
      {
        label: "إنشاء خطة التشغيل...",
        icon: `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>`,
      },
    ];

    async function playActivityFeed(myToken) {
      const container = el(`<div class="chat-bubble ai !bg-white/[.03]"><div class="space-y-2.5" data-feed></div></div>`);
      heroThread.appendChild(container);
      scrollThread();
      const feed = container.querySelector("[data-feed]");
      for (const step of ACTIVITY) {
        if (myToken !== token) return;
        const prev = feed.querySelector(".stream-item:last-child .stream-check");
        if (prev) {
          prev.style.background = "rgba(74,222,128,.15)";
          prev.style.color = "#4ADE80";
        }
        const item = el(`
          <div class="stream-item">
            <span class="stream-check" style="background:rgba(201,162,39,.18); color:#E4C766;"><svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${step.icon}</svg></span>
            <span class="text-white/80 text-[13px] font-medium">${step.label}</span>
          </div>`);
        feed.appendChild(item);
        requestAnimationFrame(() => item.classList.add("in"));
        scrollThread();
        await sleep(650);
      }
      const last = feed.querySelector(".stream-item:last-child .stream-check");
      if (last) {
        last.style.background = "rgba(74,222,128,.15)";
        last.style.color = "#4ADE80";
      }
    }

    async function playHeroDemo(myToken) {
      heroThread.innerHTML = "";
      await typeAssistant("أهلاً وسهلاً، كيف يمكنني مساعدتك اليوم؟", myToken);
      await sleep(700);
      if (myToken !== token) return;

      await typeUser("خلك جاهز لموسم حج 1448هـ.", myToken);
      await sleep(400);
      if (myToken !== token) return;

      if (!(await showTyping(myToken))) return;

      await typeAssistant("تم. أنا جاهز لمساعدتك في التخطيط والتشغيل واتخاذ القرار طوال الموسم.", myToken);
      await sleep(500);
      if (myToken !== token) return;

      await playActivityFeed(myToken);
      if (myToken !== token) return;

      await sleep(3500);
      if (myToken !== token) return;
      playHeroDemo(myToken);
    }

    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            token++;
            playHeroDemo(token);
          } else {
            token++;
          }
        });
      },
      { threshold: 0.3 }
    );
    heroObserver.observe(heroSection);
  })();

  /* ---------------- Build side navigation dots ---------------- */
  slides.forEach((slide, i) => {
    const dot = document.createElement("div");
    dot.className = "nav-dot";
    dot.dataset.target = slide.id;
    dot.dataset.label = slide.dataset.nav || `شريحة ${i + 1}`;
    dot.addEventListener("click", () => {
      slide.scrollIntoView({ behavior: "smooth" });
    });
    navDotsContainer.appendChild(dot);
  });
  const dots = Array.from(navDotsContainer.querySelectorAll(".nav-dot"));

  /* ---------------- Scroll spy: active dot + progress bar ---------------- */
  function updateOnScroll() {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const ratio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    progressBar.style.transform = `scaleX(${ratio})`;

    let activeIndex = 0;
    let minDist = Infinity;
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const dist = Math.abs(rect.top);
      if (dist < minDist) {
        minDist = dist;
        activeIndex = i;
      }
    });
    dots.forEach((d, i) => d.classList.toggle("active", i === activeIndex));
  }
  document.addEventListener("scroll", updateOnScroll, { passive: true });
  updateOnScroll();

  /* ---------------- Reveal-on-scroll ---------------- */
  const revealEls = document.querySelectorAll(".reveal, .reveal-scale");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in");
      });
    },
    { threshold: 0.18 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------------- Draw-on-scroll SVG lines ---------------- */
  const drawLines = document.querySelectorAll(".draw-line");
  const drawObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in");
      });
    },
    { threshold: 0.3 }
  );
  drawLines.forEach((el) => drawObserver.observe(el));

  /* ---------------- Roadmap line grow (Slide 11) ---------------- */
  const roadmapLine = document.getElementById("roadmap-line");
  if (roadmapLine) {
    const roadmapObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) roadmapLine.classList.add("in");
        });
      },
      { threshold: 0.3 }
    );
    roadmapObserver.observe(roadmapLine);
  }

  /* ---------------- Ambient particle fields ---------------- */
  function spawnParticles(el, count) {
    if (!el) return;
    const w = el.clientWidth || 800;
    const h = el.clientHeight || 600;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      const size = 2 + Math.random() * 3;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${20 + Math.random() * 70}%`;
      p.style.setProperty("--dx", `${(Math.random() - 0.5) * 80}px`);
      p.style.setProperty("--dy", `${-60 - Math.random() * 120}px`);
      p.style.setProperty("--pmax", `${0.3 + Math.random() * 0.5}`);
      p.style.animationDuration = `${6 + Math.random() * 8}s`;
      p.style.animationDelay = `${Math.random() * 8}s`;
      el.appendChild(p);
    }
  }
  ["hero-particles", "s4-particles", "s14-particles", "s15-particles"].forEach(
    (id) => spawnParticles(document.getElementById(id), 26)
  );

  /* ---------------- Animated KPI counters ---------------- */
  function formatNumber(n) {
    return n.toLocaleString("en-US");
  }
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll("[data-count]");
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => counterObserver.observe(c));

  /* ---------------- Progress rings (Slide 9) ---------------- */
  const rings = document.querySelectorAll(".progress-ring-fg");
  const ringObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const pct = parseFloat(el.dataset.ring);
          const circumference = 264;
          const offset = circumference - (pct / 100) * circumference;
          requestAnimationFrame(() => {
            el.style.strokeDashoffset = offset;
          });
          ringObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );
  rings.forEach((r) => ringObserver.observe(r));

  /* ---------------- Live AI Demo (Slide 4) — auto-playing conversation ---------------- */
  (function () {
    const liveSection = document.getElementById("slide-04");
    const thread = document.getElementById("live-thread");
    if (!liveSection || !thread) return;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let runToken = 0;

    function scrollThread() {
      thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" });
    }

    function el(html) {
      const wrap = document.createElement("div");
      wrap.innerHTML = html.trim();
      return wrap.firstElementChild;
    }

    async function typeUserMessage(text, token) {
      const bubble = el(`<div class="chat-bubble user in text-sm"></div>`);
      thread.appendChild(bubble);
      scrollThread();
      let i = 0;
      while (i <= text.length) {
        if (token !== runToken) return;
        bubble.textContent = text.slice(0, i);
        i++;
        scrollThread();
        await sleep(16);
      }
    }

    async function showLoading(token) {
      const loading = el(`
        <div class="chat-bubble ai loading-bubble">
          <div class="typing-row"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>
          <span class="text-white/50 text-xs font-semibold">جاري تحليل البيانات...</span>
        </div>`);
      thread.appendChild(loading);
      requestAnimationFrame(() => loading.classList.add("in"));
      scrollThread();
      await sleep(1100);
      if (token !== runToken) return null;
      loading.remove();
      return true;
    }

    async function addStreamContainer() {
      const container = el(`<div class="chat-bubble ai"><div class="space-y-2.5" data-stream></div></div>`);
      thread.appendChild(container);
      scrollThread();
      return container.querySelector("[data-stream]");
    }

    async function addStreamItem(streamEl, label, token) {
      if (token !== runToken) return;
      const item = el(`
        <div class="stream-item">
          <span class="stream-check"><svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
          <span class="text-white/80 text-[13px] font-medium">${label}</span>
        </div>`);
      streamEl.appendChild(item);
      requestAnimationFrame(() => item.classList.add("in"));
      scrollThread();
      await sleep(430);
    }

    async function addMapCard(mapHtml, token) {
      if (token !== runToken) return;
      const card = el(`<div class="chat-bubble ai live-map-card p-0 overflow-hidden"><div class="p-4">${mapHtml}</div></div>`);
      thread.appendChild(card);
      requestAnimationFrame(() => card.classList.add("in"));
      scrollThread();
      await sleep(700);
    }

    async function addDecisionCard(items, token) {
      if (token !== runToken) return;
      const chips = items.map((t) => `<span class="decision-chip">${t}</span>`).join("");
      const card = el(`
        <div class="decision-box reveal-scale">
          <div class="flex items-center gap-2 mb-3">
            <div class="icon-tile on-dark w-7 h-7"><svg width="13" height="13" viewBox="0 0 24 24"><polygon points="12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5 12 2" fill="#C9A227" stroke="none"/></svg></div>
            <p class="text-gold font-bold text-sm">قرار بصيرة</p>
          </div>
          <div class="flex flex-wrap gap-2">${chips}</div>
        </div>`);
      thread.appendChild(card);
      requestAnimationFrame(() => card.classList.add("in"));
      scrollThread();
      await sleep(1600);
    }

    async function addDivider(label, token) {
      if (token !== runToken) return;
      const div = el(`<div class="scenario-divider">${label}</div>`);
      thread.appendChild(div);
      requestAnimationFrame(() => div.classList.add("in"));
      scrollThread();
      await sleep(500);
    }

    async function addAssistantLine(text, token) {
      if (token !== runToken) return;
      const bubble = el(`<div class="chat-bubble ai in text-sm text-white/85">${text}</div>`);
      thread.appendChild(bubble);
      scrollThread();
      await sleep(900);
    }

    const MAP_ACTIVATION = `
      <p class="text-white font-bold text-xs mb-3">الخريطة التشغيلية — مركزا التفعيل</p>
      <svg viewBox="0 0 480 190" class="w-full h-auto">
        <g stroke="#ffffff" stroke-opacity=".06"><line x1="0" y1="40" x2="480" y2="40"/><line x1="0" y1="95" x2="480" y2="95"/><line x1="0" y1="150" x2="480" y2="150"/></g>
        <path d="M110 70 C 180 70, 200 95, 240 95" fill="none" stroke="#C9A227" stroke-width="1" stroke-dasharray="3 6" opacity=".5"/>
        <path d="M370 70 C 300 70, 280 95, 240 95" fill="none" stroke="#C9A227" stroke-width="1" stroke-dasharray="3 6" opacity=".5"/>
        <g>
          <rect x="60" y="45" width="100" height="50" rx="10" fill="rgba(255,255,255,.06)" stroke="#4ADE80" stroke-width="1.2"/>
          <text x="110" y="65" text-anchor="middle" fill="#F6F8F6" font-size="11" font-weight="700" font-family="IBM Plex Sans Arabic">مركز 1</text>
          <text x="110" y="82" text-anchor="middle" fill="#4ADE80" font-size="9" font-family="IBM Plex Sans Arabic">40 موظف · مستقر</text>
        </g>
        <g>
          <rect x="320" y="45" width="100" height="50" rx="10" fill="rgba(180,70,58,.12)" stroke="#E0574A" stroke-width="1.2"/>
          <circle cx="420" cy="46" r="5" fill="none" stroke="#E0574A" stroke-width="1.4" class="ring-pulse"/>
          <circle cx="420" cy="46" r="3" fill="#E0574A"/>
          <text x="370" y="65" text-anchor="middle" fill="#F6F8F6" font-size="11" font-weight="700" font-family="IBM Plex Sans Arabic">مركز 2</text>
          <text x="370" y="82" text-anchor="middle" fill="#E0574A" font-size="9" font-family="IBM Plex Sans Arabic">اختناق متوقع</text>
        </g>
        <g transform="translate(240,110)">
          <circle r="26" fill="#0F5C4B" stroke="#C9A227" stroke-width="1.4" class="pulse-glow"/>
          <text text-anchor="middle" y="4" fill="#F6F8F6" font-size="10" font-weight="700" font-family="IBM Plex Sans Arabic">بصيرة</text>
        </g>
      </svg>`;

    const MAP_TRANSPORT = `
      <p class="text-white font-bold text-xs mb-3">الخريطة التفاعلية — المدينة ⟶ مكة</p>
      <svg viewBox="0 0 480 190" class="w-full h-auto">
        <path id="liveRoute" d="M40 150 C 150 40, 320 170, 440 40" fill="none" stroke="#C9A227" stroke-opacity=".25" stroke-width="3" stroke-dasharray="6 8"/>
        <circle cx="40" cy="150" r="7" fill="#4ADE80"/>
        <text x="40" y="172" text-anchor="middle" fill="#F6F8F6" font-size="9.5" font-family="IBM Plex Sans Arabic">المدينة</text>
        <circle cx="440" cy="40" r="7" fill="#C9A227"/>
        <text x="440" y="24" text-anchor="middle" fill="#F6F8F6" font-size="9.5" font-family="IBM Plex Sans Arabic">مكة</text>
        <circle cx="255" cy="112" r="7" fill="none" stroke="#E0574A" stroke-width="1.4" class="ring-pulse"/>
        <circle cx="255" cy="112" r="4" fill="#E0574A"/>
        <text x="255" y="132" text-anchor="middle" fill="#E0574A" font-size="9" font-family="IBM Plex Sans Arabic">ازدحام متوقع</text>
        <g>
          <rect x="-11" y="-6" width="22" height="12" rx="3" fill="#0F5C4B" stroke="#C9A227" stroke-width="1"/>
          <animateMotion dur="5s" repeatCount="indefinite" rotate="auto"><mpath href="#liveRoute"/></animateMotion>
        </g>
        <g>
          <rect x="-11" y="-6" width="22" height="12" rx="3" fill="#0F5C4B" stroke="#C9A227" stroke-width="1"/>
          <animateMotion dur="5s" begin="1.7s" repeatCount="indefinite" rotate="auto"><mpath href="#liveRoute"/></animateMotion>
        </g>
      </svg>`;

    const MAP_FALLBACK = `
      <p class="text-white font-bold text-xs mb-3">أفضل نقطة تشغيل بديلة — طريق الهجرة</p>
      <svg viewBox="0 0 480 170" class="w-full h-auto">
        <g>
          <rect x="40" y="30" width="110" height="46" rx="10" fill="rgba(180,70,58,.12)" stroke="#E0574A" stroke-width="1.2"/>
          <circle cx="150" cy="31" r="5" fill="none" stroke="#E0574A" stroke-width="1.4" class="ring-pulse"/>
          <circle cx="150" cy="31" r="3" fill="#E0574A"/>
          <text x="95" y="50" text-anchor="middle" fill="#F6F8F6" font-size="10.5" font-weight="700" font-family="IBM Plex Sans Arabic">حجاج المجاملة</text>
          <text x="95" y="66" text-anchor="middle" fill="#E0574A" font-size="9" font-family="IBM Plex Sans Arabic">متعطل</text>
        </g>
        <path d="M150 55 C 230 30, 260 100, 340 100" fill="none" stroke="#C9A227" stroke-width="1.4" stroke-dasharray="4 7" class="data-line"/>
        <g>
          <rect x="330" y="77" width="120" height="46" rx="10" fill="rgba(201,162,39,.1)" stroke="#C9A227" stroke-width="1.4"/>
          <g transform="translate(340,88)" stroke="#E4C766" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6 0C2.7 0 0 2.6 0 5.8 0 10 6 16 6 16s6-6 6-10.2C12 2.6 9.3 0 6 0z"/><circle cx="6" cy="5.6" r="2" fill="#E4C766" stroke="none"/></g>
          <text x="396" y="97" text-anchor="middle" fill="#F6F8F6" font-size="10.5" font-weight="700" font-family="IBM Plex Sans Arabic">طريق الهجرة</text>
          <text x="390" y="113" text-anchor="middle" fill="#E4C766" font-size="9" font-family="IBM Plex Sans Arabic">نقطة بديلة مقترحة</text>
        </g>
      </svg>`;

    async function scenarioActivation(token) {
      await typeUserMessage("وصل لدينا 5000 حاج في المدينة. لدينا مركزان للتفعيل، بكل مركز 40 موظفًا. نريد إنهاء التفعيل خلال اليوم.", token);
      await sleep(300);
      if (!(await showLoading(token))) return;
      const stream = await addStreamContainer();
      await addStreamItem(stream, "عدد خطوط الخدمة المطلوبة", token);
      await addStreamItem(stream, "توزيع الموظفين", token);
      await addStreamItem(stream, "مدة الإنجاز المتوقعة", token);
      await addStreamItem(stream, "نقاط الاختناق — تظهر على الخريطة", token);
      if (token !== runToken) return;
      await addMapCard(MAP_ACTIVATION, token);
      await addStreamItem(stream, "الاحتياج الإضافي من الموارد", token);
      await addStreamItem(stream, "توصيات لتحسين الأداء", token);
      await addDecisionCard(["زيادة خطي خدمة إضافيين", "إعادة توزيع الموظفين", "إنهاء التفعيل خلال 7 ساعات", "تقليل الانتظار 32%"], token);
    }

    async function scenarioTransport(token) {
      await typeUserMessage("لدينا 7000 حاج، و20 حافلة سعة كل واحدة 50 راكبًا. نريد نقلهم من المدينة إلى مكة.", token);
      await sleep(300);
      if (!(await showLoading(token))) return;
      const stream = await addStreamContainer();
      await addStreamItem(stream, "حالة الطرق", token);
      await addStreamItem(stream, "الازدحام الحالي", token);
      await addStreamItem(stream, "نقاط الاختناق", token);
      await addStreamItem(stream, "زمن الرحلة", token);
      await addStreamItem(stream, "أوقات الذروة", token);
      await addStreamItem(stream, "عدد الرحلات المطلوبة", token);
      if (token !== runToken) return;
      await addMapCard(MAP_TRANSPORT, token);
      await addAssistantLine("أفضل وقت للانطلاق، عدد الحافلات الإضافية، وأثر زيادة أو تقليل الموارد على مدة التنفيذ — تم احتسابها جميعًا.", token);
      await addDecisionCard(["إضافة 4 حافلات", "تأخير الرحلة الثانية", "استخدام المسار الشرقي", "تقليل مدة النقل 18%"], token);
    }

    async function scenarioFallback(token) {
      await typeUserMessage("تعطل مركز حجاج المجاملة في المدينة. ما الخطة البديلة؟", token);
      await sleep(300);
      if (!(await showLoading(token))) return;
      const stream = await addStreamContainer();
      await addStreamItem(stream, "عدد الحجاج — 8000", token);
      await addStreamItem(stream, "البطاقات غير المفعّلة — 6400", token);
      await addStreamItem(stream, "الرحلات القادمة — 30 حافلة كل ساعتين", token);
      await addStreamItem(stream, "المراكز القريبة والموظفون المتوفرون", token);
      await addStreamItem(stream, "الطقس وحالة الطرق", token);
      if (token !== runToken) return;
      await addMapCard(MAP_FALLBACK, token);
      const alert = el(`
        <div class="chat-bubble ai flex items-start gap-3 !bg-amber-400/10 !border-amber-400/30">
          <div class="icon-tile w-8 h-8 shrink-0" style="background:rgba(251,191,36,.16); color:#FBBF24;"><svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/><circle cx="12" cy="12" r="5"/></svg></div>
          <p class="text-amber-200 text-xs leading-relaxed">بسبب ارتفاع درجة الحرارة، يوصي بصيرة بتنفيذ التفعيل داخل الحافلات أثناء الرحلة لتقليل تعرض الحجاج لضربات الشمس.</p>
        </div>`);
      thread.appendChild(alert);
      requestAnimationFrame(() => alert.classList.add("in"));
      scrollThread();
      await sleep(1000);
      await addDecisionCard(["إنشاء نقطة تفعيل مؤقتة", "إعادة توزيع 64 موظفًا", "تفعيل داخل الحافلات", "إنهاء العملية خلال 6 ساعات"], token);
    }

    async function playDemo(token) {
      thread.innerHTML = "";
      const welcome = el(`<div class="chat-bubble ai in text-sm text-white/90">مرحبًا، أنا بصيرة.<br>كيف يمكنني مساعدتك في التخطيط التشغيلي اليوم؟</div>`);
      thread.appendChild(welcome);
      scrollThread();
      await sleep(1300);
      if (token !== runToken) return;

      await scenarioActivation(token);
      if (token !== runToken) return;
      await addDivider("سيناريو تالٍ", token);
      if (token !== runToken) return;

      await scenarioTransport(token);
      if (token !== runToken) return;
      await addDivider("سيناريو تالٍ", token);
      if (token !== runToken) return;

      await scenarioFallback(token);
      if (token !== runToken) return;

      await sleep(3200);
      if (token !== runToken) return;
      playDemo(token);
    }

    const liveObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runToken++;
            playDemo(runToken);
          } else {
            runToken++;
          }
        });
      },
      { threshold: 0.4 }
    );
    liveObserver.observe(liveSection);
  })();

  /* ---------------- Animated flow (Slide 5) ---------------- */
  const flowContainer = document.getElementById("flow-container");
  if (flowContainer) {
    const flowNodes = Array.from(flowContainer.querySelectorAll(".flow-node"));
    const connectors = Array.from(flowContainer.querySelectorAll(".connector"));
    let flowIndex = 0;
    let flowInterval = null;

    function stepFlow() {
      flowNodes.forEach((n) => n.classList.remove("active"));
      connectors.forEach((c) => c.classList.remove("active"));
      flowNodes[flowIndex].classList.add("active");
      if (connectors[flowIndex]) connectors[flowIndex].classList.add("active");
      flowIndex = (flowIndex + 1) % flowNodes.length;
    }

    const flowObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !flowInterval) {
            stepFlow();
            flowInterval = setInterval(stepFlow, 1300);
          } else if (!entry.isIntersecting && flowInterval) {
            clearInterval(flowInterval);
            flowInterval = null;
          }
        });
      },
      { threshold: 0.3 }
    );
    flowObserver.observe(flowContainer);
  }

  /* ---------------- What-If scenarios (Slide 7) ---------------- */
  const scenarios = {
    base: { response: "8 ثواني", resp: 18, risk: 18, resources: 6, rec: "استمرار الخطة الحالية دون تعديل" },
    surge: { response: "11 ثانية", resp: 55, risk: 60, resources: 70, rec: "توسيع نافذة التفعيل وإضافة نوبة عمل ثالثة" },
    closed: { response: "9 ثواني", resp: 40, risk: 85, resources: 55, rec: "إعادة توجيه الحجاج لأقرب مركزين متاحين فورًا" },
    road: { response: "10 ثواني", resp: 35, risk: 50, resources: 40, rec: "إعادة توجيه الحافلات عبر المسار البديل رقم 3" },
    staff: { response: "9 ثواني", resp: 30, risk: 55, resources: 65, rec: "استقطاب موظفين من المراكز الأقل ازدحامًا" },
  };

  const scenarioButtons = document.querySelectorAll(".scenario-btn");
  const sResponse = document.getElementById("s-response");
  const sRec = document.getElementById("s-rec");
  const barResponse = document.getElementById("bar-response");
  const barRisk = document.getElementById("bar-risk");
  const barResources = document.getElementById("bar-resources");

  function applyScenario(key) {
    const s = scenarios[key];
    if (!s || !sResponse) return;
    const parts = s.response.split(" ");
    sResponse.innerHTML = `${parts[0]} <span class="text-sm text-primary/40">${parts[1] || ""}</span>`;
    sRec.textContent = s.rec;
    if (barResponse) barResponse.style.width = `${s.resp}%`;
    if (barRisk) barRisk.style.width = `${s.risk}%`;
    if (barResources) barResources.style.width = `${s.resources}%`;
  }

  scenarioButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      scenarioButtons.forEach((b) => {
        b.classList.remove("active", "border-primary");
        b.classList.add("border-transparent");
      });
      btn.classList.add("active", "border-primary");
      btn.classList.remove("border-transparent");
      applyScenario(btn.dataset.scenario);
    });
  });

  /* ---------------- PRESENTATION_MODE — keynote-style navigation ---------------- */
  const presentationToggle = document.getElementById("presentation-toggle");
  const slideCounter = document.getElementById("slide-counter");
  let presentationMode = false;
  let wheelLocked = false;
  let currentSlideIndex = 0;

  function getCurrentSlideIndex() {
    let idx = 0;
    let minDist = Infinity;
    slides.forEach((slide, i) => {
      const dist = Math.abs(slide.getBoundingClientRect().top);
      if (dist < minDist) {
        minDist = dist;
        idx = i;
      }
    });
    return idx;
  }

  function updateSlideCounter() {
    currentSlideIndex = getCurrentSlideIndex();
    if (slideCounter) {
      slideCounter.textContent = `${String(currentSlideIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    }
  }

  function goToSlide(index) {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    slides[clamped].scrollIntoView({ behavior: "smooth", block: "start" });
    currentSlideIndex = clamped;
  }

  function setPresentationMode(on) {
    presentationMode = on;
    presentationToggle.classList.toggle("active", on);
    presentationToggle.setAttribute("aria-pressed", String(on));
    if (slideCounter) slideCounter.classList.toggle("visible", on);
    if (on) updateSlideCounter();
  }

  if (presentationToggle) {
    presentationToggle.addEventListener("click", () => setPresentationMode(!presentationMode));

    document.addEventListener(
      "keydown",
      (e) => {
        if (!presentationMode) return;
        if (e.key === " " || e.key === "ArrowDown" || e.key === "PageDown") {
          e.preventDefault();
          goToSlide(getCurrentSlideIndex() + 1);
        } else if (e.key === "ArrowUp" || e.key === "PageUp") {
          e.preventDefault();
          goToSlide(getCurrentSlideIndex() - 1);
        } else if (e.key === "Escape") {
          setPresentationMode(false);
        }
      },
      { passive: false }
    );

    document.addEventListener(
      "wheel",
      (e) => {
        if (!presentationMode || wheelLocked) return;
        if (Math.abs(e.deltaY) < 12) return;
        e.preventDefault();
        wheelLocked = true;
        goToSlide(getCurrentSlideIndex() + (e.deltaY > 0 ? 1 : -1));
        setTimeout(() => {
          wheelLocked = false;
        }, 900);
      },
      { passive: false }
    );

    document.addEventListener("scroll", () => {
      if (presentationMode) updateSlideCounter();
    }, { passive: true });
  }

  /* ---------------- Ending cinematic: fade extras → keep logo + line → fade to black ---------------- */
  const closingSlide = document.getElementById("slide-16");
  const endingCurtain = document.getElementById("ending-curtain");
  const endWordmark = document.getElementById("end-wordmark");
  const endCta = document.getElementById("end-cta");
  const endCopyright = document.getElementById("end-copyright");
  let endingTimers = [];

  function clearEndingSequence() {
    endingTimers.forEach((t) => clearTimeout(t));
    endingTimers = [];
    [endCta, endCopyright, endWordmark].forEach((el) => el && el.classList.remove("hide"));
    if (endingCurtain) endingCurtain.classList.remove("black");
  }

  function playEndingSequence() {
    clearEndingSequence();
    endingTimers.push(setTimeout(() => {
      endCta && endCta.classList.add("hide");
      endCopyright && endCopyright.classList.add("hide");
    }, 2600));
    endingTimers.push(setTimeout(() => {
      endWordmark && endWordmark.classList.add("hide");
    }, 4400));
    endingTimers.push(setTimeout(() => {
      endingCurtain && endingCurtain.classList.add("black");
    }, 6200));
  }

  if (closingSlide) {
    const endingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            playEndingSequence();
          } else {
            clearEndingSequence();
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75] }
    );
    endingObserver.observe(closingSlide);
  }

  /* ---------------- Operational Scenarios tabs/carousel (Slide 06) ---------------- */
  const opscTabs = Array.from(document.querySelectorAll(".opsc-tab"));
  const opscPanels = Array.from(document.querySelectorAll(".opsc-panel"));
  const opscPrev = document.getElementById("opsc-prev");
  const opscNext = document.getElementById("opsc-next");

  if (opscTabs.length && opscPanels.length) {
    let opscIndex = 0;

    function showOpscPanel(index) {
      opscIndex = (index + opscPanels.length) % opscPanels.length;
      opscPanels.forEach((panel, i) => {
        if (i === opscIndex) {
          panel.classList.remove("hidden");
          panel.classList.remove("in");
          panel.style.opacity = "0";
          panel.style.transform = "scale(.97)";
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              panel.style.opacity = "";
              panel.style.transform = "";
              panel.classList.add("in");
            });
          });
        } else {
          panel.classList.add("hidden");
          panel.classList.remove("in");
        }
      });
      opscTabs.forEach((tab, i) => {
        tab.classList.toggle("active", i === opscIndex);
        tab.classList.toggle("border-gold/60", i === opscIndex);
        tab.classList.toggle("border-transparent", i !== opscIndex);
      });
    }

    opscTabs.forEach((tab, i) => {
      tab.addEventListener("click", () => showOpscPanel(i));
    });
    if (opscPrev) opscPrev.addEventListener("click", () => showOpscPanel(opscIndex - 1));
    if (opscNext) opscNext.addEventListener("click", () => showOpscPanel(opscIndex + 1));
  }
})();
