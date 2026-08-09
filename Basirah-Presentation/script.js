/* ===================================================================
   Basirah AI — Executive Presentation — Interactions
   =================================================================== */
(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const navDotsContainer = document.getElementById("nav-dots");
  const progressBar = document.getElementById("progress-bar");

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
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
        }
      });
    },
    { threshold: 0.18 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------------- Animated KPI counters (Slide 2) ---------------- */
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

  /* ---------------- Typewriter (Slide 4) ---------------- */
  const typewriterEl = document.getElementById("typewriter-text");
  const aiResponse = document.getElementById("ai-response");
  const typewriterBox = document.getElementById("typewriter-box");
  const fullText =
    "لدينا 5000 حاج، مركزان للتفعيل، و40 موظفاً. نريد إنهاء التفعيل اليوم قبل الغروب.";
  let typewriterStarted = false;

  function runTypewriter() {
    if (typewriterStarted || !typewriterEl) return;
    typewriterStarted = true;
    let i = 0;
    const speed = 38;
    function type() {
      if (i <= fullText.length) {
        typewriterEl.textContent = fullText.slice(0, i);
        i++;
        setTimeout(type, speed);
      } else {
        setTimeout(() => {
          if (aiResponse) aiResponse.style.opacity = "1";
        }, 500);
      }
    }
    type();
  }
  if (typewriterBox) {
    const twObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runTypewriter();
            twObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    twObserver.observe(typewriterBox);
  }

  /* ---------------- Animated flow (Slide 5) ---------------- */
  const flowContainer = document.getElementById("flow-container");
  if (flowContainer) {
    const flowNodes = Array.from(flowContainer.querySelectorAll(".flow-node"));
    let flowIndex = 0;
    let flowInterval = null;

    function stepFlow() {
      flowNodes.forEach((n) => n.classList.remove("active"));
      flowNodes[flowIndex].classList.add("active");
      flowIndex = (flowIndex + 1) % flowNodes.length;
    }

    const flowObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !flowInterval) {
            stepFlow();
            flowInterval = setInterval(stepFlow, 1400);
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
    base: {
      response: "8 ثواني",
      risk: "منخفض",
      riskColor: "#0F5C4B",
      resources: "0",
      rec: "استمرار الخطة الحالية دون تعديل",
    },
    surge: {
      response: "11 ثانية",
      risk: "متوسط",
      riskColor: "#C9A227",
      resources: "+6 حافلات",
      rec: "توسيع نافذة التفعيل وإضافة نوبة عمل ثالثة",
    },
    closed: {
      response: "9 ثواني",
      risk: "مرتفع",
      riskColor: "#B4463A",
      resources: "+2 مركز بديل",
      rec: "إعادة توجيه الحجاج لأقرب مركزين متاحين فورًا",
    },
    road: {
      response: "10 ثواني",
      risk: "متوسط",
      riskColor: "#C9A227",
      resources: "مسار بديل",
      rec: "إعادة توجيه الحافلات عبر المسار البديل رقم 3",
    },
    staff: {
      response: "9 ثواني",
      risk: "متوسط",
      riskColor: "#C9A227",
      resources: "+15 موظف مؤقت",
      rec: "استقطاب موظفين من المراكز الأقل ازدحامًا",
    },
  };

  const scenarioButtons = document.querySelectorAll(".scenario-btn");
  const sResponse = document.getElementById("s-response");
  const sRisk = document.getElementById("s-risk");
  const sResources = document.getElementById("s-resources");
  const sRec = document.getElementById("s-rec");

  function applyScenario(key) {
    const s = scenarios[key];
    if (!s || !sResponse) return;
    sResponse.innerHTML = `${s.response.split(" ")[0]} <span class="text-sm text-primary/40">${s.response.split(" ")[1] || ""}</span>`;
    sRisk.textContent = s.risk;
    sRisk.style.color = s.riskColor;
    sResources.textContent = s.resources;
    sRec.textContent = s.rec;
  }

  scenarioButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      scenarioButtons.forEach((b) => {
        b.classList.remove("active", "bg-primary", "text-white", "border-primary");
        b.classList.add("border-primary/15", "text-primary");
      });
      btn.classList.add("active", "bg-primary", "text-white", "border-primary");
      btn.classList.remove("border-primary/15");
      applyScenario(btn.dataset.scenario);
    });
  });

  /* ---------------- Header brand fade on scroll past hero ---------------- */
  const header = document.querySelector("header");
  const hero = document.getElementById("slide-01");
  if (header && hero) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          header.classList.toggle("mix-blend-normal", true);
        });
      },
      { threshold: 0.1 }
    );
    heroObserver.observe(hero);
  }
})();
