/* =========================================================
   NOVA — interactions & animations
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Loader ---------- */
  const reveal = () => document.body.classList.add("loaded");
  if (document.readyState === "complete") setTimeout(reveal, 400);
  else window.addEventListener("load", () => setTimeout(reveal, 400));
  setTimeout(reveal, 2500); // sécurité

  /* ---------- Pochette 3D rotative ---------- */
  const stage = $("#stage");
  const album = $("#album3d");
  const cover = $(".cover-art");

  let rotX = -10, rotY = -25;     // angle actuel
  let velX = 0, velY = 0;         // inertie
  let dragging = false, moved = false;
  let lastX = 0, lastY = 0, lastInteraction = 0;
  const AUTO_SPEED = 0.25;        // rotation auto (deg / frame)

  const onDown = (e) => {
    dragging = true; moved = false;
    lastX = e.clientX; lastY = e.clientY;
    velX = velY = 0;
    stage.classList.add("dragging");
    stage.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    velY = dx * 0.5;
    velX = -dy * 0.5;
    rotY += velY; rotX += velX;
    lastX = e.clientX; lastY = e.clientY;
    lastInteraction = performance.now();
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("dragging");
    lastInteraction = performance.now();
    if (!moved) album.classList.toggle("open"); // clic = sortir le vinyle
  };
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);

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

  const render = () => {
    if (!dragging) {
      // inertie
      rotY += velY; rotX += velX;
      velY *= 0.94; velX *= 0.94;
      // rotation automatique après 2 s d'inactivité
      if (!reduceMotion && performance.now() - lastInteraction > 2000) {
        rotY += AUTO_SPEED;
        rotX += (-10 - rotX) * 0.02; // revient doucement à l'inclinaison de base
      }
    }
    rotX = Math.max(-60, Math.min(60, rotX));
    const float = reduceMotion ? 0 : Math.sin(performance.now() / 900) * 10;
    album.style.transform = `translateY(${float}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    // reflet lumineux qui suit la rotation
    const shine = ((((rotY % 360) + 360) % 360) / 360) * 240 - 120;
    cover.style.setProperty("--shine", `${shine}%`);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  const burger = $("#burger");
  const navLinks = $("#navLinks");
  const toTop = $("#toTop");
  const heroBg = $(".hero-bg");

  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });
  $$("a", navLinks).forEach((a) => a.addEventListener("click", () => {
    burger.classList.remove("open");
    navLinks.classList.remove("open");
  }));

  const sections = $$("section[id]");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    toTop.classList.toggle("show", y > 600);
    // lien actif
    let current = "";
    sections.forEach((s) => { if (y >= s.offsetTop - 200) current = s.id; });
    $$("a", navLinks).forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
    // parallaxe du fond du header
    if (!reduceMotion) heroBg.style.transform = `translateY(${y * 0.3}px)`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Apparition au scroll + compteurs ---------- */
  const animateCounter = (el) => {
    const target = +el.dataset.target;
    const start = performance.now();
    const dur = 1600;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("visible");
      const counter = $(".counter", el);
      if (counter) animateCounter(counter);
      io.unobserve(el);
    });
  }, { threshold: 0.15 });

  // délai en cascade pour les éléments frères
  $$(".reveal").forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.transitionDelay = `${siblings.indexOf(el) * 0.1}s`;
    io.observe(el);
  });

  /* ---------- Curseur personnalisé ---------- */
  const cursor = $("#cursor");
  let cx = -100, cy = -100, tx = -100, ty = -100;
  window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
  const moveCursor = () => {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(moveCursor);
  };
  moveCursor();
  document.addEventListener("pointerover", (e) => {
    cursor.classList.toggle("hover", !!e.target.closest("a, button, .track, .stage"));
  });

  /* ---------- Cartes concerts : effet tilt 3D ---------- */
  $$(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) translateZ(10px)`;
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
    li.style.transitionDelay = `${i * 0.08}s`;
    list.appendChild(li);
    io.observe(li);
  });

  const playBtn = $("#playBtn"), nowTitle = $("#nowTitle"), bar = $("#progressBar"), eq = $("#eq");
  let current = -1, playing = false, progress = 0, timer = null;

  const toSeconds = (t) => { const [m, s] = t.split(":").map(Number); return m * 60 + s; };
  const setPlaying = (state) => {
    playing = state;
    playBtn.textContent = playing ? "❚❚" : "▶";
    eq.classList.toggle("on", playing);
    album.classList.toggle("open", playing); // le vinyle sort pendant la lecture
    clearInterval(timer);
    if (playing) {
      const total = toSeconds(tracks[current][1]);
      timer = setInterval(() => {
        progress += 100 / total;
        if (progress >= 100) return playTrack((current + 1) % tracks.length);
        bar.style.width = `${progress}%`;
      }, 1000);
    }
  };
  function playTrack(i) {
    $$(".track").forEach((t, j) => t.classList.toggle("playing", j === i));
    if (i !== current) { current = i; progress = 0; bar.style.width = "0%"; }
    nowTitle.textContent = `${tracks[i][0]} — NOVA`;
    setPlaying(true);
  }
  playBtn.addEventListener("click", () => {
    if (current === -1) return playTrack(0);
    setPlaying(!playing);
  });

  /* ---------- Formulaire ---------- */
  $("#form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = e.target.elements.name.value.trim();
    $("#formMsg").textContent = `Merci ${name} ! Ton message a bien été envoyé ✦`;
    e.target.reset();
  });

  $("#year").textContent = new Date().getFullYear();
});
