<script id="v372-demo-exemples">
/* V372 — Exemples de démonstration : un cas concret par menu resté vide.
   Données injectées une seule fois (clé sm372_demo_v1), sans écraser les saisies existantes. */
(function () {
  "use strict";
  var FLAG = 'sm372_demo_v1';
  function rd(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var TAG = '<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#fff4e0;color:#9a5b00;font-size:11px;font-weight:700;vertical-align:middle">Exemple de démonstration</span>';

  /* ---------- (a) Exécution des contrats ---------- */
  function seedExec() {
    if (!window.SM354 || !window.SM353) return false;
    var nos = ['CTR-2027-001', 'CTR-2027-002', 'CTR-2027-003'];
    try { nos.forEach(function (n) { SM354.box(n); }); } catch (e) { return false; }
    var a = rd('sm354_exec', {});
    function has(arr, ref) { return (arr || []).some(function (x) { return x.ref === ref; }); }
    var b2 = a['CTR-2027-002'], b1 = a['CTR-2027-001'], b3 = a['CTR-2027-003'];
    if (b2) {
      if (!b2.suspensions.length) b2.suspensions.push({ ref: 'SUS-01', reason: 'Intempéries — fortes pluies de la saison cyclonique (OS d’arrêt n°2)', start: '08/02/2027', end: '22/02/2027', days: 14, status: 'Reprise' });
      if (!b2.amendments.length) b2.amendments.push({ ref: 'AV-01', object: 'Travaux supplémentaires — réfection de la toiture du bâtiment B', just: 'Dégradation constatée lors de la dépose (PV de constat du 12/01/2027)', amount_delta: 7400000, days_delta: 21, impact: '7 400 000 MGA · 21 j', status: 'Projet' });
    }
    if (b1 && !b1.receptions.length) b1.receptions.push({ ref: 'REC-PV-01', type: 'Réception provisoire', date: '18/03/2027', reserves: 2, obs: '2 postes livrés sans licence bureautique ; 1 écran rayé à remplacer', status: 'Avec réserves' });
    if (b1 && !b1.penalties.length) b1.penalties.push({ ref: 'PEN-01', jalon: 'Livraison lot écrans (jalon 2)', days: 6, amount: 750000, date: '28/02/2027', status: 'Appliquée' });
    if (b1 && !b1.amendments.length) b1.amendments.push({ ref: 'AV-01', object: 'Ajout de 10 onduleurs pour la salle serveur', just: 'Coupures électriques fréquentes constatées à l’installation', amount_delta: 4800000, days_delta: 15, impact: '4 800 000 MGA · 15 j', status: 'Approuvé' });
    if (b1 && !b1.suspensions.length) b1.suspensions.push({ ref: 'SUS-01', reason: 'Locaux de la salle serveur non disponibles (travaux électriques de l’administration)', start: '10/01/2027', end: '17/01/2027', days: 7, status: 'Reprise' });
    if (b3 && !b3.receptions.length) b3.receptions.push({ ref: 'REC-PV-01', type: 'Réception partielle', date: '28/02/2027', reserves: 0, obs: 'Rapport de démarrage et module 1 de formation validés', status: 'Prononcée' });
    if (b3 && !b3.claims.length) b3.claims.push({ ref: 'REC-01', from: 'Titulaire', object: 'Remboursement des frais de déplacement — atelier de Toamasina', amount: 2350000, desc: 'Atelier délocalisé à la demande de l’autorité contractante.', date: '03/03/2027', status: 'En instruction' });
    if (b1 && !has(b1.claims, 'REC-01')) b1.claims.push({ ref: 'REC-01', from: 'Autorité contractante', object: 'Retard de livraison de 6 jours sur le lot écrans', amount: 0, desc: 'Demande d’explication avant application des pénalités.', date: '25/02/2027', status: 'Acceptée' });
    wr('sm354_exec', a);
    try { SM354.refresh(); } catch (e) {}
    return true;
  }

  /* ---------- (b) Candidatures / Présélection ---------- */
  function seedCand() {
    var calls = rd('sm343_calls', {}), code = 'CONS-2026-0042';
    if (!calls[code]) {
      calls[code] = { code: code, dao: 'AMI-2026-0042', title: 'Présélection — Maîtrise d’œuvre pour la construction de 3 CSB II', objet: 'Études, suivi et contrôle des travaux de 3 centres de santé de base niveau II (Analamanga).', type: 'Prestations intellectuelles', mode: 'Appel d’offres restreint', deadline: '2026-11-05T12:00:00.000Z', published: '2026-10-20T08:00:00.000Z', status: 'Ouvert', sim: false,
        criteria: [{ code: 'Q1', label: 'Capacité financière (chiffre d’affaires)', doc: 'États financiers' }, { code: 'Q2', label: 'Expériences similaires', doc: 'Attestations de bonne exécution' }, { code: 'Q3', label: 'Moyens humains et matériels', doc: 'CV / liste du matériel' }] };
      wr('sm343_calls', calls);
    }
    var cands = rd('sm343_cands', []);
    if (!cands.some(function (x) { return x.code === code; })) {
      var docs = { 'États financiers': 'Etats_financiers_2023-2025.pdf', 'Attestations de bonne exécution': 'Attestations_BE.pdf', 'CV / liste du matériel': 'CV_equipe_cle.pdf' };
      cands = cands.concat([
        { id: 'DEMO372-1', code: code, operator: 'BET Ingénierie Madagascar', nif: '4001234567', email: 'contact@bet-ingenierie.mg', date: '2026-10-29T09:12:00.000Z', docs: docs, statut: 'Déposée', recev: 'Recevable', qual: { Q1: 'Conforme', Q2: 'Conforme', Q3: 'Conforme' }, obs: 'Dossier complet, 4 références CSB similaires.' },
        { id: 'DEMO372-2', code: code, operator: 'Groupement ARCHI+ / Tsara Conseil', nif: '4007654321', email: 'archiplus@tsara.mg', date: '2026-11-02T14:40:00.000Z', docs: docs, statut: 'Déposée', recev: 'Recevable', qual: { Q1: 'Conforme', Q2: 'Non conforme', Q3: 'Conforme' }, obs: 'Une seule référence similaire sur les 3 exigées.' },
        { id: 'DEMO372-3', code: code, operator: 'Bureau d’études Fanorenana', nif: '4005550101', email: 'be.fanorenana@gmail.com', date: '2026-11-04T10:05:00.000Z', docs: docs, statut: 'Déposée' },
        { id: 'DEMO372-4', code: code, operator: 'SOMEAH Ingénieurs Conseils', nif: '4003332211', email: 'info@someah.mg', date: '2026-11-05T08:30:00.000Z', docs: { 'États financiers': 'EF_2025.pdf' }, statut: 'Déposée' }
      ]);
      wr('sm343_cands', cands);
    }
    try { if (window.SM343 && SM343.render) SM343.render(); } catch (e) {}
  }

  /* ---------- (c) Infructuosité : historique des décisions ---------- */
  function seedFail() {
    var sec = document.getElementById('v100-failure'); if (!sec || document.getElementById('v372FailHist')) return;
    var rows = [
      ['DP-2026-0007', 'Lot 02 — Mobilier de bureau', 'Aucune offre admissible (2 offres non conformes)', 'Relance de la procédure', '14/10/2026', 'Validée'],
      ['DAO-2026-0019', 'Procédure complète', 'Aucune offre reçue à la date limite', 'Relance en procédure restreinte', '02/09/2026', 'Publiée'],
      ['DAO-2026-0023', 'Lot 03 — Groupes électrogènes', 'Offre la moins-disante > enveloppe de 38 %', 'Révision du DAO et du budget', '21/08/2026', 'En validation']
    ];
    var pill = function (s) { var c = /Valid|Publi/.test(s) ? 'background:#e6f4ea;color:#1e6b34' : 'background:#fff4e0;color:#9a5b00'; return '<span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;' + c + '">' + esc(s) + '</span>'; };
    var d = document.createElement('div'); d.id = 'v372FailHist'; d.className = 'v100-panel'; d.style.marginTop = '16px';
    d.innerHTML = '<div class="v100-ph"><h2>Décisions d’infructuosité prononcées' + TAG + '</h2><p>Historique : chaque décision est motivée, publiée et suivie d’une relance ou d’une révision.</p></div><div class="v100-box" style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="text-align:left;color:#5b606d;border-bottom:1px solid #e9ebf0"><th style="padding:8px">Consultation</th><th>Périmètre</th><th>Motif</th><th>Suite donnée</th><th>Date</th><th>Statut</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr style="border-bottom:1px solid #f0f1f4"><td style="padding:8px"><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td><td>' + esc(r[4]) + '</td><td>' + pill(r[5]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    sec.appendChild(d);
    var bd = document.getElementById('v100FailBadge'); if (bd && /Aucune/.test(bd.textContent)) bd.textContent = '3 décisions (exemples)';
  }

  /* ---------- (d) Écrans Administration & Audit / Habilitations ---------- */
  function tbl(head, rows) {
    return '<div style="overflow:auto;border:1px solid #e9ebf0;border-radius:12px;background:#fff"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f5f7f9;text-align:left;color:#474c58">' + head.map(function (h) { return '<th style="padding:10px 12px;white-space:nowrap">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr style="border-top:1px solid #f0f1f4">' + r.map(function (c) { return '<td style="padding:9px 12px;vertical-align:top">' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function pl(t, k) { var m = { ok: 'background:#e6f4ea;color:#1e6b34', ko: 'background:#fde8e8;color:#a42a2a', w: 'background:#fff4e0;color:#9a5b00', i: 'background:#e8eefb;color:#2e427b' }; return '<span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;' + (m[k] || m.i) + '">' + esc(t) + '</span>'; }
  function kpis(list) { return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:0 0 16px">' + list.map(function (k) { return '<div style="border:1px solid #e9ebf0;border-radius:12px;padding:12px 14px;background:#fff"><div style="font-size:12px;color:#5b606d">' + esc(k[0]) + '</div><div style="font-size:22px;font-weight:700;color:#18244f">' + esc(k[1]) + '</div></div>'; }).join('') + '</div>'; }
  var Y = '<b style="color:#1e6b34">✓</b>', N = '<span style="color:#b9bec8">—</span>';
  var SCREENS = {
    'Utilisateurs & habilitations': function () {
      return kpis([['Utilisateurs actifs', '24'], ['Profils', '7'], ['Évaluateurs externes', '3'], ['Comptes bloqués', '1']]) + tbl(['Nom', 'Identifiant', 'Profil', 'Structure', 'Double authentification', 'Statut'], [
        ['Hery RAKOTOMALALA', 'h.rakotomalala', 'PRMP', 'UGPM — Ministère de la Santé', pl('Activée', 'ok'), pl('Actif', 'ok')],
        ['Voahirana ANDRIAMAMPIANINA', 'v.andriam', 'Responsable passation', 'UGPM', pl('Activée', 'ok'), pl('Actif', 'ok')],
        ['Tojo RAZAFINDRABE', 't.razafindrabe', 'Contrôleur financier', 'Contrôle financier', pl('Activée', 'ok'), pl('Actif', 'ok')],
        ['Mialy RANDRIANARISOA', 'm.randria', 'Évaluateur (membre CAO)', 'Direction des infrastructures', pl('Activée', 'ok'), pl('Actif', 'ok')],
        ['Fanja RABEMANANJARA', 'f.rabe', 'Juriste', 'Service juridique', pl('Non activée', 'w'), pl('Actif', 'ok')],
        ['Expert ext. — BET Conseil', 'ext.bet01', 'Évaluateur externe (code OTP)', 'Externe', pl('OTP par e-mail', 'i'), pl('Expire le 30/11/2026', 'w')],
        ['Admin Système', 'admin', 'Administrateur', 'DSI', pl('Activée', 'ok'), pl('Actif', 'ok')],
        ['Jean RAKOTO', 'j.rakoto', 'Agent de saisie', 'UGPM', pl('Non activée', 'w'), pl('Bloqué (5 essais)', 'ko')]
      ]);
    },
    'Habilitations': function () {
      var c = ['PPM', 'DAO', 'Publication', 'Ouverture', 'Évaluation', 'Attribution', 'Contrats', 'Exécution', 'Paramétrage'];
      var r = [['PRMP', [1, 1, 1, 1, 1, 1, 1, 1, 0]], ['Responsable passation', [1, 1, 1, 1, 0, 0, 1, 0, 0]], ['Évaluateur (membre CAO)', [0, 0, 0, 1, 1, 0, 0, 0, 0]], ['Contrôleur financier', [1, 0, 0, 0, 0, 1, 1, 1, 0]], ['Juriste', [0, 1, 0, 0, 0, 1, 1, 0, 0]], ['Gestionnaire de contrat', [0, 0, 0, 0, 0, 0, 1, 1, 0]], ['Administrateur', [0, 0, 0, 0, 0, 0, 0, 0, 1]]];
      return '<p style="color:#474c58;margin:0 0 12px">Matrice profils × modules (✓ = accès en écriture). Règle de séparation des tâches : un évaluateur ne peut pas valider l’attribution.</p>' + tbl(['Profil'].concat(c), r.map(function (x) { return ['<b>' + esc(x[0]) + '</b>'].concat(x[1].map(function (v) { return v ? Y : N; })); }));
    },
    'Organisations / Structures': function () {
      return tbl(['Code', 'Structure', 'Type', 'Rattachement', 'Responsable', 'Utilisateurs'], [
        ['MSANP', 'Ministère de la Santé Publique', pl('Autorité contractante', 'i'), '—', 'Secrétaire général', '12'],
        ['UGPM-MS', 'Unité de gestion de la passation des marchés', pl('Service', 'i'), 'MSANP', 'H. RAKOTOMALALA (PRMP)', '6'],
        ['DIS', 'Direction des infrastructures sanitaires', pl('Service bénéficiaire', 'i'), 'MSANP', 'Directeur DIS', '3'],
        ['CF', 'Contrôle financier', pl('Organe de contrôle', 'w'), 'Ministère des Finances', 'Contrôleur financier', '2'],
        ['DRS-ANA', 'Direction régionale Analamanga', pl('Service déconcentré', 'i'), 'MSANP', 'Directeur régional', '1']
      ]);
    },
    'Contrôles & conformité': function () {
      return kpis([['Règles actives', '9'], ['Bloquantes', '6'], ['Alertes ce mois', '4']]) + tbl(['Règle', 'Étape', 'Effet', 'Dernier résultat'], [
        ['La somme des notes maximales des critères techniques fait 100 points', 'DAO', pl('Bloquant', 'ko'), pl('OK', 'ok')],
        ['Chaque critère de qualification a au moins une pièce justificative', 'DAO', pl('Bloquant', 'ko'), pl('1 écart — DAO-2026-0031', 'w')],
        ['Garantie de soumission entre 1 % et 3 % du montant estimé', 'DAO', pl('Bloquant', 'ko'), pl('OK', 'ok')],
        ['Délai minimum de 30 jours entre publication et date limite (AOO)', 'Publication', pl('Bloquant', 'ko'), pl('OK', 'ok')],
        ['Montant attribué ≤ crédit disponible au PPM', 'Attribution', pl('Bloquant', 'ko'), pl('OK', 'ok')],
        ['Évaluateur sans conflit d’intérêts déclaré', 'Évaluation', pl('Bloquant', 'ko'), pl('OK', 'ok')],
        ['Écart offre / estimation > 20 %', 'Évaluation', pl('Alerte', 'w'), pl('2 alertes', 'w')],
        ['Avenants cumulés > 20 % du montant initial', 'Exécution', pl('Alerte', 'w'), pl('OK', 'ok')],
        ['Garantie de bonne exécution expirant sous 30 jours', 'Exécution', pl('Alerte', 'w'), pl('1 alerte — CTR-2027-001', 'w')]
      ]);
    },
    'Audit & traçabilité': function () {
      return '<p style="color:#474c58;margin:0 0 12px">Journal non modifiable : chaque action est horodatée avec l’utilisateur et l’adresse IP.</p>' + tbl(['Date et heure', 'Utilisateur', 'Module', 'Action', 'Objet', 'Adresse IP'], [
        ['10/11/2026 08:42', 'h.rakotomalala', 'Ouverture', 'Clôture de la séance d’ouverture', 'DAO-2026-0001', '41.188.12.40'],
        ['10/11/2026 08:15', 'm.randria', 'Évaluation', 'Note enregistrée (brouillon)', 'Offre TELMA — ADM-001', '41.188.12.57'],
        ['09/11/2026 17:03', 'v.andriam', 'Publication', 'Publication sur le portail', 'CONS-2026-0045', '41.188.12.41'],
        ['09/11/2026 16:20', 'TELMA Madagascar', 'Portail', 'Dépôt d’offre (accusé n° AR-2026-118)', 'DAO-2026-0001', '102.16.4.77'],
        ['09/11/2026 11:48', 'admin', 'Habilitations', 'Profil « Juriste » : ajout du droit Contrats', 'Profil Juriste', '10.0.0.5'],
        ['08/11/2026 09:30', 'j.rakoto', 'Connexion', 'Échec de connexion (5e essai) — compte bloqué', 'j.rakoto', '41.188.12.90'],
        ['07/11/2026 15:12', 't.razafindrabe', 'Attribution', 'Visa du contrôle financier', 'CTR-2027-003', '41.188.13.02']
      ]);
    },
    'Sécurité & intégrations': function () {
      var pol = tbl(['Paramètre de sécurité', 'Valeur'], [
        ['Longueur minimale du mot de passe', '12 caractères (majuscule, chiffre, symbole)'], ['Renouvellement du mot de passe', 'Tous les 90 jours'], ['Double authentification', 'Obligatoire pour PRMP, évaluateurs, administrateurs'],
        ['Expiration de session', '30 minutes d’inactivité'], ['Blocage du compte', 'Après 5 essais infructueux'], ['Coffre des offres', 'Chiffrement jusqu’à la séance d’ouverture']
      ]);
      var integ = tbl(['Intégration', 'Usage', 'État', 'Dernière synchronisation'], [
        ['SoftCompta', 'Engagements et paiements', pl('Connectée', 'ok'), '10/11/2026 07:00'],
        ['SoftSign', 'Signature électronique des PV et contrats', pl('Connectée', 'ok'), '10/11/2026 08:44'],
        ['Serveur de messagerie (SMTP)', 'Notifications aux opérateurs', pl('Connectée', 'ok'), '10/11/2026 08:40'],
        ['Portail opérateurs', 'Publication et dépôt des offres', pl('Connectée', 'ok'), 'Temps réel'],
        ['ARMP — publication officielle', 'Transmission des avis et attributions', pl('À configurer', 'w'), '—']
      ]);
      return '<h3 style="margin:0 0 8px;color:#18244f">Politique de sécurité</h3>' + pol + '<h3 style="margin:20px 0 8px;color:#18244f">Intégrations</h3>' + integ;
    }
  };
  function demoBox() {
    var t = document.getElementById('v310EncoursTitle'); if (!t) return;
    var host = t.parentNode, box = host.querySelector('#v372AdminDemo'), dashed = t.nextElementSibling && t.nextElementSibling.id !== 'v372AdminDemo' ? t.nextElementSibling : null;
    var f = SCREENS[(t.textContent || '').trim()];
    if (!box) { box = document.createElement('div'); box.id = 'v372AdminDemo'; host.appendChild(box); }
    if (f) { if (dashed) dashed.style.display = 'none'; box.style.display = ''; box.innerHTML = '<div style="margin:-4px 0 14px">' + TAG + '</div>' + f(); }
    else { if (dashed) dashed.style.display = ''; box.style.display = 'none'; box.innerHTML = ''; }
  }
  function hookAdmin() {
    var t = document.getElementById('v310EncoursTitle'); if (!t) return false; if (t.dataset.v372) return true; t.dataset.v372 = '1';
    new MutationObserver(demoBox).observe(t, { childList: true, characterData: true, subtree: true });
    demoBox(); return true;
  }

  function run(n) {
    var ok = true;
    if (!rd(FLAG, null)) { ok = seedExec(); seedCand(); if (ok) wr(FLAG, { at: new Date().toISOString() }); }
    seedFail();
    var ha = hookAdmin();
    if ((!ok || !ha) && n < 10) setTimeout(function () { run(n + 1); }, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { run(0); }, 900); });
  else setTimeout(function () { run(0); }, 900);
})();
</script>
