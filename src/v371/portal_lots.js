  /* V371 : onglet « Lots & Prix » refondu — règles financières en tête, puis une carte par lot montrant
     exactement ce que le soumissionnaire devra chiffrer (bordereau, forfait ou devis libre). */
  (function () {
    if (document.getElementById('pl371-css')) return;
    var s = document.createElement('style'); s.id = 'pl371-css';
    s.textContent = [
      '.pl-wrap{--n:#2e427b;--bd:#e9ebf0;--mu:#5b606d;--bg:#f5f7f9;color:#0b1332}',
      '.pl-rules{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:16px}@media(max-width:900px){.pl-rules{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '.pl-rule{background:var(--bg);border-radius:10px;padding:12px 14px;min-width:0}.pl-rule small{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--mu)}.pl-rule b{display:block;font-size:14.5px;margin-top:4px}.pl-rule span{display:block;font-size:12px;color:var(--mu);margin-top:2px;line-height:1.35}',
      '.pl-jump{display:flex;gap:6px;flex-wrap:wrap;margin-top:16px}.pl-jump a{border:1px solid var(--bd);border-radius:999px;padding:5px 12px;font-size:12.5px;font-weight:700;color:var(--n);text-decoration:none;background:#fff}.pl-jump a:hover{border-color:var(--n)}',
      '.pl-lot{background:#fff;border:1px solid var(--bd);border-radius:14px;margin-top:16px;overflow:hidden;box-shadow:0 5px 17px rgba(24,36,79,.04)}',
      '.pl-lh{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;padding:16px 18px;border-bottom:1px solid var(--bd)}.pl-lh h3{margin:0;font-size:16px;display:flex;gap:10px;align-items:center}.pl-lh h3 i{font-style:normal;background:var(--n);color:#fff;border-radius:7px;padding:3px 9px;font-size:12px;white-space:nowrap}',
      '.pl-meta{display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;font-size:12.5px;color:var(--mu)}.pl-meta b{color:#0b1332;font-weight:600}',
      '.pl-st{display:inline-flex;align-items:center;gap:6px;background:#eef2fb;color:var(--n);border-radius:999px;padding:5px 12px;font-size:12.5px;font-weight:700;white-space:nowrap}',
      '.pl-lb{padding:16px 18px}.pl-lb h4{margin:0 0 8px;font-size:13px;font-weight:800}.pl-lb p{margin:0}',
      '.pl-tw{overflow-x:auto;border:1px solid var(--bd);border-radius:10px}.pl-t{width:100%;border-collapse:collapse;font-size:13px;min-width:620px}.pl-t th{background:var(--bg);text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.03em;color:var(--mu);padding:8px 10px;white-space:nowrap}.pl-t td{padding:9px 10px;border-top:1px solid var(--bd);vertical-align:top}.pl-t td small{display:block;color:var(--mu);font-size:12px;margin-top:2px}.pl-t td.pu{color:#969ba8;font-style:italic;white-space:nowrap}.pl-t .opt{display:inline-block;margin-left:6px;background:#fff7ed;color:#9a3412;border-radius:6px;padding:1px 7px;font-size:11px;font-weight:700}',
      '.pl-flags{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.pl-flag{display:inline-flex;gap:6px;align-items:center;border-radius:8px;padding:6px 10px;font-size:12.5px;background:var(--bg);color:#353944}.pl-flag.y{background:#ecfdf5;color:#065f46}.pl-flag.n{background:#fff5f6;color:#9f1239}',
      '.pl-box{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:12px}@media(max-width:800px){.pl-box{grid-template-columns:1fr}}.pl-box>div{background:var(--bg);border-radius:10px;padding:12px 14px}.pl-box small{display:block;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--mu)}.pl-box b{display:block;margin-top:4px;font-size:14px}',
      '.pl-list{margin:8px 0 0;padding:0;list-style:none;display:grid;gap:6px}.pl-list li{display:flex;gap:8px;align-items:flex-start;font-size:13px}.pl-list li:before{content:"✓";color:var(--n);font-weight:800}',
      '.pl-ins{margin-top:12px;border-left:3px solid var(--n);background:#f7f9fd;padding:10px 12px;border-radius:0 8px 8px 0;font-size:13px;line-height:1.5}.pl-ins b{display:block;font-size:12px;color:var(--n);margin-bottom:2px}',
      '.pl-foot{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}@media(max-width:800px){.pl-foot{grid-template-columns:1fr}}.pl-foot>div{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:16px 18px}.pl-foot h4{margin:0 0 10px;font-size:14px}',
      '.pl-chips{display:flex;flex-wrap:wrap;gap:6px}.pl-chips span{background:var(--bg);border-radius:999px;padding:5px 11px;font-size:12.5px;font-weight:600;color:#353944}'
    ].join('');
    document.head.appendChild(s);
  })();
  function lots() {
    var d = D(), F = d.finance || null, b = d.besoin || null, L = lotsOf(), dev = devise(), multi = L.length > 1;
    var STR = { bordereau: ['▦', 'Bordereau de prix'], mixte: ['▦', 'Bordereau de prix + lignes complémentaires'], forfait: ['◉', 'Prix forfaitaire'], libre: ['✎', 'Devis libre'] };
    var RAB = { lot: 'par lot', global: 'global', conditionnel: 'conditionnel (combinaison de lots)' };
    var taxes = F ? (F.taxes === 'TTC' ? 'Toutes taxes comprises (TTC)' : F.taxes === 'Selon régime' ? 'HT ou TTC selon votre régime fiscal' : 'Hors taxes (HT)') : '';
    var rules = F ? '<div class="pl-rules">' +
      '<div class="pl-rule"><small>Monnaie de l’offre</small><b>' + esc(dev) + '</b><span>' + (F.devise_mode === 'multiples' ? 'Plusieurs monnaies acceptées.' : 'Tous les prix dans cette monnaie.') + '</span></div>' +
      '<div class="pl-rule"><small>Présentation des prix</small><b>' + esc(F.taxes || 'HT') + '</b><span>' + esc(taxes) + '</span></div>' +
      '<div class="pl-rule"><small>Rabais</small><b>' + (F.rabais ? 'Autorisés' : 'Non autorisés') + '</b><span>' + (F.rabais ? 'Rabais ' + (F.rabais_types || []).map(function (t) { return RAB[t] || t; }).join(', ') + '. À déclarer dans votre offre.' : 'Aucune remise ne sera prise en compte.') + '</span></div>' +
      (multi ? '<div class="pl-rule"><small>Lots</small><b>' + (F.soumission_par_lot ? 'Au choix' : 'Tous les lots') + '</b><span>' + (F.soumission_par_lot ? (F.max_lots_offre ? 'Jusqu’à ' + esc(F.max_lots_offre) + ' lot(s) par offre' : 'Un ou plusieurs lots') + (F.max_lots_attrib ? ' ; ' + esc(F.max_lots_attrib) + ' lot(s) attribuable(s) au plus.' : '.') : 'Votre offre doit couvrir l’ensemble des lots.') + '</span></div>'
        : '<div class="pl-rule"><small>Estimation</small><b>' + (F.estimation_publiee ? esc(money(L[0].montant_estimatif || L[0].montant, dev) || '—') : 'Non publiée') + '</b><span>' + (F.estimation_publiee ? 'Montant prévisionnel de l’entité.' : 'Montant prévisionnel non communiqué.') + '</span></div>') +
      '</div>' : '';
    var jump = multi ? '<div class="pl-jump">' + L.map(function (l, i) { return '<a href="#pl-lot-' + i + '" onclick="var e=document.getElementById(\'pl-lot-' + i + '\');if(e){e.scrollIntoView({behavior:\'smooth\',block:\'start\'});}return false;">' + esc(lotKey(l, i)) + (l.intitule ? ' · ' + esc(l.intitule) : '') + '</a>'; }).join('') + '</div>' : '';
    var cards = L.map(function (l, i) {
      var key = lotKey(l, i), cfg = F && F.lots ? F.lots[key] : null, bl = b && b.lots ? (b.lots.find(function (x) { return x.numero === key; }) || (b.lots.length === L.length ? b.lots[i] : null)) : null;
      var st = cfg ? (STR[cfg.structure] || STR.bordereau) : null, body = '';
      var meta = [['Délai d’exécution', l.delai_execution], ['Lieu', l.lieu_execution], ['Estimation', F && F.estimation_publiee && multi ? money(l.montant_estimatif || l.montant, dev) : '']].filter(function (x) { return x[1]; });
      if (cfg && (cfg.structure === 'bordereau' || cfg.structure === 'mixte')) {
        var ls = cfg.lignes || [], nOpt = ls.filter(function (x) { return !x.obligatoire; }).length;
        body = '<h4>Articles à chiffrer (' + ls.length + ')</h4><div class="pl-tw"><table class="pl-t"><thead><tr><th style="width:60px">Réf.</th><th>Désignation</th><th style="width:80px">Qté</th><th style="width:80px">Unité</th><th style="width:120px">Spécification</th><th style="width:150px">Prix unitaire ' + esc(F.taxes || 'HT') + '</th></tr></thead><tbody>' +
          (ls.length ? ls.map(function (x) { return '<tr><td>' + esc(x.ref) + '</td><td><b>' + esc(x.designation) + '</b>' + (x.obligatoire ? '' : '<span class="opt">Facultative</span>') + (x.description ? '<small>' + esc(x.description) + '</small>' : '') + '</td><td>' + esc(num(x.quantite).toLocaleString('fr-FR')) + '</td><td>' + esc(x.unite) + '</td><td>' + esc(x.spec || '—') + '</td><td class="pu">à saisir en ' + esc(dev) + '</td></tr>'; }).join('') : '<tr><td colspan="6" class="pu">Le bordereau sera communiqué dans le DAO.</td></tr>') +
          '</tbody></table></div>' +
          '<div class="pl-flags">' + (cfg.offre_partielle ? '<span class="pl-flag y">✓ Chiffrage partiel autorisé' + (nOpt ? ' (' + nOpt + ' ligne(s) facultative(s))' : '') + '</span>' : '<span class="pl-flag n">✕ Chiffrage partiel non autorisé : chiffrez toutes les lignes obligatoires</span>') +
          (cfg.structure === 'mixte' ? '<span class="pl-flag y">＋ Vous pouvez ajouter des lignes complémentaires</span>' : '<span class="pl-flag">Aucune ligne supplémentaire acceptée</span>') +
          '<span class="pl-flag">Montant = Quantité × Prix unitaire, calculé automatiquement</span></div>';
      } else if (cfg && cfg.structure === 'forfait') {
        body = '<h4>Ce que vous devez chiffrer</h4><div class="pl-box"><div><small>Objet du forfait</small><b>' + esc(cfg.objet || l.intitule || '—') + '</b></div><div><small>Votre prix</small><b>Un montant global</b><span style="font-size:12px;color:#5b606d">Forfait × 1, en ' + esc(dev) + ' ' + esc(F.taxes || 'HT') + '</span></div></div>' +
          '<div class="pl-flags">' + (cfg.devis_demande ? '<span class="pl-flag y">⎙ Devis détaillé à joindre</span>' : '<span class="pl-flag">Devis détaillé non exigé</span>') + '</div>';
      } else if (cfg && cfg.structure === 'libre') {
        var el = String(cfg.elements_obligatoires || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
        body = '<h4>Ce que vous devez chiffrer</h4><div class="pl-box"><div><small>Objet</small><b>' + esc(cfg.objet || l.intitule || '—') + '</b></div><div><small>Votre prix</small><b>Votre propre devis</b><span style="font-size:12px;color:#5b606d">Lignes libres, en ' + esc(dev) + ' ' + esc(F.taxes || 'HT') + '</span></div></div>' +
          (cfg.instructions ? '<div class="pl-ins"><b>Comment présenter votre devis</b>' + esc(cfg.instructions) + '</div>' : '') +
          (el.length ? '<h4 style="margin-top:14px">Le devis doit contenir</h4><ul class="pl-list">' + el.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '');
      } else if (bl && bl.nature === 'prestation' && bl.prestation) {
        body = grid([['Besoin', bl.prestation.besoin], ['Résultats attendus', bl.prestation.resultats], ['Quantité', bl.prestation.volume]]);
      } else if (bl && bl.lignes && bl.lignes.length) {
        body = '<div class="pl-tw"><table class="pl-t"><thead><tr><th>Désignation</th><th>Caractéristiques</th><th>Quantité</th><th>Unité</th></tr></thead><tbody>' + bl.lignes.map(function (x) { return '<tr><td><b>' + esc(x.designation) + '</b></td><td>' + esc(x.description || '—') + '</td><td>' + esc(x.quantite) + '</td><td>' + esc(x.unite || '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      } else if (l.description) body = '<p class="v35-muted" style="white-space:pre-wrap">' + esc(l.description) + '</p>';
      else body = '<p class="v35-muted">Le détail de ce lot figure dans le DAO.</p>';
      if (cfg && cfg.instructions && cfg.structure !== 'libre') body += '<div class="pl-ins"><b>Instructions pour ce lot</b>' + esc(cfg.instructions) + '</div>';
      return '<div class="pl-lot" id="pl-lot-' + i + '"><div class="pl-lh"><div><h3><i>' + esc(key) + '</i>' + esc(l.intitule || '') + '</h3>' +
        (meta.length ? '<div class="pl-meta">' + meta.map(function (m) { return '<span>' + m[0] + ' : <b>' + esc(m[1]) + '</b></span>'; }).join('') + '</div>' : '') + '</div>' +
        (st ? '<span class="pl-st">' + st[0] + ' ' + st[1] + '</span>' : '') + '</div><div class="pl-lb">' + body + '</div></div>';
    }).join('');
    var foot = F ? '<div class="pl-foot"><div><h4>⎙ Pièces financières à joindre</h4>' + ((F.documents || []).length ? '<div class="pl-chips">' + F.documents.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' : '<p class="v35-muted">Aucune pièce financière particulière.</p>') + '</div>' +
      '<div><h4>ⓘ Instructions financières</h4><p class="v35-muted" style="margin:0">' + esc(F.instructions || 'Voir le DAO.') + '</p></div></div>' : '';
    return '<div class="pl-wrap"><div class="v35-section-head"><div><h2>Lots &amp; Prix</h2><div class="v35-muted">Ce que vous devez chiffrer pour ' + (multi ? 'chaque lot' : 'ce marché') + ' et les règles de présentation de votre offre financière.</div></div></div>' +
      rules + jump + cards + foot + '</div>';
  }
