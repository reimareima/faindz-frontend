// Faindz Magazin — draggable before/after cover
(function () {
  document.querySelectorAll('[data-cover]').forEach(function (cover) {
    var before = cover.querySelector('.before');
    var line = cover.querySelector('.cover-line');
    var knob = cover.querySelector('.cover-knob');
    var range = cover.querySelector('.cover-range');
    var dragging = false;

    function set(pct) {
      pct = Math.max(0, Math.min(100, pct));
      before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      line.style.left = pct + '%';
      knob.style.left = pct + '%';
      if (range) range.value = Math.round(pct);
    }
    function fromEvent(e) {
      var r = cover.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }

    cover.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button')) return;
      dragging = true;
      cover.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    cover.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    cover.addEventListener('pointerup', function () { dragging = false; });
    cover.addEventListener('pointercancel', function () { dragging = false; });
    if (range) range.addEventListener('input', function () { set(Number(range.value)); });

    set(50);

    // One hint on load: the divider sweeps once so people see it moves.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var start = null;
    function sweep(t) {
      if (dragging) return;
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / 1400);
      // 50 -> 22 -> 50, eased
      var s = Math.sin(p * Math.PI);
      set(50 - 28 * s * s);
      if (p < 1) requestAnimationFrame(sweep);
    }
    setTimeout(function () { requestAnimationFrame(sweep); }, 700);
  });
})();
