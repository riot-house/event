(function () {
  // Envoi du formulaire : renseigner un endpoint (Formspree, Vercel function…) pour un envoi direct.
  // Sans endpoint, on ouvre le client mail avec la demande pré-remplie.
  var FORM_ENDPOINT = "";
  var CONTACT_EMAIL = "contact@riothouseprod.com";
  var OVERTIME_RATE = 100, VAT = 0.2;

  var fmt = function (n) { return n.toLocaleString("fr-FR"); };
  var est = document.getElementById("estimator");
  var recap = document.getElementById("recap");
  var field = document.getElementById("estimate-field");
  var summaryText = "";

  function update() {
    // Formule : demi-journée (9h-13h / 14h-18h), journée (9h-18h) ou soirée (16h-minuit) ; ménage toujours inclus, technicien en soirée
    var f = est.querySelector('input[name="formule"]:checked');
    var mode = f ? f.value : "soir", soir = mode === "soir";
    Array.prototype.forEach.call(est.querySelectorAll("input[data-jour]"), function (i) {
      i.dataset.price = i.dataset[mode];
      i.parentNode.querySelector("b").textContent = fmt(+i.dataset.price) + " €";
    });
    Array.prototype.forEach.call(est.querySelectorAll(".soir-only"), function (el) { el.hidden = !soir; });
    if (!soir) document.getElementById("overtime").value = "0";
    var LABELS = { demi: "Demi-journée (9h-13h ou 14h-18h), ménage inclus", jour: "Journée 9h-18h, ménage inclus", soir: "Soirée 16h-minuit, ménage et technicien sur place inclus" };
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
    document.getElementById("total-ht").textContent = fmt(total);
    document.getElementById("total-ttc").textContent = fmt(Math.round(total * (1 + VAT)));
    recap.innerHTML = lines.map(function (l) { return "<li><span>" + l[0] + "</span><span>" + l[1] + "</span></li>"; }).join("");
    summaryText = lines.length ? text.join(", ") + " — total estimé " + fmt(total) + " € HT" : "";
    field.value = summaryText;
  }
  if (est) { est.addEventListener("change", update); update(); }

  var form = document.getElementById("lead-form");
  var status = document.getElementById("form-status");
  if (!form) return;
  var wanted = new URLSearchParams(location.search).get("type");
  if (wanted) {
    Array.prototype.forEach.call(form.type.options, function (o) { if (o.value === wanted) form.type.value = wanted; });
  }
  // ?options=video : préremplit la demande et coche la captation dans l'estimateur
  if (new URLSearchParams(location.search).get("options") === "video") {
    if (!form.message.value) form.message.value = "Option souhaitée : captation vidéo et photo de l'événement (aftermovie, interviews, photocall).";
    if (est) {
      var v = Array.prototype.filter.call(est.querySelectorAll("input[type=checkbox]"), function (i) { return i.dataset.label === "Vidéo / photo"; })[0];
      if (v) { v.checked = true; update(); }
    }
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.website.value) return; // honeypot
    if (!form.name.value.trim() || !/.+@.+\..+/.test(form.email.value)) {
      status.textContent = "Merci d'indiquer votre nom et un e-mail valide.";
      return;
    }
    var data = Object.fromEntries(new FormData(form).entries());
    delete data.website;
    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw 0; status.textContent = "Merci ! Nous revenons vers vous sous 24 h ouvrées."; form.reset(); })
        .catch(function () { status.textContent = "Envoi impossible. Écrivez-nous à " + CONTACT_EMAIL; });
      return;
    }
    var body = ["Nom : " + data.name, "Entreprise : " + data.company, "Téléphone : " + data.phone, "E-mail : " + data.email,
      "Date : " + data.date, "Invités : " + data.guests, "Type : " + data.type, "Estimation : " + data.estimate, "", data.message].join("\n");
    window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("Demande de devis événement – " + (data.company || data.name)) + "&body=" + encodeURIComponent(body);
    status.textContent = "Votre messagerie va s'ouvrir avec la demande pré-remplie.";
  });
})();
