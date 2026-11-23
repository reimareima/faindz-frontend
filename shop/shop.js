// faindz Partnershop: live prices and the type filter.
// Every product card carries data-shop and data-link (its Awin link).
// The proxy looks the link up in today's feed: a new price replaces the
// one written in the page, a product no longer in the feed is hidden.
(function () {
  var PROXY = 'https://reima-proxy-production.up.railway.app';
  var cards = Array.prototype.slice.call(document.querySelectorAll('.ps-item[data-link]'));
  var stamp = document.querySelector('[data-price-stamp]');
  var euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  function fmt(n) { return euro.format(n).replace(',00', ''); }

  function updateCount() {
    var c = document.querySelector('[data-count]');
    if (!c) return;
    var n = cards.filter(function (el) { return !el.hidden && !el.dataset.gone; }).length;
    c.textContent = n === 1 ? '1 Stück' : n + ' Stücke';
  }

  if (cards.length) {
    fetch(PROXY + '/shop/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cards.map(function (el) { return { shop: el.dataset.shop, link: el.dataset.link }; }) })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.ready) return;
        d.results.forEach(function (r, i) {
          var el = cards[i];
          if (!r) { el.hidden = true; el.dataset.gone = '1'; return; }
          var p = el.querySelector('[data-price]');
          if (p) p.textContent = fmt(r.price) + '*';
          var o = el.querySelector('[data-old]');
          if (o) o.textContent = r.oldPrice ? fmt(r.oldPrice) : '';
        });
        if (stamp) {
          var t = new Date();
          stamp.textContent = 'Stand: heute, ' + t.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
        }
        updateCount();
      })
      .catch(function () { /* keep the prices written in the page */ });
  }

  // Type filter on the style pages
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.ps-filter button'));
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var kind = b.dataset.kind;
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      cards.forEach(function (el) {
        el.hidden = !!el.dataset.gone || (kind !== 'alle' && el.dataset.kind !== kind);
      });
      updateCount();
    });
  });
})();
