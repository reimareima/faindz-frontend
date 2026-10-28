// Faindz Magazin — draggable before/after cover
// Mouse: press anywhere and drag. Touch: a horizontal swipe moves the divider,
// a vertical swipe scrolls the page as usual. Keyboard: the hidden range input.
(function () {
  document.querySelectorAll('[data-cover]').forEach(function (cover) {
    var before = cover.querySelector('.before');
    var line = cover.querySelector('.cover-line');
    var knob = cover.querySelector('.cover-knob');
    var range = cover.querySelector('.cover-range');
    var touched = false;      // user has interacted -> stop the intro sweep
    var drag = null;          // { id, x0, y0, active, isTouch }

    cover.querySelectorAll('img').forEach(function (img) {
      img.draggable = false;
      img.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });

    function set(pct) {
      pct = Math.max(0, Math.min(100, pct));
      before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      line.style.left = pct + '%';
      knob.style.left = pct + '%';
      if (range) range.value = Math.round(pct);
    }
    function moveTo(clientX) {
      var r = cover.getBoundingClientRect();
      set(((clientX - r.left) / r.width) * 100);
    }

    cover.addEventListener('pointerdown', function (e) {
      if (e.button > 0 || e.target.closest('a, button, input')) return;
      touched = true;
      var isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, active: !isTouch, isTouch: isTouch };
      if (!isTouch) {
        e.preventDefault();
        cover.setPointerCapture(e.pointerId);
        moveTo(e.clientX);
      }
    });

    cover.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.active) {
        var dx = Math.abs(e.clientX - drag.x0), dy = Math.abs(e.clientY - drag.y0);
        if (dx < 8 && dy < 8) return;
        if (dy > dx) { drag = null; return; }   // vertical: let the page scroll
        drag.active = true;
        try { cover.setPointerCapture(e.pointerId); } catch (err) {}
      }
      moveTo(e.clientX);
    });

    function end(e) { if (drag && e.pointerId === drag.id) drag = null; }
    cover.addEventListener('pointerup', end);
    cover.addEventListener('pointercancel', end);
    cover.addEventListener('lostpointercapture', end);

    if (range) {
      range.addEventListener('input', function () { touched = true; set(Number(range.value)); });
    }

    set(50);

    // One hint on load: the divider sweeps once so people see it moves.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var start = null;
    function sweep(t) {
      if (touched) return;
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / 1400);
      var s = Math.sin(p * Math.PI);
      set(50 - 28 * s * s);
      if (p < 1) requestAnimationFrame(sweep);
    }
    setTimeout(function () { if (!touched) requestAnimationFrame(sweep); }, 700);
  });
})();
