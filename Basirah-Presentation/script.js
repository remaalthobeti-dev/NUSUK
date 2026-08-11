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
      heroThread.scrollTop = heroThread.scrollHeight;
    }

    async function typeAssistant(text, myToken) {
      const bubble = el(`<div class="chat-bubble ai text-sm"></div>`);
      heroThread.appendChild(bubble);
      requestAnimationFrame(() => bubble.classList.add("in"));
      scrollThread();
      let i = 0;
      while (i <= text.length) {
        if (myToken !== token) return;
        bubble.textContent = text.slice(0, i);
        i++;
        scrollThread();
        await sleep(48);
      }
    }

    async function typeUser(text, myToken) {
      const bubble = el(`<div class="chat-bubble user text-sm"></div>`);
      heroThread.appendChild(bubble);
      requestAnimationFrame(() => bubble.classList.add("in"));
      scrollThread();
      let i = 0;
      while (i <= text.length) {
        if (myToken !== token) return;
        bubble.textContent = text.slice(0, i);
        i++;
        scrollThread();
        await sleep(65);
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

    async function playHeroDemo(myToken) {
      heroThread.innerHTML = "";
      await typeAssistant("أهلاً وسهلاً، كيف يمكنني مساعدتك اليوم؟", myToken);
      await sleep(900);
      if (myToken !== token) return;

      await typeUser("خلك جاهز لموسم حج 1448هـ.", myToken);
      await sleep(600);
      if (myToken !== token) return;

      if (!(await showTyping(myToken))) return;

      await typeAssistant("تم. أنا جاهز لمساعدتك في التخطيط والتشغيل واتخاذ القرار طوال الموسم.", myToken);
      /* Motion settles here — the demo stays on this line, no further animation. */
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

  /* ---------------- Operations Map (Slide 02) — live command & control center ---------------- */
  (function () {
    const opsSection = document.getElementById("slide-02");
    const svg = document.getElementById("ops-map");
    if (!opsSection || !svg) return;

    const mapWrap = document.getElementById("ops-map-wrap");
    const mapViewport = document.getElementById("map-viewport");
    const mainRoutePath = document.getElementById("mainRoute");
    const altRoutePath = document.getElementById("altRoute");
    const altRouteLabel = document.getElementById("altRouteLabel");
    const busesLayer = document.getElementById("layer-buses");
    const selectedPulse = document.getElementById("selectedPulse");
    const selectedGlow = document.getElementById("selectedGlow");
    const selectedConnLine = document.getElementById("selectedConnLine");
    const tripPanel = document.getElementById("trip-panel");
    const tripPanelTitle = document.getElementById("trip-panel-title");
    const tripPanelBody = document.getElementById("trip-panel-body");
    const tripPanelClose = document.getElementById("trip-panel-close");
    const suggestBtn = document.getElementById("basirah-suggest-btn");
    const suggestionBanner = document.getElementById("suggestion-banner");
    const kpiActiveBuses = document.getElementById("kpi-active-buses");
    const kpiPilgrims = document.getElementById("kpi-pilgrims");
    const kpiDelay = document.getElementById("kpi-delay");
    const zoomInBtn = document.getElementById("map-zoom-in");
    const zoomOutBtn = document.getElementById("map-zoom-out");
    const zoomResetBtn = document.getElementById("map-zoom-reset");

    const STAFF_NAMES = [
      "عبدالله الحربي", "فيصل العتيبي", "سعود القحطاني", "ناصر الزهراني",
      "خالد الشمري", "تركي الدوسري", "بندر السبيعي", "ماجد الغامدي",
      "سلطان المطيري", "عبدالعزيز الرشيدي", "فهد العنزي", "يوسف الشهري",
    ];
    const STATUS_POOL = ["في الطريق", "في الطريق", "في الطريق", "متوقفة عند نقطة تفتيش"];
    const CAPACITY = 50;
    const CHECKPOINTS = [
      { name: "نقطة تفتيش 1", frac: 0.22 },
      { name: "نقطة تفتيش 2", frac: 0.42 },
      { name: "نقطة تفتيش 3", frac: 0.66 },
      { name: "نقطة تفتيش 4", frac: 0.86 },
    ];
    const HUB_POINT = { x: 830, y: 450 };

    function pad(n) {
      return String(n).padStart(2, "0");
    }
    function randPhone() {
      return "05" + Math.floor(10000000 + Math.random() * 89999999);
    }
    function randBetween(min, max) {
      return Math.round(min + Math.random() * (max - min));
    }
    function lastCheckpoint(bus) {
      if (bus.usingAlt) return "تجاوز طريق الهجرة";
      let passed = null;
      for (const cp of CHECKPOINTS) {
        if (bus.frac >= cp.frac) passed = cp;
      }
      return passed ? passed.name : "لم يصل بعد";
    }

    const BUS_COUNT = 12;
    const buses = [];
    for (let i = 0; i < BUS_COUNT; i++) {
      const depHour = 4 + Math.floor(i / 6);
      const depMin = (i % 6) * 10;
      const etaHour = depHour + 3 + (i % 2);
      const etaMin = (depMin + 20) % 60;
      buses.push({
        id: `BUS-${pad(i + 1)}`,
        pilgrims: randBetween(38, CAPACITY),
        staff: STAFF_NAMES[i % STAFF_NAMES.length],
        phone: randPhone(),
        departure: `${pad(depHour)}:${pad(depMin)} ص`,
        eta: `${pad(etaHour)}:${pad(etaMin)} ص`,
        speed: randBetween(64, 96),
        status: STATUS_POOL[i % STATUS_POOL.length],
        temp: randBetween(34, 45),
        delay: i % 5 === 0 ? 0 : randBetween(2, 15),
        frac: i / BUS_COUNT,
        speedFrac: 0.000018 + Math.random() * 0.000006,
        usingAlt: false,
        x: 0,
        y: 0,
      });
    }

    const NS = "http://www.w3.org/2000/svg";
    buses.forEach((bus) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "bus-icon");
      g.setAttribute("data-bus", bus.id);
      g.innerHTML = `
        <circle r="17" fill="transparent"/>
        <g class="bus-body">
          <rect x="-10" y="-5.5" width="20" height="11" rx="3.5" fill="#0F5C4B" stroke="#C9A227" stroke-width="1"/>
          <rect x="-6" y="-3.5" width="9" height="4" rx="1" fill="#E4C766" opacity=".35"/>
          <polygon points="10,-3.5 15,0 10,3.5" fill="#E4C766"/>
          <circle cx="-5.5" cy="6.5" r="2.1" fill="#083A2F" stroke="#E4C766" stroke-width=".6"/>
          <circle cx="5.5" cy="6.5" r="2.1" fill="#083A2F" stroke="#E4C766" stroke-width=".6"/>
        </g>`;
      g.addEventListener("click", () => selectBus(bus));
      busesLayer.appendChild(g);
      bus.el = g;
    });

    let mainLen = mainRoutePath.getTotalLength();
    let altLen = altRoutePath.getTotalLength();

    /* ---- pinned trip panel (click a bus / click another bus / close button) ---- */
    const ROW_ICONS = {
      bus: '<rect x="3" y="6" width="18" height="11" rx="2"/><path d="M3 12h18"/><circle cx="7.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/>',
      users: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M17 3.13a4 4 0 0 1 0 7.75"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
      person: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
      phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/>',
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      flag: '<path d="M4 3v18"/><path d="M4 4h13l-2.5 4.5L17 13H4"/>',
      speed: '<path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/><path d="M12 12l4-4"/><path d="M12 8v1"/>',
      activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
      trend: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
      temp: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
      route: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
      checkpoint: '<path d="M12 2l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V5z"/><polyline points="9 12 11 14 15 10"/>',
    };
    function tripRow(icon, label, value) {
      return `<div class="trip-row">
        <div class="trip-row-icon"><svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ROW_ICONS[icon]}</svg></div>
        <div><p class="trip-row-label">${label}</p><p class="trip-row-value">${value}</p></div>
      </div>`;
    }

    let selectedBus = null;
    function openTripPanel(bus) {
      tripPanelTitle.textContent = bus.id;
      tripPanelBody.innerHTML = [
        tripRow("users", "عدد الحجاج", `${bus.pilgrims}/${CAPACITY}`),
        tripRow("person", "الموظف المسؤول", bus.staff),
        tripRow("phone", "رقم الجوال", bus.phone),
        tripRow("clock", "وقت الانطلاق", bus.departure),
        tripRow("flag", "الوقت المتوقع للوصول", bus.eta),
        tripRow("speed", "السرعة الحالية", `${bus.speed} كم/س`),
        tripRow("activity", "الحالة", bus.status),
        tripRow("trend", "نسبة التأخير", `${bus.delay}%`),
        tripRow("temp", "درجة الحرارة", `${bus.temp}°`),
        tripRow("route", "المسار الحالي", bus.usingAlt ? "المسار البديل" : "طريق الهجرة"),
        tripRow("checkpoint", "آخر نقطة تفتيش", lastCheckpoint(bus)),
      ].join("");
      tripPanel.classList.add("open");
    }
    function selectBus(bus) {
      if (selectedBus && selectedBus.el) {
        selectedBus.el.classList.remove("selected");
        selectedBus.paused = false;
      }
      selectedBus = bus;
      bus.paused = true;
      bus.el.classList.add("selected");
      openTripPanel(bus);
      selectedGlow.setAttribute("cx", bus.x);
      selectedGlow.setAttribute("cy", bus.y);
      selectedGlow.setAttribute("opacity", "1");
    }
    function deselectBus() {
      if (selectedBus && selectedBus.el) {
        selectedBus.el.classList.remove("selected");
        selectedBus.paused = false;
      }
      selectedBus = null;
      tripPanel.classList.remove("open");
      selectedPulse.setAttribute("opacity", "0");
      selectedConnLine.setAttribute("opacity", "0");
      selectedGlow.setAttribute("opacity", "0");
    }
    if (tripPanelClose) tripPanelClose.addEventListener("click", deselectBus);

    /* ---- generic marker info panel (centers / checkpoints / congestion / gathering points) ---- */
    function openInfoPanel(title, rowsHtml) {
      if (selectedBus && selectedBus.el) {
        selectedBus.el.classList.remove("selected");
        selectedBus.paused = false;
      }
      selectedBus = null;
      selectedPulse.setAttribute("opacity", "0");
      selectedConnLine.setAttribute("opacity", "0");
      selectedGlow.setAttribute("opacity", "0");
      tripPanelTitle.textContent = title;
      tripPanelBody.innerHTML = rowsHtml.join("");
      tripPanel.classList.add("open");
    }
    const MARKER_INFO = {
      "marker-congestion": [
        "ازدحام مروري",
        [
          tripRow("activity", "الحالة", "ازدحام مرتفع"),
          tripRow("trend", "التأخير المتوقع", "18 دقيقة"),
          tripRow("route", "المسار المتأثر", "طريق الهجرة"),
          tripRow("checkpoint", "التوصية", "استخدام المسار البديل"),
        ],
      ],
      "marker-center-1": [
        "مركز عمليات المدينة المنورة",
        [
          tripRow("person", "نسبة الإشغال", "85%"),
          tripRow("users", "عدد الموظفين", "124"),
          tripRow("bus", "عدد الحجاج", "3,820"),
          tripRow("activity", "الحالة", "نشط"),
        ],
      ],
      "marker-center-2": [
        "مركز عمليات المسار الأوسط",
        [
          tripRow("person", "نسبة الإشغال", "72%"),
          tripRow("users", "عدد الموظفين", "96"),
          tripRow("bus", "عدد الحجاج", "2,450"),
          tripRow("activity", "الحالة", "نشط"),
        ],
      ],
      "marker-center-3": [
        "مركز عمليات مكة المكرمة",
        [
          tripRow("person", "نسبة الإشغال", "90%"),
          tripRow("users", "عدد الموظفين", "140"),
          tripRow("bus", "عدد الحجاج", "4,100"),
          tripRow("activity", "الحالة", "نشط"),
        ],
      ],
      "marker-cp-1": [
        "نقطة تفتيش 1",
        [tripRow("clock", "متوسط زمن العبور", "3 دقائق"), tripRow("activity", "الحالة", "طبيعي")],
      ],
      "marker-cp-2": [
        "نقطة تفتيش 2",
        [tripRow("clock", "متوسط زمن العبور", "5 دقائق"), tripRow("activity", "الحالة", "طبيعي")],
      ],
      "marker-cp-3": [
        "نقطة تفتيش 3",
        [tripRow("clock", "متوسط زمن العبور", "9 دقائق"), tripRow("activity", "الحالة", "ازدحام خفيف")],
      ],
      "marker-cp-4": [
        "نقطة تفتيش 4",
        [tripRow("clock", "متوسط زمن العبور", "4 دقائق"), tripRow("activity", "الحالة", "طبيعي")],
      ],
      "marker-gather-1": [
        "نقطة تجمع — المدينة المنورة",
        [tripRow("users", "عدد الحجاج الحاليين", "612"), tripRow("activity", "الحالة", "استقبال مستمر")],
      ],
      "marker-gather-2": [
        "نقطة تجمع — مكة المكرمة",
        [tripRow("users", "عدد الحجاج الحاليين", "845"), tripRow("activity", "الحالة", "استقبال مستمر")],
      ],
      "marker-heat-1": [
        "قراءة الحرارة — المدينة المنورة",
        [tripRow("temp", "درجة الحرارة", "37°"), tripRow("activity", "الحالة", "طبيعية")],
      ],
      "marker-heat-2": [
        "قراءة الحرارة — منتصف الطريق",
        [tripRow("temp", "درجة الحرارة", "44°"), tripRow("activity", "الحالة", "مرتفعة")],
      ],
      "marker-heat-3": [
        "قراءة الحرارة — مكة المكرمة",
        [tripRow("temp", "درجة الحرارة", "41°"), tripRow("activity", "الحالة", "مرتفعة")],
      ],
      "marker-incident-1": [
        "إشعار طارئ",
        [
          tripRow("activity", "النوع", "توقف مؤقت لحافلة"),
          tripRow("clock", "الوقت المتوقع للحل", "6 دقائق"),
        ],
      ],
    };
    document.querySelectorAll("#ops-map .map-marker").forEach((marker) => {
      const info = MARKER_INFO[marker.id];
      if (!info) return;
      marker.style.cursor = "pointer";
      marker.addEventListener("click", (e) => {
        e.stopPropagation();
        openInfoPanel(info[0], info[1]);
      });
    });

    /* ---- filters ---- */
    document.querySelectorAll('#map-filters input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const layer = document.getElementById(`layer-${cb.dataset.layer}`);
        if (layer) layer.style.display = cb.checked ? "" : "none";
        if (cb.dataset.layer === "buses" && !cb.checked) deselectBus();
      });
    });

    /* ---- map zoom controls ---- */
    let zoomLevel = 1;
    function applyZoom() {
      mapViewport.setAttribute("transform", `translate(450,240) scale(${zoomLevel}) translate(-450,-240)`);
    }
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => { zoomLevel = Math.min(1.8, zoomLevel + 0.2); applyZoom(); });
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => { zoomLevel = Math.max(0.7, zoomLevel - 0.2); applyZoom(); });
    if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => { zoomLevel = 1; applyZoom(); });

    /* ---- Basirah suggestion: reroute onto المسار البديل ---- */
    if (suggestBtn) {
      suggestBtn.addEventListener("click", () => {
        suggestBtn.disabled = true;
        suggestionBanner.classList.remove("hidden");
        suggestionBanner.classList.add("suggestion-flash");
        setTimeout(() => {
          altRoutePath.style.transition = "opacity .8s ease";
          altRoutePath.style.opacity = ".9";
          altRouteLabel.style.transition = "opacity .8s ease";
          altRouteLabel.setAttribute("opacity", ".9");
          buses.forEach((b) => (b.usingAlt = true));
          const hotspot = document.querySelector("#layer-congestion ellipse");
          if (hotspot) {
            hotspot.style.transition = "fill 1.2s ease, opacity 1.2s ease";
            hotspot.setAttribute("fill", "#4ADE80");
            hotspot.setAttribute("opacity", ".14");
          }
          if (selectedBus) openTripPanel(selectedBus);
        }, 1300);
        setTimeout(() => {
          suggestBtn.disabled = false;
          suggestionBanner.classList.add("hidden");
          suggestionBanner.classList.remove("suggestion-flash");
        }, 7000);
      });
    }

    /* ---- KPI ticker ---- */
    function setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }
    function updateKpis() {
      const active = buses.filter((b) => b.status !== "وصلت").length;
      const pilgrims = buses.reduce((s, b) => s + b.pilgrims, 0);
      const avgDelay = Math.round(buses.reduce((s, b) => s + b.delay, 0) / buses.length);
      if (kpiActiveBuses) kpiActiveBuses.textContent = active;
      if (kpiPilgrims) kpiPilgrims.textContent = pilgrims.toLocaleString("en-US");
      if (kpiDelay) kpiDelay.textContent = `${avgDelay}%`;

      const onHijrah = buses.filter((b) => !b.usingAlt).length;
      const onAlt = buses.length - onHijrah;
      const pctHijrah = Math.round((onHijrah / buses.length) * 100);
      const donutRoute = document.getElementById("donut-route");
      if (donutRoute) donutRoute.style.background = `conic-gradient(#4ADE80 0% ${pctHijrah}%, #E4C766 ${pctHijrah}% 100%)`;
      setText("donut-route-a", onHijrah);
      setText("donut-route-b", onAlt);

      const onRoad = buses.filter((b) => b.status === "في الطريق").length;
      const stopped = buses.length - onRoad;
      const pctRoad = Math.round((onRoad / buses.length) * 100);
      const donutStatus = document.getElementById("donut-status");
      if (donutStatus) donutStatus.style.background = `conic-gradient(#4ADE80 0% ${pctRoad}%, #E8A33D ${pctRoad}% 100%)`;
      setText("donut-status-a", onRoad);
      setText("donut-status-b", stopped);
    }
    updateKpis();

    /* ---- gold data-stream dots: bus -> Basirah hub ---- */
    function svgToWrapperPoint(x, y) {
      const pt = svg.createSVGPoint();
      pt.x = x;
      pt.y = y;
      const screenPt = pt.matrixTransform(svg.getScreenCTM());
      const wrapRect = mapWrap.getBoundingClientRect();
      return { left: screenPt.x - wrapRect.left, top: screenPt.y - wrapRect.top };
    }
    function spawnDataDot() {
      if (!running) return;
      const bus = buses[Math.floor(Math.random() * buses.length)];
      const dot = document.createElement("span");
      dot.className = "data-dot-travel";
      const start = svgToWrapperPoint(bus.x, bus.y);
      dot.style.left = `${start.left}px`;
      dot.style.top = `${start.top}px`;
      mapWrap.appendChild(dot);
      requestAnimationFrame(() => {
        dot.style.opacity = "1";
        requestAnimationFrame(() => {
          const end = svgToWrapperPoint(HUB_POINT.x, HUB_POINT.y);
          dot.style.left = `${end.left}px`;
          dot.style.top = `${end.top}px`;
          setTimeout(() => {
            dot.style.opacity = "0";
            setTimeout(() => dot.remove(), 350);
          }, 950);
        });
      });
    }

    /* ---- animation loop ---- */
    let running = false;
    let tickScheduled = false;
    let lastTime = 0;
    function tick(now) {
      if (!running) {
        tickScheduled = false;
        return;
      }
      const dt = lastTime ? now - lastTime : 16;
      lastTime = now;
      buses.forEach((bus) => {
        if (bus.paused) return;
        bus.frac += bus.speedFrac * dt;
        if (bus.frac > 1) bus.frac -= 1;
        const path = bus.usingAlt ? altRoutePath : mainRoutePath;
        const len = bus.usingAlt ? altLen : mainLen;
        const d = bus.frac * len;
        const pt = path.getPointAtLength(d);
        const pt2 = path.getPointAtLength(Math.min(len, d + 2));
        const angle = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI;
        bus.x = pt.x;
        bus.y = pt.y;
        bus.el.setAttribute("transform", `translate(${pt.x},${pt.y}) rotate(${angle})`);
      });
      if (selectedBus) {
        selectedPulse.setAttribute("cx", selectedBus.x);
        selectedPulse.setAttribute("cy", selectedBus.y);
        selectedPulse.setAttribute("opacity", "1");
        selectedConnLine.setAttribute("d", `M${selectedBus.x},${selectedBus.y} L${HUB_POINT.x},${HUB_POINT.y}`);
        selectedConnLine.setAttribute("opacity", ".55");
      }
      requestAnimationFrame(tick);
    }

    let dataDotInterval = null;
    let kpiInterval = null;
    const opsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            running = true;
            if (!tickScheduled) {
              tickScheduled = true;
              lastTime = 0;
              requestAnimationFrame(tick);
            }
            if (!dataDotInterval) dataDotInterval = setInterval(spawnDataDot, 2200);
            if (!kpiInterval) kpiInterval = setInterval(updateKpis, 4000);
          } else {
            running = false;
            if (dataDotInterval) {
              clearInterval(dataDotInterval);
              dataDotInterval = null;
            }
            if (kpiInterval) {
              clearInterval(kpiInterval);
              kpiInterval = null;
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    opsObserver.observe(opsSection);
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

    /* ---- tabs: one scenario visible at a time, no auto-cycling ---- */
    const SCENARIOS = [
      { key: "activation", run: scenarioActivation },
      { key: "transport", run: scenarioTransport },
      { key: "fallback", run: scenarioFallback },
    ];
    const tabButtons = Array.from(document.querySelectorAll("#s4-tabs .s4-tab"));
    const counterEl = document.getElementById("s4-counter");
    const progressFill = document.getElementById("s4-progress");
    let activeIndex = 0;

    function setActiveTabUI(index) {
      tabButtons.forEach((btn, i) => btn.classList.toggle("active", i === index));
      if (counterEl) counterEl.textContent = `${index + 1} / ${SCENARIOS.length}`;
      if (progressFill) progressFill.style.transform = `translateX(${index * -100}%)`;
    }

    async function playScenario(index, token) {
      thread.innerHTML = "";
      await SCENARIOS[index].run(token);
    }

    async function switchToScenario(index) {
      if (index === activeIndex && thread.children.length) return;
      activeIndex = index;
      runToken++;
      const token = runToken;
      setActiveTabUI(index);
      thread.classList.add("switching");
      await sleep(320);
      if (token !== runToken) return;
      thread.classList.remove("switching");
      await playScenario(index, token);
    }

    tabButtons.forEach((btn, i) => {
      btn.addEventListener("click", () => switchToScenario(i));
    });

    let hasEntered = false;
    const liveObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hasEntered = true;
            activeIndex = 0;
            runToken++;
            const token = runToken;
            setActiveTabUI(0);
            playScenario(0, token);
          } else if (hasEntered) {
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
