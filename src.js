// Traffic source for Awin reports.
// Ads link to faindz.de with ?src=fb (or utm_source=facebook/instagram/...).
// The source is kept for 30 days and added to every Awin link as clickref2,
// so Awin shows e.g. clickref=app + clickref2=fb for a sale from an ad.
(function () {
  var KEY = 'faindz_src';
  var MAP = { facebook: 'fb', fb: 'fb', instagram: 'ig', ig: 'ig', tiktok: 'tt', tt: 'tt', pinterest: 'pin', pin: 'pin', google: 'gads', gads: 'gads' };
  var src = '';
  try {
    var p = new URLSearchParams(location.search);
    var raw = (p.get('src') || p.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
    if (raw) {
      src = MAP[raw] || raw;
      localStorage.setItem(KEY, JSON.stringify({ s: src, t: Date.now() }));
    } else {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && Date.now() - saved.t < 30 * 864e5) src = saved.s;
    }
  } catch (e) {}
  window.faindzSrc = src;
  if (!src) return;

  function tag(a) {
    var h = a.getAttribute('href') || '';
    if (h.indexOf('awin1.com/cread.php') === -1 || h.indexOf('clickref2=') !== -1) return;
    a.setAttribute('href', h + '&clickref2=' + encodeURIComponent(src));
  }
  function tagAll(root) {
    var links = (root || document).querySelectorAll ? (root || document).querySelectorAll('a[href*="awin1.com/cread.php"]') : [];
    for (var i = 0; i < links.length; i++) tag(links[i]);
  }
  // Links are also built later by scripts (app results, shop prices):
  // tag them right before they are followed.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="awin1.com/cread.php"]');
    if (a) tag(a);
  }, true);
  document.addEventListener('auxclick', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="awin1.com/cread.php"]');
    if (a) tag(a);
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { tagAll(); });
  else tagAll();
})();
