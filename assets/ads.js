(function () {
  // Suivi des conversions Google Ads, déclenché uniquement après consentement (CNIL).
  // Renseigner l'identifiant du compte (AW-…) et le libellé de l'action de conversion
  // « Demande de devis » fournis par Google Ads. Laissés vides, rien n'est chargé ni affiché.
  var ADS_ID = "";          // ex. "AW-123456789"
  var LEAD_LABEL = "";      // ex. "AbCdEfGhIjKlMnOp" : envoi du formulaire de devis
  var PHONE_LABEL = "";     // facultatif : clic sur le numéro de téléphone
  var KEY = "rh-consent";   // "granted" | "denied", conservé 6 mois

  window.rhTrack = function () {};
  if (!ADS_ID) { hideManage(); return; }

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && Date.now() - v.t < 1000 * 60 * 60 * 24 * 182) return v.c;
    } catch (e) {}
    return null;
  }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify({ c: c, t: Date.now() })); } catch (e) {} }

  var loaded = false;
  function load() {
    if (loaded) return; loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied", analytics_storage: "denied" });
    gtag("js", new Date());
    gtag("config", ADS_ID);
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + ADS_ID;
    document.head.appendChild(s);
  }

  // Appelé sur la page de remerciement après l'envoi du formulaire ; value = estimation HT si renseignée
  window.rhTrack = function (kind, value) {
    if (!loaded || !window.gtag) return;
    var label = kind === "phone" ? PHONE_LABEL : LEAD_LABEL;
    if (kind === "lead") gtag("event", "generate_lead", { currency: "EUR", value: value || 0 });
    if (label) gtag("event", "conversion", { send_to: ADS_ID + "/" + label, currency: "EUR", value: value || 0 });
  };

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (a) window.rhTrack("phone");
  });

  var bar;
  function banner() {
    if (bar) { bar.hidden = false; return; }
    bar = document.createElement("div");
    bar.className = "consent";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Cookies");
    bar.innerHTML = '<p>Nous aimerions mesurer l\'efficacité de nos annonces Google (demandes de devis reçues grâce à elles). Cela dépose un cookie Google Ads, uniquement avec votre accord. <a href="/confidentialite/#cookies">En savoir plus</a></p>' +
      '<div class="consent-btns"><button type="button" class="btn btn-ghost btn-sm" data-c="denied">Refuser</button><button type="button" class="btn btn-sm" data-c="granted">Accepter</button></div>';
    bar.addEventListener("click", function (e) {
      var c = e.target.getAttribute && e.target.getAttribute("data-c");
      if (!c) return;
      save(c); bar.hidden = true;
      if (c === "granted") load();
      else if (loaded) location.reload(); // retrait du consentement : on recharge sans Google
    });
    document.body.appendChild(bar);
  }

  function hideManage() {
    document.addEventListener("DOMContentLoaded", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".manage-cookies"), function (el) { el.hidden = true; });
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".manage-cookies")) { e.preventDefault(); banner(); }
  });

  var c = read();
  if (c === "granted") load();
  else if (c === null) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", banner); else banner();
  }
  // Page de remerciement : la demande de devis vient d'être envoyée
  try {
    var lead = sessionStorage.getItem("rh-lead");
    if (lead !== null && /\/merci/.test(location.pathname)) { sessionStorage.removeItem("rh-lead"); window.rhTrack("lead", +lead); }
  } catch (e) {}
})();
