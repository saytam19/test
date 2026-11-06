/* =========================================================
   PLUG Boutique — boutique + animations
   ========================================================= */
const IMG = {
  boitier: "images/boitier.webp",
  adaptateur: "images/adaptateur.webp",
  pochette: "images/pochette.webp",
  coffret: "images/coffret.webp",
};
const PRODUCTS = [
  { id: "complet", name: "PLUG Complet", price: 49.90, contents: "1 boîtier · 1 adaptateur · 1 pochette", desc: "Le pack pour démarrer : votre téléphone se recharge dès que vous entrez dans la pièce.", badge: "Best-seller", group: "pack",
    pics: [["pochette", "width:44%;left:50%;bottom:4%"], ["boitier", "width:40%;left:12%;bottom:6%"], ["adaptateur", "width:26%;left:6%;bottom:-2%"]] },
  { id: "duo", name: "PLUG Duo", price: 61.90, contents: "1 boîtier · 2 adaptateurs · 1 pochette", desc: "Un boîtier pour deux appareils : votre téléphone et celui de votre moitié, ou votre deuxième téléphone pro.", group: "pack",
    pics: [["pochette", "width:40%;left:54%;bottom:6%"], ["boitier", "width:40%;left:16%;bottom:8%"], ["adaptateur", "width:24%;left:4%;bottom:-2%"], ["adaptateur", "width:24%;left:34%;bottom:-4%"]] },
  { id: "famille", name: "PLUG Famille", price: 84.90, contents: "2 boîtiers · 4 adaptateurs · 1 pochette", desc: "Deux pièces équipées et quatre téléphones couverts. Fini les disputes autour du dernier chargeur.", group: "pack",
    pics: [["boitier", "width:36%;left:8%;bottom:16%"], ["boitier", "width:36%;left:52%;bottom:16%"], ["adaptateur", "width:20%;left:4%;bottom:-3%"], ["adaptateur", "width:20%;left:28%;bottom:-5%"], ["adaptateur", "width:20%;left:52%;bottom:-5%"], ["adaptateur", "width:20%;left:76%;bottom:-3%"]] },
  { id: "adaptateur", name: "Adaptateur", price: 12.90, contents: "1 adaptateur USB-C", desc: "Un appareil de plus à recharger sur votre boîtier, ou un adaptateur de rechange.", group: "acc",
    pics: [["adaptateur", "width:62%;left:19%;bottom:14%"]] },
  { id: "bloc", name: "Bloc", price: 22.90, contents: "1 boîtier mural", desc: "Un boîtier supplémentaire pour équiper une autre pièce avec vos adaptateurs existants.", group: "acc",
    pics: [["boitier", "width:72%;left:14%;bottom:12%"]] },
];
const SHIP_FREE = 30, SHIP_FEE = 4.90;
const fmt = (n) => n.toFixed(2).replace(".", ",") + " €";
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Panier (sauvegardé dans le navigateur) ---------- */
let cart = {};
try { const s = localStorage.getItem("plug-cart"); if (s) cart = JSON.parse(s) || {}; } catch (e) { cart = {}; }
function save() { try { localStorage.setItem("plug-cart", JSON.stringify(cart)); } catch (e) {} }

function picHTML(p) { return p.pics.map(([k, st]) => `<img src="${IMG[k]}" alt="" style="${st}">`).join(""); }
function cardHTML(p) {
  const badge = p.badge ? `<span class="badge">${p.badge}</span>` : "";
  if (p.group === "acc") return `<article class="card row" data-reveal><div class="pic">${picHTML(p)}</div><div class="info"><h3>${p.name}</h3><span class="price">${fmt(p.price)}</span><span class="contents">${p.contents}</span><p class="desc">${p.desc}</p><button class="btn ghost small" data-add="${p.id}">Ajouter au panier</button></div></article>`;
  return `<article class="card" data-reveal><div class="pic">${badge}${picHTML(p)}</div><h3>${p.name}</h3><span class="price">${fmt(p.price)}</span><span class="contents">${p.contents}</span><p class="desc">${p.desc}</p><button class="btn ghost" data-add="${p.id}">Ajouter au panier</button></article>`;
}
$("#packs-grid").innerHTML = PRODUCTS.filter((p) => p.group === "pack").map(cardHTML).join("");
$("#acc-grid").innerHTML = PRODUCTS.filter((p) => p.group === "acc").map(cardHTML).join("");

