/** @type {import('tailwindcss').Config} */
export default {
  // Seuls les composants React utilisent Tailwind : le reste du site garde son CSS (public/style.css)
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
