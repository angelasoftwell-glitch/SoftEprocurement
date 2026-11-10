# V375 — Notation pondérée : note du barème (référentiel) ≠ points attribués dans le DAO.
PTS = "((x.points_dao !== '' && x.points_dao != null && !isNaN(num(x.points_dao))) ? num(x.points_dao) : num(x.note_max))"

def rep(s, old, new, count=1):
    n = s.count(old)
    assert n == count, (n, old[:70])
    return s.replace(old, new)

def back(s):
    # v312 + v326 : le contrôle des 100 points porte sur les points DAO (repli : note du barème)
    s = rep(s, "tot = tech.reduce(function (a, x) { return a + (num(x.note_max) || 0); }, 0)",
            "tot = Math.round(tech.reduce(function (a, x) { return a + (" + PTS + " || 0); }, 0) * 100) / 100", 2)
    s = rep(s, "Le barème technique doit totaliser 100 points (actuellement ' + tot + ').'",
            "La somme des points DAO des critères techniques notés doit être égale à 100 (actuellement ' + tot + ').'")
    s = rep(s, "'\">Barème technique : ' + tot + ' / 100 pts</span>",
            "'\">Pondération technique du DAO : ' + tot + ' / 100 pts</span>")
    s = rep(s, "function fmtN(v)",
            "function ptsVal(x) { return has(x.points_dao) ? x.points_dao : (x.note_max || ''); }\n  function fmtN(v)")
    s = rep(s, "<th>Élim.</th><th>Points</th><th>Justificatif</th>",
            "<th>Élim.</th><th>Note du barème</th><th>Points DAO</th><th>Justificatif</th>")
    s = rep(s, "'</td><td>' + (x.mode_evaluation === 'Note' ? x.note_max : '—') + '</td><td>' + (x.doc_attendu",
            "'</td><td>' + (x.mode_evaluation === 'Note' ? 'sur ' + esc(x.note_max) : '—') + '</td><td>' + (x.mode_evaluation === 'Note' ? (ed ? '<input type=\"number\" class=\"v375pts\" min=\"0\" max=\"100\" step=\"0.5\" data-pts=\"' + i + '\" value=\"' + esc(ptsVal(x)) + '\"> pts' : '<b>' + esc(ptsVal(x)) + ' pts</b>') : (x.categorie === 'Technique' ? '<small style=\"color:#5b606d\">condition — 0 pt</small>' : '—')) + '</td><td>' + (x.doc_attendu")
    s = rep(s, "colspan=\"9\" style=\"color:#969ba8;text-align:center;padding:16px\">Aucun critère ' + DCAT",
            "colspan=\"10\" style=\"color:#969ba8;text-align:center;padding:16px\">Aucun critère ' + DCAT")
    s = rep(s, "'</tbody></table>';\n    card.querySelectorAll('[data-dcat]')",
            "'</tbody></table>' + (DCAT === 'Technique' && window.SM375 ? SM375.simu(d) : '');\n    card.querySelectorAll('[data-pts]').forEach(function (inp) { inp.onchange = function () { var x = d.criteres[+inp.dataset.pts]; if (!x) return; x.points_dao = inp.value; renderDao(); }; });\n    if (window.SM375) SM375.bind(card, d);\n    card.querySelectorAll('[data-dcat]')")
    # v310-phase2 : grille figée — poids = points DAO, max = note du barème
    s = rep(s, "if (k === 'tech') it.w = rich ? (cr.mode_evaluation === 'Note' ? num(cr.note_max) : 0)",
            "if (k === 'tech' && rich && cr.mode_evaluation === 'Note') it.max = num(cr.note_max);\n      if (k === 'tech') it.w = rich ? (cr.mode_evaluation === 'Note' ? ((cr.points_dao !== '' && cr.points_dao != null && !isNaN(num(cr.points_dao))) ? num(cr.points_dao) : num(cr.note_max)) : 0)")
    s = rep(s, "return a + (it.w ? (x.note || 0) : 0); }, 0); }",
            "return a + (it.w ? (x.note || 0) * (it.max ? it.w / it.max : 1) : 0); }, 0); }")
    s = rep(s, "function techTotal(dz, ref) { return Math.round(techRaw(dz, ref) * 1000 / techMax(dz)) / 10; }",
            "function techTotal(dz, ref) { return Math.round(techRaw(dz, ref) * 10000 / techMax(dz)) / 100; }")
    s = rep(s, "techRaw(dz, o.offer_ref) + '/' + mx + ' pts</small>'",
            "(Math.round(techRaw(dz, o.offer_ref) * 100) / 100) + '/' + mx + ' pts</small>'")
    s = rep(s, "(m === 'Note' ? (x.note + '/' + c.note_max) :",
            "(m === 'Note' ? (x.note + '/' + c.note_max + (it.max && it.w && it.w !== it.max ? ' → ' + (Math.round(x.note * it.w / it.max * 100) / 100).toLocaleString('fr-FR') + '/' + it.w + ' pts' : '')) :")
    s = rep(s, "(cr.w ? '/ ' + cr.w + ' pts' : 'condition')",
            "(cr.w ? (cr.max && cr.max !== cr.w ? 'barème /' + cr.max + ' → ' : '') + cr.w + ' pts DAO' : 'condition')")
    return s

def portal(p):
    p = rep(p, "techTot = tech.reduce(function (a, c) { return a + num(c.note_max); }, 0);",
            "techTot = tech.reduce(function (a, c) { return a + (c.mode_evaluation === 'Note' ? num(c.points_dao !== '' && c.points_dao != null ? c.points_dao : c.note_max) : 0); }, 0);")
    p = rep(p, "c.mode_evaluation === 'Note' && c.note_max ? c.note_max + ' pts' : ''",
            "c.mode_evaluation === 'Note' && (c.points_dao || c.note_max) ? (c.points_dao || c.note_max) + ' pts' : ''")
    p = rep(p, "(c.eliminatoire ? '<span class=\"cj-tag\">Obligatoire</span>' : '')",
            "(c.eliminatoire ? '<span class=\"cj-tag\">Obligatoire</span>' : '') + (c.categorie === 'Technique' && c.mode_evaluation === 'Note' && (c.points_dao || c.note_max) ? '<span class=\"cj-tag\">' + esc(c.points_dao || c.note_max) + ' pts</span>' : '')")
    return p
