# PLUG Boutique

Site de vente PLUG (projet étudiant fictif). HTML, CSS et JavaScript simples : ouvrez `index.html` dans un navigateur, rien à installer.

- `index.html` : accueil (trame de la maquette : hero, formules, concept, pourquoi PLUG, bandeau, bornes, FAQ, contact)
- `produit.html` : page produit avec choix de la formule, quantité, comparatif et accessoires (`produit.html#duo` ouvre directement la formule Duo)
- `style.css` : styles communs
- `app.js` : produits, panier (partagé entre les deux pages), batterie animée, page produit
- `images/` : photos produits (`*-detoure.webp` = détourées)
- `qr-code-github.png` : QR code vers la version GitHub Pages (https://saytam19.github.io/test/)
- `qr-code-claude.png` : QR code vers la version claude.ai
- `.nojekyll` : indique à GitHub Pages de servir les fichiers tels quels

## Mise en ligne avec GitHub Pages

1. Le dépôt doit être public (Settings → General → Danger Zone → Change visibility), sauf avec un compte GitHub payant.
2. Settings → Pages → Source : « Deploy from a branch », branche `claude/animations-header-3d-vj4zgi`, dossier `/ (root)`, puis Save.
3. Le site est en ligne au bout d'une à deux minutes sur https://saytam19.github.io/test/
