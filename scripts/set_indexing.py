#!/usr/bin/env python3
"""Active ou coupe l'indexation par les moteurs de recherche.

  python3 scripts/set_indexing.py off   # phase de test : noindex + robots.txt Disallow
  python3 scripts/set_indexing.py on    # mise en production : indexation autorisée
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ON_META = 'index, follow, max-image-preview:large'
OFF_META = 'noindex, nofollow'
mode = sys.argv[1] if len(sys.argv) > 1 else ""
if mode not in ("on", "off"):
    sys.exit(__doc__)

for f in ROOT.rglob("index.html"):
    if ".git" in f.parts: continue
    t = f.read_text()
    new = re.sub(r'(<meta name="robots" content=")[^"]*(")', r'\g<1>%s\g<2>' % (ON_META if mode == "on" else OFF_META), t, count=1)
    f.write_text(new)

if mode == "off":
    (ROOT / "robots.txt").write_text("# Site en phase de test : ne pas indexer\nUser-agent: *\nDisallow: /\n")
else:
    (ROOT / "robots.txt").write_text("User-agent: *\nAllow: /\n\nSitemap: https://event.riothouse.fr/sitemap.xml\n")
print("Indexation", "AUTORISÉE" if mode == "on" else "BLOQUÉE (mode test)")
