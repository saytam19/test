/* =========================================================
   Midnight Echoes — interactions & animations
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Animation d'entrée ---------- */
  const start = () => document.body.classList.add("loaded");
  requestAnimationFrame(() => setTimeout(start, 150));

  /* ---------- Pochette 3D rotative (header) ---------- */
  const stage = $("#stage");
  const album = $("#album3d");
  const cover = $("#coverArt");
  const shadow = $("#shadow");

  let rotX = -8, rotY = -28;      // angle actuel
  let velX = 0, velY = 0;         // inertie
  let dragging = false, moved = false;
  let lastX = 0, lastY = 0, lastInteraction = 0;
  const AUTO_SPEED = 0.22;        // rotation auto (degrés / image)

  stage.addEventListener("pointerdown", (e) => {
    dragging = true; moved = false;
    lastX = e.clientX; lastY = e.clientY;
    velX = velY = 0;
    stage.classList.add("dragging");
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    velY = dx * 0.5;
    velX = -dy * 0.5;
    rotY += velY; rotX += velX;
    lastX = e.clientX; lastY = e.clientY;
    lastInteraction = performance.now();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("dragging");
    lastInteraction = performance.now();
    if (!moved) album.classList.toggle("open"); // simple clic = sortir le vinyle
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);

  // Clavier (accessibilité)
  stage.tabIndex = 0;
  stage.setAttribute("aria-label", "Pochette 3D : flèches pour tourner, Entrée pour sortir le vinyle");
  stage.addEventListener("keydown", (e) => {
    const step = 15;
    if (e.key === "ArrowLeft") rotY -= step;
    else if (e.key === "ArrowRight") rotY += step;
    else if (e.key === "ArrowUp") rotX += step;
    else if (e.key === "ArrowDown") rotX -= step;
    else if (e.key === "Enter" || e.key === " ") album.classList.toggle("open");
    else return;
    e.preventDefault();
    lastInteraction = performance.now();
  });

  const render = (now) => {
    if (!dragging) {
      rotY += velY; rotX += velX;
      velY *= 0.94; velX *= 0.94;
      if (!reduceMotion && now - lastInteraction > 2000) {
        rotY += AUTO_SPEED;
        rotX += (-8 - rotX) * 0.02; // revient doucement à l'inclinaison de base
      }
    }
    rotX = Math.max(-60, Math.min(60, rotX));
    const float = reduceMotion ? 0 : Math.sin(now / 900) * 12;
    album.style.transform = `translateY(${float}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    // l'ombre se resserre quand la pochette monte
    shadow.style.setProperty("--sx", (1 - float / 60).toFixed(3));
    // reflet qui suit la rotation
    const angle = ((rotY % 360) + 360) % 360;
    cover.style.setProperty("--shine", `${(angle / 360) * 240 - 120}%`);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);

  /* ---------- Navigation ---------- */
  const nav = $("#nav"), burger = $("#burger"), navLinks = $("#navLinks"), toTop = $("#toTop");

  const closeMenu = () => { burger.classList.remove("open"); navLinks.classList.remove("open"); };
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });
  $$("a", navLinks).forEach((a) => a.addEventListener("click", closeMenu));

  const sections = $$("section[id]");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    toTop.classList.toggle("show", y > 600);
    let current = "";
    sections.forEach((s) => { if (y >= s.offsetTop - 200) current = s.id; });
    $$("a", navLinks).forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
    // la pochette s'éloigne légèrement au scroll (parallaxe)
    if (!reduceMotion && y < window.innerHeight) {
      stage.style.translate = `0 ${y * 0.25}px`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Apparition au scroll + compteurs ---------- */
  const animateCounter = (el) => {
    const target = +el.dataset.target;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 1600, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      const counter = $(".counter", entry.target);
      if (counter) animateCounter(counter);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  const observeReveals = () => $$(".reveal:not(.observed)").forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.transitionDelay = `${siblings.indexOf(el) * 0.08}s`;
    el.classList.add("observed");
    io.observe(el);
  });

  /* ---------- Cartes concerts : inclinaison 3D ---------- */
  $$(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transitionDelay = "0s";
      card.style.transform = `perspective(700px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) translateZ(8px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  /* ---------- Liste des titres + lecteur simulé ---------- */
  const tracks = [
    ["Neon Rain", "3:42"], ["Afterglow", "4:05"], ["Static Hearts", "3:18"],
    ["Midnight Echoes", "5:01"], ["Paper Moon", "3:56"], ["Drive", "4:20"],
  ];
  const list = $("#tracklist");
  tracks.forEach(([title, time], i) => {
    const li = document.createElement("li");
    li.className = "track reveal";
    li.innerHTML = `<span class="track-num">${String(i + 1).padStart(2, "0")}</span><span>${title}</span><span class="track-time">${time}</span>`;
    li.addEventListener("click", () => playTrack(i));
    list.appendChild(li);
  });
  observeReveals();

  const playBtn = $("#playBtn"), nowTitle = $("#nowTitle"), bar = $("#progressBar"), eq = $("#eq");
  let current = -1, playing = false, progress = 0, timer = null;

  const toSeconds = (t) => { const [m, s] = t.split(":").map(Number); return m * 60 + s; };
  const setPlaying = (state) => {
    playing = state;
    playBtn.textContent = playing ? "❚❚" : "▶";
    eq.classList.toggle("on", playing);
    album.classList.toggle("open", playing); // le vinyle sort pendant la lecture
    clearInterval(timer);
    if (!playing) return;
    const total = toSeconds(tracks[current][1]);
    timer = setInterval(() => {
      progress += 100 / total;
      if (progress >= 100) return playTrack((current + 1) % tracks.length);
      bar.style.width = `${progress}%`;
    }, 1000);
  };
  function playTrack(i) {
    $$(".track").forEach((t, j) => t.classList.toggle("playing", j === i));
    if (i !== current) { current = i; progress = 0; bar.style.width = "0%"; }
    nowTitle.textContent = `${tracks[i][0]} — NOVA`;
    setPlaying(true);
  }
  playBtn.addEventListener("click", () => (current === -1 ? playTrack(0) : setPlaying(!playing)));

  /* ---------- Fenêtre « Envoyer un message » ---------- */
  const modal = $("#modal"), form = $("#form"), formMsg = $("#formMsg");
  const openModal = () => {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => form.elements.name.focus(), 300);
  };
  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  };
  $("#openModal").addEventListener("click", openModal);
  $("#closeModal").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeMenu(); } });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    formMsg.textContent = `Merci ${name}, votre message a bien été envoyé.`;
    form.reset();
    setTimeout(() => { closeModal(); formMsg.textContent = ""; }, 2200);
  });

});
