/* Effets « cinématiques » : défilement fluide (Lenis), inclinaison selon la vitesse,
   parallaxe des photos, particules interactives dans l'accueil, titre dévoilé mot à mot,
   curseur lumineux et boutons aimantés. Tout est désactivé si l'utilisateur préfère
   moins d'animations ; le contenu reste lisible sans JavaScript. */
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(pointer: fine)").matches;
  var root = document.documentElement;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. Titre principal dévoilé mot à mot ---------- */
  var h1 = document.querySelector(".hero h1, .page-hero h1");
  if (h1 && !reduce) {
    var i = 0, label = h1.textContent.replace(/\s+/g, " ").trim();
    var wrap = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var s = document.createElement("span"); s.className = "w"; s.style.setProperty("--i", i++);
            s.textContent = part; frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          // le mot en dégradé reste un bloc (le dégradé ne survit pas au découpage)
          n.classList.add("w"); n.style.setProperty("--i", i++);
        }
      });
    };
    h1.setAttribute("aria-label", label);
    wrap(h1);
    h1.classList.add("words");
    requestAnimationFrame(function () { requestAnimationFrame(function () { h1.classList.add("in"); }); });
  }

  if (reduce) return;

  /* ---------- 2. Défilement fluide + inclinaison selon la vitesse ---------- */
  var lenis = null, skew = 0;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    root.classList.add("lenis-on");
    lenis.on("scroll", parallax);
    // inclinaison lissée image par image : revient à 0 quand le défilement s'arrête
    var raf = function (t) {
      lenis.raf(t);
      var target = lenis.isScrolling ? Math.max(-3, Math.min(3, (lenis.velocity || 0) * 0.12)) : 0;
      skew += (target - skew) * 0.12;
      if (Math.abs(skew) < 0.01) skew = 0;
      root.style.setProperty("--skew", skew.toFixed(2) + "deg");
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    // ancres internes : défilement fluide en tenant compte du menu fixe
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a) return;
      var url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      if (url.search !== location.search) history.replaceState(null, "", url.search + url.hash);
      lenis.scrollTo(target.getBoundingClientRect().top + lenis.animatedScroll - 90);
    });
  }

  /* ---------- 3. Parallaxe des photos ---------- */
  var PAR = $$(".card .ph img, .photo-row img, .page-hero > img, .bg-section > img.bg, .viewfinder img");
  PAR.forEach(function (img) { img.classList.add("par"); });
  function parallax() {
    var vh = innerHeight;
    for (var k = 0; k < PAR.length; k++) {
      var r = PAR[k].parentNode.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      var off = ((r.top + r.height / 2) - vh / 2) * -0.07;
      PAR[k].style.setProperty("--py", off.toFixed(1) + "px");
    }
  }
  if (!lenis) addEventListener("scroll", function () { requestAnimationFrame(parallax); }, { passive: true });
  addEventListener("resize", parallax);
  parallax();

  /* ---------- 4. Particules interactives (accueil) ---------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var cv = document.createElement("canvas");
    cv.className = "hero-canvas"; cv.setAttribute("aria-hidden", "true");
    var bgEl = hero.querySelector(".hero-bg");
    if (bgEl) bgEl.insertAdjacentElement("afterend", cv); else hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 1.5);
    var P = [], COLORS = ["46,230,214", "34,184,255", "255,61,154", "139,123,255"];
    var mouse = { x: -9999, y: -9999, on: false }, running = false, visible = true, t = 0;
    function size() {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(1400, Math.max(260, W * H / (fine ? 1100 : 2600))));
      P = [];
      for (var q = 0; q < n; q++) P.push({
        x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
        s: Math.random() * 1.5 + .5, c: COLORS[(Math.random() * COLORS.length) | 0], a: Math.random() * .6 + .25
      });
    }
    function step() {
      if (!running) return;
      t += 0.004;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.16)"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      var f = 0.0022;
      for (var q = 0; q < P.length; q++) {
        var p = P[q];
        var ang = Math.sin(p.x * f + t) * Math.cos(p.y * f - t * 1.3) * Math.PI * 2;
        p.vx += Math.cos(ang) * 0.05; p.vy += Math.sin(ang) * 0.05;
        if (mouse.on) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, R = 190;
          if (d2 < R * R) {
            var d = Math.sqrt(d2) || 1, k = (1 - d / R);
            p.vx += (dx / d) * k * 1.6 - (dy / d) * k * 1.2; // répulsion + tourbillon
            p.vy += (dy / d) * k * 1.6 + (dx / d) * k * 1.2;
          }
        }
        p.vx *= 0.93; p.vy *= 0.93; p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
        ctx.fillStyle = "rgba(" + p.c + "," + p.a + ")";
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      requestAnimationFrame(step);
    }
    function play() { if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(step); } }
    function pause() { running = false; }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? play() : pause(); }).observe(hero);
    document.addEventListener("visibilitychange", function () { document.hidden ? pause() : play(); });
    addEventListener("pointermove", function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.on = mouse.y > -50 && mouse.y < r.height + 50;
    }, { passive: true });
    addEventListener("resize", function () { clearTimeout(size.t); size.t = setTimeout(size, 150); });
    size(); play();
  }

  /* ---------- 5. Curseur lumineux et boutons aimantés (souris uniquement) ---------- */
  if (fine) {
    var cur = document.createElement("div"); cur.className = "cursor"; cur.setAttribute("aria-hidden", "true");
    document.body.appendChild(cur);
    var cx = -100, cy = -100, tx = -100, ty = -100;
    addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      var hot = e.target.closest && e.target.closest("a, button, label, select, summary, input, textarea");
      cur.classList.toggle("hot", !!hot);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { tx = ty = -100; });
    (function loop() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cur.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)";
      requestAnimationFrame(loop);
    })();
    $$(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--bx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
        b.style.setProperty("--by", ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.setProperty("--bx", "0px"); b.style.setProperty("--by", "0px"); });
    });
  }
})();
