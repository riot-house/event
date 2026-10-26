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

  /* ---------- 2. Défilement fluide, inclinaison et parallaxe ----------
     Pour rester fluide sur grand écran : on écrit directement le transform des quelques
     éléments concernés (jamais une variable globale qui forcerait le recalcul de toute
     la page), on lit toutes les positions avant d'écrire, et on ne travaille que pendant
     le défilement. */
  var SKEW = $$(".cards, .uses, .photo-row");
  var PAR = $$(".card .ph img, .photo-row img, .page-hero > img, .bg-section > img.bg, .viewfinder img");
  PAR.forEach(function (img) { img.classList.add("par"); });
  var skew = 0, lastSkew = null, lenis = null, lastY = scrollY, idle = 0;

  function frame() {
    // inclinaison : faible et lissée, revient à 0 à l'arrêt
    var y = scrollY, v = y - lastY; lastY = y;   // vitesse réelle en px par image
    var target = Math.max(-1.2, Math.min(1.2, v * 0.03));
    skew += (target - skew) * 0.15;
    if (Math.abs(skew) < 0.02) skew = 0;
    var s = Math.round(skew * 20) / 20;
    if (s !== lastSkew) {
      var tr = s ? "skewY(" + s + "deg)" : "";
      for (var k = 0; k < SKEW.length; k++) SKEW[k].style.transform = tr;
      lastSkew = s;
    }
    // parallaxe : lecture groupée puis écriture
    var vh = innerHeight, offs = [];
    for (var j = 0; j < PAR.length; j++) {
      var r = PAR[j].parentNode.getBoundingClientRect();
      offs.push(r.bottom < -150 || r.top > vh + 150 ? null : ((r.top + r.height / 2) - vh / 2) * -0.06);
    }
    for (var m = 0; m < PAR.length; m++) {
      if (offs[m] === null) continue;
      PAR[m].style.transform = "translate3d(0," + offs[m].toFixed(1) + "px,0) scale(1.12)";
    }
  }

  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    root.classList.add("lenis-on");
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
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
  // boucle légère : ne recalcule que si la page a bougé ou si l'inclinaison retombe
  (function loop() {
    if (scrollY !== lastY || skew !== 0) { frame(); idle = 0; }
    else if (idle++ === 0) frame();
    requestAnimationFrame(loop);
  })();
  addEventListener("resize", frame);
  frame();

  /* ---------- 4. Particules interactives (accueil) ---------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var cv = document.createElement("canvas");
    cv.className = "hero-canvas"; cv.setAttribute("aria-hidden", "true");
    var bgEl = hero.querySelector(".hero-bg");
    if (bgEl) bgEl.insertAdjacentElement("afterend", cv); else hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1;
    var P = [], COLORS = ["46,230,214", "34,184,255", "255,61,154", "139,123,255"];
    var mouse = { x: -9999, y: -9999, on: false }, running = false, visible = true, t = 0;
    function size() {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(900, Math.max(220, W * H / (fine ? 1800 : 3200))));
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
      var dx = tx - cx, dy = ty - cy;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        cx += dx * 0.22; cy += dy * 0.22;
        cur.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      }
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
