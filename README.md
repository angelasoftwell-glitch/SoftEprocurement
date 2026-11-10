# Soft e-procurement — maquette

Maquette HTML autonome de Soft e-procurement (back-office + portail des opérateurs économiques).
Ouvrir `maquette/SoftEprocurement_V375_charte_Softwell.html` dans un navigateur.

## V375 (10/11/2026) — Notation pondérée des critères techniques

- Référentiel : le critère garde son barème et sa **note du barème** (ex. TEC-007 noté sur 20, TEC-008 sur 100).
- DAO › Grille de critères › Technique : colonnes **Note du barème** et **Points DAO** (saisissables) ; contrôle « somme des points DAO = 100 » (au lieu de la somme des notes du barème) ; **simulation** de la note pondérée.
- Évaluation : points obtenus = note obtenue ÷ note du barème × points DAO ; note globale arrondie à 2 décimales ; en-têtes « barème /20 → 30 pts DAO ».
- Portail : points DAO affichés par critère technique noté.
- Compatibilité : sans points DAO saisis, les points = note du barème (DAO existants inchangés).
- Exemple : DAO-2026-DEMO-POND (Brouillon), chef de projet 30 pts + RAM 70 pts → 10/20 et 75/100 donnent 67,5/100, non qualifié (seuil 70).

Source : `src/v375/`.

## V374 (10/11/2026) — Report de date limite : présentation revue

- Fiche de la consultation publiée : encadré simplifié (vignettes date limite actuelle / ouverture / date initiale, bouton « Reporter la date limite », lien vers l'historique).
- Nouveau sous-menu **Passation des marchés › Consultation & Publication › Reports de date limite** : historique de tous les reports en frise chronologique, filtre par consultation, indicateurs.
- Fenêtre de report réorganisée en 3 étapes (nouvelle date avec aperçu de l'ouverture, motif, effets).

Source : `src/v374/v374_report.js` (remplace `src/v373/v373_report.js` ; le script portail reste `src/v373/v373_portal.js`).

## V373 (10/11/2026) — Report de la date limite de dépôt

- Back-office, Consultation & Publication, fiche d'une consultation « Publiée » : encadré « Date limite de dépôt des offres » avec le bouton **Reporter la date limite** et l'**historique des reports** (ancienne / nouvelle date, motif, décision, additif, auteur, opérateurs notifiés).
- Contrôles : nouvelle date postérieure à l'actuelle et dans le futur, motif et justification obligatoires, alerte jour non ouvré, report impossible après la date limite ou après l'ouverture.
- Effets : ouverture des offres recalculée, additif « Report de la date limite » publié, notification des opérateurs (offres déposées, DAO retirés), trace dans l'historique de la consultation.
- Portail : bandeau « Date limite reportée » (ancienne date barrée), date mise à jour dans les dates clés, additif dans l'onglet Additifs.
- Exemple de démonstration : CONS-DEMO-PAYANT-001 reportée une fois.

Source : `src/v373/`.

## V372 (10/11/2026) — Démonstration client

Un exemple concret dans chaque menu qui était vide (données injectées une seule fois, sans écraser les saisies) :
- Exécution : avenant approuvé (CTR-2027-001) et avenant en projet à approuver (CTR-2027-002), pénalité appliquée, suspension puis reprise, réceptions (provisoire avec réserves, partielle), réclamations (en instruction, acceptée).
- Candidatures / Présélection : appel AMI-2026-0042 (maîtrise d'œuvre de 3 CSB II) avec 4 candidatures, dont 2 déjà qualifiées.
- Infructuosité : historique de 3 décisions.
- Administration & Audit et Habilitations : utilisateurs, matrice des habilitations, structures, contrôles de conformité, journal d'audit, sécurité et intégrations (badge « Exemple de démonstration »).

Source : `src/v372/v372_demo.js`.

## V371 (09/11/2026)

### Back-office — DAO › Lots & Prix
- Nouvel ordre des étapes : 1. Règles générales → 2. Lots (masquée s'il n'y a qu'un lot) → 3. Prix par lot.
- Récapitulatif permanent : devise, taxes, rabais, structure de prix, estimation.
- 3 structures au lieu de 4 : « Mixte » devient l'option « lignes ajoutées par le soumissionnaire » du bordereau.
- Structure recommandée selon le type de marché, aperçu de ce que verra le soumissionnaire.
- Contrôles regroupés par étape ; champs sans objet masqués pour un lot unique.
- Correction : le curseur ne quitte plus le champ après chaque saisie dans le bordereau.

### Portail — consultation, onglet Lots
- Règles financières en tête (monnaie, HT/TTC, rabais, lots), puis une carte par lot montrant ce qui est à chiffrer
  (bordereau, forfait ou devis libre), pièces financières et instructions.

### Portail — Préparer ma soumission
- Étape 5 « Offre financière » alignée sur Lots & Prix : saisie selon la structure, taxes HT/TTC/selon régime,
  rabais par lot / global / conditionnel selon le DAO, pièces financières (devis détaillé ajouté si nécessaire).
- Justificatifs regroupés par critère d'évaluation :
  - Étape 3 : pièces générales du DAO, puis une carte par critère administratif ou de qualification ;
  - Étape 4 : une carte par critère technique (valeur proposée, justificatif, points) ;
  - Étape 5 : nouvelle section des justificatifs des critères financiers.

Le modèle de données (`d.finance`, offre déposée) reste compatible avec la réception et l'évaluation.

## Contenu
- `maquette/` : maquette V375 (fichier unique).
- `src/v372/` : script des exemples de démonstration (V372).
- `captures/` : captures avant / après.
- `src/v371/` : scripts ajoutés ou remplacés dans la V371 (pour relecture).