const byId = (id) => PRODUCTS.find((p) => p.id === id);
let done = null;
function render() {
  const ids = Object.keys(cart).filter((id) => cart[id] > 0 && byId(id));
  const n = ids.reduce((a, id) => a + cart[id], 0);
  $("#cart-count").textContent = n;
  if (done) {
    $("#lines").innerHTML = `<div class="done"><span class="eyebrow">Commande simulée</span><span class="code">${done}</span><p>Merci ! Ce site est une maquette : aucun paiement n'a été effectué.</p><button class="btn ghost small" id="restart">Continuer mes achats</button></div>`;
    $("#totals").innerHTML = "";
    $("#restart").onclick = () => { done = null; render(); closeCart(); };
    return;
  }
  if (!ids.length) { $("#lines").innerHTML = `<p class="empty">Votre panier est vide.<br>Votre batterie, elle, n'attend que ça.</p>`; $("#totals").innerHTML = ""; return; }
  $("#lines").innerHTML = ids.map((id, i) => {
    const p = byId(id); const k = p.pics[p.pics.length - 1][0];
    return `<div class="line" style="animation-delay:${i * 0.05}s"><div class="th"><img src="${IMG[k === "pochette" ? "boitier" : k]}" alt=""></div><div><div class="nm">${p.name}</div><div class="pr">${fmt(p.price)} · ${p.contents}</div></div><div class="qty"><button data-dec="${id}" aria-label="Retirer un ${p.name}">−</button><span>${cart[id]}</span><button data-inc="${id}" aria-label="Ajouter un ${p.name}">+</button></div></div>`;
  }).join("");
  const sub = ids.reduce((a, id) => a + byId(id).price * cart[id], 0);
  const ship = sub >= SHIP_FREE ? 0 : SHIP_FEE;
  const pct = Math.min(100, (sub / SHIP_FREE) * 100);
  const msg = ship === 0 ? "Livraison offerte" : `Plus que ${fmt(SHIP_FREE - sub)} pour la livraison gratuite`;
  $("#totals").innerHTML = `<div class="ship-meter"><i style="width:0%"></i></div><span class="ship-msg">${msg}</span><div><span>Sous-total</span><span>${fmt(sub)}</span></div><div><span>Livraison</span><span>${ship ? fmt(ship) : "Offerte"}</span></div><div class="big"><span>Total</span><span>${fmt(sub + ship)}</span></div><button class="btn" id="checkout">Valider la commande</button>`;
  requestAnimationFrame(() => { const m = $(".ship-meter i"); if (m) m.style.width = pct + "%"; });
  $("#checkout").onclick = () => { done = "PLG-" + Math.floor(10000 + Math.random() * 89999); cart = {}; save(); render(); };
}
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2200); }
function openCart() { $("#drawer").classList.add("on"); $("#scrim").classList.add("on"); $("#drawer").setAttribute("aria-hidden", "false"); }
function closeCart() { $("#drawer").classList.remove("on"); $("#scrim").classList.remove("on"); $("#drawer").setAttribute("aria-hidden", "true"); }

/* Image du produit qui vole jusqu'au panier */
function flyToCart(fromImg) {
  const cartBtn = $("#open-cart");
  const bump = () => { cartBtn.classList.remove("bump"); void cartBtn.offsetWidth; cartBtn.classList.add("bump"); };
  header.classList.remove("hide"); // le panier doit être visible pour l'atterrissage
  holdHeaderUntil = performance.now() + 1200;
  if (!fromImg || reduceMotion) return bump();
  const a = fromImg.getBoundingClientRect(), b = cartBtn.getBoundingClientRect();
  const headerShift = header.getBoundingClientRect().top; // header encore en train de redescendre
  const cartY = b.top - headerShift;
  const fly = document.createElement("img");
  fly.src = fromImg.src;
  fly.className = "fly";
  Object.assign(fly.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
  document.body.appendChild(fly);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = cartY + b.height / 2 - (a.top + a.height / 2);
  requestAnimationFrame(() => {
    fly.style.transform = `translate(${dx}px, ${dy}px) scale(.15) rotate(25deg)`;
    fly.style.opacity = ".3";
  });
  setTimeout(() => { fly.remove(); bump(); }, 800);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-add]"), i = e.target.closest("[data-inc]"), d = e.target.closest("[data-dec]");
  if (a) {
    const id = a.dataset.add;
    cart[id] = (cart[id] || 0) + 1; done = null; save();
    const card = a.closest(".card");
    const imgs = card ? $$(".pic img", card) : [];
    flyToCart(imgs.sort((m, n) => n.offsetWidth - m.offsetWidth)[0]); // la plus grande image du produit
    setTimeout(render, reduceMotion ? 0 : 750);
    toast(byId(id).name + " ajouté au panier");
    const label = a.textContent;
    a.classList.add("added"); a.textContent = "Ajouté ✓";
    setTimeout(() => { a.classList.remove("added"); a.textContent = label; }, 1400);
  }
  if (i) { cart[i.dataset.inc]++; save(); render(); }
  if (d) { cart[d.dataset.dec]--; if (cart[d.dataset.dec] <= 0) delete cart[d.dataset.dec]; save(); render(); }
});
$("#open-cart").onclick = openCart; $("#close-cart").onclick = closeCart; $("#scrim").onclick = closeCart;
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
$("#show-form").onclick = () => { $("#contact-form").hidden = false; $("#show-form").hidden = true; $("#c-name").focus(); };
$("#contact-form").addEventListener("submit", (e) => { e.preventDefault(); $("#form-note").hidden = false; e.target.reset(); });
render();

