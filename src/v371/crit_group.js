  /* V371 : justificatifs regroupés par critère d'évaluation (étapes 3, 4 et 5). */
  (function () {
    if (document.getElementById('cj371-css')) return;
    var s = document.createElement('style'); s.id = 'cj371-css';
    s.textContent = '#bidModal .cj-sec{margin-top:16px}#bidModal .cj-sec>h4{margin:0 0 4px;font-size:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}#bidModal .cj-sec>h4 span{font-size:12px;font-weight:600;color:#5b606d}#bidModal .cj-sec>p{margin:0 0 10px;font-size:12.5px;color:#5b606d}' +
      '#bidModal .cj-card{border:1px solid #e9ebf0;border-radius:12px;background:#fff;margin-bottom:10px;overflow:hidden}#bidModal .cj-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;background:#f7f9fd;border-bottom:1px solid #e9ebf0}#bidModal .cj-h b{font-size:13.5px;color:#0b1332}#bidModal .cj-cat{background:#2e427b;color:#fff;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}#bidModal .cj-tag{border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;background:#eef2fb;color:#2e427b}#bidModal .cj-tag.el{background:#ffe4e6;color:#be123c}#bidModal .cj-h small{flex-basis:100%;color:#5b606d;font-size:12px}#bidModal .cj-card .v52-doc-list{margin:0;padding:4px 10px}#bidModal .cj-none{font-size:12.5px;color:#5b606d;background:#f5f7f9;border-radius:9px;padding:10px 12px}';
    document.head.appendChild(s);
  })();
  function critByCode(code) { return crits().find(function (c) { return (c.source_code || c.code) === code; }) || {}; }
  function critCards(reqs) {
    var by = {}, order = [];
    reqs.forEach(function (q) { if (!by[q.crit]) { by[q.crit] = []; order.push(q.crit); } by[q.crit].push(q); });
    return order.map(function (code) {
      var c = critByCode(code), lib = c.libelle || code, rules = (c.mode_evaluation === 'Valeur numérique' || c.mode_evaluation === 'Pourcentage') && c.valeur != null && c.valeur !== '' ? 'Exigence : ' + (c.operateur === 'intervalle' ? 'entre ' + c.valeur + ' et ' + c.valeur_max : (c.operateur || '≥') + ' ' + num(c.valeur).toLocaleString('fr-FR')) + (c.mode_evaluation === 'Pourcentage' ? ' %' : c.unite ? ' ' + c.unite : '') : '';
      var rows = by[code].map(function (q) {
        var short = String(q.label).replace(' — ' + lib, '').replace(lib + ' — ', '');
        if (q.value) short = short.charAt(0).toUpperCase() + short.slice(1);
        return reqRow(Object.assign({}, q, { label: short }));
      }).join('');
      return '<div class="cj-card"><div class="cj-h"><span class="cj-cat">' + esc(c.categorie || '') + '</span><b>' + esc(lib) + '</b>' + (c.eliminatoire ? '<span class="cj-tag el">Éliminatoire</span>' : '') + (c.mode_evaluation === 'Note' && c.note_max ? '<span class="cj-tag">' + esc(c.note_max) + ' pts</span>' : '') + (rules ? '<span class="cj-tag">' + esc(rules) + '</span>' : c.mode_evaluation && c.mode_evaluation !== 'Note' ? '<span class="cj-tag">' + esc(c.mode_evaluation) + '</span>' : '') +
        ((c.instructions || c.description) ? '<small>' + esc(c.instructions || c.description) + '</small>' : '') + '</div><div class="v52-doc-list">' + rows + '</div></div>';
    }).join('');
  }
  function critSection(title, sub, reqs, emptyTxt) {
    var n = {}; reqs.forEach(function (q) { n[q.crit] = 1; });
    return '<div class="cj-sec"><h4>' + title + '<span>' + Object.keys(n).length + ' critère(s) · ' + reqs.filter(function (q) { return q.req; }).length + ' élément(s) obligatoire(s)</span></h4>' + (sub ? '<p>' + sub + '</p>' : '') + (reqs.length ? critCards(reqs) : '<div class="cj-none">' + emptyTxt + '</div>') + '</div>';
  }
  function finReqs() {
    var r = [];
    crits().filter(function (c) { return c.categorie === 'Financier' && c.portail !== false; }).forEach(function (c) {
      var code = c.source_code || c.code;
      if (needsDoc(c)) r.push({ id: 'f:' + code, crit: code, label: docLabel(c) + ' — ' + c.libelle, note: (c.doc_formats || 'PDF') + ' · ' + (c.doc_taille || 10) + ' Mo max.', req: !!c.doc_obligatoire, file: true, formats: c.doc_formats, taille: c.doc_taille, multiple: num(c.doc_nb_max) > 1, min: num(c.doc_nb_min) || 1, max: num(c.doc_nb_max) || 1 });
    });
    return r;
  }
