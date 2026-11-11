<script id="v376-softsign-liste">
/* V376 — Signature électronique / SoftSign : liste des contrats d'abord.
   Statuts : À préparer → Prêt à envoyer → En attente de signature → Signé (ou Refusé / Expiré).
   Garantie bloquante non validée → « Bloqué — garantie ». Données de démonstration dans localStorage sm376_sign. */
(function () {
  "use strict";
  var KEY = 'sm376_sign';
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { return new Date().toLocaleDateString('fr-FR'); }
  function now() { return new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); }
  function plus(d) { var x = new Date(); x.setDate(x.getDate() + d); return x.toLocaleDateString('fr-FR'); }
  function sig(tit, rep) { return [{ nom: 'RAKOTO Jean', qualite: 'PRMP — Autorité signataire', org: 'Autorité contractante', statut: 'À venir', date: '' }, { nom: rep, qualite: 'Représentant légal', org: tit, statut: 'À venir', date: '' }]; }
  function seed() {
    var L = [
      { no: 'CTR-2027-004', objet: 'Fournitures de bureau', tit: 'SOFTWELL', rep: 'RANDRIA Hery', montant: '18 400 000 MGA', visa: '05/11/2026', version: 'V2', garantie: 'Validée', statut: 'À préparer', zones: false },
      { no: 'CTR-2027-005', objet: 'Réhabilitation de bâtiments', tit: 'BATIR SARL', rep: 'RAZAFY Paul', montant: '245 000 000 MGA', visa: '06/11/2026', version: 'V1', garantie: 'À fournir', statut: 'À préparer', zones: false },
      { no: 'CTR-2027-006', objet: 'Formation des agents', tit: 'MADATECH', rep: 'RABE Lova', montant: '32 500 000 MGA', visa: '04/11/2026', version: 'V3', garantie: 'Validée', statut: 'Prêt à envoyer', zones: true },
      { no: 'CTR-2027-002', objet: 'Maintenance du parc informatique', tit: 'INFOSERV', rep: 'RAVELO Mamy', montant: '54 000 000 MGA', visa: '30/10/2026', version: 'V2', garantie: 'Validée', statut: 'En attente de signature', zones: true, envoye: '07/11/2026', limite: '14/11/2026', etape: 1 },
      { no: 'CTR-2027-003', objet: 'Fourniture de mobilier', tit: 'MOBILIA', rep: 'RASOA Fara', montant: '27 800 000 MGA', visa: '28/10/2026', version: 'V1', garantie: 'Validée', statut: 'Refusé', zones: true, envoye: '29/10/2026', motif: 'Le montant en lettres ne correspond pas au montant en chiffres (article 4).', refusPar: 'RASOA Fara (titulaire)' },
      { no: 'CTR-2027-001', objet: 'Équipements informatiques', tit: 'Société ABC', rep: 'RAKOTOBE Aina', montant: '125 000 000 MGA', visa: '12/11/2026', version: 'V4', garantie: 'Validée', statut: 'Signé', zones: true, envoye: '14/11/2026', signe: '18/11/2026' }
    ];
    L.forEach(function (c) {
      c.signataires = sig(c.tit, c.rep); c.hist = [{ d: c.visa, a: 'Visa accordé — contrat ' + c.version + ' prêt pour la signature' }];
      if (c.zones) c.hist.push({ d: c.visa, a: 'Zones de signature configurées (2 signataires)' });
      if (c.envoye) c.hist.push({ d: c.envoye, a: 'Envoyé à SoftSign' });
      if (c.statut === 'En attente de signature') { c.signataires[0].statut = 'Signé'; c.signataires[0].date = '08/11/2026'; c.signataires[1].statut = 'En attente'; c.hist.push({ d: '08/11/2026', a: 'Signé par RAKOTO Jean (PRMP)' }); }
      if (c.statut === 'Refusé') { c.signataires[0].statut = 'Signé'; c.signataires[0].date = '29/10/2026'; c.signataires[1].statut = 'Refusé'; c.signataires[1].date = '30/10/2026'; c.hist.push({ d: '30/10/2026', a: 'Refus de signature : ' + c.motif }); }
      if (c.statut === 'Signé') { c.signataires.forEach(function (s, i) { s.statut = 'Signé'; s.date = i ? '18/11/2026' : '15/11/2026'; }); c.hist.push({ d: '18/11/2026', a: 'Signature terminée — contrat signé généré et transmis aux Contrats signés' }); }
    });
    return L;
  }
  var L;
  try { L = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!Array.isArray(L)) L = seed();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) {} }
  var OPEN = null, FILTRE = '', Q = '';

  function bloque(c) { return c.garantie !== 'Validée' && c.statut !== 'Signé'; }
  function statutAff(c) { return bloque(c) && /préparer|Prêt/.test(c.statut) ? 'Bloqué — garantie' : c.statut; }
  var ORDRE = { 'Bloqué — garantie': 0, 'À préparer': 1, 'Prêt à envoyer': 2, 'En attente de signature': 3, 'Refusé': 4, 'Expiré': 4, 'Signé': 5 };
  function pill(s) {
    var cl = { 'Signé': 'g', 'En attente de signature': 'b', 'Prêt à envoyer': 'v', 'À préparer': 'a', 'Bloqué — garantie': 'r', 'Refusé': 'r', 'Expiré': 'r' }[s] || 'a';
    return '<span class="v376p ' + cl + '">' + esc(s) + '</span>';
  }
  function nbSig(c) { return c.signataires.filter(function (s) { return s.statut === 'Signé'; }).length + '/' + c.signataires.length; }
  function actions(c) {
    var s = statutAff(c), b = function (act, lab, p) { return '<button class="v134-btn' + (p ? ' primary' : '') + '" data-v376="' + act + '" data-no="' + esc(c.no) + '">' + lab + '</button>'; };
    var cs = b('consulter', 'Consulter');
    if (s === 'Bloqué — garantie') return b('garantie', 'Voir la garantie', true) + cs;
    if (s === 'À préparer' || s === 'Prêt à envoyer') return b('zones', 'Configurer les zones', true) + cs;
    if (s === 'En attente de signature') return b('suivre', 'Suivre', true) + cs;
    if (s === 'Refusé' || s === 'Expiré') return b('motif', 'Voir le motif', true) + cs;
    if (s === 'Signé') return b('telecharger', 'Télécharger', true) + cs;
    return cs;
  }
  function etapes(c) {
    var s = c.statut, n = c.signataires;
    var st = [
      ['Contrat validé', 'Visa du ' + c.visa, 'done'],
      ['Zones configurées', c.zones ? 'Fait' : 'À faire', c.zones ? 'done' : (bloque(c) ? '' : 'now')],
      ['Envoyé à SoftSign', c.envoye ? 'Le ' + c.envoye : 'À venir', c.envoye ? 'done' : (c.zones && !bloque(c) ? 'now' : '')],
      ['Signataire 1', n[0].statut === 'Signé' ? 'Signé le ' + n[0].date : (s === 'En attente de signature' ? 'En attente' : 'À venir'), n[0].statut === 'Signé' ? 'done' : (s === 'En attente de signature' ? 'now' : '')],
      ['Signataire 2', n[1].statut === 'Signé' ? 'Signé le ' + n[1].date : n[1].statut === 'Refusé' ? 'Refusé le ' + n[1].date : (n[1].statut === 'En attente' ? 'En attente' : 'À venir'), n[1].statut === 'Signé' ? 'done' : n[1].statut === 'Refusé' ? 'ko' : (n[1].statut === 'En attente' ? 'now' : '')],
      ['Contrat signé', s === 'Signé' ? 'Le ' + c.signe : 'À venir', s === 'Signé' ? 'done' : '']
    ];
    return '<div class="v376steps">' + st.map(function (x, i) { return '<div class="' + x[2] + '"><b>' + (x[2] === 'done' ? '✓ ' : x[2] === 'ko' ? '✕ ' : '') + (i + 1) + '. ' + esc(x[0]) + '</b><small>' + esc(x[1]) + '</small></div>'; }).join('') + '</div>';
  }
  function detail(c) {
    var alerte = bloque(c) ? '<div class="v376alert r"><b>Signature bloquée.</b> La garantie de bonne exécution est « ' + esc(c.garantie) + ' » alors qu’elle est bloquante avant signature. Le contrat ne pourra être envoyé à SoftSign qu’après validation de la garantie.</div>' :
      c.statut === 'Refusé' ? '<div class="v376alert r"><b>Refus de signature</b> par ' + esc(c.refusPar) + ' : ' + esc(c.motif) + '</div>' :
      c.statut === 'En attente de signature' ? '<div class="v376alert b">Envoyé le ' + esc(c.envoye) + ' · date limite de signature : <b>' + esc(c.limite) + '</b>. En attente de : <b>' + esc((c.signataires.find(function (s) { return s.statut === 'En attente'; }) || {}).nom || '—') + '</b>.</div>' :
      c.statut === 'Signé' ? '<div class="v376alert g">Contrat signé le ' + esc(c.signe) + '. Le document signé <b>Contrat_' + esc(c.no) + '_SIGNE.pdf</b> et le certificat SoftSign ont été générés automatiquement et transmis aux <b>Contrats signés</b>.</div>' : '';
    return '<tr class="v376det"><td colspan="9"><div class="v376detin">' + alerte + etapes(c) +
      '<div class="v376cols"><div><h4>Signataires</h4><table class="v134-table"><thead><tr><th>Ordre</th><th>Signataire</th><th>Qualité</th><th>Organisation</th><th>Mode</th><th>Statut</th><th>Date</th></tr></thead><tbody>' +
      c.signataires.map(function (s, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(s.nom) + '</td><td>' + esc(s.qualite) + '</td><td>' + esc(s.org) + '</td><td>Électronique</td><td>' + pill(s.statut === 'En attente' ? 'En attente de signature' : s.statut === 'À venir' ? 'À préparer' : s.statut).replace('À préparer', 'À venir') + '</td><td>' + esc(s.date || '—') + '</td></tr>'; }).join('') +
      '</tbody></table></div><div><h4>Historique</h4><ul class="v376hist">' + c.hist.slice().reverse().map(function (h) { return '<li><small>' + esc(h.d) + '</small>' + esc(h.a) + '</li>'; }).join('') + '</ul></div></div>' +
      (c.statut === 'En attente de signature' ? '<div class="v376demo"><button class="v134-btn" data-v376="relancer" data-no="' + esc(c.no) + '">Relancer le signataire</button><button class="v134-btn" data-v376="annuler" data-no="' + esc(c.no) + '">Annuler l’envoi</button><span style="margin-left:auto">Démonstration</span><button class="v134-btn" data-v376="simuler" data-no="' + esc(c.no) + '">Simuler la signature suivante</button></div>' : '') +
      (c.statut === 'Refusé' || c.statut === 'Expiré' ? '<div class="v376demo"><button class="v134-btn primary" data-v376="renvoyer" data-no="' + esc(c.no) + '">Corriger et renvoyer</button></div>' : '') +
      (c.statut === 'Signé' ? '<div class="v376demo"><button class="v134-btn" data-v376="registre" data-no="' + esc(c.no) + '">Voir dans Contrats signés</button></div>' : '') +
      '</div></td></tr>';
  }
  function realRows() {
    var S = window.SM310; if (!S || typeof S.all !== 'function') return [];
    var a = {}; try { a = S.all() || {}; } catch (e) { return []; }
    return Object.keys(a).map(function (k) { return a[k]; }).filter(function (dz) { return dz && dz.contract && /Visé|En signature|Signé/.test(dz.contract.status); }).map(function (dz) {
      var c = dz.contract, s = c.signatures || {}, st = c.status === 'Signé' ? 'Signé' : c.status === 'En signature' ? 'En attente de signature' : 'Prêt à envoyer';
      return { real: dz.code, no: c.no, objet: dz.title || dz.dao || '', tit: (c.holder || {}).name || '', montant: (c.amount || '') + ' ' + (c.currency || ''), visa: '—', statut: st, nb: ((s.ac ? 1 : 0) + (s.tit ? 1 : 0)) + '/2' };
    });
  }
  function kpis(all) {
    var cnt = function (f) { return all.filter(f).length; };
    return '<div class="v134-kpis" id="v376kpis">' +
      '<div class="v134-kpi"><b>' + cnt(function (c) { return /préparer|Prêt|Bloqué/.test(c.s); }) + '</b><span>À préparer / envoyer</span></div>' +
      '<div class="v134-kpi"><b>' + cnt(function (c) { return c.s === 'En attente de signature'; }) + '</b><span>En attente de signature</span></div>' +
      '<div class="v134-kpi"><b>' + cnt(function (c) { return c.s === 'Signé'; }) + '</b><span>Signés</span></div>' +
      '<div class="v134-kpi"><b>' + cnt(function (c) { return /Refusé|Expiré|Bloqué/.test(c.s); }) + '</b><span>Bloqués / refus / expiration</span></div></div>';
  }
  function render() {
    var pg = document.getElementById('v134-sign'); if (!pg) return;
    pg.classList.add('v376on');
    var rr = realRows(), all = L.map(function (c) { return { c: c, s: statutAff(c) }; }).concat(rr.map(function (r) { return { c: r, s: r.statut, real: 1 }; }));
    all.sort(function (a, b) { return (ORDRE[a.s] - ORDRE[b.s]) || a.c.no.localeCompare(b.c.no); });
    var k = pg.querySelector('.v134-kpis:not(#v376kpis)'); if (k) k.style.display = 'none';
    var old = document.getElementById('v376kpis'); if (old) old.remove();
    var box = document.getElementById('v376-card');
    if (!box) { box = document.createElement('div'); box.id = 'v376-card'; box.className = 'v134-card'; var hero = pg.querySelector('.v134-hero'); hero.insertAdjacentElement('afterend', box); }
    box.insertAdjacentHTML('beforebegin', kpis(all));
    var st = pg.querySelector('.v134-hero .v134-status'), att = all.filter(function (x) { return /préparer|Prêt|Bloqué/.test(x.s); }).length;
    if (st) st.textContent = '● ' + att + ' contrat' + (att > 1 ? 's' : '') + ' à préparer ou envoyer';
    var vis = all.filter(function (x) { return (!FILTRE || x.s === FILTRE || (FILTRE === 'Refusé' && /Refusé|Expiré/.test(x.s))) && (!Q || (x.c.no + ' ' + x.c.objet + ' ' + x.c.tit).toLowerCase().indexOf(Q.toLowerCase()) >= 0); });
    box.innerHTML = '<div class="v134-cardhead"><div><h2>Contrats à signer</h2><span style="font-size:12px;color:#5b606d">Contrats ayant reçu le visa, du plus urgent au plus avancé. Cliquez sur une ligne pour voir le circuit de signature.</span></div>' +
      '<div class="v134-toolbar"><input class="v134-input" id="v376q" placeholder="Rechercher un contrat, un titulaire…" value="' + esc(Q) + '"><select class="v134-select" id="v376f"><option value="">Tous les statuts</option>' +
      ['Bloqué — garantie', 'À préparer', 'Prêt à envoyer', 'En attente de signature', 'Refusé', 'Signé'].map(function (s) { return '<option' + (s === FILTRE ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div></div>' +
      '<div style="overflow-x:auto"><table class="v134-table v376t"><thead><tr><th></th><th>Contrat</th><th>Objet</th><th>Titulaire</th><th>Montant</th><th>Visa</th><th>Signatures</th><th>Statut</th><th>Action</th></tr></thead><tbody>' +
      (vis.map(function (x) {
        var c = x.c, o = OPEN === c.no && !x.real;
        var act = x.real ? '<button class="v134-btn primary" onclick="event.stopPropagation();SM310.openContract(\'' + esc(c.real) + '\',6)">' + (x.s === 'Signé' ? 'Consulter' : 'Ouvrir la signature') + '</button>' : actions(c);
        return '<tr class="v376row' + (o ? ' open' : '') + '" data-row="' + esc(c.no) + '"' + (x.real ? ' data-real="1"' : '') + '><td class="v376chev">' + (x.real ? '' : (o ? '▾' : '▸')) + '</td><td><strong>' + esc(c.no) + '</strong>' + (x.real ? '<span class="s353-tag r">Réel</span>' : '<br><small>' + esc(c.version) + '</small>') + '</td><td>' + esc(c.objet) + '</td><td>' + esc(c.tit) + '</td><td style="white-space:nowrap">' + esc(c.montant) + '</td><td>' + esc(c.visa) + '</td><td>' + esc(x.real ? c.nb : nbSig(c)) + '</td><td>' + pill(x.s) + '</td><td><div class="v376act">' + act + '</div></td></tr>' + (o ? detail(c) : '');
      }).join('') || '<tr><td colspan="9" style="text-align:center;color:#969ba8;padding:18px">Aucun contrat pour ce filtre.</td></tr>') + '</tbody></table></div>';
    var q = document.getElementById('v376q'); q.oninput = function () { Q = q.value; render(); var n = document.getElementById('v376q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    document.getElementById('v376f').onchange = function () { FILTRE = this.value; render(); };
  }
  function find(no) { return L.find(function (c) { return c.no === no; }); }
  function toast(t) { var d = document.createElement('div'); d.className = 'v376toast'; d.innerHTML = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4200); }
  function modal(title, sub, body, okLab, onOk, ok2Lab, onOk2, closeLab) {
    var m = document.createElement('div'); m.className = 'v376m';
    m.innerHTML = '<div class="v376dlg"><div class="v376mh"><div><b>' + title + '</b><small>' + sub + '</small></div><button class="v134-btn" data-x>✕</button></div><div class="v376mb">' + body + '</div><div class="v376mf"><button class="v134-btn" data-x>' + (closeLab || 'Annuler') + '</button>' + (ok2Lab ? '<button class="v134-btn" data-ok2>' + ok2Lab + '</button>' : '') + (okLab ? '<button class="v134-btn primary" data-ok>' + okLab + '</button>' : '') + '</div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-x]')) m.remove(); if (e.target.closest('[data-ok]')) { if (onOk(m) !== false) m.remove(); } if (e.target.closest('[data-ok2]')) { if (onOk2(m) !== false) m.remove(); } });
    return m;
  }
  function zones(c) {
    var pos = ['Bas de page — gauche', 'Bas de page — droite', 'Milieu de page'];
    var row = function (s, i) { return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(s.nom) + '</b><br><small>' + esc(s.qualite) + '</small></td><td><select class="v134-select" data-pg><option>Dernière page (p. 12)</option><option>Page 11</option></select></td><td><select class="v134-select" data-pos>' + pos.map(function (p, j) { return '<option' + (j === i ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></td><td><label><input type="checkbox" checked> Paraphe</label></td></tr>'; };
    modal('Configurer les zones de signature', esc(c.no) + ' · Contrat_' + esc(c.no) + '_' + esc(c.version) + '.pdf',
      '<div class="v376zg"><div class="v376page"><div class="v376lines"></div><div class="v376zone z0">1 · ' + esc(c.signataires[0].nom) + '<br><small>Autorité contractante</small></div><div class="v376zone z1">2 · ' + esc(c.signataires[1].nom) + '<br><small>' + esc(c.tit) + '</small></div><span class="v376pn">Page 12 / 12</span></div>' +
      '<div><p style="margin:0 0 8px;font-size:12.5px;color:#5b606d">Placez la zone de chaque signataire. L’ordre de signature suit l’ordre du tableau. Le paraphe est apposé sur chaque page.</p><table class="v134-table"><thead><tr><th>Ordre</th><th>Signataire</th><th>Page</th><th>Position</th><th></th></tr></thead><tbody>' + c.signataires.map(row).join('') + '</tbody></table>' +
      '<div class="v376send"><div class="v134-field"><label>Date limite de signature</label><input class="v134-input" id="v376lim" value="' + plus(7) + '"></div><div class="v134-field"><label>Message aux signataires</label><input class="v134-input" value="Merci de bien vouloir signer électroniquement le contrat ' + esc(c.no) + '."></div></div>' +
      '<p style="margin:8px 0 0;font-size:12px;color:#5b606d">« Enregistrer les zones » garde le contrat au statut « Prêt à envoyer ». « Envoyer à SoftSign » enregistre les zones et lance le circuit de signature.</p></div></div>',
      'Envoyer à SoftSign', function (m) { if (!c.zones) c.hist.push({ d: now(), a: 'Zones de signature configurées (2 signataires)' }); c.zones = true; c.statut = 'En attente de signature'; c.envoye = today(); c.limite = m.querySelector('#v376lim').value; c.signataires[0].statut = 'En attente'; c.hist.push({ d: now(), a: 'Envoyé à SoftSign — date limite ' + c.limite }); save(); OPEN = c.no; render(); toast('Envoyé à SoftSign. Statut : <b>En attente de signature</b>. ' + esc(c.signataires[0].nom) + ' a été notifié.'); },
      'Enregistrer les zones', function () { c.zones = true; if (c.statut === 'À préparer') c.statut = 'Prêt à envoyer'; c.hist.push({ d: now(), a: 'Zones de signature configurées (2 signataires)' }); save(); OPEN = c.no; render(); toast('Zones enregistrées : <b>' + esc(c.no) + '</b> est prêt à envoyer.'); });
  }
  function consulter(c) {
    var info = function (l, v) { return '<div><small>' + l + '</small><b>' + v + '</b></div>'; };
    modal('Contrat ' + esc(c.no), esc(c.objet) + ' · ' + esc(c.tit),
      '<div class="v376zg"><div class="v376page v376doc"><b>CONTRAT N° ' + esc(c.no) + '</b><small>' + esc(c.objet) + '</small><div class="v376lines" style="top:70px;height:170px"></div><span class="v376pn">Page 1 / 12</span></div>' +
      '<div><div class="v376sum" style="grid-template-columns:1fr 1fr">' + info('Titulaire', esc(c.tit)) + info('Montant', esc(c.montant)) + info('Version', esc(c.version) + ' · visa du ' + esc(c.visa)) + info('Statut de signature', pill(statutAff(c))) +
      info('Garantie de bonne exécution', c.garantie === 'Validée' ? '<span style="color:#047857">✓ Validée</span>' : '<span style="color:#b91c1c">' + esc(c.garantie) + ' — bloquante</span>') + info('Signatures', nbSig(c)) + '</div>' +
      '<h4 style="margin:14px 0 6px;font-size:13px;color:#18244f">Documents</h4><div class="v376docs"><div>📄 Contrat_' + esc(c.no) + '_' + esc(c.version) + '.pdf <small>version visée</small></div>' + (c.statut === 'Signé' ? '<div>✅ Contrat_' + esc(c.no) + '_SIGNE.pdf <small>signé le ' + esc(c.signe) + '</small></div><div>🔒 Certificat_SoftSign_' + esc(c.no) + '.pdf <small>preuve de signature</small></div>' : '') + '<div>📎 Annexes (CCAP, CCTP, bordereau des prix)</div></div></div></div>',
      c.statut === 'Signé' ? 'Télécharger le contrat signé' : 'Télécharger le PDF', function () { toast('Téléchargement : <b>Contrat_' + esc(c.no) + (c.statut === 'Signé' ? '_SIGNE' : '_' + esc(c.version)) + '.pdf</b> (démonstration).'); return false; }, null, null, 'Fermer');
  }
  function envoyer(c) {
    modal('Envoyer à SoftSign', esc(c.no) + ' · ' + esc(c.tit),
      '<div class="v376sum"><div><small>Document</small><b>Contrat_' + esc(c.no) + '_' + esc(c.version) + '.pdf</b></div><div><small>Garantie bloquante</small><b style="color:#047857">✓ Validée</b></div><div><small>Ordre de signature</small><b>1. ' + esc(c.signataires[0].nom) + ' → 2. ' + esc(c.signataires[1].nom) + '</b></div></div>' +
      '<div class="v134-field" style="margin-top:12px"><label>Date limite de signature</label><input class="v134-input" id="v376lim" value="' + plus(7) + '"></div><div class="v134-field"><label>Message aux signataires</label><textarea class="v134-input" rows="2" style="width:100%">Merci de bien vouloir signer électroniquement le contrat ' + esc(c.no) + '.</textarea></div>',
      'Envoyer à SoftSign', function (m) { c.statut = 'En attente de signature'; c.envoye = today(); c.limite = m.querySelector('#v376lim').value; c.signataires[0].statut = 'En attente'; c.hist.push({ d: now(), a: 'Envoyé à SoftSign — date limite ' + c.limite }); save(); OPEN = c.no; render(); toast('Envoyé à SoftSign. Statut : <b>En attente de signature</b>. ' + esc(c.signataires[0].nom) + ' a été notifié.'); });
  }
  function simuler(c) {
    var i = c.signataires.findIndex(function (s) { return s.statut === 'En attente'; }); if (i < 0) return;
    var s = c.signataires[i]; s.statut = 'Signé'; s.date = today(); c.hist.push({ d: now(), a: 'Signé par ' + s.nom });
    if (c.signataires[i + 1]) { c.signataires[i + 1].statut = 'En attente'; toast('Signé par <b>' + esc(s.nom) + '</b>. ' + esc(c.signataires[i + 1].nom) + ' est notifié.'); }
    else { c.statut = 'Signé'; c.signe = today(); c.hist.push({ d: now(), a: 'Signature terminée — contrat signé généré et transmis aux Contrats signés' }); addRegistre(c); toast('Signature terminée. <b>Contrat_' + esc(c.no) + '_SIGNE.pdf</b> a été généré et ajouté aux Contrats signés.'); }
    save(); OPEN = c.no; render();
  }
  function addRegistre(c) {
    var tb = document.querySelector('#v134-signed table tbody'); if (!tb || tb.querySelector('[data-v376s="' + c.no + '"]')) return;
    var tr = document.createElement('tr'); tr.setAttribute('data-v376s', c.no);
    tr.innerHTML = '<td><strong>' + esc(c.no) + '</strong></td><td>' + esc(c.objet) + '</td><td>' + esc(c.tit) + '</td><td>' + esc(c.montant) + '</td><td>' + esc(c.signe) + '</td><td>—</td><td><span class="v134-pill green">Signé</span></td><td><button class="v134-btn">Consulter</button></td>';
    tb.insertBefore(tr, tb.firstChild);
  }
  function guarRow() {
    var tb = document.querySelector('#v134-guarantees .v134-card:not(#s353-guar) table tbody'); if (!tb || tb.querySelector('[data-v376g]')) return;
    var c = find('CTR-2027-005'); if (!c) return;
    var tr = document.createElement('tr'); tr.setAttribute('data-v376g', '1');
    tr.innerHTML = '<td><strong>Bonne exécution</strong> · CTR-2027-005<br><small style="color:#b91c1c">Bloquante avant signature</small></td><td>12 250 000 MGA</td><td>—</td><td>—</td><td>—</td><td>À contrôler</td><td><span class="v134-pill amber">' + esc(c.garantie) + '</span></td><td><button class="v134-btn primary" data-v134-add-guarantee>Traiter</button></td>';
    tb.appendChild(tr);
  }
  function go(id) { var l = document.querySelector('[data-goto="' + id + '"]'); if (l && typeof selectLeaf === 'function') selectLeaf(l); if (id === 'v134-guarantees') setTimeout(guarRow, 300); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-v376]');
    if (b) {
      e.stopPropagation(); var c = find(b.dataset.no); if (!c) return; var a = b.dataset.v376;
      if (a === 'zones') zones(c);
      else if (a === 'consulter') consulter(c);
      else if (a === 'envoyer') envoyer(c);
      else if (a === 'garantie') { go('v134-guarantees'); toast('Garantie de <b>' + esc(c.no) + '</b> à fournir et valider avant la signature.'); }
      else if (a === 'suivre') { OPEN = OPEN === c.no ? null : c.no; render(); }
      else if (a === 'relancer') { var w = c.signataires.find(function (s) { return s.statut === 'En attente'; }); c.hist.push({ d: now(), a: 'Relance envoyée à ' + (w ? w.nom : '') }); save(); render(); toast('Relance envoyée à <b>' + esc(w ? w.nom : '') + '</b>.'); }
      else if (a === 'annuler') modal('Annuler l’envoi', esc(c.no), '<div class="v134-field"><label>Motif de l’annulation *</label><textarea class="v134-input" id="v376mo" rows="3" style="width:100%"></textarea></div>', 'Confirmer l’annulation', function (m) { var mo = m.querySelector('#v376mo').value.trim(); if (!mo) { m.querySelector('#v376mo').style.borderColor = '#b91c1c'; return false; } c.statut = 'Prêt à envoyer'; c.envoye = ''; c.signataires.forEach(function (s) { s.statut = 'À venir'; s.date = ''; }); c.hist.push({ d: now(), a: 'Envoi annulé : ' + mo }); save(); render(); toast('Envoi annulé. Le contrat est revenu à « Prêt à envoyer ».'); });
      else if (a === 'motif') { OPEN = c.no; render(); }
      else if (a === 'renvoyer') modal('Renvoyer à la signature', esc(c.no), '<p style="font-size:13px;color:#2e427b;margin:0">Le refus porte sur : <i>' + esc(c.motif) + '</i></p><p style="font-size:12.5px;color:#5b606d">Le contrat corrigé repasse en <b>Validation / Visa</b> (nouvelle version), puis revient ici au statut « À préparer ».</p>', 'Créer la version corrigée', function () { var v = 'V' + ((parseInt(String(c.version).slice(1), 10) || 1) + 1); c.version = v; c.statut = 'À préparer'; c.zones = false; c.envoye = ''; c.signataires.forEach(function (s) { s.statut = 'À venir'; s.date = ''; }); c.hist.push({ d: now(), a: 'Version ' + v + ' créée après refus — à configurer et renvoyer' }); save(); OPEN = c.no; render(); toast('Version <b>' + v + '</b> créée. Configurez les zones puis renvoyez.'); });
      else if (a === 'telecharger') toast('Téléchargement : <b>Contrat_' + esc(c.no) + '_SIGNE.pdf</b> + certificat SoftSign (démonstration).');
      else if (a === 'registre') go('v134-signed');
      else if (a === 'simuler') simuler(c);
      return;
    }
    var r = e.target.closest && e.target.closest('#v376-card .v376row');
    if (r && !r.dataset.real && !e.target.closest('button')) { OPEN = OPEN === r.dataset.row ? null : r.dataset.row; render(); }
    if (e.target.closest && e.target.closest('[data-goto="v134-guarantees"]')) setTimeout(guarRow, 300);
    if (e.target.closest && e.target.closest('[data-goto="v134-sign"], [data-goto="v134-signed"]')) setTimeout(function () { render(); L.filter(function (c) { return c.statut === 'Signé' && c.no !== 'CTR-2027-001'; }).forEach(addRegistre); }, 260);
  }, true);
  window.SM376 = { render: render, data: function () { return L; }, reset: function () { L = seed(); save(); render(); } };
  setTimeout(function () { try { render(); L.filter(function (c) { return c.statut === 'Signé' && c.no !== 'CTR-2027-001'; }).forEach(addRegistre); } catch (e) { console.error('V376', e); } }, 900);
})();
</script>
<style id="v376-css">
#v134-sign.v376on > .v134-card:not(#v376-card){display:none!important}
.v376t tbody tr.v376row{cursor:pointer}.v376t tbody tr.v376row:hover td{background:#f8f9fc}.v376t tr.open td{background:#f3f5fb}
.v376chev{width:18px;color:#5b606d}
.v376act{display:flex;gap:6px;flex-wrap:wrap}
.v376p{display:inline-block;border-radius:6px;padding:5px 9px;font-size:11.5px;font-weight:800;white-space:nowrap}
.v376p.g{background:#d1fae5;color:#047857}.v376p.b{background:#e0e7ff;color:#2e427b}.v376p.v{background:#ede9fe;color:#5b21b6}.v376p.a{background:#fef3c7;color:#b45309}.v376p.r{background:#fee2e2;color:#b91c1c}
.v376det td{padding:0!important;border-top:0!important}.v376detin{background:#f8f9fc;border-left:3px solid #2e427b;padding:14px 16px 16px}
.v376steps{display:grid;grid-template-columns:repeat(6,1fr);gap:0;border:1px solid #e3e6ee;border-radius:10px;overflow:hidden;margin:10px 0 14px;background:#fff}
.v376steps div{padding:10px 12px;border-right:1px solid #e3e6ee}.v376steps div:last-child{border-right:0}.v376steps b{display:block;font-size:12.5px;color:#2e427b}.v376steps small{font-size:11.5px;color:#5b606d}
.v376steps .done{background:#ecfdf5}.v376steps .done b{color:#047857}.v376steps .now{background:#eef2ff}.v376steps .ko{background:#fef2f2}.v376steps .ko b{color:#b91c1c}
.v376cols{display:grid;grid-template-columns:1.6fr 1fr;gap:16px}.v376cols h4{margin:0 0 6px;font-size:13px;color:#18244f}
.v376hist{list-style:none;margin:0;padding:0;font-size:12px;color:#2e427b}.v376hist li{padding:6px 0;border-bottom:1px dashed #e3e6ee}.v376hist small{display:block;color:#969ba8;font-size:11px}
.v376alert{border-radius:8px;padding:9px 12px;font-size:12.5px}.v376alert.r{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}.v376alert.b{background:#eef2ff;color:#2e427b;border:1px solid #c7d2fe}.v376alert.g{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
.v376demo{margin-top:12px;display:flex;align-items:center;gap:8px}.v376demo span{font-size:11px;font-weight:800;color:#b45309;background:#fef3c7;border-radius:5px;padding:3px 7px}
.v376m{position:fixed;inset:0;background:rgba(24,36,79,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
.v376dlg{background:#fff;border-radius:14px;width:min(980px,100%);max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.25)}
.v376mh{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 20px;border-bottom:1px solid #e9ebf0}.v376mh b{display:block;color:#18244f;font-size:16px}.v376mh small{color:#5b606d;font-size:12px}
.v376mb{padding:16px 20px;overflow:auto}.v376mf{display:flex;justify-content:flex-end;gap:8px;padding:12px 20px;border-top:1px solid #e9ebf0}
.v376send{display:grid;grid-template-columns:180px 1fr;gap:10px;margin-top:12px}.v376doc{padding:16px;text-align:center}.v376doc b{display:block;color:#18244f;font-size:12px}.v376doc small{font-size:10.5px;color:#5b606d}.v376docs div{padding:7px 0;border-bottom:1px dashed #e3e6ee;font-size:12.5px;color:#2e427b}.v376docs small{color:#969ba8;margin-left:6px}
.v376zg{display:grid;grid-template-columns:200px minmax(0,1fr);gap:16px}.v376dlg .v134-select{width:100%;min-width:0;padding:7px 8px}.v376dlg .v134-table td,.v376dlg .v134-table th{padding:9px 8px}.v376t td:nth-child(2) strong{white-space:nowrap}
.v376page{position:relative;height:300px;border:1px solid #d6d9e0;border-radius:6px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.v376lines{position:absolute;left:18px;right:18px;top:20px;height:150px;background:repeating-linear-gradient(#fff 0 9px,#e9ebf0 9px 11px)}
.v376zone{position:absolute;bottom:30px;width:42%;border:2px dashed;border-radius:6px;padding:6px;font-size:10.5px;font-weight:800;line-height:1.25}.v376zone small{font-weight:400}
.v376zone.z0{left:8px;border-color:#2e427b;color:#2e427b;background:#eef2ff}.v376zone.z1{right:8px;border-color:#047857;color:#047857;background:#ecfdf5}
.v376pn{position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:10px;color:#969ba8}
.v376sum{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:10px}.v376sum div{background:#f8f9fc;border:1px solid #e9ebf0;border-radius:8px;padding:9px 11px}.v376sum small{display:block;color:#5b606d;font-size:11.5px}.v376sum b{font-size:12.5px;color:#18244f}
.v376toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;z-index:10000;background:#18244f;color:#fff;border-radius:10px;padding:12px 16px;font-size:13px;max-width:420px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
@media (max-width:900px){.v376steps{grid-template-columns:repeat(3,1fr)}.v376cols,.v376zg,.v376sum{grid-template-columns:1fr}}
</style>
