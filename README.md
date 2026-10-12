# Riot House Events — event.riothouse.fr

Landing page B2B de location des studios Riot House (soirées d'entreprise, séminaires, lancements produit).
Site statique (HTML/CSS/JS), hébergé sur GitHub Pages, domaine via `CNAME`.

## À finaliser
- **Photos** : remplacer les blocs `.ph` de `index.html` par de vraies images (WebP, `width`/`height`, `alt`), dans `assets/photos/`.
- **Formulaire** : renseigner `FORM_ENDPOINT` dans `assets/app.js` (Formspree, fonction Vercel…). Sans endpoint, un `mailto:` pré-rempli s'ouvre.
- **Tarifs** : prix en dur dans `index.html` (attributs `data-price`, cartes, JSON-LD, FAQ) et `OVERTIME_RATE` dans `assets/app.js`.
- **DNS** : CNAME `event` → `riot-house.github.io`, puis activer Pages + HTTPS dans les réglages du repo.
- **SEO** : ajouter le site dans Google Search Console (sitemap `/sitemap.xml`), créer/optimiser la fiche Google Business Profile, régénérer `assets/og-image.png` depuis `assets/og-source.html` si besoin.
