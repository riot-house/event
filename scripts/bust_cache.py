#!/usr/bin/env python3
"""Ajoute ?v=<empreinte> aux CSS/JS dans toutes les pages, pour que les navigateurs
rechargent toujours la dernière version après un déploiement (GitHub Pages met en cache 10 min)."""
import hashlib, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ["assets/style.css", "assets/fx.js", "assets/app.js", "assets/cinema.js"]
ver = {a: hashlib.sha1((ROOT / a).read_bytes()).hexdigest()[:8] for a in ASSETS}

for f in ROOT.rglob("*.html"):
    if ".git" in f.parts or "og-source" in f.name: continue
    t = f.read_text()
    new = t
    for a, v in ver.items():
        new = re.sub(r'(["\'])/%s(\?v=[0-9a-f]+)?\1' % re.escape(a), r'\g<1>/%s?v=%s\g<1>' % (a, v), new)
    if new != t: f.write_text(new)
print("versions :", ver)
