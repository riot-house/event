# Riot House Events — event.riothouse.fr

Landing page B2B de location des studios Riot House (soirées d'entreprise, séminaires, lancements produit).
Site statique (HTML/CSS/JS), hébergé sur GitHub Pages, domaine via `CNAME`.

## À finaliser
- **Photos** : issues de riothouseloc.fr (studios A/B, extérieur, cuisine) dans `assets/photos/` (WebP 800/1600). À ajouter : terrasse/bar container et entrée (salon vert, borne d'arcade).
- **Pages** : `/seminaire/` et `/mise-au-vert/` (gabarit identique, JSON-LD Service + FAQ + fil d'Ariane).
- **Formulaire** : renseigner `FORM_ENDPOINT` dans `assets/app.js` (Formspree, fonction Vercel…). Sans endpoint, un `mailto:` pré-rempli s'ouvre.
- **Tarifs** : prix en dur dans `index.html` (attributs `data-price`, cartes, JSON-LD, FAQ) et `OVERTIME_RATE` dans `assets/app.js`.
- **DNS** : CNAME `event` → `riot-house.github.io`, puis activer Pages + HTTPS dans les réglages du repo.
- **SEO** : voir `SEO.md`. `assets/og-image.png` se régénère depuis `assets/og-source.html`.

## Mise en ligne
1. Fusionner la pull request dans `main`.
2. Dans GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**. Le workflow `.github/workflows/pages.yml` contrôle puis publie le site à chaque push sur `main`.
3. Dans **Settings → Pages → Custom domain**, saisir `event.riothouse.fr`, puis cocher **Enforce HTTPS** une fois le certificat émis.
4. Chez l'hébergeur DNS de `riothouse.fr` : enregistrement **CNAME** `event` → `riot-house.github.io`.
5. Suivre `SEO.md` (Search Console, Google Business Profile, backlinks).

## Contrôle local
`python3 scripts/check_seo.py` vérifie titres, descriptions, canonical, alt, liens internes et sitemap (également lancé en CI).
Les pages `seminaire/`, `mise-au-vert/`, `soiree-entreprise/` et `lancement-produit/` partagent le même gabarit.

## Mode test (noindex)
Tant que le site n'est pas validé, l'indexation est **bloquée** (`noindex` sur chaque page et `Disallow: /` dans `robots.txt`).
Pour la mise en production : `python3 scripts/set_indexing.py on`, commit, push sur `main`. Le contrôle SEO affiche un avertissement tant que le blocage est actif.
