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

  /* ---------------- Live AI conversation (Slide 4) ---------------- */
  const chatSection = document.getElementById("slide-04");
  const chatUser = document.getElementById("chat-user");
  const chatTyping = document.getElementById("chat-typing");
  const chatPlan = document.getElementById("chat-plan");
  let chatPlayed = false;

  function playChat() {
    if (!chatUser) return;
    [chatUser, chatTyping, chatPlan].forEach((b) => b.classList.remove("in"));
    chatPlan.querySelectorAll(".plan-chip").forEach((c) => c.classList.remove("in"));

    setTimeout(() => chatUser.classList.add("in"), 150);
    setTimeout(() => chatTyping.classList.add("in"), 900);
    setTimeout(() => {
      chatTyping.classList.remove("in");
      chatPlan.classList.add("in");
      chatPlan.querySelectorAll(".plan-chip").forEach((chip) => chip.classList.add("in"));
    }, 2500);
  }

  if (chatSection) {
    const chatObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !chatPlayed) {
            chatPlayed = true;
            playChat();
          } else if (!entry.isIntersecting) {
            chatPlayed = false;
          }
        });
      },
      { threshold: 0.5 }
    );
    chatObserver.observe(chatSection);
  }

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
