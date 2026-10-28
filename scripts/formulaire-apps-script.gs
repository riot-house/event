/**
 * Formulaire de devis de event.riothouse.fr : à coller dans un projet Google Apps Script
 * créé avec le compte riothouseprod@gmail.com (https://script.google.com), puis
 * Déployer > Nouveau déploiement > Application Web, « Exécuter en tant que : moi »,
 * « Qui a accès : tout le monde ». Coller l'URL obtenue (…/exec) dans FORM_ENDPOINT (assets/app.js).
 *
 * Deux e-mails par demande : la demande complète vers TO, et une confirmation avec le récapitulatif
 * au demandeur. Quota Gmail gratuit : 100 destinataires par jour.
 */
const TO = 'riothouseprod@gmail.com';
const CONTACT = 'contact@riothouse.fr';

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: 'format' }); }
  if (d._honey) return out({ ok: true }); // robot : on ignore sans rien envoyer
  const clip = (v, n) => String(v || '').trim().slice(0, n);
  const f = {
    nom: clip(d.nom, 120), entreprise: clip(d.entreprise, 120), email: clip(d.email, 160),
    telephone: clip(d.telephone, 40), date: clip(d.date, 20), invites: clip(d.invites, 10),
    type: clip(d.type, 80), estimation: clip(d.estimation, 600), projet: clip(d.projet, 3000)
  };
  if (!f.nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return out({ ok: false, error: 'invalid' });

  const rows = [
    ['Nom', f.nom], ['Entreprise', f.entreprise], ['E-mail', f.email], ['Téléphone', f.telephone],
    ['Date souhaitée', f.date], ["Nombre d'invités", f.invites], ["Type d'événement", f.type],
    ['Estimation', f.estimation], ['Projet', f.projet]
  ].filter(r => r[1]);
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const table = '<table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
    rows.map(r => '<tr><td style="border:1px solid #ddd;background:#f6f8fa"><b>' + esc(r[0]) + '</b></td><td style="border:1px solid #ddd">' +
      esc(r[1]).replace(/\n/g, '<br>') + '</td></tr>').join('') + '</table>';
  const text = rows.map(r => r[0] + ' : ' + r[1]).join('\n');

  MailApp.sendEmail({
    to: TO, replyTo: f.email, name: 'Site Riot House Event',
    subject: 'Demande de devis événement – ' + (f.entreprise || f.nom),
    body: 'Nouvelle demande depuis event.riothouse.fr\n\n' + text,
    htmlBody: '<p style="font-family:Arial,sans-serif">Nouvelle demande depuis event.riothouse.fr. Répondez directement à ce mail pour écrire au client.</p>' + table
  });

  const intro = 'Bonjour ' + f.nom + ',\n\nMerci pour votre demande de devis ! Nous l\'avons bien reçue et revenons vers vous sous 24 h ouvrées.\n\nVoici le récapitulatif de ce que vous nous avez envoyé :\n\n';
  const outro = '\n\nÀ très vite,\nL\'équipe Riot House Event\n04 73 15 96 22 · ' + CONTACT + ' · https://event.riothouse.fr';
  MailApp.sendEmail({
    to: f.email, replyTo: CONTACT, name: 'Riot House Event',
    subject: 'Votre demande de devis a bien été reçue',
    body: intro + text + outro,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5"><p>Bonjour ' + esc(f.nom) + ',</p>' +
      '<p>Merci pour votre demande de devis ! Nous l\'avons bien reçue et revenons vers vous <b>sous 24 h ouvrées</b>.</p>' +
      '<p>Voici le récapitulatif de ce que vous nous avez envoyé :</p>' + table +
      '<p>À très vite,<br>L\'équipe Riot House Event<br>04 73 15 96 22 · ' + CONTACT + ' · <a href="https://event.riothouse.fr">event.riothouse.fr</a></p></div>'
  });
  return out({ ok: true });
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
