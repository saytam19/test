/* =========================================================
   PLUG — panier, produits et petites animations
   Utilisé par index.html et produit.html
   ========================================================= */

const IMG = { b: "images/boitier-detoure.webp", a: "images/adaptateur-detoure.webp" };
const PRODUCTS = [
  { id: "complet", name: "PLUG Complet", price: 49.90, b: 1, a: 1, pochette: true, flag: "Best-seller",
    desc: "Le pack pour démarrer : votre téléphone se recharge dès que vous entrez dans la pièce." },
  { id: "duo", name: "PLUG Duo", price: 61.90, b: 1, a: 2, pochette: true,
    desc: "Un boîtier pour deux téléphones : le vôtre et celui de votre moitié, ou votre téléphone pro." },
  { id: "famille", name: "PLUG Famille", price: 84.90, b: 2, a: 4, pochette: true,
    desc: "Deux pièces équipées et quatre téléphones couverts. Fini les disputes autour du dernier chargeur." },
  { id: "adaptateur", name: "Adaptateur seul", price: 12.90, b: 0, a: 1, acc: true,
    desc: "Un téléphone de plus sur votre boîtier, ou un adaptateur de rechange." },
  { id: "bloc", name: "Boîtier seul", price: 22.90, b: 1, a: 0, acc: true,
    desc: "Une pièce de plus équipée, avec vos adaptateurs existants." },
];
const PACKS = PRODUCTS.filter((p) => !p.acc);
const SHIP_FREE = 30, SHIP_FEE = 4.90;

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fmt = (n) => n.toFixed(2).replace(".", ",") + " €";
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const contents = (p) => [p.b && plural(p.b, "boîtier", "boîtiers"), p.a && plural(p.a, "adaptateur", "adaptateurs"), p.pochette && "1 pochette"].filter(Boolean).join(" · ");

/* Visuel d'un pack : les boîtiers puis les adaptateurs, à la bonne échelle */
function packImgs(p) {
  // au-delà de 2 adaptateurs : boîtiers sur une ligne, adaptateurs sur la suivante
  return Array.from({ length: p.b }, () => `<img class="b" src="${IMG.b}" alt="">`).join("") +
         (p.a > 2 ? `<i class="br"></i>` : "") +
         Array.from({ length: p.a }, () => `<img class="a" src="${IMG.a}" alt="">`).join("");
}

/* ---------- Panier (gardé dans le navigateur) ---------- */
let cart = {};
try { cart = JSON.parse(localStorage.getItem("plug-cart") || "{}") || {}; } catch (e) { cart = {}; }
const save = () => { try { localStorage.setItem("plug-cart", JSON.stringify(cart)); } catch (e) {} };
let orderCode = null;

function addToCart(id, qty = 1) {
  cart[id] = (cart[id] || 0) + qty;
  orderCode = null;
  save();
  renderCart();
  const btn = $("#open-cart");
  btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
  toast(`${byId(id).name} ajouté au panier${qty > 1 ? ` (× ${qty})` : ""}`);
}

function renderCart() {
  const ids = Object.keys(cart).filter((id) => cart[id] > 0 && byId(id));
  $("#cart-count").textContent = ids.reduce((n, id) => n + cart[id], 0);
  const lines = $("#lines"), totals = $("#totals");
  if (orderCode) {
    lines.innerHTML = `<div class="done"><span class="eyebrow">Commande simulée</span><span class="code">${orderCode}</span><p>Merci ! Ce site est une maquette de projet étudiant : aucun paiement n'a été effectué.</p><button class="btn ghost small" id="restart">Continuer mes achats</button></div>`;
    totals.innerHTML = "";
    $("#restart").onclick = () => { orderCode = null; renderCart(); closeCart(); };
    return;
  }
  if (!ids.length) {
    lines.innerHTML = `<p class="empty">Votre panier est vide.<br>Votre batterie, elle, n'attend que ça.</p>`;
    totals.innerHTML = "";
    return;
  }
  lines.innerHTML = ids.map((id) => {
    const p = byId(id);
    return `<div class="line"><div class="th"><img src="${p.b ? IMG.b : IMG.a}" alt=""></div><div><div class="nm">${p.name}</div><div class="pr">${fmt(p.price)} · ${contents(p)}</div></div><div class="qty"><button data-dec="${id}" aria-label="Retirer un ${p.name}">−</button><span>${cart[id]}</span><button data-inc="${id}" aria-label="Ajouter un ${p.name}">+</button></div></div>`;
  }).join("");
  const sub = ids.reduce((s, id) => s + byId(id).price * cart[id], 0);
  const ship = sub >= SHIP_FREE ? 0 : SHIP_FEE;
  totals.innerHTML = `<div class="meter"><i style="width:${Math.min(100, (sub / SHIP_FREE) * 100)}%"></i></div>
    <span class="ship-msg">${ship ? `Plus que ${fmt(SHIP_FREE - sub)} pour la livraison gratuite` : "Livraison offerte"}</span>
    <div><span>Sous-total</span><span>${fmt(sub)}</span></div>
    <div><span>Livraison</span><span>${ship ? fmt(ship) : "Offerte"}</span></div>
    <div class="big"><span>Total</span><span>${fmt(sub + ship)}</span></div>
    <button class="btn full" id="checkout">Valider la commande</button>`;
  $("#checkout").onclick = () => { orderCode = "PLG-" + Math.floor(10000 + Math.random() * 89999); cart = {}; save(); renderCart(); };
}

