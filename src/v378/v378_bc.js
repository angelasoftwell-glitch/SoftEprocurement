<script id="v377-bons-de-commande">
/* V377 — Contractualisation › Bons de commande (achats hors contrats — sans lien avec le PPM).
   Création : par liaison (BC récupéré de Softaccounting) ou par saisie manuelle (envoyé à Softaccounting).
   Circuit : Brouillon → En validation → Approuvé → Notifié → Réceptionné → Facturé → Payé → Clôturé (ou Rejeté).
   Contrôles : seuil du BC, crédit de la ligne budgétaire, fournisseur, anti-fractionnement (cumul annuel par fournisseur). Données : localStorage sm378_bc. */
(function () {
  "use strict";
  var KEY = 'sm378_bc', DEV = 'EUR', SEUIL_BC = 20000, TVA = 20;
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(v) { var x = Number(String(v == null ? '' : v).replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(x) ? 0 : x; }
  function m(v) { return Math.round(n(v)).toLocaleString('fr-FR') + ' ' + DEV; }
  function today() { return new Date().toLocaleDateString('fr-FR'); }
  function now() { return new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); }
  var LIGNES = [
    { code: '61.1', lib: 'Fournitures de bureau', credit: 40000 },
    { code: '62.4', lib: 'Entretien et réparations', credit: 10000 },
    { code: '60.5', lib: 'Petits équipements', credit: 8000 },
    { code: '61.8', lib: 'Carburant et lubrifiants', credit: 6000 }
  ];
  var FOURN = ['PAPETERIE CENTRALE', 'SOFTWELL', 'FROID SERVICE', 'MADATECH', 'GARAGE DU SUD', 'INFOSERV'];
  /* BC déjà saisis dans Softaccounting, récupérables par liaison */
  var SOURCES = [
    { type: 'Softaccounting', ref: 'SA-BC-2026-0018', lib: 'Fournitures de bureau — octobre', f: 'PAPETERIE CENTRALE', ligne: '61.1', date: '10/10/2026', items: [{ d: 'Ramettes papier A4 (carton de 5)', q: 60, pu: 35 }, { d: 'Classeurs à levier', q: 120, pu: 4.5 }] },
    { type: 'Softaccounting', ref: 'SA-BC-2026-0021', lib: 'Claviers et souris', f: 'MADATECH', ligne: '60.5', date: '06/11/2026', items: [{ d: 'Claviers USB', q: 10, pu: 22 }, { d: 'Souris sans fil', q: 20, pu: 18 }] },
    { type: 'Softaccounting', ref: 'SA-BC-2026-0024', lib: 'Entretien du véhicule 4x4', f: 'GARAGE DU SUD', ligne: '62.4', date: '10/11/2026', items: [{ d: 'Vidange, filtres et révision', q: 1, pu: 640 }] }
  ];
  function srcOf(ref) { return SOURCES.find(function (x) { return x.ref === ref; }) || null; }
  var ST = ['Brouillon', 'En validation', 'Approuvé', 'Notifié', 'Réceptionné', 'Facturé', 'Payé', 'Clôturé'];
  function bc(no, date, objet, ligne, f, items, statut, extra) {
    var o = { mode: 'manuel', source: '', no: no, date: date, objet: objet, ligne: ligne, fournisseur: f, items: items, delai: '15 jours', lieu: 'Siège du projet — Antananarivo', paiement: 'À 30 jours après réception', statut: statut, recu: 0, compta: [], hist: [{ d: date, a: 'Création par saisie manuelle' }] };
    Object.assign(o, extra || {});
    if (o.mode === 'liaison') { o.hist = [{ d: date, a: 'Création par liaison — repris de Softaccounting (' + o.source + ')' }]; o.compta.push({ d: date, a: 'BC ' + o.source + ' récupéré de Softaccounting', t: 'lien' }); }
    var i = ST.indexOf(statut);
    if (i >= 1) o.hist.push({ d: date, a: 'Soumis à validation' });
    if (i >= 2) { o.hist.push({ d: date, a: 'Approuvé — crédit disponible vérifié' }); o.compta.push({ d: date, a: o.mode === 'liaison' ? 'Engagement existant confirmé dans Softaccounting' : 'Engagement ENG-' + no.slice(3) + ' créé dans Softaccounting', t: 'eng' }); }
    if (i >= 3) o.hist.push({ d: date, a: 'Signé et notifié au fournisseur (portail)' });
    if (i >= 4) { o.recu = 100; o.hist.push({ d: date, a: 'Réception totale — bon de réception enregistré' }); }
    if (i >= 5) { o.facture = 'FA-' + no.slice(3); o.hist.push({ d: date, a: 'Facture ' + o.facture + ' enregistrée' }); o.compta.push({ d: date, a: 'Écriture fournisseur comptabilisée (facture ' + o.facture + ')', t: 'fac' }); }
    if (i >= 6) { o.compta.push({ d: date, a: 'Paiement effectué — statut « Payé » reçu de Softaccounting', t: 'pay' }); o.hist.push({ d: date, a: 'Payé (retour compta)' }); }
    return o;
  }
  function seed() {
    return [
      bc('BC-2026-001', '12/10/2026', 'Fournitures de bureau — octobre', '61.1', 'PAPETERIE CENTRALE', [{ d: 'Ramettes papier A4 (carton de 5)', q: 60, pu: 35 }, { d: 'Classeurs à levier', q: 120, pu: 4.5 }], 'Payé', { mode: 'liaison', source: 'SA-BC-2026-0018' }),
      bc('BC-2026-002', '20/10/2026', 'Cartouches de toner', '61.1', 'SOFTWELL', [{ d: 'Cartouches de toner', q: 25, pu: 124 }], 'Facturé'),
      bc('BC-2026-003', '28/10/2026', 'Réparation des climatiseurs de la salle serveur', '62.4', 'FROID SERVICE', [{ d: 'Réparation de 3 climatiseurs (pièces et main-d’œuvre)', q: 1, pu: 1450 }], 'Notifié'),
      bc('BC-2026-004', '04/11/2026', 'Agendas et carnets 2027', '61.1', 'PAPETERIE CENTRALE', [{ d: 'Agendas et carnets', q: 80, pu: 15 }], 'Approuvé'),
      bc('BC-2026-005', '09/11/2026', 'Onduleurs pour les postes de travail', '60.5', 'MADATECH', [{ d: 'Onduleurs 1 000 VA', q: 4, pu: 380 }], 'En validation'),
      bc('BC-2026-006', '10/11/2026', 'Papeterie pour la formation régionale', '61.1', 'PAPETERIE CENTRALE', [{ d: 'Kits de formation (bloc-notes, stylos, chemises)', q: 145, pu: 115 }], 'Brouillon')
    ];
  }
  var L; try { L = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!Array.isArray(L)) L = seed();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) {} }
  var TAB = 'liste', OPEN = null, F = '';

  function ht(b) { return (b.items || []).reduce(function (a, i) { return a + n(i.q) * n(i.pu); }, 0); }
  function ttc(b) { return ht(b) * (1 + TVA / 100); }
  function engage(b) { return ST.indexOf(b.statut) >= 2; }
  function ligne(c) { return LIGNES.find(function (l) { return l.code === c; }) || { code: c, lib: '', credit: 0 }; }
  function engageLigne(code, sauf) { return L.filter(function (b) { return b.ligne === code && engage(b) && b.no !== sauf; }).reduce(function (a, b) { return a + ttc(b); }, 0); }
  function payeLigne(code) { return L.filter(function (b) { return b.ligne === code && ST.indexOf(b.statut) >= 6; }).reduce(function (a, b) { return a + ttc(b); }, 0); }
  function cumulFourn(f, sauf) { var y = String(new Date().getFullYear()); return L.filter(function (b) { return b.fournisseur === f && b.no !== sauf && b.statut !== 'Rejeté' && String(b.date).slice(-4) === y; }).reduce(function (a, b) { return a + ht(b); }, 0); }
  /* Contrôles : renvoie [{ok, bloq, txt}] */
  function controles(b) {
    var r = [], h = ht(b), t = ttc(b), l = ligne(b.ligne), dispo = l.credit - engageLigne(b.ligne, b.no);
    r.push({ ok: !!String(b.objet || '').trim(), bloq: true, txt: 'Objet de l’achat renseigné' });
    r.push({ ok: h <= SEUIL_BC, bloq: true, txt: 'Montant ' + m(h) + ' HT ≤ seuil du bon de commande (' + m(SEUIL_BC) + ')' + (h > SEUIL_BC ? ' — au-delà, un contrat est obligatoire' : '') });
    r.push({ ok: !!b.ligne, bloq: true, txt: 'Ligne budgétaire renseignée' });
    if (b.ligne) r.push({ ok: t <= dispo, bloq: true, txt: 'Crédit disponible sur ' + l.code + ' : ' + m(dispo) + ' (besoin ' + m(t) + ' TTC)' });
    r.push({ ok: !!b.fournisseur, bloq: true, txt: 'Fournisseur actif dans le référentiel' });
    if (b.mode === 'liaison') r.push({ ok: !!srcOf(b.source), bloq: true, txt: 'BC Softaccounting sélectionné' });
    if (b.fournisseur) { var cum = cumulFourn(b.fournisseur, b.no) + h; r.push({ ok: cum <= SEUIL_BC, bloq: false, frac: true, txt: 'Anti-fractionnement : cumul ' + new Date().getFullYear() + ' des BC chez ' + b.fournisseur + ' = ' + m(cum) + ' HT' + (cum > SEUIL_BC ? ' > ' + m(SEUIL_BC) + ' — ces achats auraient dû faire l’objet d’un contrat' : '') }); }
    return r;
  }
  function bloque(b) { return controles(b).some(function (c) { return !c.ok && c.bloq; }); }
  function alerteFrac(b) { return controles(b).some(function (c) { return c.frac && !c.ok; }); }

  function pill(s) { var c = { 'Brouillon': 'a', 'En validation': 'v', 'Approuvé': 'b', 'Notifié': 'b', 'Réceptionné': 'b', 'Facturé': 'v', 'Payé': 'g', 'Clôturé': 'g', 'Rejeté': 'r' }[s] || 'a'; return '<span class="v376p ' + c + '">' + esc(s) + '</span>'; }
  function comptaCell(b) {
    var t = (b.compta || []).map(function (x) { return x.t; });
    if (t.indexOf('pay') >= 0) return '<span class="v377c g">● Payé</span>';
    if (t.indexOf('fac') >= 0) return '<span class="v377c v">● Facture comptabilisée</span>';
    if (t.indexOf('eng') >= 0) return '<span class="v377c b">● Engagé</span>';
    if (t.indexOf('lien') >= 0) return '<span class="v377c b">● Lié à la compta</span>';
    return '<span class="v377c">—</span>';
  }
  function actions(b) {
    var B = function (a, lab, p) { return '<button class="v134-btn' + (p ? ' primary' : '') + '" data-v377="' + a + '" data-no="' + esc(b.no) + '">' + lab + '</button>'; };
    var main = { 'Brouillon': B('modifier', 'Modifier', true) + B('soumettre', 'Soumettre'), 'En validation': B('valider', 'Valider', true) + B('rejeter', 'Rejeter'), 'Approuvé': B('notifier', 'Signer et notifier', true), 'Notifié': B('receptionner', 'Réceptionner', true), 'Réceptionné': B('facturer', 'Enregistrer la facture', true), 'Facturé': '<span class="v377wait">En attente du paiement (compta)</span>', 'Payé': B('cloturer', 'Clôturer', true), 'Rejeté': B('modifier', 'Corriger', true) }[b.statut] || '';
    return main + B('consulter', 'Consulter');
  }
  function kpis() {
    var en = L.filter(function (b) { return ST.indexOf(b.statut) >= 2 && b.statut !== 'Clôturé'; }), al = L.filter(function (b) { return b.statut !== 'Rejeté' && alerteFrac(b); });
    var apayer = L.filter(function (b) { return b.statut === 'Facturé'; });
    return '<div class="v134-kpis"><div class="v134-kpi"><b>' + L.filter(function (b) { return /Brouillon|En validation/.test(b.statut); }).length + '</b><span>À soumettre / valider</span></div>' +
      '<div class="v134-kpi"><b>' + m(L.filter(engage).reduce(function (a, b) { return a + ttc(b); }, 0)) + '</b><span>Engagé TTC (' + en.length + ' BC en cours)</span></div>' +
      '<div class="v134-kpi"><b>' + m(apayer.reduce(function (a, b) { return a + ttc(b); }, 0)) + '</b><span>Facturé, en attente de paiement</span></div>' +
      '<div class="v134-kpi"><b>' + al.length + '</b><span>Alertes de fractionnement</span></div></div>';
  }
  function liste() {
    var vis = L.filter(function (b) { return !F || (F === 'LIAISON' ? b.mode === 'liaison' : F === 'MANUEL' ? b.mode !== 'liaison' : b.statut === F); }).slice().sort(function (a, b) { return b.no.localeCompare(a.no); });
    return '<div class="v134-card"><div class="v134-cardhead"><div><h2>Bons de commande</h2><span class="v377sub">Achats qui ne font pas l’objet d’un contrat. Chaque BC approuvé est engagé dans Softaccounting.</span></div>' +
      '<div class="v134-toolbar"><select class="v134-select" id="v377f"><option value="">Tous les BC</option><option value="LIAISON"' + (F === 'LIAISON' ? ' selected' : '') + '>Créés par liaison</option><option value="MANUEL"' + (F === 'MANUEL' ? ' selected' : '') + '>Saisis manuellement</option>' + ST.concat(['Rejeté']).map(function (s) { return '<option' + (s === F ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select><button class="v134-btn primary" data-v377="nouveau">+ Nouveau bon de commande</button></div></div>' +
      '<div style="overflow-x:auto"><table class="v134-table v377t"><thead><tr><th>N° BC</th><th>Objet</th><th>Fournisseur</th><th>Ligne budgétaire</th><th>Montant TTC</th><th>Statut</th><th>Compta</th><th>Action</th></tr></thead><tbody>' +
      (vis.map(function (b) {
        return '<tr><td><strong>' + esc(b.no) + '</strong><br><small>' + esc(b.date) + '</small></td><td>' + esc(b.objet) + '<br>' + (b.mode === 'liaison' ? '<span class="v377o l">🔗 ' + esc(b.source) + '</span>' : '<span class="v377o m">Saisie manuelle</span>') + (alerteFrac(b) ? ' <span class="v377warn" title="Cumul annuel chez ce fournisseur au-delà du seuil">⚠ fractionnement</span>' : '') + '</td><td>' + esc(b.fournisseur) + '</td><td>' + esc(b.ligne) + ' — ' + esc(ligne(b.ligne).lib) + '</td><td style="white-space:nowrap">' + m(ttc(b)) + '</td><td>' + pill(b.statut) + '</td><td>' + comptaCell(b) + '</td><td><div class="v376act">' + actions(b) + '</div></td></tr>';
      }).join('') || '<tr><td colspan="8" style="text-align:center;color:#969ba8;padding:18px">Aucun bon de commande.</td></tr>') + '</tbody></table></div></div>';
  }
  function etatSeuils() {
    var y = new Date().getFullYear(), fs = FOURN.map(function (f) { var x = L.filter(function (b) { return b.fournisseur === f && b.statut !== 'Rejeté' && String(b.date).slice(-4) === String(y); }); return { f: f, nb: x.length, c: x.reduce(function (a, b) { return a + ht(b); }, 0) }; }).filter(function (x) { return x.nb; }).sort(function (a, b) { return b.c - a.c; });
    return '<div class="v134-card"><div class="v134-cardhead"><div><h2>Contrôle des seuils ' + y + ' — cumul par fournisseur</h2><span class="v377sub">Au-delà de ' + m(SEUIL_BC) + ' HT d’achats sur l’année chez un même fournisseur, les achats auraient dû faire l’objet d’un contrat (risque de fractionnement).</span></div></div>' +
      '<table class="v134-table"><thead><tr><th>Fournisseur</th><th>Nombre de BC</th><th>Cumul HT</th><th style="width:26%">Part du seuil</th><th>Situation</th></tr></thead><tbody>' +
      fs.map(function (x) { var ko = x.c > SEUIL_BC, pc = Math.min(100, Math.round(x.c * 100 / SEUIL_BC)); return '<tr><td><b>' + esc(x.f) + '</b></td><td>' + x.nb + '</td><td>' + m(x.c) + '</td><td><div class="v377bar"><i style="width:' + pc + '%;background:' + (ko ? '#fca5a5' : pc >= 80 ? '#fcd34d' : '#9fb1e3') + '"></i></div><small>' + Math.round(x.c * 100 / SEUIL_BC) + ' %</small></td><td>' + (ko ? '<span class="v376p r">Seuil dépassé — contrat requis</span>' : pc >= 80 ? '<span class="v376p a">Proche du seuil</span>' : '<span class="v376p g">Conforme</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function suiviBudget() {
    return '<div class="v134-card"><div class="v134-cardhead"><div><h2>Suivi financier par ligne budgétaire</h2><span class="v377sub">Engagé = BC approuvés (envoyés à Softaccounting). Payé = statut renvoyé par la comptabilité.</span></div></div>' +
      '<table class="v134-table"><thead><tr><th>Ligne budgétaire</th><th>Crédit</th><th>Engagé</th><th>Payé</th><th>Disponible</th><th style="width:28%">Consommation</th></tr></thead><tbody>' +
      LIGNES.map(function (l) { var e = engageLigne(l.code), p = payeLigne(l.code), d = l.credit - e, pc = l.credit ? Math.min(100, Math.round(e * 100 / l.credit)) : 0, pp = l.credit ? Math.min(100, Math.round(p * 100 / l.credit)) : 0;
        return '<tr><td><b>' + esc(l.code) + '</b> — ' + esc(l.lib) + '</td><td>' + m(l.credit) + '</td><td>' + m(e) + '</td><td>' + m(p) + '</td><td><b>' + m(d) + '</b></td><td><div class="v377bar"><i style="width:' + pc + '%"></i><em style="width:' + pp + '%"></em></div><small>' + pc + ' % engagé · ' + pp + ' % payé</small></td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function render() {
    var pg = ensurePage(); if (!pg) return;
    pg.innerHTML = '<div class="v134-hero"><div><div class="v134-eyebrow">Contractualisation</div><h1>Bons de commande</h1><p>Achats hors contrats : créez un BC par liaison avec Softaccounting ou par saisie manuelle, puis suivez-le jusqu’au paiement.</p></div><span class="v134-status">● Lien Softaccounting actif</span></div>' + kpis() +
      '<div class="v377tabs">' + [['liste', 'Bons de commande'], ['seuils', 'Contrôle des seuils'], ['budget', 'Suivi financier']].map(function (t) { return '<button data-v377tab="' + t[0] + '" class="' + (TAB === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      (TAB === 'seuils' ? etatSeuils() : TAB === 'budget' ? suiviBudget() : liste());
    var f = document.getElementById('v377f'); if (f) f.onchange = function () { F = this.value; render(); };
  }
  function ensurePage() {
    var pg = document.getElementById('page-v377-bc'); if (pg) return pg;
    var ref = document.getElementById('v134-signed'); if (!ref) return null;
    pg = document.createElement('div'); pg.id = 'page-v377-bc'; pg.className = 'sm-page-content v134-page';
    ref.parentNode.insertBefore(pg, ref.nextSibling); return pg;
  }
  function ensureLeaf() {
    if (document.getElementById('leaf-6-bc')) return true;
    var after = document.getElementById('leaf-6-4'); if (!after) return false;
    var el = document.createElement('div'); el.className = 'sm-sub'; el.id = 'leaf-6-bc'; el.setAttribute('data-goto', 'page-v377-bc');
    el.innerHTML = '<span class="sm-sub-dot"></span><span class="sm-sub-label">Bons de commande</span>';
    el.onclick = function (e) { e.stopPropagation(); TAB = 'liste'; render(); selectLeaf(el); };
    after.parentNode.insertBefore(el, after.nextSibling); return true;
  }
  function toast(t) { var d = document.createElement('div'); d.className = 'v376toast'; d.innerHTML = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4200); }
  function modal(title, sub, body, okLab, onOk, closeLab, wide) {
    var md = document.createElement('div'); md.className = 'v376m';
    md.innerHTML = '<div class="v376dlg"' + (wide ? ' style="width:min(1080px,100%)"' : '') + '><div class="v376mh"><div><b>' + title + '</b><small>' + sub + '</small></div><button class="v134-btn" data-x>✕</button></div><div class="v376mb">' + body + '</div><div class="v376mf"><button class="v134-btn" data-x>' + (closeLab || 'Annuler') + '</button>' + (okLab ? '<button class="v134-btn primary" data-ok>' + okLab + '</button>' : '') + '</div></div>';
    document.body.appendChild(md);
    md.addEventListener('click', function (e) { if (e.target === md || e.target.closest('[data-x]')) md.remove(); if (e.target.closest('[data-ok]')) { if (onOk(md) !== false) md.remove(); } });
    return md;
  }
  function find(no) { return L.find(function (b) { return b.no === no; }); }
  function nextNo() { var y = new Date().getFullYear(), mx = L.reduce(function (a, b) { var k = parseInt(String(b.no).split('-')[2], 10); return String(b.no).indexOf('BC-' + y) === 0 && k > a ? k : a; }, 0); return 'BC-' + y + '-' + String(mx + 1).padStart(3, '0'); }

  /* ---------------- Formulaire de création / modification ---------------- */
  function form(src) {
    var b = src ? JSON.parse(JSON.stringify(src)) : { mode: 'manuel', source: '', no: nextNo(), date: today(), objet: '', ligne: '', fournisseur: '', items: [{ d: '', q: 1, pu: 0 }], delai: '15 jours', lieu: 'Siège du projet — Antananarivo', paiement: 'À 30 jours après réception', statut: 'Brouillon', recu: 0, compta: [], hist: [] };
    var md = modal(src ? 'Modifier ' + esc(b.no) : 'Nouveau bon de commande', esc(b.no) + ' · ' + esc(b.date), '<div id="v377form"></div>', 'Soumettre à validation', function () { return commit('submit'); }, 'Annuler', true);
    var foot = md.querySelector('.v376mf'), draft = document.createElement('button'); draft.className = 'v134-btn'; draft.textContent = 'Enregistrer le brouillon'; foot.insertBefore(draft, foot.lastChild);
    draft.onclick = function () { if (commit('draft') !== false) md.remove(); };
    function commit(mode) {
      if (mode === 'submit' && bloque(b)) { paint(); md.querySelector('.v377ctl').scrollIntoView({ block: 'nearest' }); toast('Soumission impossible : corrigez les contrôles bloquants (en rouge).'); return false; }
      b.items = b.items.filter(function (i) { return String(i.d).trim(); }); if (!b.items.length) b.items = [{ d: '', q: 1, pu: 0 }];
      if (!src && b.mode === 'liaison') b.compta.push({ d: now(), a: 'BC ' + b.source + ' récupéré de Softaccounting', t: 'lien' });
      b.hist = b.hist || []; b.hist.push({ d: now(), a: src ? 'Modification' : 'Création ' + (b.mode === 'liaison' ? 'par liaison — repris de Softaccounting (' + b.source + ')' : 'par saisie manuelle') });
      if (mode === 'submit') { b.statut = 'En validation'; b.hist.push({ d: now(), a: 'Soumis à validation' + (alerteFrac(b) ? ' — alerte fractionnement signalée' : '') }); } else b.statut = 'Brouillon';
      var i = L.findIndex(function (x) { return x.no === b.no; }); if (i >= 0) L[i] = b; else L.push(b);
      save(); TAB = 'liste'; render(); toast(mode === 'submit' ? '<b>' + esc(b.no) + '</b> soumis à validation.' : 'Brouillon <b>' + esc(b.no) + '</b> enregistré.');
    }
    function paint() {
      var box = md.querySelector('#v377form'), h = ht(b);
      var opt = function (arr, v, ph) { return '<option value="">' + ph + '</option>' + arr.map(function (a) { var val = a.v != null ? a.v : a; return '<option value="' + esc(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + esc(a.l || a) + '</option>'; }).join(''); };
      var ctl = controles(b);
      var used = L.filter(function (x) { return x.no !== b.no && x.statut !== 'Rejeté'; }).map(function (x) { return x.source; });
      var srcs = SOURCES.filter(function (x) { return used.indexOf(x.ref) < 0; }), so = srcOf(b.source);
      box.innerHTML =
        '<div class="v377orig"><span>Mode de création</span><label class="' + (b.mode === 'liaison' ? 'on' : '') + '"><input type="radio" name="v377m" value="liaison"' + (b.mode === 'liaison' ? ' checked' : '') + '> <b>Par liaison</b><small>Récupérer un BC déjà saisi dans Softaccounting : les données sont reprises</small></label><label class="' + (b.mode === 'manuel' ? 'on' : '') + '"><input type="radio" name="v377m" value="manuel"' + (b.mode === 'manuel' ? ' checked' : '') + '> <b>Saisie manuelle</b><small>Le BC est saisi ici, puis envoyé à Softaccounting à son approbation</small></label></div>' +
        (b.mode === 'liaison' ? '<div class="v377grid" style="margin-bottom:12px"><div class="v134-field" style="grid-column:1/-1"><label>BC Softaccounting *</label><select class="v134-select" id="v377src"><option value="">Choisir un BC saisi dans la comptabilité</option>' + srcs.map(function (x) { return '<option value="' + esc(x.ref) + '"' + (x.ref === b.source ? ' selected' : '') + '>' + esc(x.ref + ' du ' + x.date + ' — ' + x.lib + ' — ' + x.f) + '</option>'; }).join('') + '</select></div>' +
          (so ? '<div class="v377linked" style="grid-column:1/-1">🔗 Repris de Softaccounting <b>' + esc(so.ref) + '</b> : fournisseur, ligne budgétaire, articles et prix. Ces données ne sont pas modifiables ici ; une correction se fait dans la comptabilité.</div>' : '') + '</div>' : '') +
        '<div class="v377grid">' +
        '<div class="v134-field" style="grid-column:1/-1"><label>Objet de l’achat *</label><input class="v134-input" data-k="objet" value="' + esc(b.objet) + '" placeholder="Ex. Réparation des climatiseurs de la salle serveur"></div>' +
        '<div class="v134-field"><label>Ligne budgétaire *</label><select class="v134-select" data-k="ligne">' + opt(LIGNES.map(function (l) { return { v: l.code, l: l.code + ' — ' + l.lib }; }), b.ligne, 'Choisir une ligne') + '</select></div>' +
        '<div class="v134-field"><label>Fournisseur *</label><select class="v134-select" data-k="fournisseur">' + opt(FOURN, b.fournisseur, 'Choisir dans le référentiel') + '</select></div>' +
        '<div class="v134-field"><label>Délai de livraison</label><input class="v134-input" data-k="delai" value="' + esc(b.delai) + '"></div>' +
        '<div class="v134-field"><label>Lieu de livraison</label><input class="v134-input" data-k="lieu" value="' + esc(b.lieu) + '"></div>' +
        '<div class="v134-field"><label>Conditions de paiement</label><input class="v134-input" data-k="paiement" value="' + esc(b.paiement) + '"></div></div>' +
        '<h4 class="v377h4">Articles</h4><table class="v134-table v377it"><thead><tr><th>Désignation</th><th style="width:90px">Quantité</th><th style="width:130px">Prix unitaire HT</th><th style="width:130px">Total HT</th><th style="width:40px"></th></tr></thead><tbody>' +
        b.items.map(function (i, k) { return '<tr><td><input class="v134-input" data-i="' + k + '" data-f="d" value="' + esc(i.d) + '" placeholder="Désignation"></td><td><input class="v134-input" type="number" min="0" data-i="' + k + '" data-f="q" value="' + esc(i.q) + '"></td><td><input class="v134-input" type="number" min="0" step="0.01" data-i="' + k + '" data-f="pu" value="' + esc(i.pu) + '"></td><td data-tot="' + k + '">' + m(n(i.q) * n(i.pu)) + '</td><td>' + (b.items.length > 1 ? '<button class="v134-btn" data-del="' + k + '">✕</button>' : '') + '</td></tr>'; }).join('') +
        '</tbody></table><button class="v134-btn" data-add style="margin-top:6px">+ Ajouter un article</button>' +
        '<div class="v377tot"><div><small>Total HT</small><b data-ht>' + m(h) + '</b></div><div><small>TVA ' + TVA + ' %</small><b data-tva>' + m(h * TVA / 100) + '</b></div><div><small>Total TTC</small><b data-ttc>' + m(ttc(b)) + '</b></div></div>' +
        '<div class="v377ctl"><b>Contrôles automatiques</b>' + ctl.map(function (c) { return '<div class="' + (c.ok ? 'ok' : c.bloq ? 'ko' : 'wa') + '">' + (c.ok ? '✓' : c.bloq ? '✕' : '⚠') + ' ' + esc(c.txt) + (!c.ok && !c.bloq ? ' <small>(alerte non bloquante, tracée dans l’historique)</small>' : '') + '</div>'; }).join('') + '</div>';
      box.querySelectorAll('[name="v377m"]').forEach(function (r) { r.onchange = function () { b.mode = r.value; if (b.mode === 'manuel') b.source = ''; paint(); }; });
      var ss = box.querySelector('#v377src'); if (ss) ss.onchange = function () { var x = srcOf(ss.value); b.source = ss.value; if (x) { b.fournisseur = x.f; b.ligne = x.ligne; b.objet = x.lib; b.items = JSON.parse(JSON.stringify(x.items)); } paint(); };
      if (b.mode === 'liaison' && so) {
        box.querySelectorAll('[data-k="fournisseur"],[data-k="ligne"]').forEach(function (el) { el.disabled = true; });
        box.querySelectorAll('[data-f="d"],[data-f="pu"],[data-f="q"]').forEach(function (el) { el.disabled = true; });
        box.querySelectorAll('[data-del]').forEach(function (el) { el.style.display = 'none'; });
      }
      var addB = box.querySelector('[data-add]'); if (addB && b.mode === 'liaison') addB.style.display = 'none';
      box.querySelectorAll('[data-k]').forEach(function (el) { el.onchange = function () { b[el.dataset.k] = el.value; paint(); }; });
      box.querySelectorAll('[data-i]').forEach(function (el) { el.oninput = function () { b.items[+el.dataset.i][el.dataset.f] = el.value; var k = +el.dataset.i, hh = ht(b); box.querySelector('[data-tot="' + k + '"]').textContent = m(n(b.items[k].q) * n(b.items[k].pu)); box.querySelector('[data-ht]').textContent = m(hh); box.querySelector('[data-tva]').textContent = m(hh * TVA / 100); box.querySelector('[data-ttc]').textContent = m(ttc(b)); }; el.onchange = function () { paint(); }; });
      box.querySelectorAll('[data-del]').forEach(function (el) { el.onclick = function () { b.items.splice(+el.dataset.del, 1); paint(); }; });
      box.querySelector('[data-add]').onclick = function () { b.items.push({ d: '', q: 1, pu: 0 }); paint(); };
    }
    paint();
  }
  /* ---------------- Consulter ---------------- */
  function consulter(b) {
    var l = ligne(b.ligne), info = function (k, v) { return '<div><small>' + k + '</small><b>' + v + '</b></div>'; };
    modal('Bon de commande ' + esc(b.no), esc(b.fournisseur) + ' · ' + esc(b.date),
      '<div class="v377doc"><div class="v377dochead"><div><b>BON DE COMMANDE N° ' + esc(b.no) + '</b><small>Date : ' + esc(b.date) + '</small></div>' + pill(b.statut) + '</div>' +
      '<div class="v376sum" style="grid-template-columns:repeat(3,1fr);margin:10px 0">' + info('Fournisseur', esc(b.fournisseur)) + info('Objet', esc(b.objet)) + info('Création', b.mode === 'liaison' ? 'Par liaison — Softaccounting ' + esc(b.source) : 'Saisie manuelle') + info('Ligne budgétaire', esc(l.code) + ' — ' + esc(l.lib)) + info('Délai / lieu', esc(b.delai) + ' · ' + esc(b.lieu)) + info('Paiement', esc(b.paiement)) + info('Réception', (b.recu || 0) + ' %') + info('Facture', esc(b.facture || '—')) + info('Signataire', 'PRMP / ordonnateur') + '</div>' +
      '<table class="v134-table"><thead><tr><th>Désignation</th><th>Qté</th><th>PU HT</th><th>Total HT</th></tr></thead><tbody>' + b.items.map(function (i) { return '<tr><td>' + esc(i.d) + '</td><td>' + esc(i.q) + '</td><td>' + m(i.pu) + '</td><td>' + m(n(i.q) * n(i.pu)) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="3" style="text-align:right">Total HT</td><td>' + m(ht(b)) + '</td></tr><tr><td colspan="3" style="text-align:right">TVA ' + TVA + ' %</td><td>' + m(ht(b) * TVA / 100) + '</td></tr><tr><td colspan="3" style="text-align:right"><b>Total TTC</b></td><td><b>' + m(ttc(b)) + '</b></td></tr></tfoot></table></div>' +
      '<div class="v376cols" style="margin-top:14px"><div><h4>Échanges avec Softaccounting</h4><ul class="v376hist">' + ((b.compta || []).length ? b.compta.slice().reverse().map(function (x) { return '<li><small>' + esc(x.d) + '</small>' + esc(x.a) + '</li>'; }).join('') : '<li>Aucun échange : le BC sera engagé dans la compta à son approbation.</li>') + '</ul>' +
      '<div class="v377send"><small>Données transmises à la compta</small>N° BC · code tiers du fournisseur · ligne budgétaire et analytique · montants HT / TVA / TTC · devise · date</div></div>' +
      '<div><h4>Historique</h4><ul class="v376hist">' + (b.hist || []).slice().reverse().map(function (x) { return '<li><small>' + esc(x.d) + '</small>' + esc(x.a) + '</li>'; }).join('') + '</ul></div></div>',
      'Imprimer le BC', function () { toast('Impression du <b>' + esc(b.no) + '</b> (démonstration).'); return false; }, 'Fermer', true);
  }
  /* ---------------- Actions du circuit ---------------- */
  function act(a, b) {
    var H = function (t) { b.hist.push({ d: now(), a: t }); }, C = function (t, k) { b.compta.push({ d: now(), a: t, t: k }); };
    if (a === 'modifier') return form(b);
    if (a === 'consulter') return consulter(b);
    if (a === 'soumettre') { if (bloque(b)) { form(b); return; } b.statut = 'En validation'; H('Soumis à validation' + (alerteFrac(b) ? ' — alerte fractionnement signalée' : '')); }
    else if (a === 'valider') {
      if (bloque(b)) { toast('Validation impossible : ' + esc(controles(b).filter(function (c) { return !c.ok && c.bloq; })[0].txt)); return; }
      b.statut = 'Approuvé'; H('Approuvé — crédit disponible vérifié'); C(b.mode === 'liaison' ? 'Engagement existant confirmé dans Softaccounting (' + b.source + ')' : 'Engagement ENG-' + b.no.slice(3) + ' créé dans Softaccounting (' + m(ttc(b)) + ' sur ' + b.ligne + ')', 'eng');
      toast('<b>' + esc(b.no) + '</b> approuvé. Engagement envoyé à Softaccounting.');
    }
    else if (a === 'rejeter') return modal('Rejeter ' + esc(b.no), esc(b.fournisseur), '<div class="v134-field"><label>Motif du rejet *</label><textarea class="v134-input" id="v377mo" rows="3" style="width:100%"></textarea></div>', 'Rejeter', function (md) { var v = md.querySelector('#v377mo').value.trim(); if (!v) { md.querySelector('#v377mo').style.borderColor = '#b91c1c'; return false; } b.statut = 'Rejeté'; H('Rejeté : ' + v); save(); render(); });
    else if (a === 'notifier') { b.statut = 'Notifié'; H('Signé et notifié au fournisseur (portail)'); toast('<b>' + esc(b.no) + '</b> notifié à ' + esc(b.fournisseur) + '.'); }
    else if (a === 'receptionner') return modal('Réceptionner ' + esc(b.no), esc(b.fournisseur), '<table class="v134-table"><thead><tr><th>Article</th><th>Commandé</th><th>Reçu</th></tr></thead><tbody>' + b.items.map(function (i, k) { return '<tr><td>' + esc(i.d) + '</td><td>' + esc(i.q) + '</td><td><input class="v134-input" type="number" min="0" max="' + esc(i.q) + '" data-r="' + k + '" value="' + esc(i.q) + '" style="width:90px"></td></tr>'; }).join('') + '</tbody></table><p class="v377sub">Une réception partielle laisse le BC au statut « Notifié » ; la réception totale permet d’enregistrer la facture.</p>', 'Enregistrer la réception', function (md) {
      var tq = 0, tr = 0; md.querySelectorAll('[data-r]').forEach(function (x) { var i = b.items[+x.dataset.r]; tq += n(i.q); tr += Math.min(n(x.value), n(i.q)); });
      b.recu = tq ? Math.round(tr * 100 / tq) : 0; if (b.recu >= 100) { b.statut = 'Réceptionné'; H('Réception totale — bon de réception enregistré'); } else H('Réception partielle (' + b.recu + ' %)'); save(); render(); toast('Réception enregistrée : ' + b.recu + ' %.'); });
    else if (a === 'facturer') return modal('Enregistrer la facture', esc(b.no) + ' · ' + esc(b.fournisseur), '<div class="v377grid"><div class="v134-field"><label>N° de facture *</label><input class="v134-input" id="v377fa" value="FA-' + esc(b.no.slice(3)) + '"></div><div class="v134-field"><label>Montant TTC</label><input class="v134-input" value="' + m(ttc(b)) + '" disabled></div></div><p class="v377sub">La facture est transmise à Softaccounting, qui génère l’écriture fournisseur. Le statut « Payé » reviendra automatiquement après le paiement.</p>', 'Enregistrer et transmettre à la compta', function (md) { var v = md.querySelector('#v377fa').value.trim(); if (!v) return false; b.facture = v; b.statut = 'Facturé'; H('Facture ' + v + ' enregistrée'); C('Écriture fournisseur comptabilisée (facture ' + v + ')', 'fac'); save(); render(); toast('Facture transmise à Softaccounting.'); });
    else if (a === 'payer') { b.statut = 'Payé'; C('Paiement effectué — statut « Payé » reçu de Softaccounting', 'pay'); H('Payé (retour compta)'); toast('Retour de la compta : <b>' + esc(b.no) + '</b> payé.'); }
    else if (a === 'cloturer') { b.statut = 'Clôturé'; H('Bon de commande clôturé'); }
    save(); render();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-v377tab]'); if (t) { TAB = t.dataset.v377tab; render(); return; }
    var x = e.target.closest && e.target.closest('[data-v377]'); if (!x) return;
    e.stopPropagation(); var a = x.dataset.v377;
    if (a === 'nouveau') return form(null);
        var b = find(x.dataset.no); if (b) act(a, b);
  }, true);
  /* Démonstration : simuler le retour « Payé » depuis la liste */
  var oActions = actions; actions = function (b) { var h = oActions(b); return b.statut === 'Facturé' ? h.replace('<span class="v377wait">En attente du paiement (compta)</span>', '<span class="v377wait">En attente du paiement (compta)</span><button class="v134-btn" data-v377="payer" data-no="' + esc(b.no) + '" title="Démonstration : simule le retour de Softaccounting">Simuler le paiement</button>') : h; };
  window.SM377 = { render: render, data: function () { return L; }, controles: controles, reset: function () { L = seed(); save(); render(); } };
  function boot(k) { if (ensureLeaf() && ensurePage()) { render(); return; } if (k < 20) setTimeout(function () { boot(k + 1); }, 400); }
  setTimeout(function () { boot(0); }, 900);
})();
</script>
<style id="v377-css">
.v377t td:first-child strong,.v377o{white-space:nowrap}
.v377sub{display:block;font-size:12px;color:#5b606d;margin-top:2px}
.v377tabs{display:flex;gap:4px;margin:4px 0 12px;border-bottom:1px solid #e3e6ee}.v377tabs button{border:0;background:none;padding:10px 14px;font:inherit;font-size:13px;font-weight:700;color:#5b606d;cursor:pointer;border-bottom:3px solid transparent}.v377tabs button.on{color:#18244f;border-bottom-color:#2e427b}
.v377o{display:inline-block;font-size:11px;font-weight:800;border-radius:5px;padding:2px 7px;background:#e0e7ff;color:#2e427b}.v377o.l{background:#ecfdf5;color:#047857;margin-bottom:3px}.v377o.m{background:#f1f2f6;color:#5b606d;margin-bottom:3px}.v377linked{font-size:12.5px;color:#065f46;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:8px 11px}.v377orig label input:disabled,.v377dlg [disabled]{background:#f5f7f9;color:#5b606d}
.v377o.h{background:#fef3c7;color:#b45309}
.v377warn{display:inline-block;font-size:11px;font-weight:800;color:#b91c1c;background:#fee2e2;border-radius:5px;padding:2px 6px;margin-top:3px}
.v377c{font-size:12px;font-weight:700;color:#969ba8;white-space:nowrap}.v377c.b{color:#2e427b}.v377c.v{color:#5b21b6}.v377c.g{color:#047857}
.v377wait{font-size:11.5px;color:#5b21b6;font-weight:700;align-self:center}
.v377orig{display:grid;grid-template-columns:auto 1fr 1fr;gap:10px;align-items:stretch;margin-bottom:12px}.v377orig>span{align-self:center;font-weight:800;font-size:12.5px;color:#18244f}
.v377orig label{border:1px solid #d6d9e0;border-radius:10px;padding:9px 12px;cursor:pointer;font-size:13px;color:#18244f}.v377orig label small{display:block;color:#5b606d;font-size:11.5px;margin:2px 0 0 20px}.v377orig label.on{border-color:#2e427b;background:#eef2ff}
.v377grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v377grid .v134-select,.v377grid .v134-input,.v377it .v134-input{width:100%;box-sizing:border-box}
.v377h4{margin:14px 0 6px;font-size:13px;color:#18244f}
.v377tot{display:flex;justify-content:flex-end;gap:10px;margin-top:10px}.v377tot div{background:#f8f9fc;border:1px solid #e9ebf0;border-radius:8px;padding:7px 12px;min-width:140px}.v377tot small{display:block;color:#5b606d;font-size:11px}.v377tot b{color:#18244f}
.v377ctl{margin-top:12px;border:1px solid #e3e6ee;border-radius:10px;padding:10px 12px;background:#fff;font-size:12.5px}.v377ctl>b{display:block;margin-bottom:4px;color:#18244f}.v377ctl div{padding:3px 0}.v377ctl .ok{color:#047857}.v377ctl .ko{color:#b91c1c;font-weight:700}.v377ctl .wa{color:#b45309;font-weight:700}.v377ctl small{font-weight:400;color:#5b606d}
.v377doc{border:1px solid #e3e6ee;border-radius:10px;padding:14px;background:#fff}.v377dochead{display:flex;justify-content:space-between;align-items:flex-start}.v377dochead b{display:block;color:#18244f;font-size:15px}.v377dochead small{color:#5b606d}
.v377send{margin-top:10px;font-size:12px;color:#2e427b;background:#f8f9fc;border:1px dashed #c9d3ee;border-radius:8px;padding:8px 10px}.v377send small{display:block;color:#5b606d;font-weight:700}
.v377bar{position:relative;height:8px;background:#eef0f5;border-radius:5px;overflow:hidden;margin-bottom:3px}.v377bar i{position:absolute;left:0;top:0;bottom:0;background:#9fb1e3}.v377bar em{position:absolute;left:0;top:0;bottom:0;background:#047857}
@media (max-width:900px){.v377orig,.v377grid{grid-template-columns:1fr}}
</style>
