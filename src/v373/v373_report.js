<script id="v373-report-date-limite">
/* V373 — Report de la date limite de dépôt des offres, avec historique.
   Consultation & Publication › fiche d'une consultation « Publiée » :
   bouton « Reporter la date limite » + tableau « Historique des reports ».
   Chaque report : contrôle des dates, recalcul de l'ouverture, additif publié sur le portail,
   notification des opérateurs (offres déposées, DAO retirés), trace dans l'historique. */
(function () {
  "use strict";
  function rd(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fdt(v) { return typeof consFmtDT === 'function' ? consFmtDT(v) : String(v || '—'); }
  function isoLocal(d) { return typeof consIsoLocal === 'function' ? consIsoLocal(d) : d.toISOString().slice(0, 16); }
  function user() { return window.CURRENT_USER_NAME || (typeof CURRENT_USER_NAME !== 'undefined' ? CURRENT_USER_NAME : 'Super Administrateur'); }
  function now() { return typeof nowStr === 'function' ? nowStr() : new Date().toLocaleString('fr-FR'); }
  function cur() { return typeof consCur === 'function' ? consCur() : null; }
  var MOTIFS = ['Additif modifiant le DAO (spécifications, quantités, lots)', 'Demande de report formulée par des soumissionnaires', 'Réponses aux questions publiées tardivement', 'Indisponibilité technique du portail', 'Visite de site ou réunion préparatoire reportée', 'Autre motif'];

  function opened(c) {
    try { var o = rd('sm310_dossiers', {})[c.code]; if (o && o.opening && (o.opening.sessionClosedDate || o.opening.closed)) return true; } catch (e) {}
    return c.statut === 'Clôturée';
  }
  function blockReason(c) {
    if (!c || c.statut !== 'Publiée') return 'Le report n’est possible que pour une consultation publiée.';
    if (opened(c)) return 'La séance d’ouverture a eu lieu : la date limite ne peut plus être reportée.';
    if (c.date_limite && new Date(c.date_limite) <= new Date()) return 'La date limite est déjà dépassée : un report n’est plus possible. Il faut relancer la procédure ou la déclarer infructueuse.';
    return '';
  }
  function reports(c) { return Array.isArray(c.reports_date_limite) ? c.reports_date_limite : []; }

  /* ------------------------------ Encadré dans la fiche ------------------------------ */
  function panel() {
    var c = cur(), host = document.getElementById('cons-summary-strip'), box = document.getElementById('v373-report');
    if (!host) return;
    if (!c || c.statut !== 'Publiée') { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.id = 'v373-report'; host.parentNode.insertBefore(box, host.nextSibling); }
    var r = reports(c), why = blockReason(c);
    var rows = r.map(function (x, i) {
      return '<tr><td><b>' + (i + 1) + '</b></td><td style="text-decoration:line-through;color:#8a8f9c">' + esc(fdt(x.ancienne)) + '</td><td><b style="color:#18244f">' + esc(fdt(x.nouvelle)) + '</b><br><small style="color:#5b606d">+' + esc(x.jours) + ' jour(s) · ouverture ' + esc(fdt(x.ouverture)) + '</small></td><td>' + esc(x.motif) + (x.justification ? '<br><small style="color:#5b606d">' + esc(x.justification) + '</small>' : '') + '</td><td>' + esc(x.decision || '—') + '<br><small style="color:#5b606d">' + esc(x.additif || '') + '</small></td><td>' + esc(x.par) + '<br><small style="color:#5b606d">' + esc(x.le) + '</small></td><td>' + esc(x.notifies || 0) + '</td></tr>';
    }).join('');
    box.innerHTML = '<div style="margin:14px 0;border:1px solid #e9ebf0;border-radius:14px;background:#fff;padding:16px 18px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><div style="font-size:12px;color:#5b606d;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Date limite de dépôt des offres</div>' +
      '<div style="font-size:20px;font-weight:700;color:#18244f;margin-top:2px">' + esc(fdt(c.date_limite)) + (r.length ? ' <span style="font-size:11px;padding:3px 8px;border-radius:999px;background:#fff4e0;color:#9a5b00;vertical-align:middle">Reportée ' + r.length + ' fois</span>' : '') + '</div>' +
      '<div style="font-size:12px;color:#5b606d;margin-top:2px">Ouverture des offres : ' + esc(fdt(c.ouverture_offres)) + (r.length ? ' · date initiale : <s>' + esc(fdt(r[0].ancienne)) + '</s>' : '') + '</div></div>' +
      '<div style="text-align:right">' + (why ? '<div style="font-size:12px;color:#a42a2a;max-width:380px">' + esc(why) + '</div>' : '<button class="sm-btn sm-btn-primary" id="v373-btn" style="background:#2e427b;color:#fff;border-color:#2e427b">⟳ Reporter la date limite</button>') + '</div></div>' +
      '<div style="margin-top:14px"><div style="font-weight:700;color:#18244f;margin-bottom:6px">Historique des reports</div>' +
      (r.length ? '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px" class="v373-t"><thead><tr style="background:#f5f7f9;text-align:left;color:#474c58"><th>N°</th><th>Ancienne date</th><th>Nouvelle date</th><th>Motif</th><th>Décision / additif</th><th>Décidé par</th><th>Opérateurs notifiés</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<div style="font-size:12px;color:#5b606d;padding:10px 12px;background:#f5f7f9;border-radius:10px">Aucun report : la date limite est celle de la publication.</div>') + '</div></div>';
    var b = document.getElementById('v373-btn'); if (b) b.onclick = openForm;
  }

  /* ------------------------------ Fenêtre de saisie ------------------------------ */
  function close() { var m = document.getElementById('v373-modal'); if (m) m.remove(); }
  function openForm() {
    var c = cur(), why = blockReason(c); if (why) return alert(why);
    var d = new Date(c.date_limite); d.setDate(d.getDate() + 7);
    var n = reports(c).length + 1, add = (c.additifs || []).length + 1;
    var m = document.createElement('div'); m.id = 'v373-modal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(11,19,50,.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px';
    var lab = 'display:block;font-size:12px;font-weight:600;color:#474c58;margin:10px 0 4px', inp = 'width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #d5d8df;border-radius:8px;font:inherit;font-size:13px';
    m.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:90vh;overflow:auto;padding:20px 22px;box-shadow:0 20px 60px rgba(0,0,0,.25)">' +
      '<h2 style="margin:0 0 4px;color:#18244f;font-size:18px">Reporter la date limite de dépôt</h2><div style="font-size:12px;color:#5b606d">' + esc(c.code) + ' — ' + esc(c.titre_public || c.intitule || '') + '</div>' +
      '<div style="margin-top:12px;padding:10px 12px;background:#f5f7f9;border-radius:10px;font-size:13px">Date limite actuelle : <b>' + esc(fdt(c.date_limite)) + '</b> · ouverture : ' + esc(fdt(c.ouverture_offres)) + '</div>' +
      '<label style="' + lab + '">Nouvelle date et heure limite *</label><input id="v373-new" type="datetime-local" style="' + inp + '" value="' + isoLocal(d) + '">' +
      '<div id="v373-hint" style="font-size:12px;margin-top:4px;color:#5b606d"></div>' +
      '<label style="' + lab + '">Motif du report *</label><select id="v373-motif" style="' + inp + '"><option value="">— Choisir —</option>' + MOTIFS.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<label style="' + lab + '">Justification *</label><textarea id="v373-just" rows="3" style="' + inp + '" placeholder="Ex. : additif n°1 modifiant les quantités du lot 2 ; délai nécessaire pour adapter les offres."></textarea>' +
      '<label style="' + lab + '">Référence de la décision (PRMP)</label><input id="v373-dec" style="' + inp + '" value="Décision n° ' + String(n).padStart(2, '0') + '/PRMP/' + new Date().getFullYear() + '">' +
      '<div style="margin-top:12px;font-size:12px;color:#474c58;line-height:1.55;background:#e8eefb;border-radius:10px;padding:10px 12px">En validant : la date d’ouverture est recalculée selon le processus ; l’<b>additif n°' + add + '</b> « Report de la date limite » est publié sur le portail ; les opérateurs ayant retiré le DAO ou déposé une offre sont notifiés. Les offres déjà déposées restent valables et peuvent être modifiées ou retirées jusqu’à la nouvelle date.</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button class="sm-btn" id="v373-cancel">Annuler</button><button class="sm-btn" id="v373-ok" style="background:#2e427b;color:#fff;border-color:#2e427b">Valider le report</button></div></div>';
    document.body.appendChild(m);
    var hint = function () {
      var v = document.getElementById('v373-new').value, h = document.getElementById('v373-hint'), nd = new Date(v);
      if (!v || isNaN(nd)) { h.textContent = ''; return; }
      var j = Math.round((nd - new Date(c.date_limite)) / 864e5 * 10) / 10, warn = '';
      try { if (typeof consIsWorkingDay === 'function' && !consIsWorkingDay(nd)) warn = ' ⚠ Jour non ouvré selon le calendrier.'; } catch (e) {}
      h.style.color = j <= 0 || warn ? '#a42a2a' : '#5b606d';
      h.textContent = j <= 0 ? 'La nouvelle date doit être postérieure à la date limite actuelle.' : 'Prolongation de ' + j + ' jour(s).' + warn;
    };
    document.getElementById('v373-new').oninput = hint; hint();
    document.getElementById('v373-cancel').onclick = close;
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    document.getElementById('v373-ok').onclick = function () {
      var v = document.getElementById('v373-new').value, motif = document.getElementById('v373-motif').value, just = document.getElementById('v373-just').value.trim(), dec = document.getElementById('v373-dec').value.trim();
      if (!v || isNaN(new Date(v))) return alert('Indiquez la nouvelle date limite.');
      if (new Date(v) <= new Date(c.date_limite)) return alert('La nouvelle date doit être postérieure à la date limite actuelle (' + fdt(c.date_limite) + ').');
      if (new Date(v) <= new Date()) return alert('La nouvelle date doit être dans le futur.');
      if (!motif || !just) return alert('Le motif et la justification sont obligatoires.');
      try { if (typeof consIsWorkingDay === 'function' && !consIsWorkingDay(new Date(v)) && !confirm('La nouvelle date tombe un jour non ouvré. Confirmer quand même ?')) return; } catch (e) {}
      apply(c, v, motif, just, dec); close();
    };
  }

  /* ------------------------------ Application du report ------------------------------ */
  function targets(c) {
    var seen = {}, list = [];
    function add(op, nif) { var k = (nif || '') + '|' + (op || ''); if (!op || seen[k]) return; seen[k] = 1; list.push({ operator: op, nif: nif || '' }); }
    rd('sm_offers_received_v54', []).forEach(function (o) { if (o && o.consultation === c.code) add(o.operator, o.nif); });
    rd('dp_req', []).forEach(function (o) { if (o && o.cons === c.code) add(o.operator, o.nif); });
    return list;
  }
  function apply(c, v, motif, just, dec, silent) {
    var old = c.date_limite, oldOuv = c.ouverture_offres;
    c.date_limite = v; c.date_limite_auto = false;
    try { if (typeof consRecalcOpening === 'function') consRecalcOpening(c); } catch (e) {}
    if (c.ouverture_offres === oldOuv && oldOuv) { var gap = new Date(oldOuv) - new Date(old), o = new Date(new Date(v).getTime() + (isNaN(gap) ? 0 : gap)); c.ouverture_offres = isoLocal(o); }
    c.additifs = Array.isArray(c.additifs) ? c.additifs : [];
    var addNo = c.additifs.length + 1, jours = Math.round((new Date(v) - new Date(old)) / 864e5);
    var addTitle = 'Additif n°' + addNo + ' — Report de la date limite de dépôt au ' + fdt(v) + ' (ouverture le ' + fdt(c.ouverture_offres) + ')';
    c.additifs.push({ numero: addNo, date: silent ? silent.le_iso : new Date().toISOString(), titre: addTitle, objet: motif, type: 'Report de date limite', ancienne: old, nouvelle: v });
    var tg = targets(c);
    c.reports_date_limite = reports(c).concat([{ ancienne: old, nouvelle: v, ouverture: c.ouverture_offres, ouverture_ancienne: oldOuv, jours: jours, motif: motif, justification: just, decision: dec, additif: 'Additif n°' + addNo, par: silent ? silent.par : user(), le: silent ? silent.le : now(), notifies: tg.length }]);
    c.historique = Array.isArray(c.historique) ? c.historique : [];
    c.historique.push({ date: silent ? silent.le : now(), action: 'Report de la date limite : ' + fdt(old) + ' → ' + fdt(v) + ' (' + motif + ')', utilisateur: silent ? silent.par : user() });
    if (!silent) {
      var N = rd('sm_portal_notifications_v310', []), M = rd('sm324_mails', []);
      tg.forEach(function (t) {
        N.unshift({ nif: t.nif, operator: t.operator, title: 'Report de la date limite — ' + (c.dao_code || c.code), text: 'La date limite de dépôt des offres de ' + (c.titre_public || c.intitule || c.code) + ' est reportée du ' + fdt(old) + ' au ' + fdt(v) + '. Ouverture des offres : ' + fdt(c.ouverture_offres) + '. Motif : ' + motif + '. Les offres déjà déposées restent valables et peuvent être modifiées jusqu’à la nouvelle date.', date: now(), email: true, consultation: c.code, kind: 'report' });
        M.unshift({ date: new Date().toISOString(), to: t.operator, subject: 'Report de la date limite — ' + (c.dao_code || c.code), body: addTitle });
      });
      wr('sm_portal_notifications_v310', N); wr('sm324_mails', M.slice(0, 60));
    }
    try { if (typeof consPersist === 'function') consPersist(); } catch (e) {}
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'SM310_GET_PUBLISHED' }, '*'); } catch (e) {}
    if (!silent) { try { consRender(); consRenderList(); } catch (e) {} alert('Date limite reportée au ' + fdt(v) + '.\n' + addTitle + ' publié sur le portail.\n' + tg.length + ' opérateur(s) notifié(s).'); }
  }

  /* ------------------------------ Exemple de démonstration ------------------------------ */
  function seedDemo() {
    if (rd('sm373_demo_v1', null) || typeof CONS_DATA === 'undefined') return;
    var c = CONS_DATA.find(function (x) { return x.code === 'CONS-DEMO-PAYANT-001' && x.statut === 'Publiée'; }) || CONS_DATA.find(function (x) { return x.statut === 'Publiée' && x.date_limite && new Date(x.date_limite) > new Date(); });
    if (!c || reports(c).length) { wr('sm373_demo_v1', 1); return; }
    var nv = c.date_limite, base = new Date(nv); base.setDate(base.getDate() - 10);
    c.date_limite = isoLocal(base);
    if (c.ouverture_offres) { var o = new Date(c.ouverture_offres); o.setDate(o.getDate() - 10); c.ouverture_offres = isoLocal(o); }
    apply(c, nv, MOTIFS[0], 'Additif modifiant les quantités du lot 1 suite aux questions des soumissionnaires ; délai de 10 jours accordé pour adapter les offres.', 'Décision n° 01/PRMP/2026', { par: 'Hery RAKOTOMALALA (PRMP)', le: '06/11/2026 09:30', le_iso: '2026-11-06T09:30:00' });
    wr('sm373_demo_v1', 1);
  }

  /* ------------------------------ Branchement ------------------------------ */
  function hook() {
    if (typeof window.consRender !== 'function' || window.consRender.__v373) return false;
    var orig = window.consRender;
    window.consRender = function () { var r = orig.apply(this, arguments); try { panel(); } catch (e) { console.warn('V373', e); } return r; };
    window.consRender.__v373 = true;
    try { consRender = window.consRender; } catch (e) {}
    return true;
  }
  function boot(n) { hook(); setTimeout(function () { try { seedDemo(); if (document.getElementById('cons-detail-view') && document.getElementById('cons-detail-view').style.display === 'block') panel(); } catch (e) { console.warn('V373 demo', e); } }, 2600); if (n < 8 && typeof CONS_DATA === 'undefined') setTimeout(function () { boot(n + 1); }, 500); }
  window.SM373 = { panel: panel, open: openForm, reports: function (code) { var c = (window.CONS_DATA || []).find(function (x) { return x.code === code; }); return c ? reports(c) : []; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { boot(0); }, 1200); }); else setTimeout(function () { boot(0); }, 1200);
})();
</script>
<style id="v373-css">.v373-t th,.v373-t td{padding:8px 10px;border-bottom:1px solid #f0f1f4;vertical-align:top}</style>
