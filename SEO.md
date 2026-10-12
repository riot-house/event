# Guide SEO — event.riothouse.fr

Ce qui est déjà fait dans le code, puis ce qu'il faut faire à la main pour que la page monte sur Google.

## Déjà en place (contrôlé en CI par `scripts/check_seo.py`)
- Un `<h1>` par page, titres de 20-70 caractères, meta descriptions de 70-175, URL canonique, aperçu de partage (Open Graph).
- Données structurées : lieu événementiel (`EventVenue`) avec adresse, capacité et tarifs ; `Service`, `FAQPage` et fil d'Ariane sur chaque page dédiée.
- 5 pages ciblant chacune une intention de recherche :

| Page | Requêtes visées |
|---|---|
| `/` | location studio événementiel Clermont-Ferrand, salle événement entreprise Puy-de-Dôme |
| `/soiree-entreprise/` | salle soirée d'entreprise Clermont-Ferrand, fête de fin d'année entreprise 63 |
| `/seminaire/` | salle de séminaire Clermont-Ferrand, lieu séminaire Auvergne |
| `/mise-au-vert/` | mise au vert entreprise Clermont-Ferrand, team building Puy-de-Dôme |
| `/lancement-produit/` | lieu lancement de produit Clermont-Ferrand, location plateau packshot |

- Images WebP à deux tailles, avec `alt`, `width`/`height` et chargement différé ; pas de framework ni de police externe, donc un site très rapide.
- `sitemap.xml`, `robots.txt`, page 404 en `noindex`, maillage interne entre toutes les pages.

## À faire une seule fois (dans l'ordre)
1. **Mettre le site en ligne** : voir « Mise en ligne » dans le README. HTTPS obligatoire.
2. **Google Search Console** : ajouter la propriété `https://event.riothouse.fr/`, vérifier par DNS, envoyer `https://event.riothouse.fr/sitemap.xml`, puis « Demander une indexation » sur chacune des 5 pages.
3. **Bing Webmaster Tools** : importer la propriété depuis Search Console (5 minutes).
4. **Google Business Profile** : à créer pour « Riot House Event » (catégorie « Lieu de réception » ou « Salle de séminaire »), avec adresse, horaires, photos et site `event.riothouse.fr`. Demander des avis aux premiers clients. C'est le levier n°1 des recherches locales.
5. **Backlinks internes** (faciles) : depuis `riothouseprod.com` et `riothouseloc.fr`, ajouter un lien « Louer nos studios pour un événement » vers `event.riothouse.fr`, avec une ancre descriptive (pas « cliquez ici »).
6. **Mesure** : installer un outil de statistiques respectueux de la vie privée (Plausible, Matomo) ; suivre les clics sur « Demander un devis » et les envois du formulaire.

## Ensuite, en continu
- **Avis et citations** : annuaires locaux (CCI Puy-de-Dôme, Auvergne-Rhône-Alpes Tourisme, annuaires de lieux événementiels, Pages Jaunes), toujours avec la même adresse et le même téléphone.
- **Contenu** : un article par trimestre (ex. « Organiser une fête d'entreprise à Clermont-Ferrand : budget et checklist », « Idées de team building »), lié depuis les pages dédiées.
- **Preuves** : témoignages clients (avec accord), logos de références, aftermovies intégrés sous forme de vidéo.
- **Photos** : ajouter des photos d'événements réels dès qu'il y en a.
- **Pages à créer ensuite** : `/afterwork/`, `/team-building/` si les premières pages performent.
- **Mise à jour** : modifier `lastmod` dans `sitemap.xml` quand une page change.

## Règles pour ne pas perdre le référencement
- Ne jamais copier le texte de riothouseloc.fr ou riothouse.fr (contenu dupliqué). Les photos peuvent être partagées, les textes non.
- Garder une seule URL canonique par page ; ne pas dupliquer le site sur un autre domaine.
- Tenir les tarifs affichés à jour partout : `index.html` (cartes, estimateur, FAQ, JSON-LD), pages dédiées, `assets/app.js`.
