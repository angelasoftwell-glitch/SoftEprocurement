  /* V371 : offre financière alignée sur Lots & Prix (structures, taxes, types de rabais, pièces). */
  (function () {
    if (document.getElementById('bf371-css')) return;
    var s = document.createElement('style'); s.id = 'bf371-css';
    s.textContent = [
      '#bidModal .bf{--n:#2e427b;--bd:#e9ebf0;--mu:#5b606d;--bg:#f5f7f9;color:#0b1332}',
      '#bidModal .bf-rules{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 14px}@media(max-width:900px){#bidModal .bf-rules{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '#bidModal .bf-rule{background:var(--bg);border-radius:9px;padding:9px 12px;min-width:0}#bidModal .bf-rule small{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--mu)}#bidModal .bf-rule b{display:block;font-size:13.5px;margin-top:2px}#bidModal .bf-rule span{display:block;font-size:11.5px;color:var(--mu);line-height:1.35}',
      '#bidModal .bf-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}#bidModal .bf-tab{border:1.5px solid var(--bd);background:#fff;border-radius:10px;padding:7px 12px;text-align:left;cursor:pointer;font:inherit;min-width:150px}#bidModal .bf-tab b{display:flex;justify-content:space-between;gap:8px;font-size:13px}#bidModal .bf-tab small{display:block;font-size:11.5px;color:var(--mu);margin-top:2px}#bidModal .bf-tab.on{border-color:var(--n);background:#f7f9fd;box-shadow:0 0 0 3px rgba(46,66,123,.08)}#bidModal .bf-dot{width:8px;height:8px;border-radius:50%;background:#e11d48;margin-top:4px;flex:none}#bidModal .bf-dot.ok{background:#16a34a}',
      '#bidModal .bf-lot{border:1px solid var(--bd);border-radius:12px;background:#fff;overflow:hidden}#bidModal .bf-lh{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;padding:12px 14px;border-bottom:1px solid var(--bd)}#bidModal .bf-lh h4{margin:0;font-size:15px}#bidModal .bf-lh small{display:block;color:var(--mu);font-size:12px;margin-top:3px}#bidModal .bf-st{background:#eef2fb;color:var(--n);border-radius:999px;padding:4px 11px;font-size:12px;font-weight:700;white-space:nowrap}',
      '#bidModal .bf-lb{padding:12px 14px}#bidModal .bf-ins{border-left:3px solid var(--n);background:#f7f9fd;padding:8px 11px;border-radius:0 8px 8px 0;font-size:12.5px;line-height:1.45;margin-bottom:12px}#bidModal .bf-ins b{display:block;font-size:11.5px;color:var(--n)}',
      '#bidModal .bf-t{width:100%;border-collapse:collapse;font-size:12.5px}#bidModal .bf-tw{overflow-x:auto;border:1px solid var(--bd);border-radius:9px}#bidModal .bf-t th{background:var(--bg);text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.03em;color:var(--mu);padding:7px 8px;white-space:nowrap}#bidModal .bf-t td{padding:6px 8px;border-top:1px solid var(--bd);vertical-align:middle}#bidModal .bf-t td small{display:block;color:var(--mu);font-size:11.5px}#bidModal .bf-t td.r,#bidModal .bf-t th.r{text-align:right;white-space:nowrap}#bidModal .bf-t input{width:100%;border:1px solid #d6d9e0;border-radius:6px;padding:6px 8px;font:inherit;font-size:12.5px}#bidModal .bf-t input.pu{text-align:right;min-width:110px;background:#fffdf5;border-color:#e8d9a8}#bidModal .bf-t tr.sec td{background:var(--bg);font-weight:700;font-size:12px}#bidModal .bf-opt{display:inline-block;margin-left:6px;background:#fff7ed;color:#9a3412;border-radius:6px;padding:1px 6px;font-size:10.5px;font-weight:700}',
      '#bidModal .bf-forf{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:12px;align-items:end}@media(max-width:800px){#bidModal .bf-forf{grid-template-columns:1fr}}#bidModal .bf-forf>div{background:var(--bg);border-radius:10px;padding:12px 14px}#bidModal .bf-forf small{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;color:var(--mu)}#bidModal .bf-forf b{display:block;margin-top:3px}#bidModal .bf-forf input{width:100%;margin-top:6px;border:1px solid #e8d9a8;background:#fffdf5;border-radius:8px;padding:9px 10px;font:inherit;font-size:15px;font-weight:700;text-align:right}',
      '#bidModal .bf-list{margin:0 0 12px;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px}#bidModal .bf-list li{background:var(--bg);border-radius:999px;padding:4px 10px;font-size:12px}#bidModal .bf-list li:before{content:"✓ ";color:var(--n);font-weight:800}',
      '#bidModal .bf-row{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px;padding:9px 12px;background:var(--bg);border-radius:9px;font-size:12.5px}#bidModal .bf-row select,#bidModal .bf-row input{border:1px solid #d6d9e0;border-radius:7px;padding:6px 8px;font:inherit;font-size:12.5px}#bidModal .bf-row input{width:90px;text-align:right}#bidModal .bf-row select{width:auto;min-width:220px}#bidModal .bf-box select{width:auto}',
      '#bidModal .bf-sum{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}@media(max-width:800px){#bidModal .bf-sum{grid-template-columns:1fr}}#bidModal .bf-box{border:1px solid var(--bd);border-radius:10px;padding:12px 14px;background:#fff}#bidModal .bf-box h5{margin:0 0 8px;font-size:13px}#bidModal .bf-box p{margin:0;font-size:12px;color:var(--mu);line-height:1.45}#bidModal .bf-box textarea,#bidModal .bf-box input,#bidModal .bf-box select{border:1px solid #d6d9e0;border-radius:7px;padding:6px 8px;font:inherit;font-size:12.5px}',
      '#bidModal .bf-tot div{display:flex;justify-content:space-between;padding:5px 0;font-size:12.5px;border-top:1px dashed var(--bd)}#bidModal .bf-tot div:first-child{border-top:0}#bidModal .bf-tot div.g{font-size:14px;font-weight:800;border-top:1px solid var(--bd);margin-top:4px;padding-top:8px}',
      '#bidModal .bf-docs{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:4px}#bidModal .bf-docs li{font-size:12.5px}#bidModal .bf-docs li:before{content:"▤ ";color:var(--n)}'
    ].join('');
    document.head.appendChild(s);
  })();
  var BF_STR = { bordereau: ['▦', 'Bordereau de prix'], mixte: ['▦', 'Bordereau de prix + lignes complémentaires'], forfait: ['◉', 'Prix forfaitaire'], libre: ['✎', 'Devis libre'] };
  var BF_RAB = { lot: 'par lot', global: 'global', conditionnel: 'conditionnel' };
  function taxMode() { var f = F() || {}; return f.taxes === 'TTC' ? 'TTC' : f.taxes === 'Selon régime' ? 'regime' : 'HT'; }
  function rabTypes() { var f = F() || {}; if (f.rabais === false) return []; var t = f.rabais_types && f.rabais_types.length ? f.rabais_types : ['global']; return t; }
  function finDocs() {
    var f = F() || {}, d = (f.documents || []).slice();
    var needQuote = sel().some(function (l) { var c = lotCfg(l) || {}; return c.structure === 'libre' || (c.structure === 'forfait' && c.devis_demande); });
    if (needQuote && d.indexOf('Devis détaillé') < 0) d.push('Devis détaillé');
    return d;
  }
  function finLot(l) {
    var c = lotCfg(l), s = S.fin[l.key];
    if (!s) {
      s = S.fin[l.key] = { lignes: [], compl: [], forfait: '', tva: S.tvaDef, rab: '' };
      if (c && (c.structure === 'bordereau' || c.structure === 'mixte')) s.lignes = (c.lignes || []).map(function (x) { return { ref: x.ref, designation: x.designation, description: x.description, unite: x.unite, quantite: num(x.quantite), obligatoire: !!x.obligatoire, spec: x.spec || '', pu: '' }; });
      if (c && c.structure === 'libre') s.compl.push({ designation: '', quantite: 1, unite: 'Forfait', pu: '' });
    }
    return s;
  }
  function structOf(l) { var c = lotCfg(l); return c ? c.structure : 'forfait'; }
  function complOK(l) { var st = structOf(l); return st === 'libre' || st === 'mixte'; }
  function lotHT(l) { var s = finLot(l), st = structOf(l), t = 0; if (st === 'forfait') return num(s.forfait); s.lignes.forEach(function (x) { t += num(x.quantite) * num(x.pu); }); if (complOK(l)) s.compl.forEach(function (x) { t += num(x.quantite) * num(x.pu); }); return t; }
  function lotTTC(l) { var ht = lotHT(l); return ht + ht * num(finLot(l).tva) / 100; }
  function lotRab(l) { return rabTypes().indexOf('lot') >= 0 ? lotTTC(l) * Math.min(99, Math.max(0, num(finLot(l).rab))) / 100 : 0; }
  function lotNet(l) { return lotTTC(l) - lotRab(l); }
  function offerHT() { return sel().reduce(function (a, l) { return a + lotHT(l); }, 0); }
  function offerTTC() { return sel().reduce(function (a, l) { return a + lotTTC(l); }, 0); }
  function globalRab() { if (rabTypes().indexOf('global') < 0) return 0; var base = sel().reduce(function (a, l) { return a + lotNet(l); }, 0), v = num(S.rab.val); return S.rab.type === 'pct' ? base * v / 100 : v; }
  function rabais() { return sel().reduce(function (a, l) { return a + lotRab(l); }, 0) + globalRab(); }
  function lotDone(l) { var s = finLot(l), st = structOf(l), c = lotCfg(l) || {}; if (!(lotHT(l) > 0)) return false; if (st === 'bordereau' || st === 'mixte') return c.offre_partielle || !s.lignes.some(function (x) { return x.obligatoire && !(num(x.pu) > 0); }); return true; }
  function finRows(l) {
    var s = finLot(l), st = structOf(l), tm = taxMode(), pul = tm === 'TTC' ? 'TTC' : 'HT';
    var line = function (x, j, kind, ro) {
      var m = num(x.quantite) * num(x.pu);
      return '<tr><td>' + esc(x.ref || (j + 1)) + '</td><td>' + (ro ? '<b>' + esc(x.designation) + '</b>' + (x.obligatoire ? '' : '<span class="bf-opt">Facultative</span>') + (x.description ? '<small>' + esc(x.description) + '</small>' : '') + (x.spec ? '<small style="color:#2e427b">Spécification : ' + esc(String(x.spec).split(' · ')[0]) + '</small>' : '') : '<input data-fl="' + kind + '|' + j + '|designation" value="' + esc(x.designation) + '" placeholder="Désignation de votre ligne">') + '</td>' +
        '<td class="r">' + (ro ? fmt(x.quantite) : '<input type="number" min="0" step="any" data-fl="' + kind + '|' + j + '|quantite" value="' + esc(x.quantite) + '" style="width:70px;text-align:right">') + '</td><td>' + (ro ? esc(x.unite) : '<input data-fl="' + kind + '|' + j + '|unite" value="' + esc(x.unite) + '" style="width:80px">') + '</td>' +
        '<td class="r"><input class="pu" type="number" min="0" step="any" data-fl="' + kind + '|' + j + '|pu" value="' + esc(x.pu) + '" placeholder="0" aria-label="Prix unitaire ' + pul + '"></td><td class="r v50ht">' + fmt(m) + '</td><td>' + (ro ? '' : '<button class="ghost" style="padding:2px 6px" data-fdel="' + j + '" title="Supprimer">✕</button>') + '</td></tr>';
    };
    var h = s.lignes.map(function (x, j) { return line(x, j, 'imp', true); }).join('');
    if (complOK(l)) {
      h += (st === 'mixte' ? '<tr class="sec"><td colspan="7">Lignes complémentaires proposées par vous (facultatif)</td></tr>' : '') + s.compl.map(function (x, j) { return line(x, j, 'cpl', false); }).join('') +
        '<tr><td colspan="7"><button class="ghost" data-fadd>＋ Ajouter une ligne</button></td></tr>';
    }
    return '<div class="bf-tw"><table class="bf-t"><thead><tr><th style="width:52px">Réf.</th><th>Désignation</th><th class="r" style="width:80px">Qté</th><th style="width:86px">Unité</th><th class="r" style="width:150px">Prix unitaire ' + pul + ' *</th><th class="r" style="width:130px">Montant ' + pul + '</th><th style="width:34px"></th></tr></thead><tbody>' + h + '</tbody></table></div>';
  }
