<script id="v375-ponderation">
/* V375 — Notation pondérée.
   Référentiel : le critère garde son barème et sa note maximale (ex. TEC-007 noté sur 20).
   DAO : chaque critère technique noté reçoit des « points DAO » (ex. 30) ; leur somme doit faire 100.
   Évaluation : points obtenus = note du barème / note maximale × points DAO.
   Ce script fournit la simulation affichée dans le DAO et ajoute un exemple de démonstration (30 / 70). */
(function () {
  "use strict";
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v) { var x = Number(String(v == null ? '' : v).replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(x) ? NaN : x; }
  function has(v) { return v !== '' && v != null && !isNaN(num(v)); }
  function fr(n) { return (Math.round(n * 100) / 100).toLocaleString('fr-FR'); }
  function pts(x) { return has(x.points_dao) ? num(x.points_dao) : num(x.note_max) || 0; }
  var SIMU = {};

  /* ------------------------------ Simulation dans le DAO ------------------------------ */
  function techOf(d) { return (d.criteres || []).filter(function (x) { return x.categorie === 'Technique' && x.mode_evaluation === 'Note' && x.nature !== 'Sous-critère'; }); }
  function simu(d) {
    var tech = techOf(d); if (!tech.length) return '';
    var S = SIMU[d.code] = SIMU[d.code] || {};
    var rows = tech.map(function (x) {
      var k = x.source_code || x.code, mx = num(x.note_max) || 0, v = has(S[k]) ? S[k] : (d.code === 'DAO-2026-DEMO-POND' ? (k === 'TEC-007' ? 10 : k === 'TEC-008' ? 75 : Math.round(mx / 2)) : Math.round(mx / 2));
      S[k] = v;
      return '<tr><td><b>' + esc(k) + '</b><br><small>' + esc(x.libelle) + '</small></td><td><input type="number" min="0" max="' + mx + '" step="0.5" data-simu="' + esc(k) + '" value="' + esc(v) + '" class="v375pts"> / ' + esc(mx) + '</td><td>' + fr(pts(x)) + ' pts</td><td><b data-simu-out="' + esc(k) + '"></b></td></tr>';
    }).join('');
    return '<div class="v375box"><div class="v375h"><div><b>Simulation de la note pondérée</b><small>Saisissez une note obtenue selon le barème du référentiel : le système la ramène sur les points du DAO. Aucune donnée n’est enregistrée.</small></div><button type="button" class="v312b" data-simu-reset>Réinitialiser</button></div>' +
      '<div class="v375formula">Points obtenus = <i>note obtenue</i> ÷ <i>note du barème</i> × <i>points DAO</i></div>' +
      '<table class="v312t"><thead><tr><th>Critère</th><th>Note obtenue (barème)</th><th>Points DAO</th><th>Points obtenus</th></tr></thead><tbody>' + rows + '</tbody>' +
      '<tfoot><tr><td colspan="2"><b>Note technique globale</b><br><small>Seuil de qualification : ' + esc((d.methode || {}).seuil_technique || '70') + '/100</small></td><td><b data-simu-max></b></td><td><b data-simu-tot style="font-size:15px"></b> <span data-simu-res></span></td></tr></tfoot></table></div>';
  }
  function compute(card, d) {
    var tech = techOf(d), S = SIMU[d.code] || {}, tot = 0, max = 0;
    tech.forEach(function (x) {
      var k = x.source_code || x.code, mx = num(x.note_max) || 0, w = pts(x), v = Math.max(0, Math.min(num(S[k]) || 0, mx)), p = mx ? v / mx * w : 0;
      tot += p; max += w;
      var o = card.querySelector('[data-simu-out="' + k + '"]'); if (o) o.textContent = fr(p) + ' / ' + fr(w) + ' pts';
    });
    var seuil = num((d.methode || {}).seuil_technique); if (isNaN(seuil)) seuil = 70;
    var note = max ? tot * 100 / max : 0;
    var m = card.querySelector('[data-simu-max]'); if (m) m.textContent = fr(max) + ' pts';
    var t = card.querySelector('[data-simu-tot]'); if (t) t.textContent = fr(note) + ' / 100';
    var r = card.querySelector('[data-simu-res]'); if (r) r.innerHTML = note >= seuil ? '<span class="v312p a">Qualifié</span>' : '<span class="v312p e">Non qualifié — seuil non atteint</span>';
  }
  function bind(card, d) {
    if (!card.querySelector('.v375box')) return;
    card.querySelectorAll('[data-simu]').forEach(function (inp) { inp.oninput = function () { (SIMU[d.code] = SIMU[d.code] || {})[inp.dataset.simu] = inp.value; compute(card, d); }; });
    var rs = card.querySelector('[data-simu-reset]'); if (rs) rs.onclick = function () { delete SIMU[d.code]; card.querySelector('.v375box').outerHTML = simu(d); bind(card, d); };
    compute(card, d);
  }
  window.SM375 = { simu: simu, bind: bind };

  /* ------------------------------ Exemple de démonstration ------------------------------ */
  function critSeed() {
    if (typeof CRIT_DATA === 'undefined' || !Array.isArray(CRIT_DATA)) return false;
    var base = CRIT_DATA.find(function (c) { return c.code === 'TEC-004'; }); if (!base) return false;
    function mk(code, lib, desc, unite, max, bar, instr) {
      if (CRIT_DATA.some(function (c) { return c.code === code; })) return;
      var c = JSON.parse(JSON.stringify(base));
      Object.assign(c, { code: code, libelle: lib, description: desc, unite: unite, note_max: String(max), decomposition: 'bareme', bareme: bar, instructions: instr, eliminatoire: false, statut: 'Actif', version: 'V1' });
      CRIT_DATA.push(c);
    }
    mk('TEC-007', 'Expérience du chef de projet', 'Nombre d’années d’expérience du chef de projet proposé.', 'années', 20,
      [{ op: 'entre', v1: '0', v2: '2', note: '0' }, { op: 'entre', v1: '3', v2: '5', note: '10' }, { op: 'entre', v1: '6', v2: '9', note: '15' }, { op: '≥', v1: '10', v2: '', note: '20' }], 'Indiquer le nombre d’années d’expérience du chef de projet (joindre le CV).');
    mk('TEC-008', 'Capacité de la mémoire RAM', 'Capacité de mémoire vive des ordinateurs proposés.', 'Go', 100,
      [{ op: '<', v1: '8', v2: '', note: '0' }, { op: 'entre', v1: '8', v2: '15', note: '25' }, { op: 'entre', v1: '16', v2: '23', note: '50' }, { op: 'entre', v1: '24', v2: '31', note: '75' }, { op: '≥', v1: '32', v2: '', note: '100' }], 'Indiquer la capacité de mémoire RAM proposée (en Go).');
    return true;
  }
  function daoSeed() {
    if (typeof DAO_DATA === 'undefined' || !Array.isArray(DAO_DATA)) return false;
    if (DAO_DATA.some(function (d) { return d.code === 'DAO-2026-DEMO-POND'; })) return true;
    var src = DAO_DATA.find(function (d) { return d.code === 'DAO-2026-DEMO-AOO'; }) || DAO_DATA.find(function (d) { return (d.criteres || []).length; });
    if (!src) return false;
    var d = JSON.parse(JSON.stringify(src));
    d.code = 'DAO-2026-DEMO-POND'; d.intitule = 'Démonstration — notation pondérée (chef de projet 30 pts, RAM 70 pts)'; d.statut = 'Brouillon';
    d.historique = [{ utilisateur: 'Super Administrateur', date: new Date().toLocaleString('fr-FR'), action: 'Création', commentaire: 'DAO de démonstration de la notation pondérée (V375).' }];
    delete d.consultation_code; delete d.validation; delete d.frozen; delete d.version_figee;
    var cp = function (code, p) { var c = CRIT_DATA.find(function (x) { return x.code === code; }); if (!c) return null; var x = JSON.parse(JSON.stringify(c)); x.source_code = code; x.copie_du = new Date().toLocaleString('fr-FR'); x.points_dao = String(p); x.v312 = true; x.seuil_global_pct = ''; x.seuil_global_elim = false; return x; };
    d.criteres = (d.criteres || []).filter(function (x) { return x.categorie !== 'Technique'; }).concat([cp('TEC-007', 30), cp('TEC-008', 70)].filter(Boolean));
    d.methode = Object.assign({}, d.methode || {}, { seuil_technique: '70' });
    DAO_DATA.unshift(d);
    try { if (typeof daoPersist === 'function') daoPersist(); } catch (e) {}
    try { if (typeof renderDaoTable === 'function') renderDaoTable(); } catch (e) {}
    return true;
  }
  function boot(n) { var ok = critSeed() && daoSeed(); if (!ok && n < 10) setTimeout(function () { boot(n + 1); }, 500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { boot(0); }, 1800); }); else setTimeout(function () { boot(0); }, 1800);
})();
</script>
<style id="v375-css">
.v375pts{width:72px;border:1px solid #d6d9e0;border-radius:7px;padding:4px 6px;font:inherit;font-size:12px}
.v375box{margin-top:16px;border:1px solid #c9d3ee;background:#f6f8fd;border-radius:12px;padding:14px 16px}
.v375h{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px}.v375h b{color:#18244f;font-size:14px}.v375h small{display:block;color:#5b606d;font-size:12px;margin-top:2px}
.v375formula{font-size:12.5px;color:#2e427b;background:#fff;border:1px dashed #c9d3ee;border-radius:8px;padding:7px 10px;margin-bottom:10px;display:inline-block}
.v375box table tfoot td{border-top:2px solid #e3e6ee;padding-top:10px}
</style>
