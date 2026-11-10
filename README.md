# Soft e-procurement — maquette

Maquette HTML autonome de Soft e-procurement (back-office + portail des opérateurs économiques).
Ouvrir `maquette/SoftEprocurement_V371_charte_Softwell.html` dans un navigateur.

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
- `maquette/` : maquette V371 (fichier unique).
- `captures/` : captures avant / après.
- `src/v371/` : scripts ajoutés ou remplacés dans la V371 (pour relecture).
