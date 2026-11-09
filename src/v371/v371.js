<script id="v371-lots-prix">
/* =====================================================================================
   Soft e-procurement V371 — DAO › Lots & Prix (interface simplifiée)
   Remplace l'écran V322/V323. Même modèle de données (d.finance) et même API (window.SMLP) :
   portail, réception et évaluation financière ne changent pas.
   Changements d'interface :
   - Ordre logique : 1. Règles générales → 2. Lots (masqué si lot unique) → 3. Prix par lot
   - Récapitulatif permanent (devise, taxes, rabais, lots configurés)
   - 3 structures au lieu de 4 : « Mixte » devient l'option « lignes complémentaires » du bordereau
   - Structure recommandée selon le type de marché
   - Contrôles affichés dans l'étape concernée, compteur par étape
   - Champs sans objet masqués (lot unique : pas de règles d'allotissement ni de rabais global / conditionnel)
   - Aperçu de ce que verra le soumissionnaire
   ===================================================================================== */
(function () {
  "use strict";
  if (typeof DAO_DATA === 'undefined') return;
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v) { var x = Number(String(v == null ? '' : v).replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(x) ? 0 : x; }
  function money(v, dev) { try { return fmtMontantJS(v, dev); } catch (e) { return num(v).toLocaleString('fr-FR') + ' ' + (dev || ''); } }

  var STRUCT = [
    ['bordereau', 'Bordereau de prix', '▦', 'Le DAO fixe les articles, unités et quantités. Le soumissionnaire saisit un prix unitaire par ligne.', 'Fournitures, travaux, quantités connues'],
    ['forfait', 'Prix forfaitaire', '◉', 'Un seul montant global pour l’ensemble de la prestation. Devis détaillé en pièce jointe si demandé.', 'Prestation livrée comme un tout'],
    ['libre', 'Devis libre', '✎', 'Le DAO définit l’objet et ce que le devis doit contenir. Le soumissionnaire construit ses propres lignes.', 'Solution dont le contenu dépend du soumissionnaire']
  ];
  var DEVISES = ['MGA', 'EUR', 'USD'];
  var DOCS = ['Bordereau de prix signé', 'Devis détaillé', 'DQE', 'BPU', 'Détail du forfait', 'Sous-détail de prix', 'Autres justificatifs financiers'];
  var UNITS = ['U', 'Lot', 'Forfait', 'Ensemble', 'Jour', 'Mois', 'Homme-mois', 'm', 'm²', 'm³', 'ml', 'kg', 't', 'km', 'Litre'];
  var RABAIS = [['lot', 'Par lot', 'Un rabais sur le montant d’un lot.'], ['global', 'Global', 'Un rabais sur le total de l’offre.'], ['conditionnel', 'Conditionnel', 'Accordé si le soumissionnaire obtient une combinaison de lots.']];

  function ppmOf(d) { return (typeof PPM_DATA !== 'undefined' ? PPM_DATA : []).find(function (p) { return p.code === d.ppm_code; }) || null; }
  function lotsOf(d) {
    var l = (d.lots && d.lots.length) ? d.lots : [{ numero: 'Lot unique', intitule: d.intitule, montant_estimatif: (ppmOf(d) || {}).montant_estimatif }];
    return l.map(function (x, i) { return { key: x.numero || ('Lot ' + ('0' + (i + 1)).slice(-2)), idx: i, intitule: x.intitule || x.libelle || x.objet || '', montant: num(x.montant_estimatif || x.montant) }; });
  }
  function besoinLot(d, lot, n) { var b = d.besoin; if (!b || !b.lots || !lot) return null; return b.lots.find(function (x) { return x.numero === lot.key; }) || (b.lots.length === n ? b.lots[lot.idx] : null); }
  function isServices(d) { return /servic|prestation|intellect|conseil|formation|consultant/i.test((ppmOf(d) || {}).type_marche || ''); }
  function recommended(d, lot, n) { var bl = besoinLot(d, lot, n); if (bl && bl.nature === 'quantitatif') return 'bordereau'; if ((bl && bl.nature === 'prestation') || isServices(d)) return 'forfait'; return 'bordereau'; }
  function defaultLot(d, lot, n) {
    var bl = besoinLot(d, lot, n), k = lot.idx + 1;
    var c = { structure: 'bordereau', offre_partielle: false, lignes: [], lignes_compl: false, objet: '', instructions: '', elements_obligatoires: '', devis_demande: true };
    if (bl && bl.nature === 'quantitatif' && bl.lignes && bl.lignes.length) c.lignes = bl.lignes.map(function (x, j) { return { ref: k + '.' + (j + 1), designation: x.designation, description: x.description || '', unite: x.unite || 'U', quantite: String(x.quantite || ''), obligatoire: true, spec: '' }; });
    else if ((bl && bl.nature === 'prestation') || isServices(d)) { c.structure = 'forfait'; c.objet = bl ? (bl.prestation && bl.prestation.besoin) || lot.intitule : lot.intitule; }
    return c;
  }
  function ensureFin(d) {
    var lots = lotsOf(d), p = ppmOf(d);
    var F = d.finance = d.finance || { soumission_par_lot: lots.length > 1, max_lots_offre: '', max_lots_attrib: '', devise_mode: 'imposee', devise: (p && DEVISES.indexOf(p.devise) >= 0) ? p.devise : 'MGA', devises: ['MGA'], taxes: 'HT', taxes_incluses: false, rabais: true, rabais_types: ['lot'], estimation_publiee: false, documents: ['Bordereau de prix signé'], instructions: 'Les prix doivent inclure la livraison, l’installation, la configuration et tous les frais nécessaires à l’exécution complète du marché.', lots: {} };
    F.lots = F.lots || {};
    lots.forEach(function (l) { if (!F.lots[l.key]) F.lots[l.key] = defaultLot(d, l, lots.length); });
    return F;
  }
  /* « Mixte » = bordereau + lignes complémentaires (valeur conservée pour le portail et l'évaluation). */
  function baseStruct(s) { return s === 'mixte' ? 'bordereau' : (s || 'bordereau'); }
  function structLabel(c) { var b = baseStruct(c.structure), s = STRUCT.find(function (x) { return x[0] === b; }); return s ? s[1] + (c.structure === 'mixte' ? ' + lignes libres' : '') : '—'; }

  /* ------------------------------ Contrôles (rangés par étape) ------------------------------ */
  function finIssues(d) {
    var F = ensureFin(d), lots = lotsOf(d), e = [], n = lots.length;
    function add(step, msg, lot) { e.push({ step: step, msg: msg, lot: lot || null }); }
    if (F.devise_mode === 'imposee' && !F.devise) add('regles', 'Choisissez la devise de soumission.');
    if (F.devise_mode === 'multiples' && (!F.devises || F.devises.length < 2)) add('regles', 'Plusieurs devises : sélectionnez au moins deux devises.');
    if (F.rabais && (!F.rabais_types || !F.rabais_types.length)) add('regles', 'Rabais autorisé : choisissez au moins un type de rabais.');
    if (F.rabais && F.rabais_types && F.rabais_types.indexOf('conditionnel') >= 0 && n < 2) add('regles', 'Le rabais conditionnel nécessite au moins deux lots.');
    if (n > 1 && F.soumission_par_lot) {
      if (F.max_lots_offre !== '' && (num(F.max_lots_offre) < 1 || num(F.max_lots_offre) > n)) add('lots', 'Maximum de lots par offre : entre 1 et ' + n + '.');
      if (F.max_lots_attrib !== '' && (num(F.max_lots_attrib) < 1 || num(F.max_lots_attrib) > n)) add('lots', 'Maximum de lots attribuables : entre 1 et ' + n + '.');
      if (F.max_lots_offre !== '' && F.max_lots_attrib !== '' && num(F.max_lots_attrib) > num(F.max_lots_offre)) add('lots', 'Les lots attribuables ne peuvent dépasser les lots par offre.');
    }
    lots.forEach(function (l) {
      var c = F.lots[l.key], b = baseStruct(c.structure), pre = (n > 1 ? l.key + ' — ' : '');
      var lines = b === 'bordereau' ? (c.lignes || []) : [];
      if (b === 'bordereau' && !lines.length) add('prix', pre + 'Bordereau de prix : ajoutez au moins une ligne.', l.key);
      if (b === 'forfait' && !String(c.objet || '').trim()) add('prix', pre + 'Prix forfaitaire : décrivez l’objet à chiffrer.', l.key);
      if (b === 'libre') {
        if (!String(c.objet || '').trim()) add('prix', pre + 'Devis libre : décrivez l’objet à chiffrer.', l.key);
        if (!String(c.instructions || '').trim()) add('prix', pre + 'Devis libre : indiquez comment présenter le devis.', l.key);
      }
      var seen = {};
      lines.forEach(function (x, j) {
        var r = String(x.ref || '').trim(), w = pre + 'Ligne ' + (r || j + 1) + ' : ';
        if (!r) add('prix', pre + 'Ligne ' + (j + 1) + ' : référence manquante.', l.key); else if (seen[r]) add('prix', pre + 'Référence « ' + r + ' » en double.', l.key); else seen[r] = 1;
        if (!String(x.designation || '').trim()) add('prix', w + 'désignation manquante.', l.key);
        if (!String(x.unite || '').trim()) add('prix', w + 'unité manquante.', l.key);
        if (!(num(x.quantite) > 0)) add('prix', w + 'quantité supérieure à zéro requise.', l.key);
      });
      if (lines.length) {
        var oblig = lines.filter(function (x) { return x.obligatoire; }).length;
        if (!c.offre_partielle && !oblig) add('prix', pre + 'Aucune ligne obligatoire : cochez les lignes à chiffrer obligatoirement.', l.key);
        if (c.offre_partielle && oblig === lines.length && lines.length > 1) add('prix', pre + 'Chiffrage partiel autorisé mais toutes les lignes sont obligatoires : décochez les lignes facultatives.', l.key);
      }
    });
    return e;
  }
  function finErrors(d) { return finIssues(d).map(function (x) { return x.msg; }); }

  /* ------------------------------ Styles ------------------------------ */
  var st = document.createElement('style');
  st.id = 'v371-lots-prix-css';
  st.textContent = [
    '#lp9{display:flex;flex-direction:column;gap:16px;color:#0b1332;font-size:14px;--n:#2e427b;--n7:#243569;--bd:#e9ebf0;--bd2:#d6d9e0;--mu:#5b606d;--bg:#f5f7f9;--ok:#047857;--okb:#d1fae5;--er:#be123c;--erb:#ffe4e6;--wa:#92400e;--wab:#fffbeb}',
    '#lp9 *{box-sizing:border-box}',
    '.lp-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}.lp-head h2{margin:0;font-size:20px;font-weight:800}.lp-head p{margin:4px 0 0;color:var(--mu);font-size:13px;max-width:640px}',
    '.lp-lock{display:flex;gap:10px;align-items:center;padding:10px 14px;border-radius:10px;background:var(--wab);color:var(--wa);font-size:13px;border:1px solid #fde68a}',
    '.lp-sum{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}@media(max-width:900px){.lp-sum{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.lp-kpi{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:10px 14px;min-width:0}.lp-kpi small{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--mu)}.lp-kpi b{display:block;font-size:15px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lp-kpi span{font-size:12px;color:var(--mu)}',
    '.lp-steps{display:flex;gap:0;background:#fff;border:1px solid var(--bd);border-radius:12px;padding:6px;overflow-x:auto}',
    '.lp-step{flex:1;min-width:170px;display:flex;align-items:center;gap:10px;border:0;background:none;border-radius:9px;padding:9px 12px;font:inherit;text-align:left;cursor:pointer;color:#474c58}',
    '.lp-step .n{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:13px;background:var(--bg);color:var(--mu);flex:none}',
    '.lp-step b{display:block;font-size:14px}.lp-step small{display:block;font-size:12px;color:var(--mu)}',
    '.lp-step.on{background:var(--bg);color:#0b1332}.lp-step.ok .n{background:var(--okb);color:var(--ok)}.lp-step.on .n{background:var(--n);color:#fff}.lp-step.err small{color:var(--er);font-weight:700}',
    '.lp-card{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:18px 20px}.lp-card+.lp-card{margin-top:0}',
    '.lp-card h3{margin:0;font-size:15px;font-weight:800;display:flex;align-items:center;gap:8px}.lp-card h3 i{font-style:normal;width:26px;height:26px;border-radius:8px;background:var(--bg);color:var(--n);display:grid;place-items:center;font-size:13px}',
    '.lp-card p.s{margin:4px 0 14px;color:var(--mu);font-size:12.5px;line-height:1.45}',
    '.lp-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:900px){.lp-cols{grid-template-columns:1fr}}',
    '.lp-row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:12px 0;border-top:1px solid var(--bd)}.lp-row:first-of-type{border-top:0;padding-top:0}.lp-row .t b{display:block;font-size:14px}.lp-row .t small{display:block;color:var(--mu);font-size:12px;margin-top:2px;line-height:1.4}.lp-row .c{flex:none}',
    '@media(max-width:700px){.lp-row{flex-direction:column;align-items:flex-start}}',
    '.lp-f label{display:block;font-size:12px;font-weight:700;color:#474c58;margin-bottom:5px}.lp-f input,.lp-f select,.lp-f textarea{width:100%;border:1px solid var(--bd2);border-radius:8px;padding:8px 10px;font:inherit;font-size:14px;background:#fff}.lp-f textarea{min-height:64px;resize:vertical}.lp-f :disabled{background:var(--bg);color:#353944}.lp-f small{display:block;color:var(--mu);font-size:12px;margin-top:4px;line-height:1.4}.lp-f+.lp-f{margin-top:12px}',
    '.lp-seg{display:inline-flex;background:var(--bg);border-radius:8px;padding:3px;gap:2px;flex-wrap:wrap}.lp-seg button{border:0;background:none;border-radius:6px;padding:6px 12px;font:inherit;font-weight:700;font-size:12.5px;color:#474c58;cursor:pointer}.lp-seg button.on{background:#fff;color:var(--n);box-shadow:0 1px 4px rgba(11,19,50,.12)}.lp-seg button:disabled{cursor:default}',
    '.lp-sw{position:relative;width:42px;height:24px;border-radius:12px;border:0;background:#cfd3db;cursor:pointer;flex:none;transition:background .15s}.lp-sw:after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:left .15s}.lp-sw.on{background:var(--n)}.lp-sw.on:after{left:21px}.lp-sw:disabled{opacity:.55;cursor:default}',
    '.lp-chips{display:flex;flex-wrap:wrap;gap:6px}.lp-chip{border:1px solid var(--bd2);background:#fff;border-radius:999px;padding:5px 12px;font:inherit;font-weight:600;font-size:12.5px;color:#474c58;cursor:pointer}.lp-chip.on{background:var(--n);border-color:var(--n);color:#fff}.lp-chip.on:before{content:"✓ "}.lp-chip:disabled{cursor:default}.lp-chip:disabled:not(.on){opacity:.6}',
    '.lp-chk{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}@media(max-width:900px){.lp-chk{grid-template-columns:1fr}}.lp-chk button{display:flex;gap:8px;align-items:flex-start;text-align:left;border:1.5px solid var(--bd);border-radius:10px;padding:9px 11px;background:#fff;font:inherit;cursor:pointer}.lp-chk button i{font-style:normal;width:18px;height:18px;border-radius:5px;border:1.5px solid var(--bd2);display:grid;place-items:center;font-size:11px;flex:none;margin-top:1px}.lp-chk button.on{border-color:var(--n);background:#f7f9fd}.lp-chk button.on i{background:var(--n);border-color:var(--n);color:#fff}.lp-chk button b{display:block;font-size:13px}.lp-chk button small{display:block;font-size:11.5px;color:var(--mu);margin-top:2px;line-height:1.35}.lp-chk button:disabled{cursor:default;color:inherit}',
    '.lp-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:16px;align-items:start}@media(max-width:1000px){.lp-layout{grid-template-columns:1fr}}',
    '.lp-lotnav{display:flex;flex-direction:column;gap:6px;position:sticky;top:10px}@media(max-width:1000px){.lp-lotnav{flex-direction:row;overflow-x:auto;position:static}}',
    '.lp-lot{border:1.5px solid var(--bd);border-radius:10px;padding:10px 12px;background:#fff;cursor:pointer;text-align:left;font:inherit;min-width:180px}.lp-lot b{display:flex;justify-content:space-between;gap:6px;font-size:13.5px}.lp-lot small{display:block;color:var(--mu);font-size:12px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lp-lot.on{border-color:var(--n);background:#f7f9fd;box-shadow:0 0 0 3px rgba(46,66,123,.08)}',
    '.lp-dot{width:8px;height:8px;border-radius:50%;background:#16a34a;display:inline-block;flex:none;margin-top:5px}.lp-dot.e{background:#e11d48}',
    '.lp-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}@media(max-width:900px){.lp-tiles{grid-template-columns:1fr}}',
    '.lp-tile{position:relative;border:1.5px solid var(--bd);border-radius:12px;padding:12px 14px;background:#fff;cursor:pointer;text-align:left;font:inherit;display:flex;gap:10px}.lp-tile .ic{width:32px;height:32px;border-radius:9px;background:var(--bg);color:var(--n);display:grid;place-items:center;font-size:16px;flex:none}.lp-tile b{display:block;font-size:14px}.lp-tile small{display:block;color:var(--mu);font-size:12px;margin-top:3px;line-height:1.4}.lp-tile em{display:block;font-style:normal;font-size:11.5px;color:#474c58;margin-top:6px}.lp-tile.on{border-color:var(--n);background:#f7f9fd;box-shadow:0 0 0 3px rgba(46,66,123,.1)}.lp-tile.on .ic{background:var(--n);color:#fff}.lp-tile:disabled{cursor:default;color:inherit}.lp-tile:disabled:not(.on){opacity:.5}',
    '.lp-reco{position:absolute;top:-9px;right:10px;background:var(--okb);color:var(--ok);font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:.03em}',
    '.lp-sec{margin-top:18px;padding-top:16px;border-top:1px solid var(--bd)}.lp-sec>h4{margin:0 0 10px;font-size:13px;font-weight:800;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.lp-sec>h4 span{font-weight:600;color:var(--mu);font-size:12px}',
    '.lp-tw{overflow-x:auto;border:1px solid var(--bd);border-radius:10px}',
    '.lp-t{width:100%;border-collapse:collapse;min-width:760px}.lp-t th{background:var(--bg);font-size:11px;text-transform:uppercase;letter-spacing:.03em;color:var(--mu);text-align:left;padding:8px;font-weight:800;white-space:nowrap}.lp-t td{padding:5px 6px;vertical-align:middle;border-top:1px solid var(--bd)}.lp-t input{width:100%;border:1px solid transparent;border-radius:6px;padding:6px 7px;font:inherit;font-size:13.5px;background:transparent}.lp-t input:hover:not(:disabled){border-color:var(--bd2)}.lp-t input:focus{border-color:var(--n);background:#fff;outline:0}.lp-t input[type=checkbox]{width:auto}.lp-t input:disabled{color:#353944}.lp-t td.ro{color:var(--mu);font-size:13px;padding-left:12px}',
    '.lp-empty{text-align:center;padding:26px 16px;border:1.5px dashed var(--bd2);border-radius:10px;color:var(--mu)}.lp-empty b{display:block;color:#0b1332;font-size:14px;margin-bottom:4px}.lp-empty .a{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px}',
    '.lp-btn{border:1px solid var(--bd2);background:#fff;color:var(--n7);border-radius:8px;padding:7px 12px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer;white-space:nowrap}.lp-btn.p{background:var(--n);border-color:var(--n);color:#fff}.lp-btn.s{padding:5px 10px;font-size:12.5px}.lp-btn.l{border-color:transparent;background:none;color:var(--mu)}.lp-btn.l:hover{color:var(--er)}',
    '.lp-note{padding:10px 12px;border-radius:9px;background:var(--bg);color:var(--n);font-size:12.5px;line-height:1.5}.lp-note.w{background:var(--wab);color:var(--wa)}.lp-note.e{background:#fff5f6;color:#9f1239;border:1px solid var(--erb)}.lp-note.e ul{margin:6px 0 0;padding-left:18px}',
    '.lp-prev{border:1px solid var(--bd);border-radius:10px;overflow:hidden}.lp-prev .h{background:#0b1332;color:#fff;font-size:12px;font-weight:700;padding:7px 12px;display:flex;justify-content:space-between}.lp-prev table{width:100%;border-collapse:collapse;font-size:12.5px}.lp-prev th,.lp-prev td{padding:6px 10px;border-top:1px solid var(--bd);text-align:left}.lp-prev th{color:var(--mu);font-size:11px;text-transform:uppercase}.lp-prev td.in{color:#969ba8;font-style:italic}',
    'details.lp-more{margin-top:14px}details.lp-more>summary{cursor:pointer;font-weight:700;font-size:13px;color:var(--n7)}details.lp-more>div{margin-top:10px}',
    '.lp-bar{position:sticky;bottom:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid var(--bd);border-radius:12px;padding:12px 16px;box-shadow:0 -4px 14px rgba(11,19,50,.05)}',
    '.lp-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:12.5px;font-weight:700;background:var(--bg);color:#474c58;border:0;font-family:inherit;cursor:default}.lp-pill.ok{background:var(--okb);color:var(--ok)}.lp-pill.e{background:var(--erb);color:var(--er);cursor:pointer}'
  ].join('');
  document.head.appendChild(st);

  /* ------------------------------ Petits composants ------------------------------ */
  var CUR = { dao: null, lot: null, sub: null };
  function sw(path, val, ed) { return '<button type="button" class="lp-sw' + (val ? ' on' : '') + '" data-set="' + path + '|' + (val ? '0' : '1') + '" role="switch" aria-checked="' + (val ? 'true' : 'false') + '"' + (ed ? '' : ' disabled') + '></button>'; }
  function seg(path, opts, val, ed) { return '<div class="lp-seg">' + opts.map(function (o) { return '<button type="button" data-set="' + path + '|' + o[0] + '" class="' + (String(val) === String(o[0]) ? 'on' : '') + '"' + (ed ? '' : ' disabled') + '>' + o[1] + '</button>'; }).join('') + '</div>'; }
  function row(title, sub, ctrl) { return '<div class="lp-row"><div class="t"><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div><div class="c">' + ctrl + '</div></div>'; }
  function fld(label, html, help) { return '<div class="lp-f"><label>' + label + '</label>' + html + (help ? '<small>' + help + '</small>' : '') + '</div>'; }
  function issuesBox(list) { return list.length ? '<div class="lp-note e"><b>' + list.length + ' point(s) à corriger dans cette étape</b><ul>' + list.map(function (x) { return '<li>' + esc(x.msg) + '</li>'; }).join('') + '</ul></div>' : ''; }

  function stepsOf(lots) { var s = [['regles', 'Règles générales', 'Devise, taxes, rabais, pièces']]; if (lots.length > 1) s.push(['lots', 'Lots', 'Soumission et attribution']); s.push(['prix', lots.length > 1 ? 'Prix par lot' : 'Bordereau / prix', 'Ce que le soumissionnaire chiffre']); return s; }
  function readOnlyReason(d) {
    var s = d.statut || '';
    if (/validation/i.test(s)) return 'DAO en cours de validation : lecture seule. Le validateur doit retourner le dossier pour correction avant toute modification.';
    if (/valid/i.test(s)) return 'DAO validé : la configuration financière est figée et sera transmise au portail à la publication.';
    if (/publi/i.test(s)) return 'DAO publié : toute modification de la configuration financière passe par un additif au DAO.';
    return 'Le DAO n’est pas modifiable dans son statut actuel (' + s + ').';
  }

  /* ------------------------------ Étapes ------------------------------ */
  function viewRegles(d, F, lots, ed, iss) {
    var dis = ed ? '' : ' disabled', multi = lots.length > 1;
    var rab = RABAIS.filter(function (r) { return multi || r[0] === 'lot'; });
    var devHtml = seg('devise_mode', [['imposee', 'Une devise'], ['multiples', 'Plusieurs devises']], F.devise_mode, ed) + '<div style="margin-top:8px">' +
      (F.devise_mode === 'imposee' ? '<select data-g="devise"' + dis + '>' + DEVISES.map(function (x) { return '<option' + (F.devise === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>'
        : '<div class="lp-chips">' + DEVISES.map(function (x) { return '<button type="button" class="lp-chip ' + ((F.devises || []).indexOf(x) >= 0 ? 'on' : '') + '" data-dev="' + x + '"' + dis + '>' + x + '</button>'; }).join('') + '</div>') + '</div>';
    var p = ppmOf(d), devWarn = (p && p.devise && F.devise_mode === 'imposee' && F.devise && p.devise !== F.devise) ? '<div class="lp-note w" style="margin-top:8px">Le PPM est en ' + esc(p.devise) + ' : vérifiez la devise de soumission.</div>' : '';
    var taxHelp = F.taxes === 'TTC' ? 'Les prix saisis incluent toutes les taxes.' : F.taxes === 'HT' ? 'Les prix saisis sont hors taxes ; les taxes sont indiquées à part.' : 'HT ou TTC selon le régime fiscal du soumissionnaire, à justifier.';
    return issuesBox(iss) +
      '<div class="lp-cols">' +
      '<div class="lp-card"><h3><i>¤</i>Monnaie et taxes</h3><p class="s">Dans quelle monnaie et sur quelle base les prix sont saisis.</p>' +
        fld('Devise de soumission', devHtml + devWarn) +
        fld('Présentation des prix', seg('taxes', [['HT', 'Hors taxes (HT)'], ['TTC', 'Toutes taxes (TTC)'], ['Selon régime', 'Selon régime']], F.taxes, ed), taxHelp) +
      '</div>' +
      '<div class="lp-card"><h3><i>%</i>Rabais et transparence</h3><p class="s">Ces choix sont repris automatiquement à l’ouverture et à l’évaluation financière.</p>' +
        row('Rabais autorisés', 'Le soumissionnaire peut proposer une remise sur son offre.', sw('rabais', F.rabais, ed)) +
        (F.rabais ? '<div class="lp-chk" style="grid-template-columns:repeat(' + rab.length + ',minmax(0,1fr));margin:2px 0 12px">' + rab.map(function (r) { var on = (F.rabais_types || []).indexOf(r[0]) >= 0; return '<button type="button" class="' + (on ? 'on' : '') + '" data-rab="' + r[0] + '"' + dis + '><i>' + (on ? '✓' : '') + '</i><span><b>' + r[1] + '</b><small>' + r[2] + '</small></span></button>'; }).join('') + '</div>' : '') +
        row('Publier l’estimation du PPM', 'Montant prévisionnel visible des soumissionnaires. Non recommandé.', sw('estimation_publiee', F.estimation_publiee, ed)) +
      '</div></div>' +
      '<div class="lp-card"><h3><i>⎙</i>Pièces financières à joindre à l’offre</h3><p class="s">Cochez les documents exigés. Le devis détaillé demandé dans un lot s’ajoute automatiquement.</p>' +
        '<div class="lp-chips">' + DOCS.map(function (x) { return '<button type="button" class="lp-chip ' + ((F.documents || []).indexOf(x) >= 0 ? 'on' : '') + '" data-doc="' + esc(x) + '"' + dis + '>' + esc(x) + '</button>'; }).join('') + '</div>' +
        '<div class="lp-f" style="margin-top:16px">' + '<label>Instructions financières générales</label><textarea data-g="instructions"' + dis + ' placeholder="Ex. Les prix incluent la livraison, l’installation et la formation.">' + esc(F.instructions) + '</textarea><small>S’appliquent à tous les lots. Des précisions propres à un lot peuvent être ajoutées à l’étape suivante.</small></div>' +
      '</div>';
  }
  function viewLots(d, F, lots, ed, iss) {
    var dis = ed ? '' : ' disabled';
    return issuesBox(iss) +
      '<div class="lp-card"><h3><i>▤</i>Lots repris du PPM</h3><p class="s">Le découpage en lots vient du PPM et ne se modifie pas ici. Chaque lot reçoit sa propre structure de prix à l’étape suivante.</p>' +
      '<div class="lp-tw"><table class="lp-t" style="min-width:560px"><thead><tr><th>Lot</th><th>Intitulé</th><th style="text-align:right">Estimation PPM (interne)</th><th>Structure de prix</th><th></th></tr></thead><tbody>' +
      lots.map(function (l) { var c = F.lots[l.key]; return '<tr><td class="ro"><b style="color:#0b1332">' + esc(l.key) + '</b></td><td class="ro" style="color:#0b1332">' + esc(l.intitule) + '</td><td class="ro" style="text-align:right">' + esc(money(l.montant, F.devise)) + '</td><td class="ro">' + esc(structLabel(c)) + '</td><td style="text-align:right"><button class="lp-btn s" data-golot="' + esc(l.key) + '">Configurer →</button></td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<div class="lp-card"><h3><i>⇄</i>Soumission et attribution</h3><p class="s">Combien de lots un même soumissionnaire peut viser et remporter.</p>' +
        row('Soumission lot par lot', F.soumission_par_lot ? 'Le soumissionnaire choisit les lots auxquels il répond.' : 'L’offre doit couvrir tous les lots.', sw('soumission_par_lot', F.soumission_par_lot, ed)) +
        (F.soumission_par_lot ? '<div class="lp-cols" style="margin-top:6px">' +
          fld('Maximum de lots par offre', '<input type="number" min="1" max="' + lots.length + '" data-g="max_lots_offre" value="' + esc(F.max_lots_offre) + '" placeholder="Sans limite (' + lots.length + ')"' + dis + '>', 'Vide = sans limite.') +
          fld('Maximum de lots attribuables', '<input type="number" min="1" max="' + lots.length + '" data-g="max_lots_attrib" value="' + esc(F.max_lots_attrib) + '" placeholder="Sans limite"' + dis + '>', 'Peut être inférieur au nombre de lots soumis. Appliqué à l’attribution.') + '</div>' : '') +
      '</div>';
  }
  function linesTable(d, c, ed, L, n) {
    var specs = (d.specs || []).map(function (s, i) { return 'SPEC-' + ('00' + (i + 1)).slice(-3) + ' · ' + (s.article || s.rub || ''); });
    var bl = besoinLot(d, L, n), canImport = ed && bl && (bl.lignes || []).length;
    if (!c.lignes.length) return '<div class="lp-empty"><b>Aucune ligne dans le bordereau</b>Ajoutez les articles que les soumissionnaires devront chiffrer.' +
      (ed ? '<div class="a">' + (canImport ? '<button class="lp-btn p s" data-lnimport>↧ Reprendre les ' + bl.lignes.length + ' article(s) de l’EB</button>' : '') + '<button class="lp-btn s" data-lnadd>＋ Ajouter une ligne</button></div>' : '') + '</div>';
    return '<div class="lp-tw"><table class="lp-t"><thead><tr><th style="width:64px">Réf.</th><th>Désignation *</th><th>Description</th><th style="width:96px">Unité *</th><th style="width:88px">Qté *</th><th style="width:150px">Spécification</th><th style="width:78px;text-align:center" title="Ligne à chiffrer obligatoirement">Obligatoire</th><th style="width:34px"></th></tr></thead><tbody>' +
      c.lignes.map(function (x, j) {
        var a = function (f, t, extra) { return '<input data-ln="' + j + '|' + f + '"' + (t ? ' type="' + t + '"' : '') + ' value="' + esc(x[f]) + '"' + (extra || '') + (ed ? '' : ' disabled') + '>'; };
        return '<tr><td>' + a('ref') + '</td><td>' + a('designation', '', ' placeholder="Ex. Ramette papier A4"') + '</td><td>' + a('description', '', ' placeholder="Facultatif"') + '</td><td>' + a('unite', '', ' list="lpUnits"') + '</td><td>' + a('quantite', 'number', ' min="0" step="any"') + '</td><td>' + a('spec', '', ' list="lpSpecs" placeholder="—"') + '</td><td style="text-align:center"><input type="checkbox" data-ln="' + j + '|obligatoire"' + (x.obligatoire ? ' checked' : '') + (ed ? '' : ' disabled') + '></td><td>' + (ed ? '<button class="lp-btn s l" data-lndel="' + j + '" title="Supprimer la ligne">✕</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<datalist id="lpUnits">' + UNITS.map(function (u) { return '<option value="' + u + '">'; }).join('') + '</datalist><datalist id="lpSpecs">' + specs.map(function (s) { return '<option value="' + esc(s) + '">'; }).join('') + '</datalist>' +
      (ed ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="lp-btn s" data-lnadd>＋ Ajouter une ligne</button>' + (canImport ? '<button class="lp-btn s" data-lnimport>↧ Reprendre le détail de l’EB</button>' : '') + '</div>' : '');
  }
  function preview(c, F) {
    var b = baseStruct(c.structure), cur = F.devise_mode === 'imposee' ? F.devise : (F.devises || []).join(' / '), tx = F.taxes === 'Selon régime' ? 'HT/TTC' : F.taxes;
    var h = '<div class="lp-prev"><div class="h"><span>Aperçu : ce que saisira le soumissionnaire</span><span>' + esc(cur) + ' · ' + esc(tx) + '</span></div><table>';
    if (b === 'bordereau') {
      var ls = (c.lignes || []).slice(0, 3);
      h += '<thead><tr><th>Désignation</th><th>Qté</th><th>Unité</th><th>Prix unitaire</th><th>Montant</th></tr></thead><tbody>' +
        (ls.length ? ls.map(function (x) { return '<tr><td>' + esc(x.designation || '—') + (x.obligatoire ? '' : ' <span style="color:#969ba8">(facultative)</span>') + '</td><td>' + esc(x.quantite) + '</td><td>' + esc(x.unite) + '</td><td class="in">à saisir</td><td class="in">calculé</td></tr>'; }).join('') : '<tr><td colspan="5" class="in">Les lignes du bordereau apparaîtront ici.</td></tr>') +
        ((c.lignes || []).length > 3 ? '<tr><td colspan="5" class="in">… ' + (c.lignes.length - 3) + ' autre(s) ligne(s)</td></tr>' : '') +
        (c.structure === 'mixte' ? '<tr><td colspan="5" class="in">＋ lignes ajoutées par le soumissionnaire (marquées « Complémentaire »)</td></tr>' : '') + '</tbody>';
    } else {
      h += '<thead><tr><th>Objet</th><th>Montant</th><th>Pièce jointe</th></tr></thead><tbody><tr><td>' + esc(c.objet || '—') + '</td><td class="in">' + (b === 'forfait' ? 'montant global à saisir' : 'total de son devis') + '</td><td class="in">' + (b === 'libre' || c.devis_demande ? 'devis détaillé' : '—') + '</td></tr></tbody>';
    }
    return h + '</table></div>';
  }
  function viewPrix(d, F, lots, ed, iss) {
    var dis = ed ? '' : ' disabled', n = lots.length, L = lots.find(function (x) { return x.key === CUR.lot; }), c = F.lots[CUR.lot], b = baseStruct(c.structure), reco = recommended(d, L, n);
    var lotIss = iss.filter(function (x) { return x.lot === CUR.lot; });
    var nav = n > 1 ? '<div class="lp-lotnav">' + lots.map(function (l) { var bad = iss.some(function (x) { return x.lot === l.key; }); return '<button type="button" class="lp-lot ' + (l.key === CUR.lot ? 'on' : '') + '" data-lot="' + esc(l.key) + '"><b><span>' + esc(l.key) + '</span><span class="lp-dot' + (bad ? ' e' : '') + '" title="' + (bad ? 'À corriger' : 'Complet') + '"></span></b><small>' + esc(l.intitule) + '</small><small>' + esc(structLabel(F.lots[l.key])) + '</small></button>'; }).join('') + '</div>' : '';
    var h = '<div class="lp-card"><h3><i>' + esc(n > 1 ? String(L.idx + 1) : '1') + '</i>' + esc(n > 1 ? L.key + ' — ' : '') + esc(L.intitule || 'Lot unique') + '</h3><p class="s">Estimation PPM (interne) : <b>' + esc(money(L.montant, F.devise)) + '</b></p>' +
      issuesBox(lotIss) +
      '<div class="lp-f" style="margin-top:' + (lotIss.length ? '12px' : '0') + '"><label>Comment le soumissionnaire présente-t-il son prix ?</label></div>' +
      '<div class="lp-tiles" style="margin-top:12px">' + STRUCT.map(function (s) { return '<button type="button" class="lp-tile ' + (b === s[0] ? 'on' : '') + '" data-struct="' + s[0] + '"' + dis + '>' + (reco === s[0] ? '<span class="lp-reco">Recommandé</span>' : '') + '<span class="ic">' + s[2] + '</span><span><b>' + s[1] + '</b><small>' + s[3] + '</small><em>Usage : ' + s[4] + '</em></span></button>'; }).join('') + '</div>';
    if (b === 'bordereau') {
      h += '<div class="lp-sec"><h4>Articles du bordereau <span>' + c.lignes.length + ' ligne(s) · ' + c.lignes.filter(function (x) { return x.obligatoire; }).length + ' obligatoire(s)</span></h4>' + linesTable(d, c, ed, L, n) + '</div>';
      h += '<div class="lp-sec"><h4>Options du bordereau</h4>' +
        row('Chiffrage partiel des lignes', c.offre_partielle ? 'Le soumissionnaire peut laisser vides les lignes non obligatoires.' : 'Toutes les lignes obligatoires doivent avoir un prix pour pouvoir soumettre.', sw('lot.offre_partielle', c.offre_partielle, ed)) +
        row('Lignes ajoutées par le soumissionnaire', c.structure === 'mixte' ? 'Il peut proposer des lignes en plus (options, accessoires). Elles sont marquées « Complémentaire ».' : 'Seules les lignes du DAO peuvent être chiffrées.', sw('lot.mixte', c.structure === 'mixte', ed)) + '</div>';
    }
    if (b === 'forfait') h += '<div class="lp-sec"><h4>Objet du forfait</h4>' + fld('Objet / prestation à chiffrer *', '<input data-lt="objet" value="' + esc(c.objet) + '" placeholder="Ex. Installation complète du réseau informatique"' + dis + '>', 'Chiffré comme : Forfait × 1.') + '<div style="margin-top:12px">' + row('Devis détaillé à joindre', 'Le soumissionnaire joint la décomposition de son forfait.', sw('lot.devis_demande', c.devis_demande, ed)) + '</div></div>';
    if (b === 'libre') h += '<div class="lp-sec"><h4>Contenu du devis</h4>' + fld('Objet / prestation à chiffrer *', '<input data-lt="objet" value="' + esc(c.objet) + '" placeholder="Ex. Mise en œuvre de la solution de gestion"' + dis + '>') + '<div class="lp-cols" style="margin-top:12px">' + fld('Comment présenter le devis *', '<textarea data-lt="instructions" placeholder="Ex. Détailler séparément licences, mise en œuvre, formation et assistance."' + dis + '>' + esc(c.instructions) + '</textarea>') + fld('Éléments que le devis doit contenir', '<textarea data-lt="elements_obligatoires" placeholder="Un élément par ligne, ex. :\nLicences\nFormation\nMaintenance 1 an"' + dis + '>' + esc(c.elements_obligatoires) + '</textarea>', 'Facultatif. Un élément par ligne.') + '</div></div>';
    if (b !== 'libre') h += '<details class="lp-more"' + (c.instructions ? ' open' : '') + '><summary>Instructions propres à ce lot (facultatif)</summary><div class="lp-f"><textarea data-lt="instructions" placeholder="Ex. Les prix incluent la livraison au siège du projet."' + dis + '>' + esc(c.instructions) + '</textarea></div></details>';
    h += '<div class="lp-sec"><h4>Aperçu</h4>' + preview(c, F) + '</div>';
    if (n > 1 && ed) h += '<div style="margin-top:14px;display:flex;justify-content:flex-end"><button class="lp-btn s" data-copyall>Appliquer cette structure aux ' + (n - 1) + ' autre(s) lot(s)</button></div>';
    h += '</div>';
    return n > 1 ? '<div class="lp-layout">' + nav + '<div>' + h + '</div></div>' : h;
  }

  /* ------------------------------ Rendu ------------------------------ */
  function render() {
    var d = daoFind(CUR.dao); if (!d) return;
    var panel = document.getElementById('daof-panel-5'); if (!panel) return;
    var legacy = document.getElementById('v17-lots'); if (legacy) legacy.style.display = 'none';
    [].forEach.call(panel.children, function (x) { if (x.id !== 'lp9') x.style.display = 'none'; });
    var box = document.getElementById('lp9'); if (!box) { box = document.createElement('div'); box.id = 'lp9'; panel.insertBefore(box, panel.firstChild); }
    var F = ensureFin(d), lots = lotsOf(d), ed = typeof daoIsEditable === 'function' ? daoIsEditable(d) : true;
    var STEPS = stepsOf(lots);
    if (!CUR.lot || !F.lots[CUR.lot]) CUR.lot = lots[0].key;
    if (!CUR.sub || !STEPS.some(function (s) { return s[0] === CUR.sub; })) CUR.sub = ed ? 'regles' : 'prix';
    var iss = finIssues(d), byStep = function (k) { return iss.filter(function (x) { return x.step === k; }); };
    var done = lots.filter(function (l) { return !iss.some(function (x) { return x.lot === l.key; }); }).length;
    var curTxt = F.devise_mode === 'imposee' ? (F.devise || '—') : (F.devises || []).join(' / ') || '—';
    var rabTxt = F.rabais ? (F.rabais_types || []).map(function (t) { return (RABAIS.find(function (r) { return r[0] === t; }) || ['', t])[1].toLowerCase(); }).join(', ') : 'non';

    var head = '<div class="lp-head"><div><h2>Lots &amp; Prix</h2><p>Définissez comment les soumissionnaires présenteront leurs prix. Le besoin vient de l’EB ; les prix viendront des offres.</p></div></div>' +
      (ed ? '' : '<div class="lp-lock">🔒 <span>' + esc(readOnlyReason(d)) + '</span></div>') +
      '<div class="lp-sum">' +
        '<div class="lp-kpi"><small>Devise · prix</small><b>' + esc(curTxt) + ' · ' + esc(F.taxes) + '</b></div>' +
        '<div class="lp-kpi"><small>Rabais</small><b>' + esc(rabTxt.charAt(0).toUpperCase() + rabTxt.slice(1)) + '</b></div>' +
        '<div class="lp-kpi"><small>' + (lots.length > 1 ? 'Lots' : 'Structure de prix') + '</small><b>' + (lots.length > 1 ? done + ' / ' + lots.length + ' configuré(s)' : esc(structLabel(F.lots[lots[0].key]))) + '</b></div>' +
        '<div class="lp-kpi"><small>Estimation PPM (interne)</small><b>' + esc(money(lots.reduce(function (a, l) { return a + l.montant; }, 0), F.devise)) + '</b><span>' + (F.estimation_publiee ? 'publiée' : 'non publiée') + '</span></div>' +
      '</div>' +
      '<div class="lp-steps">' + STEPS.map(function (s, i) { var k = byStep(s[0]).length, on = CUR.sub === s[0]; return '<button type="button" class="lp-step' + (on ? ' on' : '') + (k ? ' err' : ' ok') + '" data-sub="' + s[0] + '"><span class="n">' + (k || on ? (i + 1) : '✓') + '</span><span><b>' + s[1] + '</b><small>' + (k ? k + ' point(s) à corriger' : s[2]) + '</small></span></button>'; }).join('') + '</div>';

    var body = CUR.sub === 'regles' ? viewRegles(d, F, lots, ed, byStep('regles')) : CUR.sub === 'lots' ? viewLots(d, F, lots, ed, byStep('lots')) : viewPrix(d, F, lots, ed, byStep('prix'));
    var si = STEPS.findIndex(function (s) { return s[0] === CUR.sub; });
    var bar = '<div class="lp-bar"><div>' + (iss.length ? '<button type="button" class="lp-pill e" data-firsterr>● ' + iss.length + ' point(s) à corriger — voir</button>' : '<span class="lp-pill ok">✓ Configuration complète</span>') + '</div><div style="display:flex;gap:8px;flex-wrap:wrap">' +
      (si > 0 ? '<button class="lp-btn" data-step="-1">← ' + esc(STEPS[si - 1][1]) + '</button>' : '') + (ed ? '<button class="lp-btn" data-save>Enregistrer</button>' : '') + (si < STEPS.length - 1 ? '<button class="lp-btn p" data-step="1">' + esc(STEPS[si + 1][1]) + ' →</button>' : '') + '</div></div>';
    box.innerHTML = head + body + bar;
    bind(box, d, ed, STEPS, iss);
  }
  function bind(box, d, ed, STEPS, iss) {
    var F = d.finance, c = F.lots[CUR.lot];
    var re = function () {
      var a = document.activeElement, key = null, pos = null;
      if (a && box.contains(a)) { ['ln', 'lt', 'g'].some(function (k) { if (a.dataset && a.dataset[k] != null) { key = '[data-' + k + '="' + a.dataset[k] + '"]'; return true; } }); try { pos = [a.selectionStart, a.selectionEnd]; if (pos[0] == null) pos = null; } catch (e) { pos = null; } }
      var y = window.scrollY; render(); window.scrollTo(0, y);
      if (key) { var n = document.querySelector('#lp9 ' + key); if (n) { n.focus(); try { if (pos) n.setSelectionRange(pos[0], pos[1]); else if (n.select) n.select(); } catch (e) { try { n.select(); } catch (e2) {} } } }
    };
    var later = function () { setTimeout(re, 0); };
    box.querySelectorAll('[data-lot]').forEach(function (b) { b.onclick = function () { CUR.lot = b.dataset.lot; re(); }; });
    box.querySelectorAll('[data-sub]').forEach(function (b) { b.onclick = function () { CUR.sub = b.dataset.sub; re(); }; });
    box.querySelectorAll('[data-golot]').forEach(function (b) { b.onclick = function () { CUR.lot = b.dataset.golot; CUR.sub = 'prix'; re(); }; });
    box.querySelectorAll('[data-step]').forEach(function (b) { b.onclick = function () { var i = STEPS.findIndex(function (x) { return x[0] === CUR.sub; }) + +b.dataset.step; CUR.sub = STEPS[Math.max(0, Math.min(STEPS.length - 1, i))][0]; re(); try { box.scrollIntoView({ block: 'start' }); } catch (e) {} }; });
    var fe = box.querySelector('[data-firsterr]'); if (fe) fe.onclick = function () { var x = iss[0]; CUR.sub = STEPS.some(function (s) { return s[0] === x.step; }) ? x.step : 'prix'; if (x.lot) CUR.lot = x.lot; re(); };
    var sv = box.querySelector('[data-save]'); if (sv) sv.onclick = function () { d.historique = d.historique || []; d.historique.push({ utilisateur: (typeof CURRENT_USER_NAME !== 'undefined' ? CURRENT_USER_NAME : 'Utilisateur'), date: (typeof nowStr === 'function' ? nowStr() : new Date().toLocaleString('fr-FR')), action: 'Lots & Prix enregistrés', commentaire: '' }); try { toast('Lots & Prix enregistrés.'); } catch (e) {} re(); };
    if (!ed) return;
    box.querySelectorAll('[data-set]').forEach(function (b) {
      b.onclick = function () {
        var p = b.dataset.set.split('|'), k = p[0], v = p[1], bool = v === '1' ? true : v === '0' ? false : v;
        if (k === 'lot.mixte') { c.structure = bool ? 'mixte' : 'bordereau'; c.lignes_compl = !!bool; }
        else if (k.indexOf('lot.') === 0) c[k.slice(4)] = bool;
        else { F[k] = bool; if (k === 'taxes') F.taxes_incluses = (v === 'TTC'); }
        re();
      };
    });
    box.querySelectorAll('[data-g]').forEach(function (el) { el.onchange = function () { F[el.dataset.g] = el.value; later(); }; });
    box.querySelectorAll('[data-lt]').forEach(function (el) { el.oninput = function () { c[el.dataset.lt] = el.value; }; el.onchange = later; });
    box.querySelectorAll('[data-struct]').forEach(function (b) { b.onclick = function () { var s = b.dataset.struct; if (baseStruct(c.structure) === s) return; c.structure = s; c.lignes_compl = false; if ((s === 'forfait' || s === 'libre') && !c.objet) { var l = lotsOf(d).find(function (x) { return x.key === CUR.lot; }); c.objet = l ? l.intitule : ''; } re(); }; });
    box.querySelectorAll('[data-dev]').forEach(function (b) { b.onclick = function () { var a = F.devises = F.devises || [], i = a.indexOf(b.dataset.dev); if (i >= 0) a.splice(i, 1); else a.push(b.dataset.dev); re(); }; });
    box.querySelectorAll('[data-rab]').forEach(function (b) { b.onclick = function () { var a = F.rabais_types = F.rabais_types || [], i = a.indexOf(b.dataset.rab); if (i >= 0) a.splice(i, 1); else a.push(b.dataset.rab); re(); }; });
    box.querySelectorAll('[data-doc]').forEach(function (b) { b.onclick = function () { var a = F.documents = F.documents || [], i = a.indexOf(b.dataset.doc); if (i >= 0) a.splice(i, 1); else a.push(b.dataset.doc); re(); }; });
    box.querySelectorAll('[data-ln]').forEach(function (el) { var p = el.dataset.ln.split('|'); el.oninput = function () { c.lignes[+p[0]][p[1]] = el.type === 'checkbox' ? el.checked : el.value; }; el.onchange = function () { el.oninput(); later(); }; });
    box.querySelectorAll('[data-lndel]').forEach(function (b) { b.onclick = function () { c.lignes.splice(+b.dataset.lndel, 1); re(); }; });
    box.querySelectorAll('[data-lnadd]').forEach(function (la) { la.onclick = function () { var k = lotsOf(d).find(function (x) { return x.key === CUR.lot; }).idx + 1; c.lignes.push({ ref: k + '.' + (c.lignes.length + 1), designation: '', description: '', unite: 'U', quantite: '1', obligatoire: true, spec: '' }); re(); var ins = box.querySelectorAll('[data-ln$="|designation"]'); if (ins.length) ins[ins.length - 1].focus(); }; });
    box.querySelectorAll('[data-lnimport]').forEach(function (li) { li.onclick = function () { var l = lotsOf(d).find(function (x) { return x.key === CUR.lot; }), n = lotsOf(d).length; var def = defaultLot(d, l, n); if (c.lignes.length && !confirm('Remplacer les ' + c.lignes.length + ' ligne(s) actuelle(s) par le détail de l’EB ?')) return; c.lignes = def.lignes; re(); }; });
    var ca = box.querySelector('[data-copyall]'); if (ca) ca.onclick = function () { Object.keys(F.lots).forEach(function (k) { if (k === CUR.lot) return; var o = F.lots[k]; o.structure = c.structure; o.offre_partielle = c.offre_partielle; o.lignes_compl = c.lignes_compl; o.instructions = c.instructions; o.devis_demande = c.devis_demande; if ((o.structure === 'forfait' || o.structure === 'libre') && !o.objet) { var l = lotsOf(d).find(function (x) { return x.key === k; }); o.objet = l ? l.intitule : ''; } }); try { toast('Structure appliquée aux autres lots.'); } catch (e) {} re(); };
  }

  /* ------------------------------ Branchements ------------------------------ */
  function show() { try { if (typeof DAOF_CURRENT_CODE === 'undefined' || !DAOF_CURRENT_CODE) return; var p = document.getElementById('daof-panel-5'); if (!p || !p.classList.contains('active') && p.offsetParent === null) return; if (CUR.dao !== DAOF_CURRENT_CODE) { CUR.dao = DAOF_CURRENT_CODE; CUR.lot = null; CUR.sub = null; } render(); } catch (e) { if (window.console) console.error('[V371 Lots & Prix]', e); } }
  ['daoGoTab', 'daoOpenDetail'].forEach(function (fn) { var o = window[fn]; if (typeof o === 'function') window[fn] = function () { var r = o.apply(this, arguments); setTimeout(show, 60); setTimeout(show, 400); return r; }; });
  var prevComp = window.daoCompleteness;
  if (typeof prevComp === 'function') window.daoCompleteness = function (d) {
    var r = prevComp.apply(this, arguments);
    try { if (r && Array.isArray(r.errors)) finErrors(d).forEach(function (e) { r.errors.push('Lots & Prix — ' + e); }); } catch (e) {}
    return r;
  };
  var prevCreate = window.daoCreateRecordFromPpm;
  if (typeof prevCreate === 'function') window.daoCreateRecordFromPpm = function () { var d = prevCreate.apply(this, arguments); try { if (d) ensureFin(d); } catch (e) {} return d; };
  window.SMLP = { ensure: ensureFin, errors: finErrors, issues: finIssues, lots: lotsOf, render: function (code) { CUR.dao = code; CUR.lot = null; CUR.sub = null; render(); } };
})();
</script>
