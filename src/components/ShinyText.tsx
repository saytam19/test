import { motion, useReducedMotion } from "framer-motion";

type ShinyTextProps = {
  text: string;
  /** Couleur de base du texte */
  color?: string;
  /** Couleur du reflet qui balaie le texte */
  shineColor?: string;
  /** Durée d'un passage du reflet, en secondes */
  speed?: number;
  /** Angle du dégradé, en degrés */
  spread?: number;
  className?: string;
};

/**
 * Texte avec un reflet brillant qui balaie en continu de gauche à droite.
 *
 * Le dégradé fait 2 × la largeur du texte (backgroundSize 200 %), le reflet
 * est au milieu. Avec background-position, le milieu de l'image se trouve à
 * x = largeur × (1 − p) : p = 150 % le place juste avant le bord gauche,
 * p = −50 % juste après le bord droit. On anime donc 150 % → −50 % en boucle.
 */
export default function ShinyText({
  text,
  color = "#64CEFB",
  shineColor = "#ffffff",
  speed = 3,
  spread = 100,
  className = "",
}: ShinyTextProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: "200% auto",
        // le motif se répète : la boucle 150 % → −50 % décale d'exactement une période, sans saut
        backgroundRepeat: "repeat",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }}
      initial={{ backgroundPosition: "150% center" }}
      animate={reduceMotion ? undefined : { backgroundPosition: ["150% center", "-50% center"] }}
      transition={{ duration: speed, ease: "linear", repeat: Infinity }}
    >
      {text}
    </motion.span>
  );
}
