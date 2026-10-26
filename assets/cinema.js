/* Effets légers (défilement natif du navigateur, rien ne tourne pendant le défilement) :
   particules interactives dans l'accueil, titre dévoilé mot à mot,
   boutons aimantés. Tout est désactivé si l'utilisateur préfère
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

  /* ---------- 5. Boutons aimantés (souris uniquement) ---------- */
  if (fine) {
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
