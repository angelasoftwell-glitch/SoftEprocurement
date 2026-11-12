<script id="v377-bons-de-commande">
/* V382 — Contractualisation › Bons de commande (achats hors contrats, hors PPM).
   - Saisie en 2 étapes (Informations, Articles). Fournisseur, financement, catégorie financière et activité viennent des référentiels de Procurement.
   - À l'enregistrement, le BC passe automatiquement « En attente de validation » : il est envoyé dans Validation › À traiter selon le workflow
     (Paramétrage › Workflows, type « Bons de commande ») choisi dans Paramétrage › Bons de commande.
   - Validé : édition du BC selon le modèle paramétré, génération vers Softaccounting, puis réception. Annulation avec motif à tout moment avant réception.
   - Numérotation : bouton « Numérotation » du menu Bons de commande (même principe que le PPM).
   - Suivi financier : données lues dans Softaccounting. Seuil global du BC et anti-fractionnement (cumul par fournisseur et catégorie). */
(function () {
  "use strict";
  var KEY = 'sm383_bc', PKEY = 'sm383_bcparam', NKEY = 'sm382_bcnum', DEV = 'EUR', TVA = 20, WFTYPE = 'Bons de commande';
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(v) { var x = Number(String(v == null ? '' : v).replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(x) ? 0 : x; }
  var DEVB = null, DEVISES = [{ v: 'MGA', l: 'MGA — Ariary malgache' }, { v: 'EUR', l: 'EUR — Euro' }, { v: 'USD', l: 'USD — Dollar américain' }, { v: 'XOF', l: 'XOF — Franc CFA' }];
  var RATE = { EUR: 1, USD: 0.92, MGA: 0.0002, XOF: 0.001524 }; /* taux indicatifs (démonstration) */
  function m(v, d) { return Math.round(n(v)).toLocaleString('fr-FR') + ' ' + (d || DEVB || P.devise || DEV); }
  function cv(v, from) { var a = RATE[from || P.devise] || 1, b = RATE[P.devise] || 1; return n(v) * a / b; }
  function withDev(b, fn) { var o = DEVB; DEVB = b.devise || P.devise; try { return fn(); } finally { DEVB = o; } }
  function today() { return new Date().toLocaleDateString('fr-FR'); }
  function now() { return new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); }
  function rd(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function G(name) { try { return window[name] !== undefined ? window[name] : eval(name); } catch (e) { return undefined; } }

  /* ---------- Référentiels de Procurement (avec repli si absents) ---------- */
  var FREF = { 'PAPETERIE CENTRALE': { nif: '4001234567', st: 'Actif' }, 'SOFTWELL': { nif: '4002345678', st: 'Actif' }, 'FROID SERVICE': { nif: '4003456789', st: 'Actif' }, 'MADATECH': { nif: '4004567890', st: 'Actif' }, 'GARAGE DU SUD': { nif: '4005678901', st: 'Actif' }, 'INFOSERV': { nif: '4006789012', st: 'Actif' }, 'BTP RAPIDE': { nif: '4007890123', st: 'Exclu' } };
  var FOURN = Object.keys(FREF);
  function FINS() { var d = G('FIN_DATA'); d = Array.isArray(d) ? d : [{ code: 'FIN-IDA001', libelle: 'Don IDA-001', statut: 'Actif' }, { code: 'FIN-CTRP', libelle: 'Contrepartie nationale', statut: 'Actif' }]; return d.filter(function (x) { return x.statut === 'Actif'; }); }
  function CATS(fin) { var d = G('CATF_DATA'); d = Array.isArray(d) ? d : [{ code: 'CAT-02', libelle: 'Biens', financement: 'FIN-IDA001', statut: 'Actif', montant_alloue: 1500000 }, { code: 'CAT-03', libelle: 'Services', financement: 'FIN-IDA001', statut: 'Actif', montant_alloue: 1000000 }, { code: 'CAT-05', libelle: 'Fonctionnement', financement: 'FIN-CTRP', statut: 'Actif', montant_alloue: 500000 }]; return d.filter(function (x) { return x.statut === 'Actif' && (!fin || x.financement === fin); }); }
  function ACTS() {
    var pa = G('PA_DATA'), p = Array.isArray(pa) ? (pa.filter(function (x) { return x.defaut; })[0] || pa[0]) : null;
    var t = p && p.tree ? p.tree.filter(function (x) { return x.statut === 'Actif'; }) : [{ code: '1', libelle: 'Infrastructure', niveau: 1 }, { code: '1.2', libelle: 'Équipements publics', niveau: 2 }, { code: '2', libelle: 'Renforcement des capacités', niveau: 1 }];
    return t.map(function (x) { return { code: x.code, libelle: x.libelle, niveau: x.niveau || 1 }; });
  }
  function finLib(c) { var x = FINS().concat(G('FIN_DATA') || []).filter(function (f) { return f.code === c; })[0]; return x ? x.code + ' — ' + x.libelle : (c || '—'); }
  function catOf(c) { var d = G('CATF_DATA'); d = Array.isArray(d) ? d : CATS(); return d.filter(function (x) { return x.code === c; })[0] || null; }
  function catLib(c) { var x = catOf(c); return x ? x.code + ' — ' + x.libelle : (c || '—'); }
  function actLib(c) { var x = ACTS().filter(function (a) { return a.code === c; })[0]; return x ? x.code + ' — ' + x.libelle : (c || '—'); }
  function MODELES() { var d = G('MDL_DATA'); return (Array.isArray(d) ? d : MDL_BC).filter(function (x) { return x.type_doc === 'DOC-BC' && x.statut === 'Actif'; }); }
  var MDL_BC = [
    { code: 'MOD-BC-01', libelle: 'Bon de commande standard', type_doc: 'DOC-BC', version: 'V1', format: 'PDF', type_marche: 'Tous', mode_passation: 'Tous', defaut: true, statut: 'Actif', description: 'Logo de l’entité, articles, échéances, signatures.' },
    { code: 'MOD-BC-02', libelle: 'Bon de commande bailleur', type_doc: 'DOC-BC', version: 'V1', format: 'PDF', type_marche: 'Tous', mode_passation: 'Tous', defaut: false, statut: 'Actif', description: 'Ajoute les mentions du financement et de la catégorie.' }
  ];
  var TRIGGERS = ['Notification du BC', 'Réception totale', 'Réception partielle', 'Dépôt de la facture', 'Date fixe'];

  /* ---------- Workflows « Bons de commande » ---------- */
  function etape(lib, o, v, h, com) { return { libelle: lib, ordre: o, mode: 'Séquentiel', validateurs: [v], duree_h: h, regle_plusieurs: 'Une validation suffit', commentaire: com || 'Facultatif', retourner: true, rejeter: true, checklist: [] }; }
  var WF_BC = [
    { code: 'WF-BC-01', libelle: 'Validation BC standard', type_validation: WFTYPE, description: 'Contrôle de l’acheteur, visa budgétaire, approbation de l’ordonnateur.', statut: 'Actif', version: 1, site: 'Unité de Coordination du Projet', apres_correction: 'Reprendre à l’étape ayant demandé la correction',
      etapes: [etape('Contrôle de l’acheteur', 1, { type: 'Habilitation', ref: 'Chargé de la passation des marchés' }, 24), etape('Visa budgétaire', 2, { type: 'Habilitation', ref: 'Contrôleur financier' }, 24, 'Obligatoire'), etape('Approbation de l’ordonnateur', 3, { type: 'Personne', ref: 'Super Administrateur' }, 8)], utilise_par: 6, historique_versions: [{ version: 1, date: '12/11/2026', note: 'Création du workflow.' }] },
    { code: 'WF-BC-02', libelle: 'Validation BC simplifiée', type_validation: WFTYPE, description: 'Visa budgétaire puis approbation.', statut: 'Actif', version: 1, site: 'Unité de Coordination du Projet', apres_correction: 'Reprendre au début du circuit',
      etapes: [etape('Visa budgétaire', 1, { type: 'Habilitation', ref: 'Contrôleur financier' }, 24, 'Obligatoire'), etape('Approbation de l’ordonnateur', 2, { type: 'Personne', ref: 'Super Administrateur' }, 8)], utilise_par: 0, historique_versions: [{ version: 1, date: '12/11/2026', note: 'Création du workflow.' }] }
  ];
  function wfAll() { var d = G('WF_DATA'); d = Array.isArray(d) ? d : WF_BC; return d.filter(function (w) { return w.type_validation === WFTYPE; }); }
  function wfActifs() { return wfAll().filter(function (w) { return w.statut === 'Actif'; }); }
  function wfCur() { var a = wfActifs(); return a.filter(function (w) { return w.code === P.wf; })[0] || a[0] || WF_BC[0]; }

  /* ---------- Paramétrage de l'entité ---------- */
  function pdef() { return { seuil: 20000, devise: 'EUR', depasse: 'bloquer', wf: 'WF-BC-01' }; }
  var P = rd(PKEY, null); if (!P || P.seuil == null) P = pdef(); if (!P.devise) P.devise = 'EUR'; if (!P.depasse) P.depasse = 'bloquer';
  function psave() { wr(PKEY, P); }
  /* Numérotation (même principe que le PPM) */
  var NUM = rd(NKEY, null) || { mode: 'Automatique', prefixe: 'BC', separateur: '-', avec_exercice: true, longueur_compteur: 3, compteur_depart: 1, reinitialisation: 'Annuelle' };
  function nsave() { wr(NKEY, NUM); }
  function genNo(cfg, ex, sauf) {
    cfg = cfg || NUM; ex = String(ex || new Date().getFullYear());
    if (cfg.mode !== 'Automatique') return '';
    var sep = cfg.separateur || '-', pre = [cfg.prefixe || 'BC'].concat(cfg.avec_exercice ? [ex] : []).join(sep) + sep;
    var mx = (L || []).reduce(function (a, b) { if (b.no === sauf || String(b.no).indexOf(pre) !== 0) return a; if (cfg.reinitialisation === 'Annuelle' && !cfg.avec_exercice && String(b.date).slice(-4) !== ex) return a; var k = parseInt(String(b.no).slice(pre.length), 10); return k > a ? k : a; }, (cfg.compteur_depart || 1) - 1);
    var s = String(mx + 1); while (s.length < (cfg.longueur_compteur || 3)) s = '0' + s;
    return pre + s;
  }

  /* ---------- Données ---------- */
  var ST = ['En attente de validation', 'À corriger', 'Rejeté', 'Validé', 'Réceptionné partiellement', 'Réceptionné', 'Annulé', 'Transmis au PPM'];
  function ech1() { return [{ lib: 'Paiement unique', pct: 100, trig: 'Réception totale', delai: 30 }]; }
  function bc(no, date, objet, f, cat, act, items, statut, extra) {
    var o = { no: no, date: date, objet: objet, fournisseur: f, fin: (catOf(cat) || {}).financement || 'FIN-IDA001', cat: cat, act: act, delai: '15 jours', lieu: 'Siège du projet — Antananarivo', echeances: ech1(), items: items, statut: statut, recu: 0, compta: [], hist: [{ d: date, a: 'Saisie du BC — en attente de validation (workflow WF-BC-01)' }], editions: 0 };
    Object.assign(o, extra || {});
    var gen = statut === 'Généré' || ['Réceptionné partiellement', 'Réceptionné'].indexOf(statut) >= 0; if (statut === 'Généré') { statut = 'Validé'; o.statut = 'Validé'; }
    if (statut !== 'En attente de validation' && statut !== 'Annulé') o.hist.push({ d: date, a: 'Workflow WF-BC-01 terminé — BC validé' });
    if (gen) { o.hist.push({ d: date, a: 'BC édité (MOD-BC-01) et généré vers Softaccounting' }); o.compta.push({ d: date, a: 'BC généré — engagement ENG-' + no.slice(3) + ' créé dans Softaccounting', t: 'eng' }); o.editions = 1; }
    if (statut === 'Réceptionné') { o.recu = 100; o.hist.push({ d: date, a: 'Réception totale' }); }
    if (statut === 'Réceptionné partiellement') { o.recu = 50; o.hist.push({ d: date, a: 'Réception partielle (50 %)' }); }
    return o;
  }
  function seed() {
    var a = ACTS(), A1 = (a.filter(function (x) { return x.code === '1.2'; })[0] || a[0] || {}).code, A2 = (a[0] || {}).code;
    var r = [
      bc('BC-2026-001', '12/10/2026', 'Fournitures de bureau — octobre', 'PAPETERIE CENTRALE', 'CAT-02', A1, [{ d: 'Ramettes papier A4 (carton de 5)', q: 60, pu: 35 }, { d: 'Classeurs à levier', q: 120, pu: 4.5 }], 'Réceptionné'),
      bc('BC-2026-002', '20/10/2026', 'Cartouches de toner', 'SOFTWELL', 'CAT-02', A1, [{ d: 'Cartouches de toner', q: 25, pu: 124 }], 'Réceptionné'),
      bc('BC-2026-003', '28/10/2026', 'Réparation des climatiseurs de la salle serveur', 'FROID SERVICE', 'CAT-03', A2, [{ d: 'Réparation de 3 climatiseurs (pièces et main-d’œuvre)', q: 1, pu: 1450 }], 'Généré', { echeances: [{ lib: 'Avance', pct: 30, trig: 'Notification du BC', delai: 10 }, { lib: 'Solde', pct: 70, trig: 'Réception totale', delai: 30 }] }),
      bc('BC-2026-004', '04/11/2026', 'Agendas et carnets 2027', 'PAPETERIE CENTRALE', 'CAT-02', A1, [{ d: 'Agendas et carnets', q: 80, pu: 15 }], 'Validé'),
      bc('BC-2026-005', '09/11/2026', 'Onduleurs pour les postes de travail', 'MADATECH', 'CAT-02', A1, [{ d: 'Onduleurs 1 000 VA', q: 4, pu: 380 }], 'En attente de validation'),
      bc('BC-2026-006', '10/11/2026', 'Papeterie pour la formation régionale', 'PAPETERIE CENTRALE', 'CAT-02', A2, [{ d: 'Kits de formation (bloc-notes, stylos, chemises)', q: 145, pu: 115 }], 'En attente de validation'),
      bc('BC-2026-007', '11/11/2026', 'Entretien du véhicule 4x4', 'GARAGE DU SUD', 'CAT-03', A2, [{ d: 'Vidange, filtres et révision', q: 1, pu: 640 }], 'Annulé', { annul: { d: '11/11/2026', motif: 'Entretien pris en charge par la garantie du constructeur.' } })
    ];
    r[0].compta.push({ d: '05/11/2026', a: 'Facture FA-0412 comptabilisée', t: 'fac' }, { d: '08/11/2026', a: 'Paiement effectué (virement 2026-118)', t: 'pay' });
    r[1].compta.push({ d: '09/11/2026', a: 'Facture FA-0457 comptabilisée', t: 'fac' });
    r[6].hist.push({ d: '11/11/2026', a: 'BC annulé : Entretien pris en charge par la garantie du constructeur.' });
    return r;
  }
  var L = null;
  function load() { L = rd(KEY, null); if (!Array.isArray(L)) { L = seed(); save(); } L.forEach(function (b) { if (b.statut === 'Généré') b.statut = 'Validé'; if (!b.devise) b.devise = 'EUR'; }); }
  function save() { wr(KEY, L); }
  function find(no) { return L.filter(function (b) { return b.no === no; })[0]; }
  function ht(b) { return (b.items || []).reduce(function (a, i) { return a + n(i.q) * n(i.pu); }, 0); }
  function ttc(b) { return ht(b) * (1 + TVA / 100); }
  function actif(b) { return b.statut !== 'Annulé' && b.statut !== 'Rejeté' && b.statut !== 'Transmis au PPM'; }
  function genere(b) { return (b.compta || []).some(function (x) { return x.t === 'eng'; }) && b.statut !== 'Annulé'; }
  function annee(b) { return String(b.date).slice(-4); }

  /* ---------- Contrôles ---------- */
  function cumul(b) {
    var y = String(new Date().getFullYear()), byCat = P.base !== 'fournisseur';
    return L.filter(function (x) { return x.no !== b.no && actif(x) && x.fournisseur === b.fournisseur && (!byCat || x.cat === b.cat) && (P.periode !== 'Année civile' || annee(x) === y); }).reduce(function (a, x) { return a + ht(x); }, 0) + ht(b);
  }
  function engCat(c, sauf) { return L.filter(function (x) { return x.cat === c && x.no !== sauf && actif(x) && ['Validé', 'Réceptionné partiellement', 'Réceptionné'].indexOf(x.statut) >= 0; }).reduce(function (a, x) { return a + cv(ttc(x), x.devise); }, 0); }
  function controles(b) {
    var r = [], h = ht(b), S = n(P.seuil), fr = FREF[b.fournisseur], pct = (b.echeances || []).reduce(function (a, e) { return a + n(e.pct); }, 0);
    r.push({ ok: !!String(b.objet || '').trim(), bloq: true, txt: 'Objet de l’achat renseigné' });
    r.push({ ok: !!fr && fr.st === 'Actif', bloq: true, txt: !b.fournisseur ? 'Fournisseur choisi dans le référentiel des opérateurs économiques' : fr && fr.st !== 'Actif' ? b.fournisseur + ' est ' + fr.st.toLowerCase() + ' dans le référentiel : BC impossible' : 'Fournisseur actif dans le référentiel des opérateurs économiques' });
    r.push({ ok: !!b.fin && !!b.cat, bloq: true, txt: 'Financement et catégorie financière renseignés' });
    r.push({ ok: !!b.act, bloq: true, txt: 'Activité renseignée' });
    if (NUM.mode === 'Manuel') r.push({ ok: !!String(b.no || '').trim() && !L.some(function (x) { return x.no === b.no && x !== b && x.no !== b._orig; }), bloq: true, txt: 'Numéro du BC saisi et unique' });
    r.push({ ok: h > 0 && (b.items || []).some(function (i) { return String(i.d).trim(); }), bloq: true, txt: 'Au moins un article avec un montant' });
    r.push({ ok: !!b.devise, bloq: true, txt: 'Devise choisie' });
    var hc = cv(h, b.devise), over = hc > S, conv = b.devise && b.devise !== P.devise ? ' (≈ ' + m(hc, P.devise) + ')' : '';
    r.push({ ok: !over, bloq: over && P.depasse !== 'ppm', ppm: over && P.depasse === 'ppm', txt: 'Montant ' + m(h, b.devise || P.devise) + ' HT' + conv + ' ≤ seuil du BC (' + m(S, P.devise) + ')' + (over ? (P.depasse === 'ppm' ? ' — au-delà du seuil : à l’enregistrement, l’achat sera transmis au PPM' : ' — au-delà du seuil : BC bloqué') : '') });
    r.push({ ok: Math.round(pct) === 100, bloq: true, txt: 'Échéances : total ' + pct + ' % (doit faire 100 %)' });
    var c = catOf(b.cat); if (c && c.montant_alloue) { var dispo = n(c.montant_alloue) - engCat(b.cat, b.no); r.push({ ok: cv(ttc(b), b.devise) <= dispo, bloq: true, txt: 'Crédit disponible sur la catégorie ' + c.code + ' : ' + m(dispo, P.devise) }); }
    return r;
  }
  function bloque(b) { return controles(b).some(function (c) { return !c.ok && c.bloq; }); }

  /* ---------- Validation (menu Validation, workflow) ---------- */
  function valInst(b) { var V = G('VAL_DATA'); return Array.isArray(V) ? V.filter(function (v) { return v.source_type === 'BC' && v.source_ref === b.no; }).slice(-1)[0] || null : null; }
  function soumettre(b) {
    var V = G('VAL_DATA'), w = wfCur();
    b.statut = 'En attente de validation';
    if (!Array.isArray(V) || typeof valAdvance !== 'function') { b.hist.push({ d: now(), a: 'En attente de validation — workflow ' + w.code }); return; }
    var old = valInst(b); if (old && (old.statut === 'En cours' || old.statut === 'À corriger')) { if (old.statut === 'À corriger' && typeof valResubmit === 'function') { valResubmit(old.id); b.hist.push({ d: now(), a: 'Corrigé et renvoyé en validation' }); } return; }
    var inst = { id: valNextId(), type_validation: WFTYPE, reference: b.no, objet: b.objet, workflow_code: w.code, apres_correction: w.apres_correction, soumis_par: (G('CURRENT_USER_NAME') || 'Utilisateur'), date_soumission: today(), source_type: 'BC', source_ref: b.no, statut: 'En cours',
      etapes: w.etapes.map(function (s) { return { libelle: s.libelle, ordre: s.ordre, mode: s.mode, validateurs: s.validateurs, statut: 'En attente', decisions: [], date_ouverture: null, duree_h: s.duree_h, checklist: s.checklist || [] }; }),
      historique: [{ date: now(), auteur: (G('CURRENT_USER_NAME') || ''), action: 'Soumission', detail: 'Bon de commande ' + b.no + ' soumis à validation (circuit ' + w.code + ').' }], montant_estime: ttc(b), service: 'Contractualisation', description: b.objet, etape_retour_ordre: null };
    V.push(inst); valAdvance(inst);
    b.hist.push({ d: now(), a: 'En attente de validation — workflow ' + w.code + ' « ' + w.libelle + ' » (Validation › À traiter)' });
    try { if (typeof valRenderAll === 'function') valRenderAll(); } catch (e) {}
  }
  function hookValidation() {
    var VT = G('VAL_TYPES'); if (Array.isArray(VT) && VT.indexOf(WFTYPE) < 0) VT.push(WFTYPE);
    if (typeof valSyncSourceStatut === 'function' && !valSyncSourceStatut.__bc) {
      var o = valSyncSourceStatut;
      valSyncSourceStatut = function (inst, statut, com) {
        var r = o.apply(this, arguments);
        if (inst && inst.source_type === 'BC') { var b = find(inst.source_ref); if (b && b.statut !== 'Annulé') { b.statut = statut === 'Validé' ? 'Validé' : statut === 'Rejeté' ? 'Rejeté' : 'À corriger'; b.hist.push({ d: now(), a: (statut === 'Validé' ? 'Workflow ' + inst.workflow_code + ' terminé — BC validé' : statut === 'Rejeté' ? 'Rejeté en validation' : 'Retourné pour correction') + (com ? ' : ' + com : '') }); save(); render(); } }
        return r;
      };
      valSyncSourceStatut.__bc = true; window.valSyncSourceStatut = valSyncSourceStatut;
    }
    /* BC en attente sans instance de validation (données d'exemple) : on la crée */
    L.forEach(function (b) { if (b.statut === 'En attente de validation' && !valInst(b)) { var h = b.hist.length; soumettre(b); b.hist.length = h; } });
    var b5 = find('BC-2026-005'), v5 = b5 && valInst(b5);
    if (v5 && v5.etapes[0] && v5.etapes[0].statut === 'À traiter' && !v5.__seeded) { v5.__seeded = true; v5.etapes[0].statut = 'Validée'; v5.etapes[0].decisions.push({ validateur: 'Marie Lefèvre', decision: 'Valider', date: '10/11/2026 10:15', commentaire: 'Devis conforme.' }); try { valAdvance(v5); } catch (e) {} }
    save();
  }

  /* ---------- Rendu ---------- */
  var TAB = 'liste', F = '', SYNC = now();
  var IC = {
    voir: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    modif: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    edit: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    gen: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    recep: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/>',
    annul: '<circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/>',
    valid: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
  };
  function ico(k) { return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; }
  function pill(s) { var c = { 'En attente de validation': 'v', 'À corriger': 'a', 'Rejeté': 'r', 'Validé': 'b', 'Réceptionné partiellement': 'a', 'Réceptionné': 'g', 'Annulé': 'x', 'Transmis au PPM': 'a' }[s] || 'a'; return '<span class="v376p ' + c + '">' + esc(s) + '</span>'; }
  function sa(b) { return genere(b) ? '<span class="v386sa" title="Généré vers SoftAccounting : engagement ENG-' + esc(b.no.slice(3)) + '" aria-label="Généré vers SoftAccounting"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>SA</span>' : ''; }
  function can(b) {
    var s = b.statut, inst = valInst(b), g = genere(b), noDecision = !inst || inst.etapes.every(function (e) { return !(e.decisions || []).length; });
    return { voir: true, modif: s === 'À corriger' || (s === 'En attente de validation' && noDecision), edit: ['Validé', 'Réceptionné partiellement', 'Réceptionné'].indexOf(s) >= 0, gen: s !== 'Annulé' && ['Validé', 'Réceptionné partiellement', 'Réceptionné'].indexOf(s) >= 0 && !g, recep: s === 'Validé' || s === 'Réceptionné partiellement', annul: ['En attente de validation', 'À corriger', 'Validé'].indexOf(s) >= 0 };
  }
  var LAB = { voir: 'Consulter', modif: 'Modifier', edit: 'Éditer le BC', gen: 'Générer vers SoftAccounting', recep: 'Réceptionner', annul: 'Annuler le BC' };
  var WHY = { modif: 'Modifiable seulement avant la première décision de validation (ou s’il est retourné « À corriger »)', annul: 'Annulation impossible pour ce statut' };
  /* Boutons visibles après validation : Éditer et Réceptionner. Menu ⋮ : Consulter, Modifier, Annuler. */
  function actions(b) {
    var c = can(b);
    return '<div class="v383act v386act">' + ['edit', 'recep'].map(function (k) { return c[k] ? '<button class="v383main ' + k + '" data-v382="' + k + '" data-no="' + esc(b.no) + '">' + ico(k) + (k === 'edit' ? 'Éditer' : 'Réceptionner') + '</button>' : '<span class="v386slot ' + k + '" aria-hidden="true"></span>'; }).join('') +
      '<div class="v383menu"><button class="v383more" data-v383menu="' + esc(b.no) + '" aria-haspopup="true" aria-expanded="false" title="Autres actions" aria-label="Autres actions ' + esc(b.no) + '">⋮</button><div class="v383pop" role="menu" hidden>' +
      ['voir', 'modif', 'annul'].map(function (k) { return '<button role="menuitem" class="' + k + '"' + (c[k] ? ' data-v382="' + k + '" data-no="' + esc(b.no) + '"' : ' disabled aria-disabled="true" title="' + esc(WHY[k]) + '"') + '>' + ico(k) + LAB[k] + '</button>'; }).join('') + '</div></div></div>';
  }
  function kpis() {
    var att = L.filter(function (b) { return b.statut === 'En attente de validation' || b.statut === 'À corriger'; }).length, val = L.filter(function (b) { return can(b).gen; }).length;
    var eng = L.filter(genere).reduce(function (a, b) { return a + cv(ttc(b), b.devise); }, 0), fr = L.filter(function (b) { return b.statut === 'Réceptionné'; }).length;
    return '<div class="v134-kpis"><div class="v134-kpi"><b>' + att + '</b><span>En attente de validation</span></div><div class="v134-kpi"><b>' + val + '</b><span>Validés, à générer (onglet Génération BC)</span></div><div class="v134-kpi"><b>' + m(eng) + '</b><span>Engagé dans Softaccounting (TTC)</span></div><div class="v134-kpi"><b>' + fr + '</b><span>Réceptionnés</span></div></div>';
  }
  function liste() {
    var vis = L.filter(function (b) { return !F || b.statut === F; }).slice().sort(function (a, b) { return b.no.localeCompare(a.no); });
    return '<div class="v134-card"><div class="v134-cardhead"><div><h2>Bons de commande</h2><span class="v377sub">Achats hors contrats, sous le seuil de ' + m(P.seuil) + ' HT.</span></div>' +
      '<div class="v134-toolbar"><button class="v134-btn" data-v382="num">' + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg> Numérotation</button>' +
      '<select class="v134-select" id="v382f" aria-label="Filtrer par statut"><option value="">Tous les statuts</option>' + ST.map(function (s) { return '<option' + (s === F ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select><button class="v134-btn primary" data-v382="nouveau">+ Nouveau bon de commande</button></div></div>' +
      '<div class="v386wrap"><table class="v134-table v382t v386t"><colgroup><col style="width:116px"><col style="width:24%"><col style="width:17%"><col style="width:22%"><col style="width:100px"><col style="width:90px"><col style="width:184px"><col style="width:246px"></colgroup><thead><tr><th>N° BC</th><th>Objet</th><th>Fournisseur</th><th>Activité</th><th class="r">Montant TTC</th><th>Date</th><th>Statut</th><th class="r">Actions</th></tr></thead><tbody>' +
      (vis.map(function (b) { return withDev(b, function () { return '<tr class="v383row ' + (b.statut === 'Annulé' ? 'ann' : '') + '" data-v383row="' + esc(b.no) + '" tabindex="0" title="Cliquer pour consulter le BC"><td><strong>' + esc(b.no) + '</strong></td><td><span class="v386c" title="' + esc(b.objet) + '">' + esc(b.objet) + '</span></td><td><span class="v386c" title="' + esc(b.fournisseur) + '">' + esc(b.fournisseur) + '</span></td><td><span class="v386c" title="' + esc(actLib(b.act)) + '"><b class="v386code">' + esc(b.act) + '</b> ' + esc(actLib(b.act).replace(/^[^—]*—\s*/, '')) + '</span></td><td class="v377n">' + m(ttc(b)) + '</td><td>' + esc(b.date) + '</td><td><div class="v386st">' + pill(b.statut) + sa(b) + '</div></td><td>' + actions(b) + '</td></tr>'; }); }).join('') || '<tr><td colspan="8">Aucun bon de commande pour ce filtre.</td></tr>') + '</tbody></table></div>' +
      '<div class="v382leg">Cliquez sur une ligne pour consulter le BC. « SA ✓ » : BC généré vers SoftAccounting. Après validation : Éditer et Réceptionner. Le menu ⋮ regroupe Consulter, Modifier et Annuler. La génération vers SoftAccounting se fait dans l’onglet « Génération BC ».</div></div>';
  }
  /* Onglet Génération BC : BC validés pas encore générés. Une fois généré, le BC sort de la liste (pas de double génération). */
  function aGenerer() { return L.filter(function (b) { return can(b).gen; }).sort(function (a, b) { return a.no.localeCompare(b.no); }); }
  function etatGeneration() {
    var rows = aGenerer();
    return '<div class="v134-card"><div class="v134-cardhead"><div><h2>Génération des BC vers SoftAccounting</h2><span class="v377sub">BC validés en attente de génération. Une fois généré, le BC disparaît de cette liste : il ne peut pas être généré deux fois.</span></div></div>' +
      '<table class="v134-table v382t"><thead><tr><th>N° BC</th><th>Objet</th><th>Fournisseur</th><th>Activité</th><th>Catégorie</th><th>Montant TTC</th><th>Statut</th><th>Action</th></tr></thead><tbody>' +
      (rows.map(function (b) { return withDev(b, function () { return '<tr><td><strong>' + esc(b.no) + '</strong></td><td>' + esc(b.objet) + '</td><td>' + esc(b.fournisseur) + '</td><td>' + esc(actLib(b.act)) + '</td><td>' + esc(catLib(b.cat)) + '</td><td class="v377n">' + m(ttc(b)) + '</td><td>' + pill(b.statut) + '</td><td><div class="v383act"><button class="v383main gen" data-v382="gen" data-no="' + esc(b.no) + '">' + ico('gen') + 'Générer</button></div></td></tr>'; }); }).join('') || '<tr><td colspan="8">Aucun BC validé en attente de génération.</td></tr>') + '</tbody></table></div>';
  }
  function fin(b) { var t = (b.compta || []).map(function (x) { return x.t; }), v = ttc(b), e = t.indexOf('eng') >= 0 && t.indexOf('ann') < 0 ? v : 0, f = t.indexOf('fac') >= 0 ? v : 0, p = t.indexOf('pay') >= 0 ? v : 0; return { eng: e, fac: f, pay: p, reste: e - p, sit: t.indexOf('ann') >= 0 ? 'Engagement annulé' : p ? 'Payé' : f ? 'Facture comptabilisée' : e ? 'Engagé' : '—' }; }
  /* Barre d'avancement d'un BC : payé / facturé non payé / engagé non facturé */
  function mini(x) {
    var e = x.eng || 1, p = Math.round(x.pay * 100 / e), f = Math.round((x.fac - x.pay) * 100 / e), r = Math.max(0, 100 - p - f), lab = p >= 100 ? 'Payé' : x.fac >= x.eng && x.eng ? 'Facturé' : x.eng ? 'Engagé' : '—';
    return '<div class="v385mini" title="Payé ' + p + ' % · facturé non payé ' + f + ' % · reste à facturer ' + r + ' %"><div class="v385bar"><i class="p" style="width:' + p + '%"></i><i class="f" style="width:' + f + '%"></i><i class="r" style="width:' + r + '%"></i></div><small>' + lab + ' · ' + p + ' % payé</small></div>';
  }
  /* Vue d'ensemble : étapes du BC (engagé → facturé → payé) et répartition du montant */
  function vueFinanciere(T, rows) {
    var e = T.eng || 1, pP = Math.round(T.pay * 100 / e), pF = Math.round(T.fac * 100 / e), fNP = T.fac - T.pay, nF = T.eng - T.fac;
    var etapes = [['Engagé', T.eng, 100, 'e', rows.length + ' BC générés'], ['Facturé', T.fac, pF, 'f', pF + ' % du montant'], ['Payé', T.pay, pP, 'p', pP + ' % du montant'], ['Reste à payer', T.reste, Math.round(T.reste * 100 / e), 'r', 'dont ' + m(fNP) + ' facturés']];
    var R = 54, C = 2 * Math.PI * R, segs = [[T.pay, '#047857'], [fNP, '#f59e0b'], [nF, '#c7d2fe']], off = 0;
    var donut = '<svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label="Payé ' + pP + ' % du montant engagé"><circle cx="70" cy="70" r="' + R + '" fill="none" stroke="#eef0f5" stroke-width="16"/>' +
      segs.map(function (sg) { var len = T.eng ? C * sg[0] / T.eng : 0, o = '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + sg[1] + '" stroke-width="16" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)"/>'; off += len; return o; }).join('') +
      '<text x="70" y="66" text-anchor="middle" font-size="24" font-weight="700" fill="#1e2b55">' + pP + ' %</text><text x="70" y="86" text-anchor="middle" font-size="11" fill="#5b606d">payé</text></svg>';
    return '<div class="v385vue"><div class="v385flow">' + etapes.map(function (s, k) { return '<div class="v385step ' + s[3] + '"><small>' + s[0] + '</small><b>' + m(s[1]) + '</b><div class="v385bar"><i class="' + s[3] + '" style="width:' + Math.min(100, s[2]) + '%"></i></div><em>' + esc(s[4]) + '</em></div>' + (k < 3 ? '<span class="v385arr" aria-hidden="true">›</span>' : ''); }).join('') + '</div>' +
      '<div class="v385donut">' + donut + '<ul><li><i style="background:#047857"></i>Payé<b>' + m(T.pay) + '</b></li><li><i style="background:#f59e0b"></i>Facturé, à payer<b>' + m(fNP) + '</b></li><li><i style="background:#c7d2fe"></i>Engagé, à facturer<b>' + m(nF) + '</b></li></ul></div></div>';
  }
  function etatFinancier() {
    var rows = L.filter(function (b) { return (b.compta || []).some(function (x) { return x.t === 'eng'; }); }).sort(function (a, b) { return a.no.localeCompare(b.no); }), T = { eng: 0, fac: 0, pay: 0, reste: 0 };
    var body = rows.map(function (b) { var x = fin(b); ['eng', 'fac', 'pay', 'reste'].forEach(function (k) { T[k] += cv(x[k], b.devise); }); return withDev(b, function () { return '<tr><td><strong style="white-space:nowrap">' + esc(b.no) + '</strong></td><td>' + esc(b.objet) + '</td><td>' + esc(b.fournisseur) + '</td><td>' + esc(actLib(b.act)) + '</td><td class="v377n">' + m(x.eng) + '</td><td class="v377n">' + m(x.fac) + '</td><td class="v377n">' + m(x.pay) + '</td><td class="v377n"><b>' + m(x.reste) + '</b></td><td>' + mini(x) + '</td></tr>'; }); }).join('');
    return '<div class="v134-card"><div class="v134-cardhead"><div><h2>État de suivi financier des bons de commande</h2><span class="v377sub">Données lues dans Softaccounting (lecture seule) · dernière synchronisation : ' + esc(SYNC) + '. Seuls les BC générés vers la comptabilité apparaissent.</span></div><button class="v134-btn" data-v382="sync">Actualiser depuis Softaccounting</button></div>' + vueFinanciere(T, rows) +
      '<table class="v134-table"><thead><tr><th>N° BC</th><th>Objet</th><th>Fournisseur</th><th>Activités</th><th>Montant TTC</th><th>Facturé TTC</th><th>Payé TTC</th><th>Reste à payer</th><th style="width:150px">Avancement</th></tr></thead><tbody>' + (body || '<tr><td colspan="9">Aucun BC généré vers Softaccounting.</td></tr>') +
      '<tr class="v377total"><td colspan="4"><b>Total</b></td><td class="v377n"><b>' + m(T.eng) + '</b></td><td class="v377n"><b>' + m(T.fac) + '</b></td><td class="v377n"><b>' + m(T.pay) + '</b></td><td class="v377n"><b>' + m(T.reste) + '</b></td><td></td></tr></tbody></table></div>';
  }
  function render() {
    var pg = document.getElementById('page-v377-bc'); if (!pg) return; DEVB = null;
    pg.innerHTML = '<div class="v377tabs">' + [['liste', 'Bons de commande'], ['gen', 'Génération BC'], ['budget', 'État de suivi financier']].map(function (t) { var k = t[0] === 'gen' ? aGenerer().length : 0; return '<button data-v382tab="' + t[0] + '" class="' + (TAB === t[0] ? 'on' : '') + '">' + t[1] + (k ? ' <span class="v384cnt">' + k + '</span>' : '') + '</button>'; }).join('') + '</div>' +
      (TAB === 'gen' || TAB === 'seuils' ? etatGeneration() : TAB === 'budget' ? etatFinancier() : liste());
    var f = document.getElementById('v382f'); if (f) f.onchange = function () { F = this.value; render(); };
  }

  /* ---------- Fenêtres ---------- */
  function toast(t) { var d = document.createElement('div'); d.className = 'v376toast'; d.innerHTML = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4200); }
  function modal(title, sub, body, okLab, onOk, closeLab, wide) {
    var md = document.createElement('div'); md.className = 'v376m';
    md.innerHTML = '<div class="v376dlg"' + (wide ? ' style="width:min(1080px,100%)"' : '') + '><div class="v376mh"><div><b>' + title + '</b><small>' + sub + '</small></div><button class="v134-btn" data-x aria-label="Fermer">✕</button></div><div class="v376mb">' + body + '</div><div class="v376mf"><button class="v134-btn" data-x>' + (closeLab || 'Annuler') + '</button>' + (okLab ? '<button class="v134-btn primary" data-ok>' + okLab + '</button>' : '') + '</div></div>';
    document.body.appendChild(md);
    md.addEventListener('click', function (e) { if (e.target === md || e.target.closest('[data-x]')) { md.remove(); DEVB = null; } if (e.target.closest('[data-ok]')) { if (onOk(md) !== false) md.remove(); } });
    return md;
  }
  function opt(arr, v, ph) { return '<option value="">' + ph + '</option>' + arr.map(function (a) { var val = a.v != null ? a.v : a; return '<option value="' + esc(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + esc(a.l || a) + '</option>'; }).join(''); }

  /* Saisie en deux étapes : Informations, Articles */
  function form(src) {
    var b = src ? JSON.parse(JSON.stringify(src)) : { no: genNo(), date: today(), objet: '', fournisseur: '', fin: (FINS()[0] || {}).code || '', cat: '', act: '', devise: P.devise, delai: '15 jours', lieu: 'Siège du projet — Antananarivo', echeances: ech1(), items: [{ d: '', q: 1, pu: 0 }], statut: 'En attente de validation', recu: 0, compta: [], hist: [], editions: 0 };
    if (src) b._orig = src.no; var step = 1;
    var md = modal(src ? 'Modifier ' + esc(b.no) : 'Nouveau bon de commande', 'Étape 1 sur 2 · Informations', '<div class="v382steps"><span class="on">1. Informations</span><span>2. Articles</span></div><div id="v382form"></div>', '', null, 'Annuler', true);
    var foot = md.querySelector('.v376mf');
    var prev = document.createElement('button'), next = document.createElement('button'); prev.className = 'v134-btn'; prev.textContent = '← Précédent'; next.className = 'v134-btn primary';
    foot.appendChild(prev); foot.appendChild(next);
    prev.onclick = function () { step = 1; paint(); };
    next.onclick = function () {
      if (step === 1) { var miss = []; if (!String(b.objet).trim()) miss.push('objet'); if (!b.devise) miss.push('devise'); if (!b.fournisseur) miss.push('fournisseur'); if (!b.fin || !b.cat) miss.push('financement et catégorie'); if (!b.act) miss.push('activité'); if (NUM.mode === 'Manuel' && !String(b.no).trim()) miss.push('numéro'); if (miss.length) { toast('À compléter : ' + miss.join(', ') + '.'); return; } step = 2; paint(); return; }
      b.items = b.items.filter(function (i) { return String(i.d).trim(); }); if (!b.items.length) b.items = [{ d: '', q: 1, pu: 0 }];
      if (bloque(b)) { paint(); toast('Enregistrement impossible : ' + esc(controles(b).filter(function (c) { return !c.ok && c.bloq; })[0].txt)); return; }
      var orig = b._orig; delete b._orig;
      if (src) { b.hist.push({ d: now(), a: 'Modification du BC' }); var i = L.findIndex(function (x) { return x.no === orig; }); L[i] = b; } else { b.hist.push({ d: now(), a: 'Saisie du BC' }); L.push(b); }
      if (controles(b).some(function (c) { return c.ppm; })) { b.statut = 'Transmis au PPM'; b.hist.push({ d: now(), a: 'Montant au-delà du seuil (' + m(n(P.seuil), P.devise) + ' HT) : achat transmis au PPM pour une procédure de passation' }); save(); md.remove(); DEVB = null; TAB = 'liste'; render(); toast('<b>' + esc(b.no) + '</b> dépasse le seuil : l’achat est transmis au PPM.'); return; }
      soumettre(b); save(); md.remove(); DEVB = null; TAB = 'liste'; render();
      toast('<b>' + esc(b.no) + '</b> enregistré : en attente de validation (Validation › À traiter).');
    };
    function paint() {
      DEVB = b.devise || P.devise; var box = md.querySelector('#v382form'), ctl = controles(b);
      md.querySelector('.v376mh small').textContent = 'Étape ' + step + ' sur 2 · ' + (step === 1 ? 'Informations' : 'Articles');
      md.querySelectorAll('.v382steps span').forEach(function (s, k) { s.className = k + 1 === step ? 'on' : k + 1 < step ? 'ok' : ''; });
      prev.style.display = step === 1 ? 'none' : ''; next.textContent = step === 1 ? 'Suivant : Articles →' : ctl.some(function (c) { return c.ppm; }) ? 'Transmettre au PPM' : 'Enregistrer';
      if (step === 1) {
        var fr = FREF[b.fournisseur], cats = CATS(b.fin), pct = b.echeances.reduce(function (a, e) { return a + n(e.pct); }, 0);
        box.innerHTML = '<div class="v377grid">' +
          '<div class="v134-field" style="grid-column:1/-1"><label for="v382o">Objet de l’achat *</label><input class="v134-input" id="v382o" data-k="objet" value="' + esc(b.objet) + '" placeholder="Ex. Réparation des climatiseurs de la salle serveur">' +
          '<div class="v382no"><span>N° BC</span>' + (NUM.mode === 'Manuel' ? '<input class="v134-input" data-k="no" value="' + esc(b.no) + '" placeholder="Saisir le numéro" aria-label="Numéro du BC">' : '<b>' + esc(b.no) + '</b><small>attribué automatiquement</small>') + '</div></div>' +
          '<div class="v134-field"><label>Fournisseur *</label><select class="v134-select" data-k="fournisseur">' + opt(FOURN.map(function (f) { return { v: f, l: f + (FREF[f].st !== 'Actif' ? ' (' + FREF[f].st.toLowerCase() + ')' : '') }; }), b.fournisseur, 'Choisir dans le référentiel') + '</select><small class="v380src">Référentiel des opérateurs économiques' + (fr ? ' · NIF ' + fr.nif + ' · ' + fr.st : '') + '</small></div>' +
          '<div class="v134-field"><label>Activité *</label><select class="v134-select" data-k="act">' + opt(ACTS().map(function (a) { return { v: a.code, l: new Array(a.niveau).join('  ') + a.code + ' — ' + a.libelle }; }), b.act, 'Choisir une activité') + '</select><small class="v380src">Plan d’activités (Paramétrage › Plans &amp; Financements)</small></div>' +
          '<div class="v134-field"><label>Financement *</label><select class="v134-select" data-k="fin">' + opt(FINS().map(function (f) { return { v: f.code, l: f.code + ' — ' + f.libelle }; }), b.fin, 'Choisir un financement') + '</select><small class="v380src">Paramétrage › Financements</small></div>' +
          '<div class="v134-field"><label>Catégorie *</label><select class="v134-select" data-k="cat">' + opt(cats.map(function (c) { return { v: c.code, l: c.code + ' — ' + c.libelle }; }), b.cat, cats.length ? 'Choisir une catégorie' : 'Aucune catégorie pour ce financement') + '</select><small class="v380src">Catégories financières paramétrées pour ce financement</small></div>' +
          '<div class="v134-field"><label>Devise *</label><select class="v134-select" data-k="devise">' + opt(DEVISES, b.devise, 'Choisir une devise') + '</select><small class="v380src">Devise du BC · seuil exprimé en ' + esc(P.devise) + '</small></div>' +
          '<div class="v134-field"><label>Délai de livraison</label><input class="v134-input" data-k="delai" value="' + esc(b.delai) + '"></div>' +
          '<div class="v134-field"><label>Lieu de livraison</label><input class="v134-input" data-k="lieu" value="' + esc(b.lieu) + '"></div></div>' +
          '<h4 class="v377h4">Échéances de paiement</h4><p class="v377sub" style="margin:0 0 6px">Comme pour un contrat : chaque échéance a une condition, un déclencheur et un délai de paiement. Le total doit faire 100 %.</p>' +
          '<table class="v134-table v382ech"><thead><tr><th style="width:36px">N°</th><th>Condition de paiement</th><th style="width:80px">%</th><th style="width:120px">Montant</th><th style="width:190px">Déclencheur</th><th style="width:110px">Délai (jours)</th><th style="width:40px"></th></tr></thead><tbody>' +
          b.echeances.map(function (e, k) { return '<tr><td>' + (k + 1) + '</td><td><input class="v134-input" data-e="' + k + '" data-f="lib" value="' + esc(e.lib) + '" placeholder="Ex. Avance, Solde"></td><td><input class="v134-input" type="number" min="0" max="100" data-e="' + k + '" data-f="pct" value="' + esc(e.pct) + '"></td><td class="v377n">' + m(ttc(b) * n(e.pct) / 100) + '</td><td><select class="v134-select" data-e="' + k + '" data-f="trig">' + TRIGGERS.map(function (t) { return '<option' + (t === e.trig ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></td><td><input class="v134-input" type="number" min="0" data-e="' + k + '" data-f="delai" value="' + esc(e.delai) + '"></td><td>' + (b.echeances.length > 1 ? '<button class="v134-btn" data-edel="' + k + '" aria-label="Supprimer l’échéance">✕</button>' : '') + '</td></tr>'; }).join('') +
          '</tbody><tfoot><tr><td colspan="2"><b>Total</b></td><td><b class="' + (Math.round(pct) === 100 ? 'v382ok' : 'v382ko') + '">' + pct + ' %</b></td><td colspan="4"></td></tr></tfoot></table><button class="v134-btn" data-eadd style="margin-top:6px">+ Ajouter une échéance</button>';
      } else {
        var h = ht(b);
        box.innerHTML = '<div class="v382recap"><b>' + esc(b.no) + '</b> · ' + esc(b.objet) + ' · ' + esc(b.fournisseur) + ' · ' + esc(catLib(b.cat)) + '</div>' +
          '<table class="v134-table v377it"><thead><tr><th>Désignation</th><th style="width:90px">Quantité</th><th style="width:130px">Prix unitaire HT</th><th style="width:130px">Total HT</th><th style="width:40px"></th></tr></thead><tbody>' +
          b.items.map(function (i, k) { return '<tr><td><input class="v134-input" data-i="' + k + '" data-f="d" value="' + esc(i.d) + '" placeholder="Désignation"></td><td><input class="v134-input" type="number" min="0" data-i="' + k + '" data-f="q" value="' + esc(i.q) + '"></td><td><input class="v134-input" type="number" min="0" step="0.01" data-i="' + k + '" data-f="pu" value="' + esc(i.pu) + '"></td><td data-tot="' + k + '">' + m(n(i.q) * n(i.pu)) + '</td><td>' + (b.items.length > 1 ? '<button class="v134-btn" data-del="' + k + '" aria-label="Supprimer l’article">✕</button>' : '') + '</td></tr>'; }).join('') +
          '</tbody></table><button class="v134-btn" data-add style="margin-top:6px">+ Ajouter un article</button>' +
          '<div class="v377tot"><div><small>Total HT</small><b data-ht>' + m(h) + '</b></div><div><small>TVA ' + TVA + ' %</small><b data-tva>' + m(h * TVA / 100) + '</b></div><div><small>Total TTC</small><b data-ttc>' + m(ttc(b)) + '</b></div></div>' +
          '<div class="v377ctl"><b>Contrôles automatiques</b>' + ctl.map(function (c) { return '<div class="' + (c.ok ? 'ok' : c.bloq ? 'ko' : 'wa') + '">' + (c.ok ? '✓' : c.bloq ? '✕' : '⚠') + ' ' + esc(c.txt) + (c.ppm ? ' <small>(paramétrage : générer vers le PPM)</small>' : '') + '</div>'; }).join('') + '</div>' +
          '<p class="v377sub">À l’enregistrement, le BC passe automatiquement « En attente de validation » et part dans Validation › À traiter (workflow ' + esc(wfCur().code) + ').</p>';
      }
      box.querySelectorAll('[data-k]').forEach(function (el) { el.onchange = function () { b[el.dataset.k] = el.value; if (el.dataset.k === 'fin') b.cat = ''; paint(); }; if (el.tagName === 'INPUT') el.oninput = function () { b[el.dataset.k] = el.value; }; });
      box.querySelectorAll('[data-e]').forEach(function (el) { el.onchange = function () { b.echeances[+el.dataset.e][el.dataset.f] = el.dataset.f === 'lib' || el.dataset.f === 'trig' ? el.value : n(el.value); paint(); }; });
      box.querySelectorAll('[data-edel]').forEach(function (el) { el.onclick = function () { b.echeances.splice(+el.dataset.edel, 1); paint(); }; });
      var ea = box.querySelector('[data-eadd]'); if (ea) ea.onclick = function () { var r = 100 - b.echeances.reduce(function (a, e) { return a + n(e.pct); }, 0); b.echeances.push({ lib: 'Solde', pct: Math.max(0, r), trig: 'Réception totale', delai: 30 }); paint(); };
      box.querySelectorAll('[data-i]').forEach(function (el) { el.oninput = function () { DEVB = b.devise || P.devise; b.items[+el.dataset.i][el.dataset.f] = el.value; var k = +el.dataset.i, hh = ht(b); box.querySelector('[data-tot="' + k + '"]').textContent = m(n(b.items[k].q) * n(b.items[k].pu)); box.querySelector('[data-ht]').textContent = m(hh); box.querySelector('[data-tva]').textContent = m(hh * TVA / 100); box.querySelector('[data-ttc]').textContent = m(ttc(b)); }; el.onchange = function () { paint(); }; });
      box.querySelectorAll('[data-del]').forEach(function (el) { el.onclick = function () { b.items.splice(+el.dataset.del, 1); paint(); }; });
      var ad = box.querySelector('[data-add]'); if (ad) ad.onclick = function () { b.items.push({ d: '', q: 1, pu: 0 }); paint(); };
    }
    paint();
  }

  function circuit(b) {
    var inst = valInst(b), w = inst ? { code: inst.workflow_code, etapes: inst.etapes } : wfCur();
    var done = ['Validé', 'Réceptionné partiellement', 'Réceptionné'].indexOf(b.statut) >= 0;
    return '<div class="v380circ"><b>Circuit de validation — ' + esc(w.code) + '</b><small>Étapes définies dans Paramétrage › Workflows (type « ' + WFTYPE + ' »). Les décisions se prennent dans Validation › À traiter.</small><ol style="grid-template-columns:repeat(' + w.etapes.length + ',minmax(0,1fr))">' +
      w.etapes.map(function (e, k) { var s = e.statut || '', st = done || s === 'Validée' ? 'ok' : s === 'Rejetée' || s === 'Retournée' ? 'ko' : s === 'À traiter' ? 'cur' : ''; var dec = (e.decisions || []).slice(-1)[0]; return '<li class="' + st + '"><span>' + (st === 'ok' ? '✓' : st === 'ko' ? '✕' : k + 1) + '</span><div><b>' + esc(e.libelle) + '</b><small>' + esc((e.validateurs || []).map(function (v) { return v.type + ' : ' + v.ref; }).join(', ')) + '</small><em>' + (dec ? esc(dec.decision + ' — ' + dec.validateur + ', ' + dec.date) : st === 'cur' ? 'À traiter' : 'Délai ' + esc(e.duree_h) + ' h') + '</em></div></li>'; }).join('') + '</ol></div>';
  }
  function docBC(b, mod) { return withDev(b, function () { return docBC0(b, mod); }); }
  function docBC0(b, mod) {
    var info = function (k, v) { return '<div><small>' + k + '</small><b>' + v + '</b></div>'; };
    return '<div class="v377doc"><div class="v377dochead"><div><b>BON DE COMMANDE N° ' + esc(b.no) + '</b><small>Date : ' + esc(b.date) + (mod ? ' · ' + esc(mod.code + ' ' + mod.libelle) : '') + '</small></div>' + pill(b.statut) + '</div>' +
      '<div class="v376sum" style="grid-template-columns:repeat(3,1fr);margin:10px 0">' + info('Fournisseur', esc(b.fournisseur) + (FREF[b.fournisseur] ? ' · NIF ' + FREF[b.fournisseur].nif : '')) + info('Objet', esc(b.objet)) + info('Activité', esc(actLib(b.act))) + info('Financement', esc(finLib(b.fin))) + info('Catégorie', esc(catLib(b.cat))) + info('Livraison', esc(b.delai) + ' · ' + esc(b.lieu)) + info('Devise', esc(b.devise || P.devise)) + '</div>' +
      '<table class="v134-table"><thead><tr><th>Désignation</th><th>Qté</th><th>PU HT</th><th>Total HT</th></tr></thead><tbody>' + b.items.map(function (i) { return '<tr><td>' + esc(i.d) + '</td><td>' + esc(i.q) + '</td><td>' + m(i.pu) + '</td><td>' + m(n(i.q) * n(i.pu)) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="3" style="text-align:right">Total HT</td><td>' + m(ht(b)) + '</td></tr><tr><td colspan="3" style="text-align:right">TVA ' + TVA + ' %</td><td>' + m(ht(b) * TVA / 100) + '</td></tr><tr><td colspan="3" style="text-align:right"><b>Total TTC</b></td><td><b>' + m(ttc(b)) + '</b></td></tr></tfoot></table>' +
      '<table class="v134-table" style="margin-top:10px"><thead><tr><th>Échéance</th><th>%</th><th>Montant</th><th>Déclencheur</th><th>Délai</th></tr></thead><tbody>' + (b.echeances || []).map(function (e) { return '<tr><td>' + esc(e.lib) + '</td><td>' + esc(e.pct) + ' %</td><td>' + m(ttc(b) * n(e.pct) / 100) + '</td><td>' + esc(e.trig) + '</td><td>' + esc(e.delai) + ' jours</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function consulter(b) {
    modal('Bon de commande ' + esc(b.no), esc(b.fournisseur) + ' · ' + esc(b.date) + ' · ' + esc(b.devise || P.devise), docBC(b) + circuit(b) +
      (b.annul ? '<div class="v382ann"><b>BC annulé le ' + esc(b.annul.d) + '</b> — ' + esc(b.annul.motif) + '</div>' : '') +
      '<div class="v376cols" style="margin-top:14px"><div><h4>Échanges avec Softaccounting</h4><ul class="v376hist">' + ((b.compta || []).length ? b.compta.slice().reverse().map(function (x) { return '<li><small>' + esc(x.d) + '</small>' + esc(x.a) + '</li>'; }).join('') : '<li>Aucun échange : le BC sera envoyé à la compta avec l’action « Générer », après validation.</li>') + '</ul></div>' +
      '<div><h4>Historique</h4><ul class="v376hist">' + (b.hist || []).slice().reverse().map(function (x) { return '<li><small>' + esc(x.d) + '</small>' + esc(x.a) + '</li>'; }).join('') + '</ul></div></div>', '', null, 'Fermer', true);
  }
  function editer(b) {
    var mods = MODELES(), mod = mods.filter(function (x) { return x.code === b.modele; })[0] || mods[0] || MDL_BC[0];
    var sel = '<div class="v383mod"><div class="v134-field"><label for="v383mo">Modèle d’édition</label><select class="v134-select" id="v383mo">' + mods.map(function (x) { return '<option value="' + esc(x.code) + '"' + (x.code === mod.code ? ' selected' : '') + '>' + esc(x.code + ' — ' + x.libelle + ' (' + x.format + ')') + '</option>'; }).join('') + '</select></div><small>Modèles de type « Bon de commande » gérés dans Paramétrage › Modèles.</small></div>';
    var paper = function (md) { return '<div class="v382paper">' + docBC(b, md) + '<div class="v382sig"><div>Le fournisseur<br><small>Accusé de réception</small></div><div>L’ordonnateur<br><small>Signature et cachet</small></div></div></div>'; };
    var dlg = modal('Éditer le BC ' + esc(b.no), 'Choisissez le modèle, vérifiez l’aperçu puis téléchargez', sel + '<div id="v383paper">' + paper(mod) + '</div>',
      'Télécharger le BC (PDF)', function () { b.modele = mod.code; b.editions = (b.editions || 0) + 1; b.hist.push({ d: now(), a: 'BC édité (' + mod.code + ')' }); save(); render(); toast('BC <b>' + esc(b.no) + '</b> édité avec le modèle ' + esc(mod.code) + ' (démonstration).'); }, 'Fermer', true);
    dlg.querySelector('#v383mo').onchange = function () { mod = mods.filter(function (x) { return x.code === this.value; }, this)[0] || mod; dlg.querySelector('#v383paper').innerHTML = paper(mod); };
  }
  /* Générer : fenêtre de contrôle des données envoyées à SoftAccounting, avec libellé, activité, financement et catégorie modifiables */
  function generer(b) {
    var g = { lib: b.genLib || b.objet, act: b.act, fin: b.fin, cat: b.cat };
    var fr = FREF[b.fournisseur] || {};
    var ro = function (k, v) { return '<div><small>' + k + '</small><b>' + v + '</b></div>'; };
    var catsOpt = function () { var cs = CATS(g.fin); if (!cs.some(function (c) { return c.code === g.cat; })) g.cat = ''; return opt(cs.map(function (c) { return { v: c.code, l: c.code + ' — ' + c.libelle }; }), g.cat, cs.length ? 'Choisir une catégorie' : 'Aucune catégorie pour ce financement'); };
    var credit = function () { var c = catOf(g.cat); if (!g.cat) return '<div class="v382warn">Choisissez une catégorie.</div>'; if (!c || !c.montant_alloue) return ''; var d = n(c.montant_alloue) - engCat(g.cat, b.no), ok = cv(ttc(b), b.devise) <= d; return '<div class="v383cr ' + (ok ? 'ok' : 'ko') + '">' + (ok ? '✓' : '✕') + ' Crédit disponible sur ' + esc(c.code + ' — ' + c.libelle) + ' : <b>' + m(d, P.devise) + '</b> pour un engagement de ' + m(ttc(b), b.devise || P.devise) + '</div>'; };
    DEVB = b.devise || P.devise;
    var body = '<p class="v383intro">Vérifiez les informations qui seront envoyées à SoftAccounting. Les champs en bleu peuvent être modifiés avant l’envoi.</p>' +
      '<div class="v383gen"><h4>Imputation (modifiable)</h4><div class="v377grid">' +
      '<div class="v134-field v380full"><label for="v383gl">Libellé de l’engagement *</label><input class="v134-input" id="v383gl" value="' + esc(g.lib) + '"></div>' +
      '<div class="v134-field"><label for="v383ga">Activité *</label><select class="v134-select" id="v383ga">' + opt(ACTS().map(function (a) { return { v: a.code, l: new Array(a.niveau).join('  ') + a.code + ' — ' + a.libelle }; }), g.act, 'Choisir une activité') + '</select></div>' +
      '<div class="v134-field"><label for="v383gf">Financement *</label><select class="v134-select" id="v383gf">' + opt(FINS().map(function (f) { return { v: f.code, l: f.code + ' — ' + f.libelle }; }), g.fin, 'Choisir un financement') + '</select></div>' +
      '<div class="v134-field"><label for="v383gc">Catégorie *</label><select class="v134-select" id="v383gc">' + catsOpt() + '</select></div>' +
      '<div class="v134-field"><label>Contrôle du crédit</label><div id="v383gcr">' + credit() + '</div></div></div></div>' +
      '<div class="v383gen ro"><h4>Données du BC (lecture seule)</h4><div class="v376sum" style="grid-template-columns:repeat(3,1fr)">' + ro('N° BC', esc(b.no)) + ro('Date', esc(b.date)) + ro('Fournisseur', esc(b.fournisseur)) + ro('Code tiers / NIF', esc(fr.nif || '—')) + ro('Montant HT', m(ht(b))) + ro('TVA ' + TVA + ' %', m(ht(b) * TVA / 100)) + ro('Montant TTC', '<span style="color:#2e427b">' + m(ttc(b)) + '</span>') + ro('N° engagement', 'ENG-' + esc(b.no.slice(3))) + ro('Devise', esc(b.devise || P.devise)) + '</div>' +
      '<table class="v134-table" style="margin-top:10px"><thead><tr><th>Article</th><th>Qté</th><th>PU HT</th><th>Total HT</th></tr></thead><tbody>' + b.items.map(function (i) { return '<tr><td>' + esc(i.d) + '</td><td>' + esc(i.q) + '</td><td>' + m(i.pu) + '</td><td>' + m(n(i.q) * n(i.pu)) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<table class="v134-table" style="margin-top:10px"><thead><tr><th>Échéance</th><th>%</th><th>Montant TTC</th><th>Déclencheur</th><th>Délai</th></tr></thead><tbody>' + (b.echeances || []).map(function (e) { return '<tr><td>' + esc(e.lib) + '</td><td>' + esc(e.pct) + ' %</td><td>' + m(ttc(b) * n(e.pct) / 100) + '</td><td>' + esc(e.trig) + '</td><td>' + esc(e.delai) + ' jours</td></tr>'; }).join('') + '</tbody></table></div>';
    var md = modal('Générer ' + esc(b.no) + ' vers SoftAccounting', esc(b.fournisseur) + ' · ' + m(ttc(b)) + ' TTC', body, 'Générer vers SoftAccounting', function (md) {
      g.lib = md.querySelector('#v383gl').value.trim();
      var miss = [['#v383gl', g.lib], ['#v383ga', g.act], ['#v383gf', g.fin], ['#v383gc', g.cat]].filter(function (x) { return !x[1]; });
      md.querySelectorAll('#v383gl,#v383ga,#v383gf,#v383gc').forEach(function (x) { x.style.borderColor = ''; });
      if (miss.length) { miss.forEach(function (x) { md.querySelector(x[0]).style.borderColor = '#b91c1c'; }); md.querySelector(miss[0][0]).focus(); return false; }
      var c = catOf(g.cat); if (c && c.montant_alloue && cv(ttc(b), b.devise) > n(c.montant_alloue) - engCat(g.cat, b.no)) { toast('Crédit insuffisant sur la catégorie ' + esc(c.code) + '.'); return false; }
      var chg = []; if (g.lib !== (b.genLib || b.objet)) chg.push('libellé'); if (g.act !== b.act) chg.push('activité'); if (g.fin !== b.fin) chg.push('financement'); if (g.cat !== b.cat) chg.push('catégorie');
      b.genLib = g.lib; b.act = g.act; b.fin = g.fin; b.cat = g.cat;
      b.compta.push({ d: now(), a: 'BC généré — engagement ENG-' + b.no.slice(3) + ' « ' + g.lib + ' » créé dans Softaccounting (' + m(ttc(b)) + ', ' + g.act + ' / ' + g.fin + ' / ' + g.cat + ')', t: 'eng' });
      b.hist.push({ d: now(), a: 'Généré vers Softaccounting' + (chg.length ? ' — modifié avant envoi : ' + chg.join(', ') : '') });
      DEVB = null; save(); render(); toast('<b>' + esc(b.no) + '</b> généré : engagement créé dans Softaccounting. Il sort de la liste « Génération BC ».');
    }, 'Fermer', true);
    DEVB = null;
    md.querySelector('#v383ga').onchange = function () { g.act = this.value; };
    md.querySelector('#v383gf').onchange = function () { g.fin = this.value; md.querySelector('#v383gc').innerHTML = catsOpt(); md.querySelector('#v383gcr').innerHTML = credit(); };
    md.querySelector('#v383gc').onchange = function () { g.cat = this.value; md.querySelector('#v383gcr').innerHTML = credit(); };
  }
  /* Réception : suivi par article (commandé, déjà reçu, reste), réceptions successives jusqu'à la réception totale */
  function ensureRec(b) {
    if (!b.receptions) b.receptions = [];
    b.items.forEach(function (it) { if (it.rq == null) it.rq = Math.round(n(it.q) * n(b.recu) / 100); });
    if (!b.receptions.length && n(b.recu) > 0) b.receptions.push({ no: 'REC-1', d: b.date, bl: '', res: '', l: b.items.map(function (it) { return n(it.rq); }) });
  }
  function recPct(b) { var q = 0, r = 0; b.items.forEach(function (it) { q += n(it.q); r += Math.min(n(it.rq), n(it.q)); }); return q ? Math.round(r * 100 / q) : 0; }
  function receptionner(b) {
    ensureRec(b);
    var pct = recPct(b), k0 = b.receptions.length + 1;
    var bar = function (p) { return '<div class="v387bar"><i style="width:' + p + '%"></i></div>'; };
    var lignes = b.items.map(function (it, k) { var q = n(it.q), d = Math.min(n(it.rq), q), r = q - d, p = q ? Math.round(d * 100 / q) : 0;
      return '<tr class="' + (r ? '' : 'done') + '"><td><b>' + esc(it.d) + '</b></td><td class="v377n">' + q + '</td><td class="v377n">' + d + '</td><td class="v377n"><b>' + r + '</b></td><td>' + (r ? '<input class="v134-input v387in" type="number" min="0" max="' + r + '" data-r="' + k + '" value="' + r + '" aria-label="Quantité reçue ' + esc(it.d) + '">' : '<span class="v387ok">✓ Soldé</span>') + '</td><td>' + bar(p) + '<small>' + p + ' %</small></td></tr>'; }).join('');
    var histo = b.receptions.length ? '<h4 class="v377h4">Réceptions déjà enregistrées</h4><table class="v134-table v387h"><thead><tr><th>N°</th><th>Date</th><th>Bon de livraison</th><th>Quantités reçues</th><th>Réserves</th></tr></thead><tbody>' + b.receptions.map(function (r) { return '<tr><td><b>' + esc(r.no) + '</b></td><td>' + esc(r.d) + '</td><td>' + esc(r.bl || '—') + '</td><td>' + b.items.map(function (it, k) { return esc(it.d) + ' : ' + n((r.l || [])[k]); }).join('<br>') + '</td><td>' + esc(r.res || '—') + '</td></tr>'; }).join('') + '</tbody></table>' : '';
    var tq = b.items.reduce(function (a, it) { return a + n(it.q); }, 0), td = b.items.reduce(function (a, it) { return a + Math.min(n(it.rq), n(it.q)); }, 0);
    var body = '<div class="v387sum"><div><small>Commandé</small><b>' + tq + '</b></div><div><small>Déjà reçu</small><b>' + td + '</b></div><div class="rest"><small>Reste à recevoir</small><b>' + (tq - td) + '</b></div><div class="prog"><small>Avancement de la réception</small>' + bar(pct) + '<b>' + pct + ' %</b></div></div>' +
      '<div class="v387head"><h4 class="v377h4">Réception n° ' + k0 + '</h4><div><button class="v134-btn" data-rall>Tout le reste</button> <button class="v134-btn" data-rzero>Remettre à zéro</button></div></div>' +
      '<table class="v134-table v387t"><thead><tr><th>Article</th><th class="r">Commandé</th><th class="r">Déjà reçu</th><th class="r">Reste</th><th>Reçu ce jour</th><th style="width:150px">Avancement</th></tr></thead><tbody>' + lignes + '</tbody></table>' +
      '<div class="v377grid" style="margin-top:12px"><div class="v134-field"><label for="v387dt">Date de réception</label><input class="v134-input" id="v387dt" value="' + esc(today()) + '"></div><div class="v134-field"><label for="v387bl">N° bon de livraison</label><input class="v134-input" id="v387bl" placeholder="Ex. BL-2026-145"></div>' +
      '<div class="v134-field v380full"><label for="v382res">Réserves éventuelles</label><input class="v134-input" id="v382res" style="width:100%" placeholder="Ex. 2 cartons abîmés, à remplacer"></div></div><div id="v387after" class="v387after"></div>' + histo;
    var md = modal('Réceptionner ' + esc(b.no), esc(b.fournisseur) + ' · ' + esc(b.objet), body, 'Enregistrer la réception', function (md) {
      var l = b.items.map(function () { return 0; }), tot = 0;
      md.querySelectorAll('[data-r]').forEach(function (x) { var k = +x.dataset.r, it = b.items[k], r = n(it.q) - Math.min(n(it.rq), n(it.q)), v = Math.max(0, Math.min(n(x.value), r)); l[k] = v; tot += v; });
      if (!tot) { toast('Saisissez au moins une quantité reçue.'); return false; }
      var res = md.querySelector('#v382res').value.trim(), bl = md.querySelector('#v387bl').value.trim(), dt = md.querySelector('#v387dt').value.trim() || today();
      b.items.forEach(function (it, k) { it.rq = n(it.rq) + l[k]; });
      b.receptions.push({ no: 'REC-' + k0, d: dt, bl: bl, res: res, l: l });
      b.recu = recPct(b); b.statut = b.recu >= 100 ? 'Réceptionné' : 'Réceptionné partiellement';
      b.hist.push({ d: now(), a: 'Réception n° ' + k0 + (b.recu >= 100 ? ' — réception totale' : ' — partielle, ' + b.recu + ' % reçu') + (bl ? ' (BL ' + bl + ')' : '') + (res ? ' — réserves : ' + res : '') });
      save(); render(); toast('Réception n° ' + k0 + ' enregistrée pour <b>' + esc(b.no) + '</b> : ' + (b.recu >= 100 ? 'BC entièrement réceptionné.' : b.recu + ' % reçu.'));
    }, 'Annuler', true);
    var upd = function () { var add = 0, rest = 0; md.querySelectorAll('[data-r]').forEach(function (x) { var it = b.items[+x.dataset.r], r = n(it.q) - Math.min(n(it.rq), n(it.q)), v = Math.max(0, Math.min(n(x.value), r)); add += v; rest += r - v; });
      md.querySelector('#v387after').innerHTML = add ? (rest ? '<span class="v376p a">Après cette réception : partielle, reste ' + rest + ' à recevoir</span>' : '<span class="v376p g">Après cette réception : BC entièrement réceptionné</span>') : '<span class="v376p x">Aucune quantité saisie</span>'; };
    md.querySelectorAll('[data-r]').forEach(function (x) { x.oninput = upd; });
    md.querySelector('[data-rall]').onclick = function () { md.querySelectorAll('[data-r]').forEach(function (x) { x.value = x.max; }); upd(); };
    md.querySelector('[data-rzero]').onclick = function () { md.querySelectorAll('[data-r]').forEach(function (x) { x.value = 0; }); upd(); };
    upd();
  }
  function annuler(b) {
    var g = genere(b), inst = valInst(b);
    modal('Annuler ' + esc(b.no), esc(b.objet), '<p>L’annulation est définitive. Le BC reste dans la liste avec le statut « Annulé » pour la traçabilité.</p>' + (g ? '<div class="v382warn">Ce BC est déjà généré : l’engagement <b>ENG-' + esc(b.no.slice(3)) + '</b> sera annulé dans Softaccounting et le crédit libéré.</div>' : inst && inst.statut === 'En cours' ? '<div class="v382warn">La validation en cours est arrêtée (Validation › À traiter).</div>' : '') +
      '<div class="v134-field" style="margin-top:10px"><label for="v382mo">Motif de l’annulation *</label><textarea class="v134-input" id="v382mo" rows="3" style="width:100%"></textarea></div>', 'Annuler le BC', function (md) {
        var v = md.querySelector('#v382mo').value.trim(); if (!v) { md.querySelector('#v382mo').style.borderColor = '#b91c1c'; md.querySelector('#v382mo').focus(); return false; }
        b.statut = 'Annulé'; b.annul = { d: today(), motif: v }; b.hist.push({ d: now(), a: 'BC annulé : ' + v });
        if (g) b.compta.push({ d: now(), a: 'Engagement ENG-' + b.no.slice(3) + ' annulé dans Softaccounting', t: 'ann' });
        if (inst && (inst.statut === 'En cours' || inst.statut === 'À corriger')) { inst.statut = 'Annulé'; inst.etapes.forEach(function (s) { if (s.statut !== 'Validée') s.statut = 'Annulée'; }); inst.historique.push({ date: now(), auteur: G('CURRENT_USER_NAME') || '', action: 'Annulation', detail: v }); try { valRenderAll(); } catch (e) {} }
        save(); render(); toast('<b>' + esc(b.no) + '</b> annulé.');
      }, 'Fermer');
  }
  function ouvrirValidation(b) {
    var inst = valInst(b), leaf = document.getElementById('leaf-1-0');
    if (leaf) { try { selectLeaf(leaf); } catch (e) {} }
    if (inst && typeof valOpenDetail === 'function') { try { valOpenDetail(inst.id); } catch (e) {} }
  }

  /* ---------- Paramétrage › Bons de commande ---------- */
  function renderParam() {
    var pg = document.getElementById('page-v380-bcparam'); if (!pg) return;
    var mods = MODELES(), w = wfCur();
    pg.innerHTML = '<div class="v382ph"><div class="v134-eyebrow">Paramétrage</div><h1>Bons de commande</h1><p>Seuil, devise, gestion du dépassement et workflow de validation. Le modèle d’édition se choisit au moment d’éditer le BC. La numérotation se règle dans Contractualisation › Bons de commande.</p></div>' +
      '<div class="v380grid"><div class="v134-card v380full"><div class="v134-cardhead"><div><h2>Seuil du bon de commande</h2><span class="v377sub">Montant HT maximum d’un BC. Au-delà, le BC est bloqué ou l’achat est généré vers le PPM, selon le choix ci-dessous.</span></div></div>' +
      '<div class="v377grid"><div class="v134-field"><label for="v382se">Seuil HT</label><input class="v134-input" type="number" min="0" step="500" id="v382se" value="' + esc(P.seuil) + '"></div>' +
      '<div class="v134-field"><label for="v384dv">Devise du seuil</label><select class="v134-select" id="v384dv">' + DEVISES.map(function (d) { return '<option value="' + d.v + '"' + (P.devise === d.v ? ' selected' : '') + '>' + esc(d.l) + '</option>'; }).join('') + '</select></div>' +
      '<div class="v134-field v380full"><label for="v384dp">Si le montant du BC dépasse le seuil</label><select class="v134-select" id="v384dp"><option value="bloquer"' + (P.depasse !== 'ppm' ? ' selected' : '') + '>Bloquer le BC</option><option value="ppm"' + (P.depasse === 'ppm' ? ' selected' : '') + '>Générer vers le PPM (l’achat passe en procédure de passation)</option></select><small class="v380src">Un BC saisi dans une autre devise est converti au taux du jour pour être comparé au seuil.</small></div></div></div>' +
      '<div class="v134-card v380full"><div class="v134-cardhead"><div><h2>Workflow de validation</h2><span class="v377sub">Le circuit se paramètre dans Paramétrage › Workflows (type de validation « ' + WFTYPE + ' »). Les BC sont validés dans Validation › À traiter.</span></div><button class="v134-btn" id="v381gw">Gérer les workflows</button></div>' +
      '<div class="v134-field"><label for="v381wf">Workflow appliqué</label><select class="v134-select" id="v381wf">' + wfActifs().map(function (x) { return '<option value="' + esc(x.code) + '"' + (x.code === w.code ? ' selected' : '') + '>' + esc(x.code + ' — ' + x.libelle + ' (' + x.etapes.length + ' étapes, v' + x.version + ')') + '</option>'; }).join('') + '</select></div>' +
      '<table class="v134-table"><thead><tr><th>Étape</th><th>Validateurs</th><th>Mode</th><th>Délai</th></tr></thead><tbody id="v381steps">' + stepsRows(w) + '</tbody></table></div></div>' +
      '<div class="v380act"><button class="v134-btn" id="v380rz">Rétablir les valeurs par défaut</button><button class="v134-btn primary" id="v380ok">Enregistrer le paramétrage</button></div>';
    var sw = pg.querySelector('#v381wf'); sw.onchange = function () { var x = wfActifs().filter(function (y) { return y.code === sw.value; })[0]; if (x) pg.querySelector('#v381steps').innerHTML = stepsRows(x); };
    pg.querySelector('#v381gw').onclick = function () { var l = document.getElementById('leaf-2-12'); if (l) selectLeaf(l); };
    pg.querySelector('#v380ok').onclick = function () { P.seuil = n(pg.querySelector('#v382se').value); P.devise = pg.querySelector('#v384dv').value; P.depasse = pg.querySelector('#v384dp').value; P.wf = sw.value; psave(); render(); renderParam(); toast('Paramétrage enregistré.'); };
    pg.querySelector('#v380rz').onclick = function () { P = pdef(); psave(); render(); renderParam(); toast('Valeurs par défaut rétablies.'); };
  }
  function stepsRows(w) { return w.etapes.map(function (e, k) { return '<tr><td><b>' + (k + 1) + '. ' + esc(e.libelle) + '</b></td><td>' + esc((e.validateurs || []).map(function (v) { return v.type + ' : ' + v.ref; }).join(', ')) + '</td><td>' + esc(e.mode || 'Séquentiel') + '</td><td>' + esc(e.duree_h) + ' h</td></tr>'; }).join(''); }

  /* ---------- Numérotation : fenêtre commune « Paramétrage de la numérotation » (comme le PPM) ---------- */
  function hookNum() {
    var NC = G('NUM_CONFIGS'); if (NC && !NC.BC) NC.BC = NUM;
    var sel = document.getElementById('ppmnum-objet'); if (sel && !sel.querySelector('option[value="BC"]')) { var o = document.createElement('option'); o.value = 'BC'; o.textContent = 'Bon de commande'; sel.appendChild(o); }
    if (typeof ppmNumUpdatePreview === 'function' && !ppmNumUpdatePreview.__bc) {
      var up = ppmNumUpdatePreview; ppmNumUpdatePreview = function () { var r = up.apply(this, arguments); if (G('PPMNUM_KIND') === 'BC') { var g = function (id) { return document.getElementById(id); }; var tmp = { mode: 'Automatique', prefixe: g('ppmnum-prefixe').value || 'BC', separateur: g('ppmnum-separateur').value || '-', avec_exercice: typeof getBoolField === 'function' ? getBoolField('ppmnum-avec-exercice') : true, longueur_compteur: parseInt(g('ppmnum-longueur').value, 10) || 3, compteur_depart: parseInt(g('ppmnum-depart').value, 10) || 1, reinitialisation: g('ppmnum-reinit').value }; g('ppmnum-preview').textContent = genNo(tmp) || '—'; } return r; };
      ppmNumUpdatePreview.__bc = true; window.ppmNumUpdatePreview = ppmNumUpdatePreview;
    }
    if (typeof submitPpmNumConfigModal === 'function' && !submitPpmNumConfigModal.__bc) {
      var sb = submitPpmNumConfigModal; submitPpmNumConfigModal = function () { var k = G('PPMNUM_KIND'); var r = sb.apply(this, arguments); if (k === 'BC') { nsave(); render(); toast('Numérotation des BC enregistrée. Prochain numéro : <b>' + esc(genNo() || 'saisie manuelle') + '</b>.'); } return r; };
      submitPpmNumConfigModal.__bc = true; window.submitPpmNumConfigModal = submitPpmNumConfigModal;
    }
  }
  function ouvrirNum() { hookNum(); if (typeof openPpmNumConfigModal === 'function' && document.getElementById('ppm-num-modal-overlay')) { openPpmNumConfigModal('BC'); } else toast('Fenêtre de numérotation indisponible.'); }

  /* ---------- Intégration au menu ---------- */
  function ensure() {
    var ref = document.getElementById('v134-signed'), a6 = document.getElementById('leaf-6-4'), a2 = document.getElementById('leaf-2-12');
    if (!ref || !a6 || !a2) return false;
    if (!document.getElementById('page-v377-bc')) { var pg = document.createElement('div'); pg.id = 'page-v377-bc'; pg.className = 'sm-page-content v134-page'; ref.parentNode.insertBefore(pg, ref.nextSibling); }
    if (!document.getElementById('page-v380-bcparam')) { var pp = document.createElement('div'); pp.id = 'page-v380-bcparam'; pp.className = 'sm-page-content v134-page'; ref.parentNode.insertBefore(pp, ref.nextSibling); }
    if (!document.getElementById('leaf-6-bc')) { var el = document.createElement('div'); el.className = 'sm-sub'; el.id = 'leaf-6-bc'; el.setAttribute('data-goto', 'page-v377-bc'); el.innerHTML = '<span class="sm-sub-dot"></span><span class="sm-sub-label">Bons de commande</span>'; el.onclick = function (e) { e.stopPropagation(); TAB = 'liste'; render(); selectLeaf(el); }; a6.parentNode.insertBefore(el, a6.nextSibling); }
    if (!document.getElementById('leaf-2-bc')) { var ep = document.createElement('div'); ep.className = 'sm-sub'; ep.id = 'leaf-2-bc'; ep.setAttribute('data-goto', 'page-v380-bcparam'); ep.innerHTML = '<span class="sm-sub-dot"></span><span class="sm-sub-label">Bons de commande</span>'; ep.onclick = function (e) { e.stopPropagation(); renderParam(); selectLeaf(ep); }; a2.parentNode.insertBefore(ep, a2.nextSibling); }
    return true;
  }
  function registerRefs() {
    var W = G('WF_DATA'); if (Array.isArray(W)) WF_BC.forEach(function (w) { if (!W.some(function (x) { return x.code === w.code; })) W.push(JSON.parse(JSON.stringify(w))); });
    try { var PX = G('WF_TYPE_CODE_PREFIX'); if (PX) PX[WFTYPE] = 'BC'; } catch (e) {}
    var sel = document.getElementById('wfwf-type'); if (sel && !sel.querySelector('option[value="' + WFTYPE + '"]')) { var o = document.createElement('option'); o.value = WFTYPE; o.textContent = WFTYPE; sel.appendChild(o); }
    try { if (typeof renderWfTable === 'function') renderWfTable(); } catch (e) {}
    var M = G('MDL_DATA'); if (Array.isArray(M)) MDL_BC.forEach(function (x) { if (!M.some(function (y) { return y.code === x.code; })) M.push(JSON.parse(JSON.stringify(x))); });
  }
  /* Bandeau « Applications · Environnement » masqué sur les pages BC (gain de place) */
  function hookNav() {
    if (typeof navigateTo !== 'function' || navigateTo.__bc) return;
    var o = navigateTo; navigateTo = function (id) { var r = o.apply(this, arguments); [].filter.call(document.querySelectorAll('span'), function (s) { return /^Applications\s/.test(s.textContent || '') && /actives/.test(s.textContent || ''); }).forEach(function (sp) { var strip = sp.parentNode && sp.parentNode.parentNode; if (strip && strip.style) strip.style.display = (id === 'page-v377-bc' || id === 'page-v380-bcparam') ? 'none' : ''; }); return r; };
    navigateTo.__bc = true; window.navigateTo = navigateTo;
  }

  function strip(show) { [].filter.call(document.querySelectorAll('span'), function (s) { return /^Applications\s/.test(s.textContent || '') && /actives/.test(s.textContent || ''); }).forEach(function (sp) { var el = sp.parentNode && sp.parentNode.parentNode; if (el && el.style) el.style.display = show ? '' : 'none'; }); }
  window.addEventListener('click', function (e) { var l = e.target.closest && e.target.closest('.sm-sub, .sm-sub3, .sm-parent, [data-goto]'); if (!l) return; var mine = l.id === 'leaf-6-bc' || l.id === 'leaf-2-bc'; setTimeout(function () { strip(!mine); }, 0); }, true);
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-v382tab]'); if (t) { TAB = t.dataset.v382tab; render(); return; }
    var mb = e.target.closest && e.target.closest('[data-v383menu]');
    document.querySelectorAll('.v383pop').forEach(function (p) { if (!mb || p.previousElementSibling !== mb) { p.hidden = true; if (p.previousElementSibling) p.previousElementSibling.setAttribute('aria-expanded', 'false'); } });
    if (mb) { e.stopPropagation(); var pop = mb.nextElementSibling; pop.hidden = !pop.hidden; mb.setAttribute('aria-expanded', String(!pop.hidden)); if (!pop.hidden) { var f1 = pop.querySelector('button'); if (f1) f1.focus(); } return; }
    var row = e.target.closest && e.target.closest('[data-v383row]');
    if (row && !e.target.closest('.v383act')) { var rb = find(row.dataset.v383row); if (rb) { e.stopPropagation(); consulter(rb); } return; }
    var x = e.target.closest && e.target.closest('[data-v382]'); if (!x) return;
    e.stopPropagation(); var a = x.dataset.v382;
    if (a === 'nouveau') return form(null);
    if (a === 'num') return ouvrirNum();
    if (a === 'param') { var l = document.getElementById('leaf-2-bc'); renderParam(); if (l) selectLeaf(l); return; }
    if (a === 'sync') { L.forEach(function (b) { if (b.statut === 'Annulé') return; var t = (b.compta || []).map(function (c) { return c.t; }); if (b.statut === 'Réceptionné' && t.indexOf('fac') < 0) b.compta.push({ d: now(), a: 'Facture comptabilisée (retour Softaccounting)', t: 'fac' }); else if (t.indexOf('fac') >= 0 && t.indexOf('pay') < 0) b.compta.push({ d: now(), a: 'Paiement effectué (retour Softaccounting)', t: 'pay' }); }); SYNC = now(); save(); render(); toast('État actualisé depuis Softaccounting (démonstration).'); return; }
    var b = find(x.dataset.no); if (!b) return;
    if (a === 'voir') consulter(b); else if (a === 'modif') form(b); else if (a === 'edit') editer(b); else if (a === 'gen') generer(b); else if (a === 'recep') receptionner(b); else if (a === 'annul') annuler(b); else if (a === 'xvalid') ouvrirValidation(b);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.v383pop').forEach(function (p) { p.hidden = true; });
    var row = e.target.closest && e.target.closest('[data-v383row]'); if (row && e.key === 'Enter' && e.target === row) { var rb = find(row.dataset.v383row); if (rb) consulter(rb); }
  });
  window.SM377 = { data: function () { return L; }, param: function () { return P; }, num: function () { return NUM; }, controles: controles, render: render, renderParam: renderParam, reset: function () { L = seed(); save(); hookValidation(); render(); } };
  function boot(k) { if (ensure()) { load(); registerRefs(); hookNum(); hookNav(); hookValidation(); renderParam(); render(); return; } if (k < 25) setTimeout(function () { boot(k + 1); }, 400); }
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
.v377n{white-space:nowrap;text-align:right;font-variant-numeric:tabular-nums}.v377total td{background:#f8f9fc}
.v380src{display:block;font-size:11px;color:#5b606d;margin-top:3px}
.v380circ{margin-top:12px;border:1px solid #e3e6ee;border-radius:10px;padding:10px 12px;background:#fff;font-size:12.5px}.v380circ>b{color:#18244f}.v380circ>small{display:block;color:#5b606d;margin:2px 0 8px}
.v380circ ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v380circ li{display:flex;gap:8px;border:1px solid #e3e6ee;border-radius:8px;padding:8px}.v380circ li>span{flex:none;width:22px;height:22px;border-radius:50%;background:#eef0f5;color:#5b606d;font-weight:800;display:grid;place-items:center;font-size:11px}
.v380circ li b{display:block;color:#18244f}.v380circ li small{display:block;color:#5b606d}.v380circ li em{display:block;font-style:normal;font-size:11px;color:#2e427b;margin-top:2px}
.v380circ li.ok{border-color:#a7f3d0;background:#f0fdf8}.v380circ li.ok>span{background:#047857;color:#fff}.v380circ li.cur{border-color:#2e427b;background:#eef2ff}.v380circ li.cur>span{background:#2e427b;color:#fff}.v380circ li.ko{border-color:#fecaca;background:#fef2f2}.v380circ li.ko>span{background:#b91c1c;color:#fff}
.v380grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;align-items:start}.v380col{display:grid;gap:14px}.v380full{grid-column:1/-1}.v380grid .v134-card{margin:0}.v380grid .v134-input,.v380grid .v134-select{width:100%;box-sizing:border-box}
.v380act{display:flex;justify-content:flex-start;gap:8px;margin-top:14px}
.v380grid .v134-card>.v134-field,.v380grid .v134-card>.v377grid,.v380grid .v134-card>p{padding:0 20px;margin:12px 0 16px}
@media (max-width:900px){.v380grid,.v380circ ol{grid-template-columns:1fr}}
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
.v382ic{display:flex;gap:4px;flex-wrap:wrap}.v382i{width:32px;height:32px;display:grid;place-items:center;border:1px solid #d6d9e0;border-radius:8px;background:#fff;color:#2e427b;cursor:pointer;padding:0}.v382i:hover,.v382i:focus-visible{background:#eef2ff;border-color:#2e427b;outline:none}
.v382i.gen{color:#047857;border-color:#a7f3d0}.v382i.recep{color:#5b21b6}.v382i.annul{color:#b91c1c;border-color:#fecaca}.v382i.annul:hover{background:#fef2f2}.v382i.valid{color:#b45309;border-color:#fcd34d}
.v382leg{display:flex;flex-wrap:wrap;gap:14px;padding:10px 16px;font-size:11.5px;color:#5b606d;border-top:1px solid #eef0f5}.v382leg span{display:inline-flex;align-items:center;gap:5px}.v382leg svg{width:13px;height:13px}
.v382t tr.ann td{color:#969ba8}.v382t tr.ann td strong{text-decoration:line-through}
.v376p.x{background:#f1f2f6;color:#5b606d}
.v382steps{display:flex;gap:6px;margin-bottom:14px}.v382steps span{flex:1;text-align:center;padding:8px;border-radius:8px;background:#f1f2f6;color:#5b606d;font-weight:800;font-size:12.5px}.v382steps span.on{background:#2e427b;color:#fff}.v382steps span.ok{background:#ecfdf5;color:#047857}
.v382no{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12.5px;color:#5b606d}.v382no b{color:#18244f;font-size:13px}.v382no small{color:#969ba8}.v382no input{max-width:240px}
.v382ech .v134-input,.v382ech .v134-select{width:100%;box-sizing:border-box}.v382ok{color:#047857}.v382ko{color:#b91c1c}
.v382recap{font-size:12.5px;color:#2e427b;background:#f8f9fc;border:1px solid #e9ebf0;border-radius:8px;padding:8px 11px;margin-bottom:10px}
.v382warn{font-size:12.5px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:8px 11px}
.v382ann{margin-top:12px;font-size:12.5px;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:8px 11px}
.v382paper{background:#f5f6f9;padding:14px;border-radius:10px}.v382paper .v377doc{box-shadow:0 2px 8px rgba(0,0,0,.06)}
.v382sig{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}.v382sig div{background:#fff;border:1px dashed #c9d3ee;border-radius:8px;height:80px;padding:10px;font-size:12.5px;color:#18244f;font-weight:700}.v382sig small{font-weight:400;color:#5b606d}
.v382ph{padding:4px 2px 14px}.v382ph h1{margin:2px 0 4px;font-size:22px;color:#18244f}.v382ph p{margin:0;color:#5b606d;font-size:13px}
.v380src{display:block;font-size:11px;color:#5b606d;margin-top:3px}
.v380circ{margin-top:12px;border:1px solid #e3e6ee;border-radius:10px;padding:10px 12px;background:#fff;font-size:12.5px}.v380circ>b{color:#18244f}.v380circ>small{display:block;color:#5b606d;margin:2px 0 8px}
.v380circ ol{list-style:none;margin:0;padding:0;display:grid;gap:8px}.v380circ li{display:flex;gap:8px;border:1px solid #e3e6ee;border-radius:8px;padding:8px}.v380circ li>span{flex:none;width:22px;height:22px;border-radius:50%;background:#eef0f5;color:#5b606d;font-weight:800;display:grid;place-items:center;font-size:11px}
.v380circ li b{display:block;color:#18244f}.v380circ li small{display:block;color:#5b606d}.v380circ li em{display:block;font-style:normal;font-size:11px;color:#2e427b;margin-top:2px}
.v380circ li.ok{border-color:#a7f3d0;background:#f0fdf8}.v380circ li.ok>span{background:#047857;color:#fff}.v380circ li.cur{border-color:#2e427b;background:#eef2ff}.v380circ li.cur>span{background:#2e427b;color:#fff}.v380circ li.ko{border-color:#fecaca;background:#fef2f2}.v380circ li.ko>span{background:#b91c1c;color:#fff}
.v380grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;align-items:start}.v380full{grid-column:1/-1}.v380grid .v134-card{margin:0}.v380grid .v134-input,.v380grid .v134-select{width:100%;box-sizing:border-box}
.v380grid .v134-card>.v134-field,.v380grid .v134-card>.v377grid,.v380grid .v134-card>p{padding:0 20px;margin:12px 0 16px}
.v380act{display:flex;justify-content:flex-start;gap:8px;margin-top:14px}
@media (max-width:900px){.v380grid{grid-template-columns:1fr}.v380circ ol{grid-template-columns:1fr!important}}
.v382t td:first-child strong{white-space:nowrap}.v382ic{flex-wrap:nowrap}

.v383row{cursor:pointer}.v383row:hover td{background:#f7f8fc}.v383row:focus-visible{outline:2px solid #2e427b;outline-offset:-2px}
.v383sa{display:inline-block;margin-left:6px;font-size:11px;font-weight:600;color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;padding:2px 8px;white-space:nowrap}
.v383act{display:flex;align-items:center;gap:6px;justify-content:flex-end;white-space:nowrap}
.v383main{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:8px;border:1px solid #2e427b;background:#2e427b;color:#fff;font:inherit;font-size:13px;font-weight:600;cursor:pointer}.v383main:hover{background:#22325f}
.v383main.modif,.v383main.edit{background:#fff;color:#2e427b}.v383main.modif:hover,.v383main.edit:hover{background:#eef2ff}
.v383main.gen{background:#047857;border-color:#047857}.v383main.gen:hover{background:#065f46}
.v383none{color:#9aa0ad;padding:0 12px}
.v383menu{position:relative}.v383more{width:32px;height:32px;border:1px solid #d6d9e0;border-radius:8px;background:#fff;color:#2e427b;font-size:18px;line-height:1;cursor:pointer}.v383more:hover,.v383more[aria-expanded=true]{background:#eef2ff;border-color:#2e427b}
.v383pop{position:absolute;right:0;top:36px;z-index:50;min-width:230px;background:#fff;border:1px solid #d6d9e0;border-radius:10px;box-shadow:0 10px 30px rgba(20,30,60,.16);padding:6px}
.v383pop button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;padding:9px 10px;border-radius:7px;font:inherit;font-size:13px;color:#1f2433;cursor:pointer;text-align:left}.v383pop button:hover,.v383pop button:focus-visible{background:#f1f4fb;outline:none}.v383pop button.annul{color:#b91c1c;border-top:1px solid #eef0f5;border-radius:0 0 7px 7px;margin-top:4px}
.v383mod{display:flex;align-items:flex-end;gap:16px;margin-bottom:14px;padding:12px 14px;background:#f7f8fc;border:1px solid #e3e6ee;border-radius:10px}.v383mod .v134-field{flex:1;margin:0}.v383mod small{color:#5b606d;padding-bottom:10px}
.v382t th:last-child{text-align:right}
.v383intro{margin:0 0 12px;color:#41475a}.v383gen{border:1px solid #c7d2fe;background:#f5f7ff;border-radius:10px;padding:12px 14px;margin-bottom:12px}.v383gen.ro{background:#fff;border-color:#e3e6ee}.v383gen h4{margin:0 0 8px;font-size:13px;color:#2e427b}.v383gen .v134-field{margin:0}.v383gen .v377grid{gap:12px}
.v383gen:not(.ro) .v134-input,.v383gen:not(.ro) .v134-select{border-color:#93a5e6;background:#fff}
.v383cr{padding:9px 10px;border-radius:8px;font-size:13px}.v383cr.ok{background:#ecfdf5;color:#065f46}.v383cr.ko{background:#fef2f2;color:#991b1b}
.v384cnt{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 6px;margin-left:6px;border-radius:999px;background:#047857;color:#fff;font-size:11.5px;font-weight:700}
.v383pop button[disabled]{color:#a3a8b5;cursor:not-allowed}.v383pop button[disabled]:hover{background:none}
.v385vue{display:grid;grid-template-columns:1fr auto;gap:18px;padding:16px 20px;border-bottom:1px solid #eef0f5;align-items:center}
.v385flow{display:flex;align-items:stretch;gap:8px}.v385step{flex:1;min-width:0;background:#f7f8fc;border:1px solid #e3e6ee;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}
.v385step small{font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:#5b606d;font-weight:600}.v385step b{font-size:19px;color:#1e2b55;white-space:nowrap}.v385step em{font-style:normal;font-size:12px;color:#5b606d}
.v385step.p{background:#ecfdf5;border-color:#a7f3d0}.v385step.r{background:#fff7ed;border-color:#fed7aa}
.v385arr{align-self:center;color:#9aa0ad;font-size:22px}
.v385bar{display:flex;height:8px;border-radius:999px;background:#eef0f5;overflow:hidden}.v385bar i{display:block;height:100%}.v385bar i.e{background:#2e427b}.v385bar i.f{background:#f59e0b}.v385bar i.p{background:#047857}.v385bar i.r{background:#c7d2fe}.v385step.r .v385bar i.r{background:#ea580c}
.v385donut{display:flex;align-items:center;gap:14px}.v385donut ul{list-style:none;margin:0;padding:0;display:grid;gap:8px;font-size:12.5px;color:#41475a}.v385donut li{display:grid;grid-template-columns:12px auto;column-gap:8px}.v385donut li i{width:12px;height:12px;border-radius:3px;margin-top:2px;grid-row:span 2}.v385donut li b{color:#1e2b55;font-size:13px}
.v385mini small{display:block;font-size:11px;color:#5b606d;margin-top:4px;white-space:nowrap}
@media (max-width:1100px){.v385vue{grid-template-columns:1fr}.v385flow{flex-wrap:wrap}.v385arr{display:none}.v385step{flex:1 1 40%}}
.v386t{table-layout:fixed;width:100%}.v386t th,.v386t td{vertical-align:middle}.v386t th.r{text-align:right}
.v386t tbody tr{height:64px}.v386t td{padding-top:10px;padding-bottom:10px}
.v386c{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.35}
.v386t td:first-child strong{white-space:nowrap}.v386t td:nth-child(5),.v386t td:nth-child(6){white-space:nowrap}
.v386st{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}.v386st .v376p{white-space:nowrap}
.v386sa{display:inline-flex;align-items:center;gap:3px;height:22px;padding:0 7px;border-radius:999px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-size:11px;font-weight:700;flex:none}
.v386act{display:grid;grid-template-columns:86px 120px 32px;gap:6px;justify-content:end}.v386act .v383main{width:100%;justify-content:center;gap:5px;height:32px;padding:0 8px;font-size:12.5px}.v386act .v383main svg{width:14px;height:14px}
.v386wrap{overflow-x:auto}.v386t{min-width:1060px}.v386t .v376p{font-size:12px}
.v386slot{display:block}.v386code{display:inline-block;min-width:26px;padding:0 5px;margin-right:4px;border-radius:5px;background:#eef2ff;color:#2e427b;font-size:11.5px;text-align:center}
.v387sum{display:grid;grid-template-columns:1fr 1fr 1fr 2fr;gap:10px;margin-bottom:14px}.v387sum>div{background:#f7f8fc;border:1px solid #e3e6ee;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:4px}.v387sum small{font-size:11.5px;color:#5b606d;text-transform:uppercase;letter-spacing:.03em;font-weight:600}.v387sum b{font-size:18px;color:#1e2b55}.v387sum .rest{background:#fff7ed;border-color:#fed7aa}.v387sum .prog .v387bar{margin:4px 0}
.v387bar{height:8px;border-radius:999px;background:#eef0f5;overflow:hidden}.v387bar i{display:block;height:100%;background:#047857;border-radius:999px}
.v387head{display:flex;align-items:center;justify-content:space-between;margin:4px 0 6px}.v387head .v377h4{margin:0}
.v387t th.r,.v387t td.v377n{text-align:right}.v387t td{vertical-align:middle}.v387t td small{font-size:11px;color:#5b606d}.v387t tr.done td{color:#6b7280}.v387in{width:100px;text-align:right}.v387ok{color:#047857;font-weight:600;font-size:13px}
.v387after{margin-top:10px}.v387h{margin-top:4px}.v387h td{vertical-align:top;font-size:13px}
</style>