function openCart() { $("#drawer").classList.add("on"); $("#scrim").classList.add("on"); $("#drawer").setAttribute("aria-hidden", "false"); $("#close-cart").focus(); }
function closeCart() { $("#drawer").classList.remove("on"); $("#scrim").classList.remove("on"); $("#drawer").setAttribute("aria-hidden", "true"); }
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2200); }

document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]"), inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
  if (add) {
    addToCart(add.dataset.add);
    const label = add.textContent;
    add.classList.add("ok"); add.textContent = "Ajouté ✓";
    setTimeout(() => { add.classList.remove("ok"); add.textContent = label; }, 1300);
  }
  if (inc) { cart[inc.dataset.inc]++; save(); renderCart(); }
  if (dec) { cart[dec.dataset.dec]--; if (cart[dec.dataset.dec] <= 0) delete cart[dec.dataset.dec]; save(); renderCart(); }
});
$("#open-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
$("#scrim").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
renderCart();

/* ---------- Apparition au défilement ---------- */
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  en.target.classList.add("in");
  io.unobserve(en.target);
}), { threshold: 0.15 });
$$("[data-reveal]").forEach((el) => io.observe(el));

/* ---------- Batterie qui se recharge ---------- */
function charge(pctEl, fillEl, { from = 1, duration = 2600, done } = {}) {
  if (!pctEl) return;
  if (reduceMotion) { pctEl.textContent = "100 %"; if (fillEl) fillEl.style.setProperty("--level", "100%"); done && done(); return; }
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const v = Math.round(from + (100 - from) * (1 - Math.pow(1 - p, 2)));
    pctEl.textContent = v + " %";
    if (fillEl) { fillEl.style.setProperty("--level", v + "%"); fillEl.classList.toggle("low", v < 20); }
    if (p < 1) requestAnimationFrame(tick); else done && done();
  };
  requestAnimationFrame(tick);
}
const heroBattery = $("#hero-battery");
if (heroBattery) {
  const pct = $(".battery-pct", heroBattery), fill = $(".battery-fill", heroBattery);
  const loop = () => charge(pct, fill, { done: () => setTimeout(loop, 2600) });
  setTimeout(loop, 500);
}
const bandPct = $("#band-pct");
if (bandPct) {
  const bo = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    bo.disconnect();
    charge(bandPct, null, { duration: 1800, done: () => bandPct.classList.add("full") });
  }, { threshold: 0.5 });
  bo.observe(bandPct);
}

/* ---------- Accueil : cartes des packs ---------- */
const homePacks = $("#home-packs");
if (homePacks) {
  homePacks.innerHTML = PACKS.map((p) => `
    <article class="card" data-reveal>
      <a class="pic${p.a > 2 ? " many" : ""}" href="produit.html#${p.id}" aria-label="Voir la formule ${p.name}">${p.flag ? `<span class="flag">${p.flag}</span>` : ""}${packImgs(p)}</a>
      <h3>${p.name}</h3>
      <span class="price tnum">${fmt(p.price)}</span>
      <p class="desc">${p.desc}</p>
      <span class="incl">${contents(p)}</span>
      <div class="card-actions">
        <a class="btn small" href="produit.html#${p.id}">Voir la formule</a>
        <button class="btn ghost small" data-add="${p.id}">Ajouter au panier</button>
      </div>
    </article>`).join("");
  $$("[data-reveal]", homePacks).forEach((el) => io.observe(el));
}

/* ---------- Formulaire de contact ---------- */
const showForm = $("#show-form");
if (showForm) {
  showForm.addEventListener("click", () => { $("#contact-form").hidden = false; showForm.hidden = true; $("#c-name").focus(); });
  $("#contact-form").addEventListener("submit", (e) => { e.preventDefault(); $("#form-note").hidden = false; e.target.reset(); });
}

/* =========================================================
   PAGE PRODUIT
   ========================================================= */
