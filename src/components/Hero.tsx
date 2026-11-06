import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import ShinyText from "./ShinyText";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4";

const NAV_LINKS = [
  { label: "Accueil", href: "#accueil" },
  { label: "À propos", href: "#a-propos" },
  { label: "La pochette", href: "#pochette" },
  { label: "Nos packs", href: "#packs" },
  { label: "Les bornes", href: "#bornes" },
  { label: "FAQ", href: "#faq" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] },
  }),
};

function Logo() {
  return (
    <a href="#accueil" className="flex items-center gap-2.5 text-white no-underline">
      <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white">
        <span className="h-3.5 w-3.5 rounded-full bg-white" />
      </span>
      <span className="text-lg font-semibold tracking-tight">PLUG</span>
    </a>
  );
}

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  // ferme le menu mobile avec Échap et bloque le défilement derrière lui
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <section id="accueil" className="relative h-screen min-h-[640px] w-full overflow-hidden bg-black font-sans text-white">
      {/* Fond animé de secours : visible si la vidéo ne peut pas se charger (hors ligne, hébergeur qui bloque les vidéos externes) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -left-[15%] top-[10%] h-[60vmax] w-[60vmax] rounded-full bg-[#64CEFB]/25 blur-[120px]"
          animate={{ x: ["0%", "25%", "0%"], y: ["0%", "15%", "0%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-[10%] bottom-[-20%] h-[55vmax] w-[55vmax] rounded-full bg-[#1d4ed8]/30 blur-[120px]"
          animate={{ x: ["0%", "-20%", "0%"], y: ["0%", "-10%", "0%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at 50% 60%, black 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 60%, black 10%, transparent 70%)",
          }}
        />
      </div>

      {/* Vidéo de fond */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      {/* voile pour garder le texte lisible */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/60" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        {/* ===== Navigation ===== */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex items-center justify-between py-5 md:py-6"
        >
          <Logo />

          <ul className="m-0 hidden list-none items-center gap-1 rounded-full border border-gray-700 px-2 py-1.5 lg:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="[display:block] rounded-full px-3.5 py-1.5 text-sm text-white/80 no-underline transition-colors duration-300 hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                className="group flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm text-white/80 no-underline transition-colors duration-300 hover:text-white"
              >
                Contact
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            className="relative z-30 grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-gray-700 bg-transparent text-white/80 transition-colors duration-300 hover:text-white lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </motion.nav>

        {/* Menu mobile */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-20 flex flex-col justify-center bg-black/90 px-8 backdrop-blur-md lg:hidden"
            >
              <ul className="m-0 list-none space-y-2 p-0">
                {[...NAV_LINKS, { label: "Contact", href: "#contact" }].map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <a
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="[display:block] py-2 text-3xl font-medium tracking-tight text-white/80 no-underline transition-colors duration-300 hover:text-white"
                    >
                      {l.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== Partie haute : deux colonnes ===== */}
        <div className="mt-6 grid gap-4 md:mt-10 lg:grid-cols-2 lg:gap-16">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="m-0 max-w-md text-sm leading-relaxed text-white/80 md:text-base"
          >
            Nous concevons une recharge sans fil à distance qui libère votre téléphone des câbles et des prises, où que vous soyez dans la pièce.
          </motion.p>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="m-0 text-sm text-white/80 md:text-base lg:text-right"
          >
            0 câble. 100 % de batterie !
          </motion.p>
        </div>

        {/* ===== Centre ===== */}
        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="m-0 mb-5 text-xs uppercase tracking-tight text-white/80 md:mb-7 md:text-sm"
          >
            Précommandes de la prochaine série bientôt ouvertes
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="m-0 font-sans text-5xl font-medium leading-[0.85] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl"
          >
            <span className="[display:block] text-white">Branchez-vous</span>
            <span className="[display:block] pb-[0.08em]">
              <ShinyText text="au futur." color="#64CEFB" shineColor="#ffffff" speed={3} spread={100} />
            </span>
          </motion.h1>

          <motion.a
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            href="#packs"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white no-underline transition-colors duration-300 hover:bg-gray-900 md:mt-12 md:px-8 md:py-4 md:text-base"
          >
            Je précommande mon PLUG
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 md:h-5 md:w-5" />
          </motion.a>
        </div>
      </div>
    </section>
  );
}
