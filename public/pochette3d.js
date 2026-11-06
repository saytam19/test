/* =========================================================
   PLUG — Pochette en coton modélisée en 3D (Three.js)
   Glisser pour tourner, inertie, rotation automatique.
   ========================================================= */
(function () {
  const host = document.getElementById("pouch3d");
  if (!host) return;
  const fallback = () => host.classList.add("no-webgl");

  if (!window.THREE) return fallback();
  const T = window.THREE;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    return fallback();
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0.15, 8.4);
  camera.lookAt(0, -0.05, 0);

  /* ---------- Lumières (studio doux comme sur la photo) ---------- */
  scene.add(new T.HemisphereLight(0xffffff, 0xb9bbbf, 0.5));
  const key = new T.DirectionalLight(0xffffff, 0.95);
  key.position.set(2.5, 6, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0015;
  Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 1, far: 20 });
  scene.add(key);
  const fill = new T.DirectionalLight(0xffffff, 0.22);
  fill.position.set(-5, 1, 3);
  scene.add(fill);
  const rim = new T.DirectionalLight(0xffffff, 0.3);
  rim.position.set(0, 3, -6);
  scene.add(rim);

  /* ---------- Textures générées (toile de coton + logo) ---------- */
  const LOGO_PATHS = [
    "M13 160V13H222A33 33 0 0 1 222 79H13",
    "M319 0V100A47 47 0 0 0 366 147H575",
    "M624 0V100A47 47 0 0 0 671 147H820A47 47 0 0 0 867 100V0",
    "M1173 47A34 34 0 0 0 1139 13H964A34 34 0 0 0 930 47V113A34 34 0 0 0 964 147H1139A34 34 0 0 0 1173 113V80H1072",
  ];
  const W = 0.92, H = 2.2, D = 0.42; // demi-largeur, hauteur, épaisseur

  function canvasTex(size, draw) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d"), size);
    const t = new T.CanvasTexture(c);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  // Tissage : fils horizontaux / verticaux + grain
  function weave(ctx, s, base) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const img = ctx.getImageData(0, 0, s, s), d = img.data;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        // armure toile : damier de fils de 2 px
        const cell = ((x >> 1) + (y >> 1)) & 1;
        const n = (Math.random() - 0.5) * 10 + (cell ? 4 : -4);
        d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.95;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawLogo(ctx, s, cx, cy, width) {
    const scale = width / 1186;
    ctx.save();
    ctx.translate(cx - width / 2, cy - 80 * scale * (W * 2 / H));
    ctx.scale(scale, scale * (W * 2 / H)); // compense le ratio largeur / hauteur de la toile
    ctx.strokeStyle = "#141414";
    ctx.lineWidth = 26;
    LOGO_PATHS.forEach((p) => ctx.stroke(new Path2D(p)));
    ctx.restore();
  }

  const fabricBase = "#e2ddd3";
  const frontMap = canvasTex(1024, (ctx, s) => {
    weave(ctx, s, fabricBase);
    drawLogo(ctx, s, s / 2, s * (1 - 0.47), s * 0.36);
  });
  const backMap = canvasTex(1024, (ctx, s) => weave(ctx, s, fabricBase));
  const bump = canvasTex(512, (ctx, s) => weave(ctx, s, "#808080"));
  bump.wrapS = bump.wrapT = T.RepeatWrapping;
  bump.repeat.set(2, 2);
  [frontMap, backMap].forEach((t) => (t.encoding = T.sRGBEncoding));

  const ropeMap = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#e6e0d4";
    ctx.fillRect(0, 0, s, s);
    for (let i = -s; i < s * 2; i += 16) {
      ctx.strokeStyle = "rgba(150,135,110,.45)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + s * 0.6, s);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i + 6, 0);
      ctx.lineTo(i + 6 + s * 0.6, s);
      ctx.stroke();
    }
  });
  ropeMap.encoding = T.sRGBEncoding;
  ropeMap.wrapS = ropeMap.wrapT = T.RepeatWrapping;

  /* ---------- Géométrie paramétrique de la pochette ---------- */
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const NECK = 0.87;

  // demi-largeur selon la hauteur v (0 = bas, 1 = haut)
  function width(v) {
    let w = lerp(0.9, 1.0, smooth(0, 0.12, v));            // coins du bas arrondis
    w = lerp(w, 0.93, smooth(0.12, 0.5, v));               // légère conicité
    w = lerp(w, 0.42, Math.pow(smooth(0.5, NECK, v), 1.6)); // épaules arrondies jusqu'au cordon
    w = lerp(w, 0.58, smooth(NECK, 1, v));                 // tête froncée
    return w * W;
  }
  // gonflement selon la hauteur
  function bulge(v) {
    let b = Math.sin(Math.min(v / 0.28, 1) * Math.PI / 2);
    b *= lerp(1, 0.16, smooth(0.45, NECK, v));
    b *= lerp(1, 0.45, smooth(NECK, 1, v));
    return b;
  }

  function surface(u, v, side) {
    const env = Math.sqrt(Math.max(0, 1 - u * u));        // 0 sur les coutures latérales
    const folds = Math.sin(u * Math.PI * 7.5) * smooth(0.6, NECK, v) * 0.035;   // plis vers le cordon
    const ruffle = Math.sin(u * Math.PI * 9) * smooth(NECK, 1, v) * 0.045;      // fronces de la tête
    const soft = Math.sin(u * 4.1 + v * 6.3) * Math.sin(v * 9.7 + side) * 0.018; // ondulation du tissu
    const x = u * width(v);
    let y = v * H - H / 2;
    y -= 0.05 * (1 - u * u) * (1 - smooth(0, 0.15, v));   // fond qui s'arrondit
    y += Math.sin(u * Math.PI * 9) * smooth(0.95, 1, v) * 0.015;
    const z = side * env * (D * bulge(v) + folds + ruffle + soft);
    return [x, y, z];
  }

  function panel(side) {
    const SU = 110, SV = 150, pos = [], uv = [], idx = [];
    for (let j = 0; j <= SV; j++) {
      const v = j / SV;
      for (let i = 0; i <= SU; i++) {
        const u = (i / SU) * 2 - 1;
        pos.push(...surface(u, v, side));
        uv.push(side > 0 ? (u + 1) / 2 : 1 - (u + 1) / 2, v);
      }
    }
    for (let j = 0; j < SV; j++) {
      for (let i = 0; i < SU; i++) {
        const a = j * (SU + 1) + i, b = a + 1, c = a + SU + 1, d = c + 1;
        if (side > 0) idx.push(a, b, d, a, d, c);
        else idx.push(a, d, b, a, c, d);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  const pouch = new T.Group();
  const fabric = (map) => new T.MeshStandardMaterial({
    map, bumpMap: bump, bumpScale: 0.006, roughness: 0.95, metalness: 0, side: T.DoubleSide,
  });
  [[1, frontMap], [-1, backMap]].forEach(([side, map]) => {
    const m = new T.Mesh(panel(side), fabric(map));
    m.castShadow = m.receiveShadow = true;
    pouch.add(m);
  });

  /* ---------- Cordons ---------- */
  const rope = new T.MeshStandardMaterial({ map: ropeMap, roughness: 1, color: 0xffffff });
  const neckY = NECK * H - H / 2;

  // coulisse autour du col
  const ring = [];
  for (let k = 0; k <= 64; k++) {
    const t = (k / 64) * Math.PI * 2;
    ring.push(new T.Vector3(Math.cos(t) * width(NECK) * 1.02, neckY + 0.02 + Math.sin(t * 10) * 0.01, Math.sin(t) * (D * bulge(NECK) + 0.06)));
  }
  const ringTex = ropeMap.clone(); ringTex.needsUpdate = true; ringTex.repeat.set(30, 1);
  const ringMesh = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(ring, true), 160, 0.03, 10, true),
    new T.MeshStandardMaterial({ map: ringTex, roughness: 1 }));
  ringMesh.castShadow = true;
  pouch.add(ringMesh);

  function cord(dir) {
    const x0 = dir * width(NECK) * 1.02;
    const pts = [
      new T.Vector3(x0, neckY + 0.02, 0.05),
      new T.Vector3(x0 + dir * 0.16, neckY + 0.22, 0.08),
      new T.Vector3(x0 + dir * 0.4, neckY + 0.16, 0.1),
      new T.Vector3(dir * 0.98, neckY - 0.25, 0.1),
      new T.Vector3(dir * 1.06, neckY - 0.72, 0.08),
      new T.Vector3(dir * 1.08, neckY - 1.0, 0.06),
    ];
    const tex = ropeMap.clone(); tex.needsUpdate = true; tex.repeat.set(16, 1);
    const tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 120, 0.036, 10, false),
      new T.MeshStandardMaterial({ map: tex, roughness: 1 }));
    tube.castShadow = true;
    pouch.add(tube);

    const end = pts[pts.length - 1];
    const knot = new T.Mesh(new T.TorusKnotGeometry(0.055, 0.03, 80, 10, 2, 3), rope);
    knot.position.copy(end);
    knot.rotation.set(0.4, dir * 0.6, 0);
    knot.castShadow = true;
    pouch.add(knot);

    // pompon effiloché
    for (let f = 0; f < 16; f++) {
      const a = (f / 16) * Math.PI * 2 + Math.random() * 0.3;
      const r = 0.012 + Math.random() * 0.02;
      const len = 0.16 + Math.random() * 0.12;
      const tilt = 0.12 + Math.random() * 0.22;
      const strand = new T.Mesh(new T.CylinderGeometry(0.007, 0.004, len, 4), rope);
      strand.position.set(end.x + Math.cos(a) * (r + Math.sin(tilt) * len / 2), end.y - 0.05 - Math.cos(tilt) * len / 2, end.z + Math.sin(a) * (r + Math.sin(tilt) * len / 2));
      strand.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
      strand.castShadow = true;
      pouch.add(strand);
    }
  }
  cord(-1);
  cord(1);

  scene.add(pouch);

  /* ---------- Ombre au sol ---------- */
  const groundY = -H / 2 - 0.2;
  const blobTex = canvasTex(256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(0,0,0,.34)");
    g.addColorStop(.45, "rgba(0,0,0,.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
  const blob = new T.Mesh(new T.PlaneGeometry(3.2, 1.1), new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = groundY + 0.005;
  scene.add(blob);

  /* ---------- Interaction : glisser pour tourner ---------- */
  let rotY = -0.45, rotX = 0.08, velY = 0, velX = 0;
  let dragging = false, lastX = 0, lastY = 0, lastTouch = -1e9;
  const AUTO = 0.0045;
  const el = renderer.domElement;

  host.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    velX = velY = 0;
    host.classList.add("dragging");
    host.setPointerCapture(e.pointerId);
    host.dispatchEvent(new CustomEvent("pouch:grab"));
  });
  host.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.008;
    velX = (e.clientY - lastY) * 0.005;
    rotY += velY; rotX += velX;
    lastX = e.clientX; lastY = e.clientY;
    lastTouch = performance.now();
  });
  const release = () => {
    dragging = false;
    host.classList.remove("dragging");
    lastTouch = performance.now();
  };
  host.addEventListener("pointerup", release);
  host.addEventListener("pointercancel", release);
  host.addEventListener("keydown", (e) => {
    const k = { ArrowLeft: [0, -0.3], ArrowRight: [0, 0.3], ArrowUp: [-0.15, 0], ArrowDown: [0.15, 0] }[e.key];
    if (!k) return;
    e.preventDefault();
    rotX += k[0]; velY = k[1] * 0.25;
    lastTouch = performance.now();
  });

  /* ---------- Taille & rendu ---------- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // recule la caméra si le cadre est étroit pour garder la pochette entière
    camera.position.z = 8.4 * Math.max(1, 0.9 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(host);

  const clock = new T.Clock();
  let intro = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    intro = Math.min(1, intro + 0.012);
    const e = 1 - Math.pow(1 - intro, 3);

    if (!dragging) {
      rotY += velY; rotX += velX;
      velY *= 0.94; velX *= 0.9;
      if (!reduceMotion && performance.now() - lastTouch > 2200) {
        rotY += AUTO;
        rotX += (0.08 - rotX) * 0.03;
      }
    }
    rotX = Math.max(-0.5, Math.min(0.6, rotX));

    const float = reduceMotion ? 0 : Math.sin(t * 1.3) * 0.07;
    pouch.rotation.set(rotX, rotY + (1 - e) * -2.2, Math.sin(t * 0.9) * 0.02);
    pouch.position.y = float + (1 - e) * 0.6;
    pouch.scale.setScalar(0.85 + 0.15 * e);
    const s = 1 - float * 1.2;
    blob.scale.set(s, s, 1);
    blob.material.opacity = e * (0.9 - float * 2);

    renderer.render(scene, camera);
  }
  frame();
  host.classList.add("ready");
})();
