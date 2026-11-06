# PLUG Boutique

Site vitrine et boutique (projet étudiant fictif).

## Lancer le site

```bash
npm install
npm run dev      # serveur de développement : http://localhost:5173
npm run build    # version finale dans dist/ (à mettre en ligne)
```

Le site passe maintenant par Vite : il faut `npm run dev`, ou héberger `dist/`. Ouvrir `index.html` en double-cliquant ne suffit plus.

## Organisation

- `src/components/Hero.tsx` : hero vidéo futuriste (React, TypeScript, Tailwind, framer-motion, lucide-react)
- `src/components/ShinyText.tsx` : texte au reflet animé (« au futur. »)
- `public/pochette3d.js` : pochette PLUG en 3D (Three.js, dans `public/vendor/`)
- `public/script.js` : boutique (packs, panier) et animations du reste du site
- `public/style.css` : charte PLUG
- `public/images/` : photos des produits
