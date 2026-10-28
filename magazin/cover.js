// Faindz Magazin — draggable before/after cover
// Mouse: press anywhere and drag. Touch: a horizontal swipe moves the divider,
// a vertical swipe scrolls the page as usual. Keyboard: the hidden range input.
// Rendering uses transforms only (no clip-path), batched per animation frame.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.matchMedia('(max-width: 720px)').matches) return; // phones use the swipe gallery
  var covers = document.querySelectorAll('[data-cover]');

  covers.forEach(function (cover, index) {
    var before = cover.querySelector('.before');
    var line = cover.querySelector('.cover-line');
    var knob = cover.querySelector('.cover-knob');
    var range = cover.querySelector('.cover-range');
    if (!before) return;

    // Wrap the "before" image so both can be moved with transforms.
    var wrap = document.createElement('div');
    wrap.className = 'before-wrap';
    before.parentNode.insertBefore(wrap, before);
    wrap.appendChild(before);

    cover.querySelectorAll('img').forEach(function (img) {
      img.draggable = false;
      img.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });

    var pct = 50, pending = false, touched = false, drag = null;

    function render() {
      pending = false;
      var off = 100 - pct;
      wrap.style.transform = 'translate3d(' + (-off) + '%,0,0)';
      before.style.transform = 'translate3d(' + off + '%,0,0)';
      line.style.left = pct + '%';
      knob.style.left = pct + '%';
      if (range) range.value = Math.round(pct);
    }
    function set(p) {
      pct = Math.max(0, Math.min(100, p));
      if (!pending) { pending = true; requestAnimationFrame(render); }
    }
    var rect = null;
    function moveTo(clientX) {
      if (!rect) rect = cover.getBoundingClientRect();
      set(((clientX - rect.left) / rect.width) * 100);
    }

    cover.addEventListener('pointerdown', function (e) {
      if (e.button > 0 || e.target.closest('a, button, input')) return;
      touched = true;
      rect = cover.getBoundingClientRect();
      var isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, active: !isTouch };
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

    function end(e) { if (drag && e.pointerId === drag.id) { drag = null; rect = null; } }
    cover.addEventListener('pointerup', end);
    cover.addEventListener('pointercancel', end);
    cover.addEventListener('lostpointercapture', end);

    if (range) range.addEventListener('input', function () { touched = true; set(Number(range.value)); });

    set(50);

    // One hint on load, only for the first slider on the page.
    if (index !== 0 || reduceMotion) return;
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

// Phones: Vorher | Nachher swipe gallery with two buttons
(function () {
  document.querySelectorAll('.swipe').forEach(function (sw) {
    var track = sw.querySelector('.swipe-track');
    var slides = sw.querySelectorAll('.swipe-slide');
    var buttons = sw.querySelectorAll('.swipe-nav button');
    function mark(i) {
      buttons.forEach(function (b, j) { b.setAttribute('aria-pressed', String(i === j)); });
    }
    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () {
        track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });
        mark(i);
      });
    });
    var t = null;
    track.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var i = track.scrollLeft > (slides[1].offsetLeft - slides[0].offsetLeft) / 2 ? 1 : 0;
        mark(i);
      }, 60);
    }, { passive: true });
  });
})();
