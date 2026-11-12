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
  var KEY = 'sm382_bc', PKEY = 'sm382_bcparam', NKEY = 'sm382_bcnum', DEV = 'EUR', TVA = 20, WFTYPE = 'Bons de commande';
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(v) { var x = Number(String(v == null ? '' : v).replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(x) ? 0 : x; }
  function m(v) { return Math.round(n(v)).toLocaleString('fr-FR') + ' ' + DEV; }
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
  function pdef() { return { seuil: 20000, alerte: 80, cumul: 'alerte', base: 'fournisseur+categorie', periode: 'Année civile', modele: 'MOD-BC-01', wf: 'WF-BC-01' }; }
  var P = rd(PKEY, null); if (!P || P.seuil == null) P = pdef();
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
  var ST = ['En attente de validation', 'À corriger', 'Rejeté', 'Validé', 'Généré', 'Réceptionné partiellement', 'Réceptionné', 'Annulé'];
  function ech1() { return [{ lib: 'Paiement unique', pct: 100, trig: 'Réception totale', delai: 30 }]; }
  function bc(no, date, objet, f, cat, act, items, statut, extra) {
    var o = { no: no, date: date, objet: objet, fournisseur: f, fin: (catOf(cat) || {}).financement || 'FIN-IDA001', cat: cat, act: act, delai: '15 jours', lieu: 'Siège du projet — Antananarivo', echeances: ech1(), items: items, statut: statut, recu: 0, compta: [], hist: [{ d: date, a: 'Saisie du BC — en attente de validation (workflow WF-BC-01)' }], editions: 0 };
    Object.assign(o, extra || {});
    var gen = ['Généré', 'Réceptionné partiellement', 'Réceptionné'].indexOf(statut) >= 0;
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
  function load() { L = rd(KEY, null); if (!Array.isArray(L)) { L = seed(); save(); } }
  function save() { wr(KEY, L); }
  function find(no) { return L.filter(function (b) { return b.no === no; })[0]; }
  function ht(b) { return (b.items || []).reduce(function (a, i) { return a + n(i.q) * n(i.pu); }, 0); }
  function ttc(b) { return ht(b) * (1 + TVA / 100); }
  function actif(b) { return b.statut !== 'Annulé' && b.statut !== 'Rejeté'; }
  function genere(b) { return (b.compta || []).some(function (x) { return x.t === 'eng'; }) && b.statut !== 'Annulé'; }
  function annee(b) { return String(b.date).slice(-4); }

  /* ---------- Contrôles ---------- */
  function cumul(b) {
    var y = String(new Date().getFullYear()), byCat = P.base !== 'fournisseur';
    return L.filter(function (x) { return x.no !== b.no && actif(x) && x.fournisseur === b.fournisseur && (!byCat || x.cat === b.cat) && (P.periode !== 'Année civile' || annee(x) === y); }).reduce(function (a, x) { return a + ht(x); }, 0) + ht(b);
  }
  function engCat(c, sauf) { return L.filter(function (x) { return x.cat === c && x.no !== sauf && actif(x) && ['Validé', 'Généré', 'Réceptionné partiellement', 'Réceptionné'].indexOf(x.statut) >= 0; }).reduce(function (a, x) { return a + ttc(x); }, 0); }
  function controles(b) {
    var r = [], h = ht(b), S = n(P.seuil), fr = FREF[b.fournisseur], pct = (b.echeances || []).reduce(function (a, e) { return a + n(e.pct); }, 0);
    r.push({ ok: !!String(b.objet || '').trim(), bloq: true, txt: 'Objet de l’achat renseigné' });
    r.push({ ok: !!fr && fr.st === 'Actif', bloq: true, txt: !b.fournisseur ? 'Fournisseur choisi dans le référentiel des opérateurs économiques' : fr && fr.st !== 'Actif' ? b.fournisseur + ' est ' + fr.st.toLowerCase() + ' dans le référentiel : BC impossible' : 'Fournisseur actif dans le référentiel des opérateurs économiques' });
    r.push({ ok: !!b.fin && !!b.cat, bloq: true, txt: 'Financement et catégorie financière renseignés' });
    r.push({ ok: !!b.act, bloq: true, txt: 'Activité renseignée' });
    if (NUM.mode === 'Manuel') r.push({ ok: !!String(b.no || '').trim() && !L.some(function (x) { return x.no === b.no && x !== b && x.no !== b._orig; }), bloq: true, txt: 'Numéro du BC saisi et unique' });
    r.push({ ok: h > 0 && (b.items || []).some(function (i) { return String(i.d).trim(); }), bloq: true, txt: 'Au moins un article avec un montant' });
    r.push({ ok: h <= S, bloq: true, txt: 'Montant ' + m(h) + ' HT ≤ seuil du BC (' + m(S) + ')' + (h > S ? ' — au-delà, un contrat est obligatoire (procédure de passation)' : '') });
    r.push({ ok: Math.round(pct) === 100, bloq: true, txt: 'Échéances : total ' + pct + ' % (doit faire 100 %)' });
    var c = catOf(b.cat); if (c && c.montant_alloue) { var dispo = n(c.montant_alloue) - engCat(b.cat, b.no); r.push({ ok: ttc(b) <= dispo, bloq: true, txt: 'Crédit disponible sur la catégorie ' + c.code + ' : ' + m(dispo) }); }
    if (b.fournisseur && b.cat) {
      var cu = cumul(b), pc = S ? Math.round(cu * 100 / S) : 0, bl = P.cumul === 'bloquant', lab = P.base === 'fournisseur' ? 'chez ' + b.fournisseur : 'chez ' + b.fournisseur + ' pour la catégorie « ' + ((c || {}).libelle || b.cat) + ' »';
      r.push({ ok: cu <= S, bloq: bl, frac: true, txt: 'Anti-fractionnement : cumul des BC ' + lab + ' = ' + m(cu) + ' HT (' + pc + ' % du seuil)' + (cu > S ? ' — ces achats de même nature auraient dû faire l’objet d’un contrat' : '') });
      if (cu <= S && pc >= n(P.alerte)) r.push({ ok: false, bloq: false, txt: 'Cumul proche du seuil (' + pc + ' %) : prévoir un contrat pour les prochains achats de cette nature' });
    }
    return r;
  }
  function bloque(b) { return controles(b).some(function (c) { return !c.ok && c.bloq; }); }
  function alerteFrac(b) { return actif(b) && b.fournisseur && b.cat && cumul(b) > n(P.seuil); }

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
  function pill(s) { var c = { 'En attente de validation': 'v', 'À corriger': 'a', 'Rejeté': 'r', 'Validé': 'b', 'Généré': 'b', 'Réceptionné partiellement': 'a', 'Réceptionné': 'g', 'Annulé': 'x' }[s] || 'a'; return '<span class="v376p ' + c + '">' + esc(s) + '</span>'; }
  function can(b) {
    var s = b.statut, inst = valInst(b), noDecision = !inst || inst.etapes.every(function (e) { return !(e.decisions || []).length; });
    return { voir: true, modif: s === 'À corriger' || (s === 'En attente de validation' && noDecision), edit: ['Validé', 'Généré', 'Réceptionné partiellement', 'Réceptionné'].indexOf(s) >= 0, gen: s === 'Validé', recep: s === 'Généré' || s === 'Réceptionné partiellement', annul: ['En attente de validation', 'À corriger', 'Validé', 'Généré'].indexOf(s) >= 0, valid: s === 'En attente de validation' && !!inst };
  }
  var ACT = [['voir', 'Consulter'], ['modif', 'Modifier'], ['edit', 'Éditer le BC'], ['gen', 'Générer vers Softaccounting'], ['recep', 'Réceptionner'], ['valid', 'Ouvrir dans Validation › À traiter'], ['annul', 'Annuler le BC']];
  function actions(b) { var c = can(b); return '<div class="v382ic">' + ACT.filter(function (a) { return c[a[0]]; }).map(function (a) { return '<button class="v382i ' + a[0] + '" data-v382="' + a[0] + '" data-no="' + esc(b.no) + '" title="' + a[1] + '" aria-label="' + a[1] + ' ' + esc(b.no) + '">' + ico(a[0]) + '</button>'; }).join('') + '</div>'; }
  function kpis() {
    var att = L.filter(function (b) { return b.statut === 'En attente de validation' || b.statut === 'À corriger'; }).length, val = L.filter(function (b) { return b.statut === 'Validé'; }).length;
    var eng = L.filter(genere).reduce(function (a, b) { return a + ttc(b); }, 0), fr = L.filter(alerteFrac).length;
    return '<div class="v134-kpis"><div class="v134-kpi"><b>' + att + '</b><span>En attente de validation</span></div><div class="v134-kpi"><b>' + val + '</b><span>Validés, à générer vers la compta</span></div><div class="v134-kpi"><b>' + m(eng) + '</b><span>Engagé dans Softaccounting (TTC)</span></div><div class="v134-kpi"><b>' + fr + '</b><span>Alertes de fractionnement</span></div></div>';
  }
  function liste() {
    var vis = L.filter(function (b) { return !F || b.statut === F; }).slice().sort(function (a, b) { return b.no.localeCompare(a.no); });
    return '<div class="v134-card"><div class="v134-cardhead"><div><h2>Bons de commande</h2><span class="v377sub">Achats hors contrats, sous le seuil de ' + m(P.seuil) + ' HT.</span></div>' +
      '<div class="v134-toolbar"><button class="v134-btn" data-v382="num">' + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg> Numérotation</button>' +
      '<select class="v134-select" id="v382f" aria-label="Filtrer par statut"><option value="">Tous les statuts</option>' + ST.map(function (s) { return '<option' + (s === F ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select><button class="v134-btn primary" data-v382="nouveau">+ Nouveau bon de commande</button></div></div>' +
      '<table class="v134-table v382t"><thead><tr><th>N° BC</th><th>Objet</th><th>Fournisseur</th><th>Activité</th><th>Montant TTC</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead><tbody>' +
      (vis.map(function (b) { return '<tr class="' + (b.statut === 'Annulé' ? 'ann' : '') + '"><td><strong>' + esc(b.no) + '</strong></td><td>' + esc(b.objet) + (alerteFrac(b) ? '<br><span class="v377warn" title="Cumul au-delà du seuil pour ce fournisseur et cette catégorie">⚠ fractionnement</span>' : '') + '</td><td>' + esc(b.fournisseur) + '</td><td>' + esc(actLib(b.act)) + '</td><td class="v377n">' + m(ttc(b)) + '</td><td>' + esc(b.date) + '</td><td>' + pill(b.statut) + '</td><td>' + actions(b) + '</td></tr>'; }).join('') || '<tr><td colspan="8">Aucun bon de commande pour ce filtre.</td></tr>') + '</tbody></table>' +
      '<div class="v382leg">' + ACT.map(function (a) { return '<span>' + ico(a[0]) + a[1] + '</span>'; }).join('') + '</div></div>';
  }
  function etatSeuils() {
    var y = new Date().getFullYear(), S = n(P.seuil), g = {};
    L.filter(function (b) { return actif(b) && b.cat && (P.periode !== 'Année civile' || annee(b) === String(y)); }).forEach(function (b) { var k = b.fournisseur + '|' + (P.base === 'fournisseur' ? '' : b.cat); (g[k] = g[k] || { f: b.fournisseur, c: P.base === 'fournisseur' ? '' : b.cat, nb: 0, t: 0 }); g[k].nb++; g[k].t += ht(b); });
    var rows = Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.t - a.t; });
    return '<div class="v134-card"><div class="v134-cardhead"><div><h2>Contrôle des seuils ' + y + '</h2><span class="v377sub">Seuil du BC : ' + m(S) + ' HT. Le cumul ne regroupe que les BC de même nature : même fournisseur' + (P.base === 'fournisseur' ? '' : ' et même catégorie financière') + '. Des achats différents (autre catégorie) ne sont pas cumulés. Alerte à ' + n(P.alerte) + ' %.</span></div><button class="v134-btn" data-v382="param">Modifier le seuil (Paramétrage)</button></div>' +
      '<table class="v134-table"><thead><tr><th>Fournisseur</th>' + (P.base === 'fournisseur' ? '' : '<th>Catégorie</th>') + '<th>Nombre de BC</th><th>Cumul HT</th><th style="width:22%">Part du seuil</th><th>Situation</th></tr></thead><tbody>' +
      rows.map(function (x) { var pr = Math.round(x.t * 100 / S), pc = Math.min(100, pr), ko = x.t > S, near = pr >= n(P.alerte); return '<tr><td><b>' + esc(x.f) + '</b></td>' + (P.base === 'fournisseur' ? '' : '<td>' + esc(catLib(x.c)) + '</td>') + '<td>' + x.nb + '</td><td class="v377n">' + m(x.t) + '</td><td><div class="v377bar"><i style="width:' + pc + '%;background:' + (ko ? '#fca5a5' : near ? '#fcd34d' : '#9fb1e3') + '"></i></div><small>' + pr + ' %</small></td><td>' + (ko ? '<span class="v376p r">Seuil dépassé — contrat requis</span>' : near ? '<span class="v376p a">Proche du seuil</span>' : '<span class="v376p g">Conforme</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function fin(b) { var t = (b.compta || []).map(function (x) { return x.t; }), v = ttc(b), e = t.indexOf('eng') >= 0 && t.indexOf('ann') < 0 ? v : 0, f = t.indexOf('fac') >= 0 ? v : 0, p = t.indexOf('pay') >= 0 ? v : 0; return { eng: e, fac: f, pay: p, reste: e - p, sit: t.indexOf('ann') >= 0 ? 'Engagement annulé' : p ? 'Payé' : f ? 'Facture comptabilisée' : e ? 'Engagé' : '—' }; }
  function etatFinancier() {
    var rows = L.filter(function (b) { return (b.compta || []).some(function (x) { return x.t === 'eng'; }); }).sort(function (a, b) { return a.no.localeCompare(b.no); }), T = { eng: 0, fac: 0, pay: 0, reste: 0 };
    var body = rows.map(function (b) { var x = fin(b); ['eng', 'fac', 'pay', 'reste'].forEach(function (k) { T[k] += x[k]; }); return '<tr><td><strong>' + esc(b.no) + '</strong><br><small>' + esc(b.objet) + '</small></td><td>' + esc(b.fournisseur) + '</td><td>' + esc(actLib(b.act)) + '</td><td>ENG-' + esc(b.no.slice(3)) + '</td><td class="v377n">' + m(x.eng) + '</td><td class="v377n">' + m(x.fac) + '</td><td class="v377n">' + m(x.pay) + '</td><td class="v377n"><b>' + m(x.reste) + '</b></td><td>' + esc(x.sit) + '</td></tr>'; }).join('');
    return '<div class="v134-card"><div class="v134-cardhead"><div><h2>État de suivi financier des bons de commande</h2><span class="v377sub">Données lues dans Softaccounting (lecture seule) · dernière synchronisation : ' + esc(SYNC) + '. Seuls les BC générés vers la comptabilité apparaissent.</span></div><button class="v134-btn" data-v382="sync">Actualiser depuis Softaccounting</button></div>' +
      '<table class="v134-table"><thead><tr><th>Bon de commande</th><th>Fournisseur</th><th>Activité</th><th>N° engagement</th><th>Engagé TTC</th><th>Facturé TTC</th><th>Payé TTC</th><th>Reste à payer</th><th>Situation compta</th></tr></thead><tbody>' + (body || '<tr><td colspan="9">Aucun BC généré vers Softaccounting.</td></tr>') +
      '<tr class="v377total"><td colspan="4"><b>Total</b></td><td class="v377n"><b>' + m(T.eng) + '</b></td><td class="v377n"><b>' + m(T.fac) + '</b></td><td class="v377n"><b>' + m(T.pay) + '</b></td><td class="v377n"><b>' + m(T.reste) + '</b></td><td></td></tr></tbody></table></div>';
  }
  function render() {
    var pg = document.getElementById('page-v377-bc'); if (!pg) return;
    pg.innerHTML = kpis() + '<div class="v377tabs">' + [['liste', 'Bons de commande'], ['seuils', 'Contrôle des seuils'], ['budget', 'État de suivi financier']].map(function (t) { return '<button data-v382tab="' + t[0] + '" class="' + (TAB === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      (TAB === 'seuils' ? etatSeuils() : TAB === 'budget' ? etatFinancier() : liste());
    var f = document.getElementById('v382f'); if (f) f.onchange = function () { F = this.value; render(); };
  }

  /* ---------- Fenêtres ---------- */
  function toast(t) { var d = document.createElement('div'); d.className = 'v376toast'; d.innerHTML = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4200); }
  function modal(title, sub, body, okLab, onOk, closeLab, wide) {
    var md = document.createElement('div'); md.className = 'v376m';
    md.innerHTML = '<div class="v376dlg"' + (wide ? ' style="width:min(1080px,100%)"' : '') + '><div class="v376mh"><div><b>' + title + '</b><small>' + sub + '</small></div><button class="v134-btn" data-x aria-label="Fermer">✕</button></div><div class="v376mb">' + body + '</div><div class="v376mf"><button class="v134-btn" data-x>' + (closeLab || 'Annuler') + '</button>' + (okLab ? '<button class="v134-btn primary" data-ok>' + okLab + '</button>' : '') + '</div></div>';
    document.body.appendChild(md);
    md.addEventListener('click', function (e) { if (e.target === md || e.target.closest('[data-x]')) md.remove(); if (e.target.closest('[data-ok]')) { if (onOk(md) !== false) md.remove(); } });
    return md;
  }
  function opt(arr, v, ph) { return '<option value="">' + ph + '</option>' + arr.map(function (a) { var val = a.v != null ? a.v : a; return '<option value="' + esc(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + esc(a.l || a) + '</option>'; }).join(''); }

  /* Saisie en deux étapes : Informations, Articles */
  function form(src) {
    var b = src ? JSON.parse(JSON.stringify(src)) : { no: genNo(), date: today(), objet: '', fournisseur: '', fin: (FINS()[0] || {}).code || '', cat: '', act: '', delai: '15 jours', lieu: 'Siège du projet — Antananarivo', echeances: ech1(), items: [{ d: '', q: 1, pu: 0 }], statut: 'En attente de validation', recu: 0, compta: [], hist: [], editions: 0 };
    if (src) b._orig = src.no; var step = 1;
    var md = modal(src ? 'Modifier ' + esc(b.no) : 'Nouveau bon de commande', 'Étape 1 sur 2 · Informations', '<div class="v382steps"><span class="on">1. Informations</span><span>2. Articles</span></div><div id="v382form"></div>', '', null, 'Annuler', true);
    var foot = md.querySelector('.v376mf');
    var prev = document.createElement('button'), next = document.createElement('button'); prev.className = 'v134-btn'; prev.textContent = '← Précédent'; next.className = 'v134-btn primary';
    foot.appendChild(prev); foot.appendChild(next);
    prev.onclick = function () { step = 1; paint(); };
    next.onclick = function () {
      if (step === 1) { var miss = []; if (!String(b.objet).trim()) miss.push('objet'); if (!b.fournisseur) miss.push('fournisseur'); if (!b.fin || !b.cat) miss.push('financement et catégorie'); if (!b.act) miss.push('activité'); if (NUM.mode === 'Manuel' && !String(b.no).trim()) miss.push('numéro'); if (miss.length) { toast('À compléter : ' + miss.join(', ') + '.'); return; } step = 2; paint(); return; }
      b.items = b.items.filter(function (i) { return String(i.d).trim(); }); if (!b.items.length) b.items = [{ d: '', q: 1, pu: 0 }];
      if (bloque(b)) { paint(); toast('Enregistrement impossible : ' + esc(controles(b).filter(function (c) { return !c.ok && c.bloq; })[0].txt)); return; }
      var orig = b._orig; delete b._orig;
      if (alerteFrac(b)) b.hist.push({ d: now(), a: 'Alerte de fractionnement signalée au valideur' });
      if (src) { b.hist.push({ d: now(), a: 'Modification du BC' }); var i = L.findIndex(function (x) { return x.no === orig; }); L[i] = b; } else { b.hist.push({ d: now(), a: 'Saisie du BC' }); L.push(b); }
      soumettre(b); save(); md.remove(); TAB = 'liste'; render();
      toast('<b>' + esc(b.no) + '</b> enregistré : en attente de validation (Validation › À traiter).');
    };
    function paint() {
      var box = md.querySelector('#v382form'), ctl = controles(b);
      md.querySelector('.v376mh small').textContent = 'Étape ' + step + ' sur 2 · ' + (step === 1 ? 'Informations' : 'Articles');
      md.querySelectorAll('.v382steps span').forEach(function (s, k) { s.className = k + 1 === step ? 'on' : k + 1 < step ? 'ok' : ''; });
      prev.style.display = step === 1 ? 'none' : ''; next.textContent = step === 1 ? 'Suivant : Articles →' : 'Enregistrer';
      if (step === 1) {
        var fr = FREF[b.fournisseur], cats = CATS(b.fin), pct = b.echeances.reduce(function (a, e) { return a + n(e.pct); }, 0);
        box.innerHTML = '<div class="v377grid">' +
          '<div class="v134-field" style="grid-column:1/-1"><label for="v382o">Objet de l’achat *</label><input class="v134-input" id="v382o" data-k="objet" value="' + esc(b.objet) + '" placeholder="Ex. Réparation des climatiseurs de la salle serveur">' +
          '<div class="v382no"><span>N° BC</span>' + (NUM.mode === 'Manuel' ? '<input class="v134-input" data-k="no" value="' + esc(b.no) + '" placeholder="Saisir le numéro" aria-label="Numéro du BC">' : '<b>' + esc(b.no) + '</b><small>attribué automatiquement</small>') + '</div></div>' +
          '<div class="v134-field"><label>Fournisseur *</label><select class="v134-select" data-k="fournisseur">' + opt(FOURN.map(function (f) { return { v: f, l: f + (FREF[f].st !== 'Actif' ? ' (' + FREF[f].st.toLowerCase() + ')' : '') }; }), b.fournisseur, 'Choisir dans le référentiel') + '</select><small class="v380src">Référentiel des opérateurs économiques' + (fr ? ' · NIF ' + fr.nif + ' · ' + fr.st : '') + '</small></div>' +
          '<div class="v134-field"><label>Activité *</label><select class="v134-select" data-k="act">' + opt(ACTS().map(function (a) { return { v: a.code, l: new Array(a.niveau).join('  ') + a.code + ' — ' + a.libelle }; }), b.act, 'Choisir une activité') + '</select><small class="v380src">Plan d’activités (Paramétrage › Plans &amp; Financements)</small></div>' +
          '<div class="v134-field"><label>Financement *</label><select class="v134-select" data-k="fin">' + opt(FINS().map(function (f) { return { v: f.code, l: f.code + ' — ' + f.libelle }; }), b.fin, 'Choisir un financement') + '</select><small class="v380src">Paramétrage › Financements</small></div>' +
          '<div class="v134-field"><label>Catégorie *</label><select class="v134-select" data-k="cat">' + opt(cats.map(function (c) { return { v: c.code, l: c.code + ' — ' + c.libelle }; }), b.cat, cats.length ? 'Choisir une catégorie' : 'Aucune catégorie pour ce financement') + '</select><small class="v380src">Catégories financières paramétrées pour ce financement</small></div>' +
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
          '<div class="v377ctl"><b>Contrôles automatiques</b>' + ctl.map(function (c) { return '<div class="' + (c.ok ? 'ok' : c.bloq ? 'ko' : 'wa') + '">' + (c.ok ? '✓' : c.bloq ? '✕' : '⚠') + ' ' + esc(c.txt) + (!c.ok && !c.bloq ? ' <small>(alerte non bloquante, signalée au valideur)</small>' : '') + '</div>'; }).join('') + '</div>' +
          '<p class="v377sub">À l’enregistrement, le BC passe automatiquement « En attente de validation » et part dans Validation › À traiter (workflow ' + esc(wfCur().code) + ').</p>';
      }
      box.querySelectorAll('[data-k]').forEach(function (el) { el.onchange = function () { b[el.dataset.k] = el.value; if (el.dataset.k === 'fin') b.cat = ''; paint(); }; if (el.tagName === 'INPUT') el.oninput = function () { b[el.dataset.k] = el.value; }; });
      box.querySelectorAll('[data-e]').forEach(function (el) { el.onchange = function () { b.echeances[+el.dataset.e][el.dataset.f] = el.dataset.f === 'lib' || el.dataset.f === 'trig' ? el.value : n(el.value); paint(); }; });
      box.querySelectorAll('[data-edel]').forEach(function (el) { el.onclick = function () { b.echeances.splice(+el.dataset.edel, 1); paint(); }; });
      var ea = box.querySelector('[data-eadd]'); if (ea) ea.onclick = function () { var r = 100 - b.echeances.reduce(function (a, e) { return a + n(e.pct); }, 0); b.echeances.push({ lib: 'Solde', pct: Math.max(0, r), trig: 'Réception totale', delai: 30 }); paint(); };
      box.querySelectorAll('[data-i]').forEach(function (el) { el.oninput = function () { b.items[+el.dataset.i][el.dataset.f] = el.value; var k = +el.dataset.i, hh = ht(b); box.querySelector('[data-tot="' + k + '"]').textContent = m(n(b.items[k].q) * n(b.items[k].pu)); box.querySelector('[data-ht]').textContent = m(hh); box.querySelector('[data-tva]').textContent = m(hh * TVA / 100); box.querySelector('[data-ttc]').textContent = m(ttc(b)); }; el.onchange = function () { paint(); }; });
      box.querySelectorAll('[data-del]').forEach(function (el) { el.onclick = function () { b.items.splice(+el.dataset.del, 1); paint(); }; });
      var ad = box.querySelector('[data-add]'); if (ad) ad.onclick = function () { b.items.push({ d: '', q: 1, pu: 0 }); paint(); };
    }
    paint();
  }

  function circuit(b) {
    var inst = valInst(b), w = inst ? { code: inst.workflow_code, etapes: inst.etapes } : wfCur();
    var done = ['Validé', 'Généré', 'Réceptionné partiellement', 'Réceptionné'].indexOf(b.statut) >= 0;
    return '<div class="v380circ"><b>Circuit de validation — ' + esc(w.code) + '</b><small>Étapes définies dans Paramétrage › Workflows (type « ' + WFTYPE + ' »). Les décisions se prennent dans Validation › À traiter.</small><ol style="grid-template-columns:repeat(' + w.etapes.length + ',minmax(0,1fr))">' +
      w.etapes.map(function (e, k) { var s = e.statut || '', st = done || s === 'Validée' ? 'ok' : s === 'Rejetée' || s === 'Retournée' ? 'ko' : s === 'À traiter' ? 'cur' : ''; var dec = (e.decisions || []).slice(-1)[0]; return '<li class="' + st + '"><span>' + (st === 'ok' ? '✓' : st === 'ko' ? '✕' : k + 1) + '</span><div><b>' + esc(e.libelle) + '</b><small>' + esc((e.validateurs || []).map(function (v) { return v.type + ' : ' + v.ref; }).join(', ')) + '</small><em>' + (dec ? esc(dec.decision + ' — ' + dec.validateur + ', ' + dec.date) : st === 'cur' ? 'À traiter' : 'Délai ' + esc(e.duree_h) + ' h') + '</em></div></li>'; }).join('') + '</ol></div>';
  }
  function docBC(b, mod) {
    var info = function (k, v) { return '<div><small>' + k + '</small><b>' + v + '</b></div>'; };
    return '<div class="v377doc"><div class="v377dochead"><div><b>BON DE COMMANDE N° ' + esc(b.no) + '</b><small>Date : ' + esc(b.date) + (mod ? ' · ' + esc(mod.code + ' ' + mod.libelle) : '') + '</small></div>' + pill(b.statut) + '</div>' +
      '<div class="v376sum" style="grid-template-columns:repeat(3,1fr);margin:10px 0">' + info('Fournisseur', esc(b.fournisseur) + (FREF[b.fournisseur] ? ' · NIF ' + FREF[b.fournisseur].nif : '')) + info('Objet', esc(b.objet)) + info('Activité', esc(actLib(b.act))) + info('Financement', esc(finLib(b.fin))) + info('Catégorie', esc(catLib(b.cat))) + info('Livraison', esc(b.delai) + ' · ' + esc(b.lieu)) + '</div>' +
      '<table class="v134-table"><thead><tr><th>Désignation</th><th>Qté</th><th>PU HT</th><th>Total HT</th></tr></thead><tbody>' + b.items.map(function (i) { return '<tr><td>' + esc(i.d) + '</td><td>' + esc(i.q) + '</td><td>' + m(i.pu) + '</td><td>' + m(n(i.q) * n(i.pu)) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="3" style="text-align:right">Total HT</td><td>' + m(ht(b)) + '</td></tr><tr><td colspan="3" style="text-align:right">TVA ' + TVA + ' %</td><td>' + m(ht(b) * TVA / 100) + '</td></tr><tr><td colspan="3" style="text-align:right"><b>Total TTC</b></td><td><b>' + m(ttc(b)) + '</b></td></tr></tfoot></table>' +
      '<table class="v134-table" style="margin-top:10px"><thead><tr><th>Échéance</th><th>%</th><th>Montant</th><th>Déclencheur</th><th>Délai</th></tr></thead><tbody>' + (b.echeances || []).map(function (e) { return '<tr><td>' + esc(e.lib) + '</td><td>' + esc(e.pct) + ' %</td><td>' + m(ttc(b) * n(e.pct) / 100) + '</td><td>' + esc(e.trig) + '</td><td>' + esc(e.delai) + ' jours</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function consulter(b) {
    modal('Bon de commande ' + esc(b.no), esc(b.fournisseur) + ' · ' + esc(b.date), docBC(b) + circuit(b) +
      (b.annul ? '<div class="v382ann"><b>BC annulé le ' + esc(b.annul.d) + '</b> — ' + esc(b.annul.motif) + '</div>' : '') +
      '<div class="v376cols" style="margin-top:14px"><div><h4>Échanges avec Softaccounting</h4><ul class="v376hist">' + ((b.compta || []).length ? b.compta.slice().reverse().map(function (x) { return '<li><small>' + esc(x.d) + '</small>' + esc(x.a) + '</li>'; }).join('') : '<li>Aucun échange : le BC sera envoyé à la compta avec l’action « Générer », après validation.</li>') + '</ul></div>' +
      '<div><h4>Historique</h4><ul class="v376hist">' + (b.hist || []).slice().reverse().map(function (x) { return '<li><small>' + esc(x.d) + '</small>' + esc(x.a) + '</li>'; }).join('') + '</ul></div></div>', '', null, 'Fermer', true);
  }
  function editer(b) {
    var mods = MODELES(), mod = mods.filter(function (x) { return x.code === P.modele; })[0] || mods[0] || MDL_BC[0];
    modal('Éditer le BC ' + esc(b.no), 'Modèle ' + esc(mod.code + ' — ' + mod.libelle) + ' (Paramétrage › Bons de commande)', '<div class="v382paper">' + docBC(b, mod) + '<div class="v382sig"><div>Le fournisseur<br><small>Accusé de réception</small></div><div>L’ordonnateur<br><small>Signature et cachet</small></div></div></div>',
      'Télécharger le BC (PDF)', function () { b.editions = (b.editions || 0) + 1; b.hist.push({ d: now(), a: 'BC édité (' + mod.code + ')' }); save(); render(); toast('BC <b>' + esc(b.no) + '</b> édité avec le modèle ' + esc(mod.code) + ' (démonstration).'); }, 'Fermer', true);
  }
  function generer(b) {
    modal('Générer ' + esc(b.no) + ' vers Softaccounting', esc(b.fournisseur) + ' · ' + m(ttc(b)) + ' TTC', '<p>Le BC validé est envoyé à Softaccounting, qui crée l’engagement sur la catégorie <b>' + esc(catLib(b.cat)) + '</b> (financement ' + esc(finLib(b.fin)) + ', activité ' + esc(actLib(b.act)) + ').</p><div class="v377send"><small>Données transmises</small>N° BC · code tiers du fournisseur · activité · financement · catégorie · montants HT / TVA / TTC · échéances · date</div>',
      'Générer', function () { b.statut = 'Généré'; b.compta.push({ d: now(), a: 'BC généré — engagement ENG-' + b.no.slice(3) + ' créé dans Softaccounting (' + m(ttc(b)) + ')', t: 'eng' }); b.hist.push({ d: now(), a: 'Généré vers Softaccounting' }); save(); render(); toast('<b>' + esc(b.no) + '</b> généré : engagement créé dans Softaccounting.'); });
  }
  function receptionner(b) {
    var deja = n(b.recu);
    modal('Réceptionner ' + esc(b.no), esc(b.fournisseur) + (deja ? ' · déjà reçu ' + deja + ' %' : ''), '<table class="v134-table"><thead><tr><th>Article</th><th>Commandé</th><th>Reçu</th></tr></thead><tbody>' + b.items.map(function (i, k) { return '<tr><td>' + esc(i.d) + '</td><td>' + esc(i.q) + '</td><td><input class="v134-input" type="number" min="0" max="' + esc(i.q) + '" data-r="' + k + '" value="' + esc(i.q) + '" style="width:90px" aria-label="Quantité reçue"></td></tr>'; }).join('') + '</tbody></table><div class="v134-field" style="margin-top:10px"><label>Réserves éventuelles</label><input class="v134-input" id="v382res" style="width:100%"></div>',
      'Enregistrer la réception', function (md) { var tq = 0, tr = 0; md.querySelectorAll('[data-r]').forEach(function (x) { var i = b.items[+x.dataset.r]; tq += n(i.q); tr += Math.min(n(x.value), n(i.q)); }); var p = tq ? Math.round(tr * 100 / tq) : 0, res = md.querySelector('#v382res').value.trim(); b.recu = Math.max(deja, p); b.statut = b.recu >= 100 ? 'Réceptionné' : 'Réceptionné partiellement'; b.hist.push({ d: now(), a: (b.recu >= 100 ? 'Réception totale' : 'Réception partielle (' + b.recu + ' %)') + (res ? ' — réserves : ' + res : '') }); save(); render(); toast('Réception enregistrée pour <b>' + esc(b.no) + '</b>.'); });
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
    pg.innerHTML = '<div class="v382ph"><div class="v134-eyebrow">Paramétrage</div><h1>Bons de commande</h1><p>Seuil, contrôle du fractionnement, modèle d’édition et workflow de validation. La numérotation se règle dans Contractualisation › Bons de commande.</p></div>' +
      '<div class="v380grid"><div class="v134-card"><div class="v134-cardhead"><div><h2>Seuil du bon de commande</h2><span class="v377sub">Montant HT maximum d’un BC, tous achats confondus. Au-delà, l’achat passe par un contrat.</span></div></div>' +
      '<div class="v377grid"><div class="v134-field"><label for="v382se">Seuil HT (' + DEV + ')</label><input class="v134-input" type="number" min="0" step="500" id="v382se" value="' + esc(P.seuil) + '"></div>' +
      '<div class="v134-field"><label for="v380al">Alerte « proche du seuil » à</label><select class="v134-select" id="v380al">' + [70, 80, 90].map(function (x) { return '<option value="' + x + '"' + (n(P.alerte) === x ? ' selected' : '') + '>' + x + ' % du seuil</option>'; }).join('') + '</select></div>' +
      '<div class="v134-field"><label for="v382ba">Cumul anti-fractionnement</label><select class="v134-select" id="v382ba"><option value="fournisseur+categorie"' + (P.base !== 'fournisseur' ? ' selected' : '') + '>Par fournisseur et catégorie (achats de même nature)</option><option value="fournisseur"' + (P.base === 'fournisseur' ? ' selected' : '') + '>Par fournisseur, toutes catégories</option></select></div>' +
      '<div class="v134-field"><label for="v380cu">Si le cumul dépasse le seuil</label><select class="v134-select" id="v380cu"><option value="alerte"' + (P.cumul !== 'bloquant' ? ' selected' : '') + '>Alerte au valideur, non bloquante</option><option value="bloquant"' + (P.cumul === 'bloquant' ? ' selected' : '') + '>Bloquer l’enregistrement du BC</option></select></div>' +
      '<div class="v134-field"><label for="v380pe">Période du cumul</label><select class="v134-select" id="v380pe">' + ['Année civile', '12 mois glissants'].map(function (x) { return '<option' + (P.periode === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div></div></div>' +
      '<div class="v134-card"><div class="v134-cardhead"><div><h2>Modèle d’édition du BC</h2><span class="v377sub">Utilisé par l’action « Éditer le BC », après validation. Les modèles se gèrent dans Paramétrage › Modèles (type de document « Bon de commande »).</span></div></div><div class="v134-field"><label for="v380mo">Modèle</label><select class="v134-select" id="v380mo">' + mods.map(function (x) { return '<option value="' + esc(x.code) + '"' + (P.modele === x.code ? ' selected' : '') + '>' + esc(x.code + ' — ' + x.libelle + ' (' + x.format + ')') + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="v134-card v380full"><div class="v134-cardhead"><div><h2>Workflow de validation</h2><span class="v377sub">Le circuit se paramètre dans Paramétrage › Workflows (type de validation « ' + WFTYPE + ' »). Les BC sont validés dans Validation › À traiter.</span></div><button class="v134-btn" id="v381gw">Gérer les workflows</button></div>' +
      '<div class="v134-field"><label for="v381wf">Workflow appliqué</label><select class="v134-select" id="v381wf">' + wfActifs().map(function (x) { return '<option value="' + esc(x.code) + '"' + (x.code === w.code ? ' selected' : '') + '>' + esc(x.code + ' — ' + x.libelle + ' (' + x.etapes.length + ' étapes, v' + x.version + ')') + '</option>'; }).join('') + '</select></div>' +
      '<table class="v134-table"><thead><tr><th>Étape</th><th>Validateurs</th><th>Mode</th><th>Délai</th></tr></thead><tbody id="v381steps">' + stepsRows(w) + '</tbody></table></div></div>' +
      '<div class="v380act"><button class="v134-btn" id="v380rz">Rétablir les valeurs par défaut</button><button class="v134-btn primary" id="v380ok">Enregistrer le paramétrage</button></div>';
    var sw = pg.querySelector('#v381wf'); sw.onchange = function () { var x = wfActifs().filter(function (y) { return y.code === sw.value; })[0]; if (x) pg.querySelector('#v381steps').innerHTML = stepsRows(x); };
    pg.querySelector('#v381gw').onclick = function () { var l = document.getElementById('leaf-2-12'); if (l) selectLeaf(l); };
    pg.querySelector('#v380ok').onclick = function () { P.seuil = n(pg.querySelector('#v382se').value); P.alerte = n(pg.querySelector('#v380al').value); P.base = pg.querySelector('#v382ba').value; P.cumul = pg.querySelector('#v380cu').value; P.periode = pg.querySelector('#v380pe').value; P.modele = pg.querySelector('#v380mo').value; P.wf = sw.value; psave(); render(); renderParam(); toast('Paramétrage enregistré.'); };
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
    var x = e.target.closest && e.target.closest('[data-v382]'); if (!x) return;
    e.stopPropagation(); var a = x.dataset.v382;
    if (a === 'nouveau') return form(null);
    if (a === 'num') return ouvrirNum();
    if (a === 'param') { var l = document.getElementById('leaf-2-bc'); renderParam(); if (l) selectLeaf(l); return; }
    if (a === 'sync') { L.forEach(function (b) { if (b.statut === 'Annulé') return; var t = (b.compta || []).map(function (c) { return c.t; }); if (b.statut === 'Réceptionné' && t.indexOf('fac') < 0) b.compta.push({ d: now(), a: 'Facture comptabilisée (retour Softaccounting)', t: 'fac' }); else if (t.indexOf('fac') >= 0 && t.indexOf('pay') < 0) b.compta.push({ d: now(), a: 'Paiement effectué (retour Softaccounting)', t: 'pay' }); }); SYNC = now(); save(); render(); toast('État actualisé depuis Softaccounting (démonstration).'); return; }
    var b = find(x.dataset.no); if (!b) return;
    if (a === 'voir') consulter(b); else if (a === 'modif') form(b); else if (a === 'edit') editer(b); else if (a === 'gen') generer(b); else if (a === 'recep') receptionner(b); else if (a === 'annul') annuler(b); else if (a === 'valid') ouvrirValidation(b);
  }, true);

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
</style>
