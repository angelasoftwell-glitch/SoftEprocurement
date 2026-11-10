<script id="v373-portal-report">
/* V373 — Portail : mention « Date limite reportée » sur la fiche de la consultation. */
(function () {
  "use strict";
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function fd(v) { var d = new Date(v); if (!v || isNaN(d)) return '—'; return ('0' + d.getDate()).slice(-2) + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear() + ' à ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function banner() {
    var x = document.getElementById('v35Exact'); if (!x) return;
    var old = document.getElementById('v373-banner'); if (old) old.remove();
    var p = window.V8P, c = p && p.consultation, r = c && c.reports_date_limite;
    if (!r || !r.length) return;
    var last = r[r.length - 1], hero = x.querySelector('.v35-hero'); if (!hero) return;
    var b = document.createElement('div'); b.id = 'v373-banner';
    b.style.cssText = 'margin:0 0 14px;padding:12px 16px;border-radius:12px;background:#fff7e6;border:1px solid #f3d19c;color:#5c3b00;font-size:14px;line-height:1.5';
    b.innerHTML = '<b>⟳ Date limite reportée</b> — nouvelle date limite de dépôt : <b>' + esc(fd(c.date_limite)) + '</b> (au lieu du <s>' + esc(fd(last.ancienne)) + '</s>). Ouverture des offres : ' + esc(fd(c.ouverture_offres)) + '.<br><small>Motif : ' + esc(last.motif) + '. Voir l’onglet <a href="#" data-v373-add style="color:#2e427b;font-weight:700">Additifs</a>. Les offres déjà déposées restent valables et peuvent être modifiées jusqu’à la nouvelle date.' + (r.length > 1 ? ' (' + r.length + ' reports)' : '') + '</small>';
    hero.parentNode.insertBefore(b, hero);
    var a = b.querySelector('[data-v373-add]'); if (a) a.onclick = function (e) { e.preventDefault(); var t = document.querySelector('.v35-tab[data-v35tab="additifs"]'); if (t) t.click(); };
    var ev = x.querySelectorAll('.v35-side-card .v35-event b')[2];
    if (ev && !ev.querySelector('s')) ev.insertAdjacentHTML('beforeend', '<br><small style="font-weight:500;color:#9a5b00">reportée — initialement <s>' + esc(fd(r[0].ancienne)) + '</s></small>');
  }
  function hook() {
    if (typeof window.openPublishedTender !== 'function' || window.openPublishedTender.__v373) return;
    var o = window.openPublishedTender;
    window.openPublishedTender = function () { var r = o.apply(this, arguments); setTimeout(banner, 250); setTimeout(banner, 900); return r; };
    window.openPublishedTender.__v373 = true;
  }
  setTimeout(hook, 1500); setTimeout(hook, 4000);
  window.SM373P = { banner: banner };
})();
</script>
