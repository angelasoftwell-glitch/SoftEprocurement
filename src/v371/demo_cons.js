<script id="v371-demo-justificatifs">
/* V371 : consultation de démonstration ouverte, pour voir les justificatifs par critère dans « Préparer ma soumission ».
   Étape 3 : pièces générales + critères administratifs / qualification ; étape 4 : critères techniques ;
   étape 5 : critères financiers. Données fictives. */
(function () {
  "use strict";
  var REF = 'CONS-2026-DEMO-V371';
  var P = {
    consultation: { code: REF, dao_code: 'DAO-2026-DEMO-V371', ppm_code: 'PPM-2026-DEMO', intitule: 'Achat de fournitures de bureau — démonstration justificatifs par critère', titre_public: 'Achat de fournitures de bureau — démonstration justificatifs par critère', description_public: 'Consultation de démonstration (données fictives) : chaque critère d’évaluation demande sa valeur et ses justificatifs dans le formulaire de soumission.', statut: 'Publiée', publication_reelle: '2026-11-09T09:00', date_limite: '2026-12-09T10:04', ouverture_offres: '2026-12-09T11:00', offer_envelope_mode: 'single', validite_offres: 90,
      documents: [{ code: 'DAO', libelle: 'Dossier d’appel d’offres complet', version: 'V1', obligatoire: true, publier: true }, { code: 'BPU', libelle: 'Bordereau des prix', version: 'V1', obligatoire: true, publier: true }] },
    ppm: { code: 'PPM-2026-DEMO', type_marche: 'Fournitures', mode_passation: 'Appel d’offres national', objet: 'Achat de fournitures de bureau' },
    refs: { documents_admin: ['Registre de commerce', 'Carte d’identification fiscale (NIF / STAT)'] },
    dao_access: { access: 'free', currency: 'MGA' },
    dao: {
      code: 'DAO-2026-DEMO-V371', ppm_code: 'PPM-2026-DEMO', statut: 'Publié', version: 'V1', intitule: 'Achat de fournitures de bureau', langue: 'Français',
      lots: [{ numero: 'Lot unique', intitule: 'Achat de fournitures de bureau', montant_estimatif: 6000000, delai_execution: '30 jours', lieu_execution: 'Antananarivo' }],
      conditions: { eligibilite: 'Entreprises légalement constituées', groupement_autorise: true, sous_traitance_autorisee: false, variantes_autorisees: false, garantie_requise: true, garantie_taux: 2 },
      methode: { methode_financiere: 'Offre évaluée la moins-disante' },
      criteres: [
        { code: 'ADM-01', categorie: 'Administratif', libelle: 'Attestation fiscale à jour', mode_evaluation: 'Conforme / Non conforme', eliminatoire: true, portail: true, doc_types: ['Attestation fiscale'], doc_obligatoire: true, doc_formats: 'PDF', instructions: 'Attestation datant de moins de 3 mois.' },
        { code: 'ADM-02', categorie: 'Administratif', libelle: 'Attestation CNaPS', mode_evaluation: 'Conforme / Non conforme', eliminatoire: true, portail: true, doc_types: ['Attestation de régularité CNaPS'], doc_obligatoire: true, doc_formats: 'PDF' },
        { code: 'QUA-01', categorie: 'Qualification', libelle: 'Chiffre d’affaires moyen des 3 dernières années', mode_evaluation: 'Valeur numérique', operateur: '≥', valeur: '50000000', unite: 'MGA', periode: '2023-2025', eliminatoire: true, portail: true, doc_types: ['États financiers certifiés'], doc_obligatoire: true, doc_formats: 'PDF', doc_nb_min: 1, doc_nb_max: 3 },
        { code: 'QUA-02', categorie: 'Qualification', libelle: 'Marchés similaires (2 au moins sur 5 ans)', mode_evaluation: 'Valeur numérique', operateur: '≥', valeur: '2', unite: 'marché(s)', eliminatoire: true, portail: true, doc_types: ['Attestations de bonne exécution'], doc_obligatoire: true, doc_formats: 'PDF', doc_nb_min: 2, doc_nb_max: 5 },
        { code: 'TEC-01', categorie: 'Technique', libelle: 'Délai de livraison', mode_evaluation: 'Valeur numérique', operateur: '≤', valeur: '30', unite: 'jours', portail: true, doc_types: ['Planning de livraison'], doc_obligatoire: true, doc_formats: 'PDF' },
        { code: 'TEC-02', categorie: 'Technique', libelle: 'Conformité des articles aux spécifications', mode_evaluation: 'Note', note_max: 60, portail: true, doc_types: ['Fiches techniques / catalogues'], doc_obligatoire: true, doc_formats: 'PDF', instructions: 'Une fiche par article du bordereau.' },
        { code: 'TEC-03', categorie: 'Technique', libelle: 'Service après-vente', mode_evaluation: 'Note', note_max: 40, portail: true, doc_types: ['Engagement de service après-vente'], doc_obligatoire: false, doc_formats: 'PDF' },
        { code: 'FIN-01', categorie: 'Financier', libelle: 'Prix évalué le plus bas', mode_evaluation: 'Moins-disant', portail: true, doc_types: ['Sous-détail des prix'], doc_obligatoire: true, doc_formats: 'PDF, XLSX' }
      ],
      finance: { soumission_par_lot: false, max_lots_offre: '', max_lots_attrib: '', devise_mode: 'imposee', devise: 'MGA', devises: ['MGA'], taxes: 'HT', taxes_incluses: false, rabais: true, rabais_types: ['lot'], estimation_publiee: false, documents: ['Bordereau de prix signé'], instructions: 'Les prix incluent la livraison au siège du projet.',
        lots: { 'Lot unique': { structure: 'mixte', lignes_compl: true, offre_partielle: false, instructions: 'Livraison en une seule fois.', lignes: [
          { ref: '1.1', designation: 'Ramette papier A4 80 g', description: 'Carton de 5 ramettes', unite: 'Carton', quantite: '120', obligatoire: true, spec: 'SPEC-001' },
          { ref: '1.2', designation: 'Stylo bille bleu', description: 'Boîte de 50', unite: 'Boîte', quantite: '40', obligatoire: true, spec: '' },
          { ref: '1.3', designation: 'Classeur à levier', description: 'Dos 8 cm', unite: 'U', quantite: '300', obligatoire: true, spec: '' },
          { ref: '1.4', designation: 'Agrafeuse métal', description: '', unite: 'U', quantite: '15', obligatoire: false, spec: '' } ] } } },
      documents_dao: []
    }
  };
  function add() {
    if (typeof data === 'undefined' || typeof render !== 'function') return false;
    if (data.some(function (x) { return x && x.ref === REF; })) return true;
    var it = typeof window.portalItem === 'function' ? window.portalItem(P) : { type: 'Fournitures', ref: REF, title: P.consultation.titre_public, desc: P.consultation.description_public, entity: 'Projet Appui Développement Local', place: 'Antananarivo', lots: 'Lot unique', pub: '09 nov. · 09:00', end: '09 déc. · 10:04', days: '30 jours', _payload: P };
    it.ref = REF; it._payload = P; it._demo371 = true; delete it._softmarche; /* pas retirée par la synchronisation des publications du back-office */
    data.unshift(it);
    try { render(data); } catch (e) {}
    return true;
  }
  function tryAdd(n) { if (!add() && n > 0) setTimeout(function () { tryAdd(n - 1); }, 300); }
  /* garde la démonstration en tête de la liste complète, même après la synchronisation des publications */
  var pr = window.render;
  if (typeof pr === 'function') window.render = function (a) {
    try { if (typeof data !== 'undefined' && a === data) { var i = data.findIndex(function (x) { return x && x.ref === REF; }); if (i > 0) data.unshift(data.splice(i, 1)[0]); } } catch (e) {}
    return pr.apply(this, arguments);
  };
  if (document.readyState === 'complete') setTimeout(function () { tryAdd(10); }, 600);
  else window.addEventListener('load', function () { setTimeout(function () { tryAdd(10); }, 600); });
})();
</script>
