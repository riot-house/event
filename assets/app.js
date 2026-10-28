(function () {
  // Envoi du formulaire : script Google Apps Script du compte riothouseprod@gmail.com
  // (scripts/formulaire-apps-script.gs), qui envoie la demande et une confirmation au demandeur.
  // Tant que l'URL n'est pas renseignée, on ouvre la messagerie du visiteur avec la demande pré-remplie.
  var FORM_ENDPOINT = "";
  var CONTACT_EMAIL = "contact@riothouse.fr";
  var OVERTIME_RATE = 100, VAT = 0.2;

  var fmt = function (n) { return n.toLocaleString("fr-FR"); };
  var est = document.getElementById("estimator");
  var recap = document.getElementById("recap");
  var field = document.getElementById("estimate-field");
  var summaryText = "", lastTotal = 0;

  function update() {
    // Formule : demi-journée (9h-13h / 14h-18h), journée (9h-18h) ou soirée (16h-minuit) ; ménage toujours inclus, technicien en soirée
    var f = est.querySelector('input[name="formule"]:checked');
    var mode = f ? f.value : "soir", soir = mode === "soir";
    Array.prototype.forEach.call(est.querySelectorAll("input[data-jour]"), function (i) {
      i.dataset.price = i.dataset[mode];
      i.parentNode.querySelector("b").textContent = fmt(+i.dataset.price) + " €";
    });
    // Forfait lumières : 250 € par espace coché (1 espace 250 €, 2 espaces 500 €, 3 espaces 750 €)
    var spaces = est.querySelectorAll("input[data-space]:checked").length;
    Array.prototype.forEach.call(est.querySelectorAll("input[data-per-space]"), function (i) {
      i.dataset.price = +i.dataset.perSpace * Math.max(1, spaces);
      i.parentNode.querySelector("b").textContent = fmt(+i.dataset.price) + " €";
    });
    Array.prototype.forEach.call(est.querySelectorAll(".soir-only"), function (el) { el.hidden = !soir; });
    if (!soir) document.getElementById("overtime").value = "0";
    var LABELS = { demi: "Demi-journée (9h-13h ou 14h-18h), ménage inclus", jour: "Journée 9h-18h, ménage inclus", soir: "Soirée 16h-minuit, ménage et technicien inclus" };
    var total = 0, lines = [], text = [LABELS[mode]];
    est.querySelectorAll("input[type=checkbox]:checked").forEach(function (i) {
      var p = +i.dataset.price;
      total += p;
      lines.push([i.dataset.label, p ? fmt(p) + " €" : "sur devis"]);
      text.push(i.dataset.label + (p ? " (" + p + " € HT)" : " (sur devis)"));
    });
    var h = +document.getElementById("overtime").value;
    if (h) {
      total += h * OVERTIME_RATE;
      lines.push(["Heures sup. ×" + h, fmt(h * OVERTIME_RATE) + " €"]);
      text.push(h + " h supplémentaire(s)");
    }
    lastTotal = total;
    document.getElementById("total-ht").textContent = fmt(total);
    document.getElementById("total-ttc").textContent = fmt(Math.round(total * (1 + VAT)));
    recap.innerHTML = lines.map(function (l) { return "<li><span>" + l[0] + "</span><span>" + l[1] + "</span></li>"; }).join("");
    summaryText = lines.length ? text.join(", ") + " — total estimé " + fmt(total) + " € HT" : "";
    field.value = summaryText || "Aucune estimation";
    var box = document.getElementById("form-estimate");
    if (box) {
      box.hidden = !summaryText;
      document.getElementById("form-estimate-text").textContent = summaryText;
    }
  }
  if (est) { est.addEventListener("change", update); update(); }

  var form = document.getElementById("lead-form");
  var status = document.getElementById("form-status");
  if (!form) return;
  var el = form.elements, params = new URLSearchParams(location.search);
  var wanted = params.get("type"), typeField = el["Type d'événement"];
  if (wanted) {
    Array.prototype.forEach.call(typeField.options, function (o) { if (o.value === wanted) typeField.value = wanted; });
  }
  // ?options=video : préremplit la demande et coche la captation dans l'estimateur
  if (params.get("options") === "video") {
    if (!el["Votre projet"].value) el["Votre projet"].value = "Option souhaitée : captation vidéo et photo de l'événement (aftermovie, interviews, photocall).";
    if (est) {
      var v = Array.prototype.filter.call(est.querySelectorAll("input[type=checkbox]"), function (i) { return i.dataset.label === "Vidéo / photo"; })[0];
      if (v) { v.checked = true; update(); }
    }
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (el._honey.value) return;
    var data = {
      nom: el["Nom"].value.trim(), entreprise: el["Entreprise"].value.trim(), email: el.email.value.trim(),
      telephone: el["Téléphone"].value.trim(), date: el["Date souhaitée"].value, invites: el["Nombre d'invités"].value,
      type: typeField.value, estimation: field.value, projet: el["Votre projet"].value.trim()
    };
    if (!data.nom || !/.+@.+\..+/.test(data.email)) {
      status.textContent = "Merci d'indiquer votre nom et un e-mail valide.";
      return;
    }
    // Valeur de la conversion Google Ads, déclarée sur la page de remerciement
    try { sessionStorage.setItem("rh-lead", String(lastTotal)); } catch (err) {}
    if (!FORM_ENDPOINT) return mailto(data);
    var btn = form.querySelector("button[type=submit]"), label = btn.textContent;
    btn.disabled = true; btn.textContent = "Envoi en cours…"; status.textContent = "";
    fetch(FORM_ENDPOINT, { method: "POST", body: JSON.stringify(data) }) // text/plain : pas de requête préalable CORS
      .then(function (r) { return r.json(); })
      .then(function (res) { if (!res.ok) throw 0; location.href = "/merci.html"; })
      .catch(function () {
        btn.disabled = false; btn.textContent = label;
        status.innerHTML = "L'envoi n'a pas abouti. Appelez-nous au <a href=\"tel:+33473159622\">04 73 15 96 22</a> ou <a href=\"#\" id=\"mail-fallback\">envoyez la demande par e-mail</a>.";
        document.getElementById("mail-fallback").addEventListener("click", function (ev) { ev.preventDefault(); mailto(data); });
      });
  });
  function mailto(d) {
    var body = ["Nom : " + d.nom, "Entreprise : " + d.entreprise, "Téléphone : " + d.telephone, "E-mail : " + d.email,
      "Date : " + d.date, "Invités : " + d.invites, "Type : " + d.type, "Estimation : " + d.estimation, "", d.projet].join("\n");
    window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("Demande de devis événement – " + (d.entreprise || d.nom)) + "&body=" + encodeURIComponent(body);
    status.textContent = "Votre messagerie va s'ouvrir avec la demande pré-remplie : il ne reste qu'à l'envoyer.";
  }
})();
