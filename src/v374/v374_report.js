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
  function timeline(c) {
    var r = reports(c), init = r.length ? r[0].ancienne : c.date_limite;
    var items = r.slice().reverse().map(function (x, k) {
      var i = r.length - k;
      return '<li class="v374-ev"><span class="v374-dot"></span><div class="v374-card">' +
        '<div class="v374-top"><b>Report n°' + i + '</b><span>' + esc(x.le) + ' · ' + esc(x.par) + '</span></div>' +
        '<div class="v374-dates"><s>' + esc(fdt(x.ancienne)) + '</s><em>→</em><b>' + esc(fdt(x.nouvelle)) + '</b><i class="v374-pill">+' + esc(x.jours) + ' j</i></div>' +
        '<div class="v374-motif"><b>' + esc(x.motif) + '</b>' + (x.justification ? '<p>' + esc(x.justification) + '</p>' : '') + '</div>' +
        '<div class="v374-chips"><span>📄 ' + esc(x.decision || '—') + '</span><span>📢 ' + esc(x.additif || '') + ' publié</span><span>✉ ' + esc(x.notifies || 0) + ' opérateur(s) notifié(s)</span><span>🕑 Ouverture : ' + esc(fdt(x.ouverture)) + '</span></div>' +
        '</div></li>';
    }).join('');
    var pub = '<li class="v374-ev first"><span class="v374-dot"></span><div class="v374-card plain"><div class="v374-top"><b>Publication</b><span>' + esc(fdt(c.publication_reelle || c.publication)) + '</span></div><div style="font-size:13px;color:#474c58">Date limite fixée au <b>' + esc(fdt(init)) + '</b></div></div></li>';
    return '<ul class="v374-tl">' + items + pub + '</ul>';
  }
  function panel() {
    var c = cur(), host = document.getElementById('cons-summary-strip'), box = document.getElementById('v373-report');
    if (!host) return;
    if (!c || c.statut !== 'Publiée') { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.id = 'v373-report'; host.parentNode.insertBefore(box, host.nextSibling); }
    var r = reports(c), why = blockReason(c), init = r.length ? r[0].ancienne : c.date_limite;
    var tile = function (lbl, val, sub, accent) { return '<div class="v374-tile' + (accent ? ' on' : '') + '"><small>' + lbl + '</small><b>' + val + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>'; };
    var tiles = tile('Date limite actuelle', esc(fdt(c.date_limite)), r.length ? '<i class="v374-pill">Reportée ' + r.length + ' fois</i>' : 'Date de la publication', true) +
      tile('Ouverture des offres', esc(fdt(c.ouverture_offres)), 'Recalculée à chaque report') +
      tile('Date limite initiale', r.length ? '<s>' + esc(fdt(init)) + '</s>' : esc(fdt(init)), r.length ? 'Prolongation totale : +' + r.reduce(function (s, x) { return s + Number(x.jours || 0); }, 0) + ' j' : '—');
    box.innerHTML = '<div class="v374">' +
      '<div class="v374-head"><div><h3>Date limite de dépôt des offres</h3><p>Suivi des reports décidés après la publication.</p></div>' +
      (why ? '<div class="v374-block">' + esc(why) + '</div>' : '<button id="v373-btn" class="v374-btn">⟳ Reporter la date limite</button>') + '</div>' +
      '<div class="v374-tiles">' + tiles + '</div>' +
      '<div class="v374-foot"><span>' + (r.length ? r.length + ' report(s) enregistré(s) pour cette consultation.' : 'Aucun report pour cette consultation.') + '</span><a href="#" id="v374-link">Voir l’historique des reports →</a></div></div>';
    var b = document.getElementById('v373-btn'); if (b) b.onclick = openForm;
    var l = document.getElementById('v374-link'); if (l) l.onclick = function (e) { e.preventDefault(); goHist(c.code); };
  }


  /* ------------------------------ Sous-menu « Reports de date limite » ------------------------------ */
  var FILTER = '';
  function ensureHistPage() {
    var pg = document.getElementById('page-v374-reports'); if (pg) return pg;
    var ref = document.getElementById('page-dashboard'); if (!ref) return null;
    pg = document.createElement('div'); pg.id = 'page-v374-reports'; pg.className = 'sm-page-content';
    ref.parentNode.insertBefore(pg, ref.nextSibling); return pg;
  }
  function ensureLeaf() {
    if (document.getElementById('leaf-4-reports')) return true;
    var after = document.getElementById('leaf-4-2'); if (!after) return false;
    var el = document.createElement('div'); el.className = 'sm-sub'; el.id = 'leaf-4-reports'; el.setAttribute('data-goto', 'page-v374-reports');
    el.innerHTML = '<span class="sm-sub-dot"></span><span class="sm-sub-label">Reports de date limite</span>';
    el.onclick = function (e) { e.stopPropagation(); FILTER = ''; renderHist(); selectLeaf(el); };
    after.parentNode.insertBefore(el, after.nextSibling); return true;
  }
  function goHist(code) { FILTER = code || ''; renderHist(); var el = document.getElementById('leaf-4-reports'); if (el && typeof selectLeaf === 'function') selectLeaf(el); else if (typeof navigateTo === 'function') navigateTo('page-v374-reports'); window.scrollTo(0, 0); }
  function renderHist() {
    var pg = ensureHistPage(); if (!pg) return;
    var all = (window.CONS_DATA || []).filter(function (c) { return reports(c).length; });
    var nRep = all.reduce(function (s, c) { return s + reports(c).length; }, 0), tot = all.reduce(function (s, c) { return s + reports(c).reduce(function (t, x) { return t + Number(x.jours || 0); }, 0); }, 0);
    var list = FILTER ? all.filter(function (c) { return c.code === FILTER; }) : all;
    var opts = '<option value="">Toutes les consultations (' + all.length + ')</option>' + all.map(function (c) { return '<option value="' + esc(c.code) + '"' + (c.code === FILTER ? ' selected' : '') + '>' + esc(c.code) + ' — ' + esc(c.titre_public || c.intitule || '') + '</option>'; }).join('');
    var tile = function (l, v) { return '<div class="v374-tile"><small>' + l + '</small><b>' + v + '</b></div>'; };
    pg.innerHTML = '<div class="v374-page">' +
      '<div class="v374-crumb">Passation des marchés › Consultation &amp; Publication › Reports de date limite</div>' +
      '<div class="v374-head"><div><h1>Reports de date limite</h1><p>Historique de tous les reports de la date limite de dépôt des offres, consultation par consultation.</p></div>' +
      '<select id="v374-filter" class="v374-sel">' + opts + '</select></div>' +
      '<div class="v374-tiles">' + tile('Consultations reportées', all.length) + tile('Reports décidés', nRep) + tile('Prolongation moyenne', nRep ? Math.round(tot / nRep) + ' jours' : '—') + '</div>' +
      (list.length ? list.map(function (c) {
        var r = reports(c);
        return '<div class="v374 v374-cons"><div class="v374-head"><div><h3>' + esc(c.code) + ' — ' + esc(c.titre_public || c.intitule || '') + '</h3><p>DAO ' + esc(c.dao_code || '—') + ' · date limite actuelle <b>' + esc(fdt(c.date_limite)) + '</b> · ' + r.length + ' report(s)</p></div><button class="v374-btn ghost" data-v374-open="' + esc(c.code) + '">Ouvrir la consultation</button></div>' + timeline(c) + '</div>';
      }).join('') : '<div class="v374 v374-empty">Aucun report de date limite. Un report se fait depuis la fiche d’une consultation publiée (Publications › Voir › « Reporter la date limite »).</div>') +
      '</div>';
    var f = document.getElementById('v374-filter'); if (f) f.onchange = function () { FILTER = f.value; renderHist(); };
    [].forEach.call(pg.querySelectorAll('[data-v374-open]'), function (b) { b.onclick = function () { var el = document.getElementById('leaf-4-1'); if (el) selectLeaf(el); consOpen(b.getAttribute('data-v374-open')); }; });
  }

  /* ------------------------------ Fenêtre de saisie ------------------------------ */
  function close() { var m = document.getElementById('v373-modal'); if (m) m.remove(); }
  function openForm() {
    var c = cur(), why = blockReason(c); if (why) return alert(why);
    var d = new Date(c.date_limite); d.setDate(d.getDate() + 7);
    var n = reports(c).length + 1, add = (c.additifs || []).length + 1, gap = new Date(c.ouverture_offres) - new Date(c.date_limite); if (isNaN(gap)) gap = 0;
    var m = document.createElement('div'); m.id = 'v373-modal'; m.className = 'v374-ov';
    m.innerHTML = '<div class="v374-dlg">' +
      '<div class="v374-dh"><div><h2>Reporter la date limite de dépôt</h2><p>' + esc(c.code) + ' — ' + esc(c.titre_public || c.intitule || '') + '</p></div><button id="v373-x" class="v374-x" aria-label="Fermer">×</button></div>' +
      '<div class="v374-db">' +
      '<div class="v374-sec">1. Nouvelle date</div>' +
      '<div class="v374-cmp"><div class="v374-cbox"><small>Actuelle</small><b>' + esc(fdt(c.date_limite)) + '</b><span>Ouverture : ' + esc(fdt(c.ouverture_offres)) + '</span></div><div class="v374-arrow">→</div>' +
      '<div class="v374-cbox new"><small>Nouvelle date et heure *</small><input id="v373-new" type="datetime-local" value="' + isoLocal(d) + '"><span id="v373-ouv">Ouverture : —</span></div></div>' +
      '<div id="v373-hint" class="v374-hint"></div>' +
      '<div class="v374-sec">2. Motif</div>' +
      '<label class="v374-l">Motif du report *</label><select id="v373-motif"><option value="">— Choisir —</option>' + MOTIFS.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<label class="v374-l">Justification *</label><textarea id="v373-just" rows="3" placeholder="Ex. : additif n°1 modifiant les quantités du lot 2 ; délai nécessaire pour adapter les offres."></textarea>' +
      '<label class="v374-l">Référence de la décision (PRMP)</label><input id="v373-dec" value="Décision n° ' + String(n).padStart(2, '0') + '/PRMP/' + new Date().getFullYear() + '">' +
      '<div class="v374-sec">3. Effets de la validation</div>' +
      '<ul class="v374-eff"><li>La date d’ouverture des offres est recalculée.</li><li>L’<b>additif n°' + add + '</b> « Report de la date limite » est publié sur le portail.</li><li>Les opérateurs ayant retiré le DAO ou déposé une offre sont notifiés.</li><li>Les offres déjà déposées restent valables et modifiables jusqu’à la nouvelle date.</li></ul>' +
      '</div><div class="v374-df"><button class="v374-btn ghost" id="v373-cancel">Annuler</button><button class="v374-btn" id="v373-ok">Valider le report</button></div></div>';
    document.body.appendChild(m);
    var hint = function () {
      var v = document.getElementById('v373-new').value, h = document.getElementById('v373-hint'), nd = new Date(v), ov = document.getElementById('v373-ouv');
      if (!v || isNaN(nd)) { h.textContent = ''; ov.textContent = 'Ouverture : —'; return; }
      ov.textContent = 'Ouverture : ' + fdt(isoLocal(new Date(nd.getTime() + gap)));
      var j = Math.round((nd - new Date(c.date_limite)) / 864e5 * 10) / 10, warn = '';
      try { if (typeof consIsWorkingDay === 'function' && !consIsWorkingDay(nd)) warn = ' ⚠ Jour non ouvré selon le calendrier.'; } catch (e) {}
      h.className = 'v374-hint' + (j <= 0 || warn ? ' ko' : ' ok');
      h.textContent = j <= 0 ? 'La nouvelle date doit être postérieure à la date limite actuelle.' : 'Prolongation de ' + j + ' jour(s).' + warn;
    };
    document.getElementById('v373-x').onclick = close;
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
    try { renderHist(); } catch (e) {}
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
  function boot(n) { hook(); ensureLeaf(); ensureHistPage(); setTimeout(function () { try { seedDemo(); if (document.getElementById('cons-detail-view') && document.getElementById('cons-detail-view').style.display === 'block') panel(); } catch (e) { console.warn('V373 demo', e); } }, 2600); if (n < 8 && typeof CONS_DATA === 'undefined') setTimeout(function () { boot(n + 1); }, 500); }
  window.SM373 = { panel: panel, open: openForm, hist: goHist, reports: function (code) { var c = (window.CONS_DATA || []).find(function (x) { return x.code === code; }); return c ? reports(c) : []; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { boot(0); }, 1200); }); else setTimeout(function () { boot(0); }, 1200);
})();
</script>
<style id="v374-css">
.v374{margin:14px 0;border:1px solid #e9ebf0;border-radius:14px;background:#fff;padding:18px 20px}
.v374-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.v374-head h3{margin:0;font-size:16px;color:#18244f}.v374-head p{margin:3px 0 0;font-size:12px;color:#5b606d}
.v374-btn{border:1px solid #2e427b;background:#2e427b;color:#fff;border-radius:9px;padding:9px 14px;font:inherit;font-size:13px;font-weight:650;cursor:pointer}
.v374-btn.ghost{background:#fff;color:#2e427b;border-color:#d5d8df}
.v374-block{font-size:12px;color:#a42a2a;background:#fde8e8;border-radius:9px;padding:8px 12px;max-width:420px}
.v374-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0}
.v374-tile{border:1px solid #e9ebf0;border-radius:12px;padding:12px 14px;background:#f8f9fb;display:flex;flex-direction:column;gap:3px}
.v374-tile.on{background:#eef2fb;border-color:#c9d3ee}
.v374-tile small{font-size:11px;font-weight:700;color:#5b606d;text-transform:uppercase;letter-spacing:.04em}
.v374-tile b{font-size:17px;color:#18244f}.v374-tile s{color:#8a8f9c;font-weight:600}
.v374-tile span{font-size:12px;color:#5b606d}
.v374-pill{display:inline-block;font-style:normal;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:#fff4e0;color:#9a5b00}
.v374-hist h4{margin:0 0 10px;font-size:14px;color:#18244f}.v374-hist h4 small{font-weight:500;color:#5b606d;margin-left:6px}
.v374-tl{list-style:none;margin:0;padding:0 0 0 18px;border-left:2px solid #e3e6ee;margin-left:6px}
.v374-ev{position:relative;margin:0 0 12px}.v374-ev:last-child{margin-bottom:0}
.v374-dot{position:absolute;left:-26px;top:14px;width:12px;height:12px;border-radius:50%;background:#2e427b;border:2px solid #fff;box-shadow:0 0 0 2px #2e427b}
.v374-ev.first .v374-dot{background:#fff;box-shadow:0 0 0 2px #b9bec8}
.v374-card{border:1px solid #e9ebf0;border-radius:12px;padding:12px 14px;background:#fff}
.v374-card.plain{background:#f8f9fb}
.v374-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:13px}.v374-top b{color:#18244f}.v374-top span{color:#5b606d;font-size:12px}
.v374-dates{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:8px 0;font-size:14px}.v374-dates s{color:#8a8f9c}.v374-dates em{font-style:normal;color:#5b606d}.v374-dates b{color:#18244f}
.v374-motif{font-size:13px;color:#353944}.v374-motif p{margin:3px 0 0;color:#5b606d;font-size:12px;line-height:1.5}
.v374-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.v374-chips span{font-size:11.5px;background:#f5f7f9;border:1px solid #e9ebf0;border-radius:999px;padding:3px 9px;color:#474c58}
.v374-ov{position:fixed;inset:0;background:rgba(11,19,50,.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px}
.v374-dlg{background:#fff;border-radius:16px;max-width:600px;width:100%;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.v374-dh{display:flex;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid #eef0f4}.v374-dh h2{margin:0;font-size:18px;color:#18244f}.v374-dh p{margin:3px 0 0;font-size:12px;color:#5b606d}
.v374-x{border:0;background:#f5f7f9;border-radius:8px;width:32px;height:32px;font-size:20px;cursor:pointer;color:#474c58}
.v374-db{padding:6px 22px 16px;overflow:auto}
.v374-sec{font-size:12px;font-weight:800;color:#2e427b;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 8px}
.v374-cmp{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch}
.v374-cbox{border:1px solid #e9ebf0;border-radius:12px;padding:10px 12px;background:#f8f9fb;display:flex;flex-direction:column;gap:4px}
.v374-cbox.new{background:#eef2fb;border-color:#c9d3ee}
.v374-cbox small{font-size:11px;font-weight:700;color:#5b606d;text-transform:uppercase}.v374-cbox b{font-size:15px;color:#18244f}.v374-cbox span{font-size:12px;color:#5b606d}
.v374-arrow{align-self:center;font-size:20px;color:#5b606d}
.v374-dlg input,.v374-dlg select,.v374-dlg textarea{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #d5d8df;border-radius:8px;font:inherit;font-size:13px;background:#fff}
.v374-l{display:block;font-size:12px;font-weight:600;color:#474c58;margin:10px 0 4px}
.v374-hint{font-size:12px;margin-top:6px}.v374-hint.ok{color:#1e6b34}.v374-hint.ko{color:#a42a2a}
.v374-eff{margin:0;padding:10px 12px 10px 28px;background:#e8eefb;border-radius:10px;font-size:12.5px;color:#353944;line-height:1.6}
.v374-df{display:flex;justify-content:flex-end;gap:8px;padding:14px 22px;border-top:1px solid #eef0f4}
.v374-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-size:12.5px;color:#5b606d;border-top:1px solid #eef0f4;padding-top:12px}
.v374-foot a{color:#2e427b;font-weight:700;text-decoration:none}
.v374-page{padding:24px 28px}.v374-crumb{font-size:12px;color:#5b606d;margin-bottom:6px}
.v374-page h1{margin:0;font-size:24px;color:#0b1332}.v374-page .v374-head>div>p{margin:4px 0 0;font-size:13px;color:#5b606d}
.v374-sel{padding:9px 10px;border:1px solid #d5d8df;border-radius:9px;font:inherit;font-size:13px;min-width:280px;max-width:100%;background:#fff}
.v374-cons .v374-tl{margin-top:14px}.v374-empty{color:#5b606d;font-size:13px}
@media(max-width:720px){.v374-tiles{grid-template-columns:1fr}.v374-cmp{grid-template-columns:1fr}.v374-arrow{display:none}}
</style>