const pp = $("#pp");
if (pp) {
  let current = PACKS.some((p) => p.id === location.hash.slice(1)) ? location.hash.slice(1) : "complet";
  let qty = 1;

  // choix des formules
  $("#formulas").innerHTML = PACKS.map((p) => `
    <label class="formula">
      <input type="radio" name="formula" value="${p.id}" id="f-${p.id}"${p.id === current ? " checked" : ""}>
      <span class="dot" aria-hidden="true"></span>
      <span>
        <span class="f-name">${p.name}${p.flag ? `<span class="pill-flag">${p.flag}</span>` : ""}</span>
        <span class="f-incl">${contents(p)}</span>
      </span>
      <span class="f-price">${fmt(p.price)}<small>${fmt(p.price / p.a)} / téléphone</small></span>
    </label>`).join("");

  // vues de la galerie : le pack choisi + photos
  const views = $$(".gallery-main .view");
  const thumbs = $$(".thumb");
  function showView(name) {
    views.forEach((v) => v.classList.toggle("on", v.dataset.view === name));
    thumbs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.view === name)));
  }
  thumbs.forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));

  // tableau comparatif
  const rows = [
    ["Boîtiers muraux", (p) => p.b],
    ["Adaptateurs USB-C", (p) => p.a],
    ["Téléphones rechargés", (p) => p.a],
    ["Pièces équipées", (p) => p.b],
    ["Pochette en coton", () => `<span class="yes">✓</span>`],
    ["Coffret en carton recyclé", () => `<span class="yes">✓</span>`],
    ["Prix par téléphone", (p) => fmt(p.price / p.a)],
  ];
  function renderTable() {
    const head = `<tr><th scope="col">Formule</th>${PACKS.map((p) => `<th scope="col" class="${p.id === current ? "sel" : ""}">${p.name.replace("PLUG ", "")}</th>`).join("")}</tr>`;
    const body = rows.map(([label, f]) => `<tr><th scope="row">${label}</th>${PACKS.map((p) => `<td class="${p.id === current ? "sel" : ""}">${f(p)}</td>`).join("")}</tr>`).join("");
    const tot = `<tr class="tot"><th scope="row">Prix</th>${PACKS.map((p) => `<td class="${p.id === current ? "sel" : ""}">${fmt(p.price)}</td>`).join("")}</tr>`;
    $("#compare").innerHTML = `<thead>${head}</thead><tbody>${body}${tot}</tbody>`;
  }

  function update() {
    const p = byId(current);
    $("#pack-view").innerHTML = packImgs(p);
    $("#pack-view").classList.toggle("many", p.a > 2);
    $("#pp-price").textContent = fmt(p.price * qty);
    $("#pp-per").textContent = qty > 1 ? `${qty} × ${fmt(p.price)}` : `soit ${fmt(p.price / p.a)} par téléphone`;
    $("#pp-desc").textContent = p.desc;
    $("#pp-incl").innerHTML = [
      p.b && `<span class="ico"><img src="${IMG.b}" alt=""> ${plural(p.b, "boîtier", "boîtiers")}</span>`,
      p.a && `<span class="ico"><img src="${IMG.a}" alt=""> ${plural(p.a, "adaptateur", "adaptateurs")}</span>`,
      `<span class="ico"><img src="images/pochette.webp" alt=""> 1 pochette</span>`,
    ].filter(Boolean).join("");
    $("#qty").textContent = qty;
    $("#bb-name").textContent = p.name;
    $("#bb-price").textContent = fmt(p.price * qty);
    renderTable();
    showView("pack");
    if (location.hash.slice(1) !== current) history.replaceState(null, "", "#" + current);
  }

  $("#formulas").addEventListener("change", (e) => { current = e.target.value; update(); });
  $("#qty-minus").addEventListener("click", () => { qty = Math.max(1, qty - 1); update(); });
  $("#qty-plus").addEventListener("click", () => { qty = Math.min(10, qty + 1); update(); });
  const add = () => {
    addToCart(current, qty);
    const b = $("#pp-add"); b.classList.add("ok"); b.textContent = "Ajouté au panier ✓";
    setTimeout(() => { b.classList.remove("ok"); b.textContent = "Ajouter au panier"; }, 1400);
  };
  $("#pp-add").addEventListener("click", add);
  $("#bb-add").addEventListener("click", add);
  window.addEventListener("hashchange", () => {
    const h = location.hash.slice(1);
    if (PACKS.some((p) => p.id === h) && h !== current) { current = h; $("#f-" + h).checked = true; update(); }
  });

  // barre d'achat en bas d'écran (mobile) quand le bouton principal n'est plus visible
  document.body.classList.add("has-buybar");
  const bar = $("#buybar");
  new IntersectionObserver(([en]) => bar.classList.toggle("on", !en.isIntersecting && en.boundingClientRect.top < 0))
    .observe($("#pp-add"));

  // accessoires
  $("#acc").innerHTML = PRODUCTS.filter((p) => p.acc).map((p) => `
    <article class="acc-item">
      <div class="pic">${packImgs(p)}</div>
      <div class="info">
        <h3>${p.name}</h3>
        <span class="price tnum">${fmt(p.price)}</span>
        <p>${p.desc}</p>
        <button class="btn ghost small" data-add="${p.id}">Ajouter au panier</button>
      </div>
    </article>`).join("");

  update();
}
