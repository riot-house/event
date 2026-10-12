#!/usr/bin/env python3
"""Contrôle SEO statique : lancé en CI avant chaque déploiement. Sans dépendance."""
import json, re, sys, pathlib
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://event.riothouse.fr"
errors = []
def err(p, m): errors.append(f"{p}: {m}")

class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.h1 = 0; s.imgs = []; s.refs = []; s.meta = {}; s.title = ""; s._t = False; s.canon = None; s.ld = []; s._ld = False
    def handle_starttag(s, tag, a):
        a = dict(a)
        if tag == "h1": s.h1 += 1
        if tag == "img": s.imgs.append(a)
        if tag == "meta" and a.get("name"): s.meta[a["name"]] = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical": s.canon = a.get("href")
        if tag == "title": s._t = True
        if tag == "script" and a.get("type") == "application/ld+json": s._ld = True
        for k in ("href", "src"):
            if k in a: s.refs.append(a[k])
        if "srcset" in a: s.refs += [x.strip().split()[0] for x in a["srcset"].split(",")]
    def handle_endtag(s, tag):
        if tag == "title": s._t = False
        if tag == "script": s._ld = False
    def handle_data(s, d):
        if s._t: s.title += d
        if s._ld: s.ld.append(d)

pages = [p for p in ROOT.rglob("index.html") if ".git" not in p.parts]
urls = set()
for f in pages:
    rel = f.relative_to(ROOT).as_posix()
    url = BASE + "/" + rel.removesuffix("index.html")
    urls.add(url)
    p = P(); p.feed(f.read_text())
    if not (20 <= len(p.title.strip()) <= 70): err(rel, f"title {len(p.title.strip())} car. (attendu 20-70)")
    d = p.meta.get("description", "")
    if not (70 <= len(d) <= 175): err(rel, f"meta description {len(d)} car. (attendu 70-175)")
    if p.canon != url: err(rel, f"canonical {p.canon} != {url}")
    if p.h1 != 1: err(rel, f"{p.h1} balises h1 (attendu 1)")
    for i in p.imgs:
        if not i.get("alt"): err(rel, f"image sans alt: {i.get('src')}")
        if not (i.get("width") and i.get("height")): err(rel, f"image sans width/height: {i.get('src')}")
    for l in p.ld:
        try: json.loads(l)
        except Exception as e: err(rel, f"JSON-LD invalide: {e}")
    for ref in p.refs:
        u = urlparse(ref)
        if u.scheme or ref.startswith(("#", "mailto:", "tel:")) or not ref: continue
        path = (ROOT / u.path.lstrip("/"))
        if path.is_dir(): path = path / "index.html"
        if not path.exists(): err(rel, f"lien/ressource introuvable: {ref}")

sm = (ROOT / "sitemap.xml").read_text()
listed = set(re.findall(r"<loc>(.*?)</loc>", sm))
for u in urls - listed: err("sitemap.xml", f"page absente du sitemap: {u}")
for u in listed - urls: err("sitemap.xml", f"URL sans page: {u}")
for need in ("CNAME", "robots.txt", "404.html", "assets/og-image.png"):
    if not (ROOT / need).exists(): err(need, "fichier manquant")

if "Disallow: /\n" in (ROOT / "robots.txt").read_text():
    print("ATTENTION : indexation bloquée (mode test). Lancer `python3 scripts/set_indexing.py on` avant la mise en production.")

if errors:
    print("\n".join(errors)); sys.exit(1)
print(f"OK : {len(urls)} pages contrôlées")
