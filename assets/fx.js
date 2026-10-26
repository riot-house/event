/* Animations : apparition au scroll, mots du titre, compteurs, halo de survol, timecode.
   Tout est désactivé si l'utilisateur préfère moins d'animations. */
(function () {
  var root = document.documentElement;
  root.dataset.fx = "1";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* 1. Halo bleu qui suit la souris */
  var GLOW = ".facts>li,.card,.uses>li,.three>li,.included>li,.pano figure,.photo-row figure,.summary,.estimator,.form,.chips li";
  $$(GLOW).forEach(function (el) { el.classList.add("glow"); });
  document.addEventListener("pointermove", function (e) {
    var el = e.target.closest && e.target.closest(".glow");
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty("--mx", (e.clientX - r.left) + "px");
    el.style.setProperty("--my", (e.clientY - r.top) + "px");
  }, { passive: true });

  if (reduce) return;

  /* 3. Apparition des blocs, avec décalage dans une même grille */
  // les textes (titres, paragraphes, listes) ne sont plus animés au défilement : seules les tuiles et les photos apparaissent
  var GROUPS = [".cards>*", ".uses>li", ".three>li", ".steps>li", ".facts>li", ".pano>li", ".included>li", ".photo-row>figure"];
  var SINGLES = ".viewfinder,.estimator,.summary,.form";
  var seen = new Set();
  GROUPS.forEach(function (g) {
    $$(g).forEach(function (el, i) { el.classList.add("reveal"); el.style.setProperty("--i", Math.min(i, 7)); seen.add(el); });
  });
  $$(SINGLES).forEach(function (el) { if (!seen.has(el)) el.classList.add("reveal"); });
  var cards = $$(".cards>.card");
  if (cards.length === 3) { cards[0].dataset.from = "left"; cards[2].dataset.from = "right"; cards[1].dataset.from = "zoom"; }
  var vf = $$(".viewfinder")[0]; if (vf) vf.dataset.from = "right";

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in"); io.unobserve(en.target);
      en.target.addEventListener("transitionend", function (ev) { if (ev.propertyName === "opacity") ev.target.style.setProperty("--i", 0); }, { once: true });
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(function (el) { io.observe(el); });

  /* 4. Compteurs des chiffres clés */
  function count(el) {
    var end = parseFloat(el.dataset.count), t0 = null, dur = 1500;
    el.textContent = "0";
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e).toLocaleString("fr-FR");
      if (p < 1) requestAnimationFrame(step); else el.textContent = end.toLocaleString("fr-FR");
    }
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { count(en.target); cio.unobserve(en.target); } });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { cio.observe(el); });

  /* 5. Timecode du viseur */
  var tc = document.getElementById("tc");
  if (tc) {
    var start = performance.now(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    setInterval(function () {
      var f = Math.floor((performance.now() - start) / 40), s = Math.floor(f / 25);
      tc.textContent = "00:" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(f % 25);
    }, 40);
  }
})();
