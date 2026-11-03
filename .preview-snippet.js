// ─── HÖFFNER PRODUCT MATCHES ──────────────────────────────────────
// The proxy keeps Höffner's Awin product feed in memory and finds real
// products for each suggestion (POST /products). When it's SURE (right
// type, colour and material), the card shows that product with photo and
// real price, and every Höffner link goes straight to it. Otherwise
// nothing changes: the category link from hoeffnerUrl() stays.
// All cards rendered in the same tick are sent as ONE request.
window.HoeffnerMatch = (() => {
  const cache = new Map();      // key -> { sure, results } | null
  const pending = new Map();    // key -> [resolve, ...]
  let queue = [];
  let timer = null;

  const keyOf = p => [p.name, p.title, p.material, p.price_range].map(v => String(v || '').trim()).join('|');

  async function flush() {
    timer = null;
    const batch = queue.splice(0, 24);
    if (queue.length) timer = setTimeout(flush, 0);
    let data = null;
    try {
      const ctrl = new AbortController();
      const kill = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${PROXY_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 4,
          items: batch.map(({ p }) => ({ text: p.name || '', alt: productTitle(p), material: p.material || '', price: p.price_range || '' })),
        }),
        signal: ctrl.signal,
      });
      clearTimeout(kill);
      if (res.ok) data = await res.json();
    } catch (e) { /* proxy unreachable: keep category links */ }
    batch.forEach(({ key }, i) => {
      const r = data && data.ready && data.results ? data.results[i] || null : null;
      // don't cache "feed still loading", so the next look tries again
      if (data && data.ready) cache.set(key, r);
      (pending.get(key) || []).forEach(fn => fn(r));
      pending.delete(key);
    });
  }

  function get(p) {
    const key = keyOf(p);
    if (cache.has(key)) return Promise.resolve(cache.get(key));
    return new Promise(resolve => {
      if (!pending.has(key)) { pending.set(key, []); queue.push({ key, p }); }
      pending.get(key).push(resolve);
      if (!timer) timer = setTimeout(flush, 0);
    });
  }

  // Synchronous: the sure top product if already known
  function bestSync(p) {
    const r = cache.get(keyOf(p));
    return r && r.sure && r.results && r.results[0] ? r.results[0] : null;
  }

  return { get, bestSync };
})();

window.formatEuro = function formatEuro(v) {
  const n = Number(v) || 0;
  return new Intl.NumberFormat(currentLang === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2,
  }).format(n);
}

// Fill a rendered card with its Höffner match once it arrives
window.attachHoeffnerMatch = function attachHoeffnerMatch(card, p) {
  if (!card || !getShopsForProduct(p).includes('hoeffner')) return;
  HoeffnerMatch.get(p).then(r => {
    const best = r && r.sure && r.results && r.results[0];
    if (!best || !card.isConnected) return;

    // Every Höffner link on this card now opens the product itself
    card.querySelectorAll('a[data-shop="hoeffner"]').forEach(a => { a.href = best.link; });

    const meta = card.querySelector('.product-meta');
    if (!meta) return;
    const old = best.oldPrice ? `<s class="product-match-old">${escapeHtml(formatEuro(best.oldPrice))}</s>` : '';
    meta.classList.add('has-match');
    meta.innerHTML = `
      <a class="product-match" href="${escapeHtml(best.link)}" target="_blank" rel="sponsored noopener noreferrer" data-shop="hoeffner">
        <span class="product-match-img"><img src="${escapeHtml(best.image)}" alt="" loading="lazy" decoding="async"></span>
        <span class="product-match-body">
          <span class="product-match-title">${escapeHtml(best.title)}</span>
          <span class="product-match-price">${escapeHtml(formatEuro(best.price))}${old}</span>
        </span>
      </a>`;
    const img = meta.querySelector('img');
    img.addEventListener('error', () => meta.querySelector('.product-match-img').remove(), { once: true });
  });
}


;(()=>{const st=document.createElement('style'); st.textContent="  /* Real H\u00f6ffner product found for this suggestion (see attachHoeffnerMatch) */\n  .product-meta.has-match { display: block; padding-top: 12px; }\n  .product-match {\n    display: flex;\n    align-items: center;\n    gap: 12px;\n    margin: 0 -8px;\n    padding: 6px 8px;\n    border-radius: 12px;\n    color: var(--text);\n    text-decoration: none;\n    animation: match-in 0.45s var(--ease-out) both;\n    transition: background 0.2s;\n  }\n  .product-match:hover { background: var(--bg-hover); }\n  .product-match-img {\n    flex: none;\n    width: 56px;\n    height: 56px;\n    border-radius: 10px;\n    overflow: hidden;\n    background: #fff;\n    border: 1px solid var(--border);\n  }\n  .product-match-img img { width: 100%; height: 100%; object-fit: contain; display: block; }\n  .product-match-body { min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n  .product-match-title {\n    font-size: 13px;\n    font-weight: 500;\n    line-height: 1.3;\n    color: var(--text-muted);\n    display: -webkit-box;\n    -webkit-line-clamp: 2;\n    -webkit-box-orient: vertical;\n    overflow: hidden;\n  }\n  .product-match-price {\n    font-size: 14px;\n    font-weight: 600;\n    letter-spacing: -0.01em;\n    color: var(--text);\n  }\n  .product-match-old {\n    margin-left: 6px;\n    font-size: 12px;\n    font-weight: 500;\n    color: var(--text-subtle);\n  }\n  @keyframes match-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }\n  @media (max-width: 720px) {\n    .product-meta.has-match { padding-top: 8px !important; }\n    .product-match { gap: 8px; margin: 0 -4px; padding: 4px; border-radius: 10px; }\n    .product-match-img { width: 40px; height: 40px; border-radius: 8px; }\n    .product-match-title { font-size: 11px; -webkit-line-clamp: 1; }\n    .product-match-price { font-size: 12px; }\n    .product-match-old { font-size: 10.5px; margin-left: 4px; }\n  }\n  @media (prefers-reduced-motion: reduce) { .product-match { animation: none; } }\n\n"; document.head.appendChild(st);})();
