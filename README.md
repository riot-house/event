# Riot House Event — event.riothouse.fr

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

## Conformité (France)
- Pages `/mentions-legales/` (LCEN) et `/confidentialite/` (RGPD), liées dans le pied de page ; mention d'information sous le formulaire.
- Aucun cookie ni traceur : pas de bandeau de consentement nécessaire. **Si vous ajoutez** un outil de statistiques, un service d'envoi de formulaire (`FORM_ENDPOINT`, ex. Formspree) ou une vidéo intégrée (YouTube…), mettez à jour la page confidentialité (sous-traitants) et, si l'outil dépose des cookies non exemptés, ajoutez un bandeau de consentement.
- Offre affichée comme réservée aux professionnels (sinon : médiateur de la consommation et prix TTC obligatoires).

## Suivi des conversions Google Ads

Le formulaire de devis (et le clic sur le téléphone) peut être mesuré comme conversion Google Ads.
Dans `assets/ads.js`, renseigner `ADS_ID` (`AW-…`) et `LEAD_LABEL` (libellé de l'action « Demande de devis »),
`PHONE_LABEL` en option. Tant qu'ils sont vides, rien n'est chargé et aucun bandeau n'apparaît.
Une fois renseignés, un bandeau de consentement s'affiche ; Google n'est chargé qu'après « Accepter ».
L'événement `generate_lead` et la conversion partent avec la valeur de l'estimation HT.