/* =========================================================
   ANIMATIONS
   ========================================================= */

/* ---------- Entrée du hero ---------- */
requestAnimationFrame(() => setTimeout(() => document.body.classList.add("is-ready"), 120));

/* Pourcentage de la batterie qui monte */
(function () {
  const el = $("#pct");
  if (reduceMotion) return;
  let v = 1;
  const t = setInterval(() => { v = Math.min(100, v + 3); el.textContent = v + " %"; if (v >= 100) clearInterval(t); }, 70);
})();

/* L'indication « glissez » disparaît dès qu'on attrape la pochette */
const pouchEl = $("#pouch3d");
pouchEl.addEventListener("pouch:grab", () => $("#drag-hint").classList.add("gone"), { once: true });

/* ---------- Header : se cache en descendant, revient en remontant ---------- */
const header = $("#site-header");
const charge = $("#scroll-charge");
const navLinks = $$(".nav ul a");
const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
let lastY = window.scrollY, ticking = false, holdHeaderUntil = 0;

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  charge.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  header.classList.toggle("raised", y > 10);
  const drawerOpen = $("#drawer").classList.contains("on");
  const hold = performance.now() < holdHeaderUntil;
  header.classList.toggle("hide", !drawerOpen && !hold && y > 400 && y > lastY + 2);
  if (y < lastY - 2 || y < 400) header.classList.remove("hide");
  lastY = y;

  // lien actif dans le menu
  let current = null;
  sections.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s; });
  navLinks.forEach((a) => a.classList.toggle("active", current && a.getAttribute("href") === "#" + current.id));

  // parallaxe des photos
  if (!reduceMotion) {
    $$("[data-parallax]").forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      img.style.transform = `translateY(${p * -40}px)`;
    });
    // la pochette s'éloigne doucement quand on descend
    if (y < innerHeight) pouchEl.style.translate = `0 ${y * 0.18}px`;
  }
  ticking = false;
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

/* ---------- Apparition au défilement (en cascade) ---------- */
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const dec = (el.dataset.count.split(".")[1] || "").length;
  const suffix = el.dataset.suffix || "";
  const t0 = performance.now(), dur = 1400;
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const v = target * (1 - Math.pow(1 - p, 3));
    el.textContent = v.toFixed(dec).replace(".", ",") + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function chargeBand(el) {
  const t0 = performance.now(), dur = 1800;
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const v = Math.round(1 + 99 * (1 - Math.pow(1 - p, 2)));
    el.textContent = v + " %";
    if (p < 1) requestAnimationFrame(tick); else el.classList.add("full");
  };
  requestAnimationFrame(tick);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add("in");
    if (!reduceMotion) {
      $$("[data-count]", el).forEach(countUp);
      const bp = $("#band-pct", el);
      if (bp) setTimeout(() => chargeBand(bp), 500);
    }
    io.unobserve(el);
  });
}, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });

$$("[data-reveal]").forEach((el) => {
  const group = [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
  el.style.transitionDelay = `${Math.min(group.indexOf(el), 5) * 0.09}s`;
  io.observe(el);
});

/* ---------- Cartes produits : inclinaison 3D + reflet ---------- */
if (finePointer && !reduceMotion) {
  $$(".card .pic").forEach((pic) => {
    pic.addEventListener("pointermove", (e) => {
      const r = pic.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      pic.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg)`;
      pic.style.setProperty("--mx", x * 100 + "%");
      pic.style.setProperty("--my", y * 100 + "%");
    });
    pic.addEventListener("pointerleave", () => { pic.style.transform = ""; });
  });

  /* Boutons « magnétiques » */
  $$(".btn, .pill").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      b.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });
}

/* ---------- FAQ : ouverture / fermeture animées ---------- */
$$(".faq details").forEach((d) => {
  const summary = $("summary", d), ans = $(".ans", d);
  summary.addEventListener("click", (e) => {
    if (reduceMotion) return;
    e.preventDefault();
    if (d.open) {
      const h = ans.scrollHeight;
      ans.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 320, easing: "ease-in" })
        .onfinish = () => { d.open = false; };
    } else {
      d.open = true;
      const h = ans.scrollHeight;
      ans.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  });
});
