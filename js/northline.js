/* MarkRanc on the Northline template: the behaviour Framer's runtime provided, re-created from the template's own values
   (js/motion-data.js is generated from _teardown/motion.json; window.NL.appear is the page's own framer/appear data).
   - load appears, scroll reveals (once, any part in view), word / character text effects (stagger = transition delay)
   - whileHover values, hero parallax (speed 70: moves at 0.3 x scroll), status-dot loop, marquee ticker (60px/s, 25% on hover)
   - phone nav drawer (Phone -> Phone Open, spring 0.4s bounce 0.2), Lenis smooth scroll (duration 1.15), form states */
(function () {
  'use strict';
  var NL = window.NL || {}, M = window.NL_MOTION || {}, APPEAR = NL.appear || {};
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ------------------------------------------------ easing helpers (Framer tween / duration springs) */
  function springLinear(duration, bounce) {
    var z = 1 - bounce, w = 2 * Math.PI / Math.max(duration, 0.01) * 1.0, n = Math.max(24, Math.round(duration * 60)), pts = [];
    for (var i = 0; i <= n; i++) {
      var t = duration * i / n, v;
      if (z < 1) { var wd = w * Math.sqrt(1 - z * z); v = 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); }
      else v = 1 - Math.exp(-w * t) * (1 + w * t);
      pts.push(i === n ? 1 : +v.toFixed(4));
    }
    return 'linear(' + pts.join(', ') + ')';
  }
  function timing(tr, extraDelay) {
    tr = tr || {};
    var easing = tr.ease ? 'cubic-bezier(' + tr.ease.join(',') + ')' : (tr.type === 'spring' ? springLinear(tr.duration || 0.4, tr.bounce || 0) : 'ease');
    return { duration: ((tr.duration != null ? tr.duration : 0.4) * 1000) || 1, delay: ((tr.delay || 0) + (extraDelay || 0)) * 1000, easing: easing, fill: 'both' };
  }
  function tfm(o) {
    if (!o) return 'none';
    var p = [];
    if (o.x) p.push('translateX(' + o.x + 'px)');
    if (o.y) p.push('translateY(' + o.y + 'px)');
    if (o.scale != null && o.scale !== 1) p.push('scale(' + o.scale + ')');
    if (o.rotate) p.push('rotate(' + o.rotate + 'deg)');
    return p.length ? p.join(' ') : 'none';
  }
  function conf(el, k) {
    for (var i = 0; i < el.classList.length; i++) { var c = M[el.classList[i]]; if (c && c[k]) return c[k]; }
    return null;
  }
  function settle(el, a, end) {
    var done = function () { for (var k in end) el.style[k] = end[k]; if (a) a.cancel(); };
    if (!a) return done();
    a.onfinish = done;
    setTimeout(function () { if (a.playState !== 'finished') done(); }, (a.effect.getTiming().delay + a.effect.getTiming().duration) + 1500);
  }
  function play(el, from, to, t) {
    if (reduced || !el.animate) { for (var k in to) el.style[k] = to[k]; return; }
    settle(el, el.animate([from, to], t), to);
  }
  var FINAL = { opacity: '1', transform: 'none', filter: 'none' };

  /* ------------------------------------------------ appear on load (framer/appear data, default breakpoint) */
  $$('[data-framer-appear-id]').forEach(function (el) {
    var a = APPEAR[el.getAttribute('data-framer-appear-id')];
    var v = a && (a.default || a[Object.keys(a)[0]]);
    if (!v || !v.animate) return;
    var tr = v.animate.transition || {};
    play(el, { opacity: el.style.opacity || String(v.initial.opacity), transform: el.style.transform || tfm(v.initial) },
      { opacity: String(v.animate.opacity != null ? v.animate.opacity : 1), transform: tfm(v.animate) }, timing(tr));
  });

  /* ------------------------------------------------ scroll reveals + text effects in view */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && e.target.__go) { io.unobserve(e.target); e.target.__go(); e.target.__go = null; } });
  }, { threshold: 0 }) : null;
  function whenSeen(el, fn) { if (!io) return fn(); el.__go = fn; io.observe(el); }

  Object.keys(M).forEach(function (cls) {
    var c = M[cls];
    $$('.' + cls).forEach(function (el) {
      if (c.r && !el.__r) {
        el.__r = true;
        var go = function () {
          var cs = el.style, t = timing(c.r.t);
          play(el, { opacity: cs.opacity || '0', transform: cs.transform || tfm(c.r.e), filter: cs.filter || 'none' }, FINAL, t);
        };
        whenSeen(el, go);
      }
      if (c.t && !el.__t) {
        el.__t = true;
        var spans = $$('span', el).filter(function (s) { return /opacity:\s*0\.001/.test(s.getAttribute('style') || ''); });
        /* Framer staggers each word by the transition delay (0.05s). The template's lines are short (~2s for its
           longest); MarkRanc's paragraphs run to 100+ words, so the stagger is capped to finish inside that 2s. */
        var stag = Math.min((c.t.tr && c.t.tr.delay) || 0, spans.length > 1 ? 2 / spans.length : 1);
        var run = function () {
          spans.forEach(function (s, i) {
            var t = timing(c.t.tr, (c.t.sd || 0) + i * stag - ((c.t.tr && c.t.tr.delay) || 0));
            play(s, { opacity: '0.001', filter: 'blur(8px)', transform: s.style.transform || 'translateY(32px)' }, FINAL, t);
          });
        };
        if (c.t.tg === 'onInView') whenSeen(el, run); else run();
      }
      if (c.h && !el.__h && matchMedia('(hover: hover)').matches) {
        el.__h = true;
        var base = null, anim = null;
        el.addEventListener('pointerenter', function () {
          var cs = getComputedStyle(el);
          if (!base) base = { transform: cs.transform === 'none' ? 'none' : cs.transform, backgroundColor: cs.backgroundColor };
          var to = { transform: tfm(c.h.v) };
          if (c.h.v.backgroundColor) to.backgroundColor = c.h.v.backgroundColor;
          if (anim) anim.cancel();
          anim = el.animate([{ transform: cs.transform, backgroundColor: cs.backgroundColor }, to], timing(c.h.t));
        });
        el.addEventListener('pointerleave', function () {
          if (!base) return;
          var cs = getComputedStyle(el), from = { transform: cs.transform, backgroundColor: cs.backgroundColor };
          if (anim) anim.cancel();
          anim = el.animate([from, base], timing(c.h.t));
        });
      }
      if (c.l && !el.__l && el.animate && !reduced) {
        el.__l = true;
        var tr = c.l.t || {};
        el.animate([{ opacity: 1, transform: 'none' }, { opacity: c.l.v.opacity != null ? c.l.v.opacity : 1, transform: tfm(c.l.v) }],
          { duration: (tr.duration || 1) * 1000, easing: tr.ease ? 'cubic-bezier(' + tr.ease.join(',') + ')' : 'linear',
            iterations: Infinity, direction: c.l.m === 'mirror' ? 'alternate' : 'normal' });
      }
    });
  });

  /* ------------------------------------------------ parallax (Framer speed: element moves at speed% of the scroll) */
  var par = [];
  Object.keys(M).forEach(function (cls) { if (M[cls].p) $$('.' + cls).forEach(function (el) { par.push([el, M[cls].p]); }); });
  function onScroll() {
    var y = window.lenis ? window.lenis.scroll : window.scrollY;
    for (var i = 0; i < par.length; i++) par[i][0].style.transform = 'translateY(' + (y * (1 - par[i][1] / 100)).toFixed(2) + 'px)';
  }
  if (par.length && !reduced) { window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  /* ------------------------------------------------ marquee ticker */
  $$('[data-framer-name="Marquee"]').forEach(function (box) {
    var ul = box.querySelector('ul'); if (!ul || ul.__t) return; ul.__t = true;
    /* Framer server-renders the ticker hidden (opacity 0, x -gap) until it has measured it */
    ul.style.opacity = '1'; ul.style.transform = 'none'; ul.style.width = 'max-content'; ul.style.maxWidth = 'none';
    var gap = parseFloat(getComputedStyle(ul).columnGap || getComputedStyle(ul).gap) || 36;
    var items = $$(':scope > li', ul);
    var setW = function () { return items.reduce(function (s, li) { return s + li.getBoundingClientRect().width + gap; }, 0); };
    var w = setW(); if (!w) return;
    var copies = Math.max(1, Math.ceil(box.clientWidth / w) + 1);
    for (var k = 0; k < copies; k++) items.forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); ul.appendChild(c); });
    ul.style.willChange = 'transform';
    if (reduced) return;
    var anim = ul.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-w) + 'px)' }], { duration: w / 60 * 1000, iterations: Infinity });
    box.addEventListener('pointerenter', function () { anim.playbackRate = 0.25; });
    box.addEventListener('pointerleave', function () { anim.playbackRate = 1; });
  });

  /* ------------------------------------------------ phone nav drawer (Phone <-> Phone Open) */
  var X = '<svg viewBox="0 0 24 24" class="x-close" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="var(--1m973uw, #14113c)" stroke-width="2" stroke-linecap="round"/></svg>';
  $$('.framer-PKBUy.framer-v-lyc8pj').forEach(function (nav) {
    var btn = nav.querySelector('[data-framer-name="Menu Button"]'); if (!btn) return;
    var icon = btn.querySelector('svg'), open = false;
    btn.setAttribute('role', 'button'); btn.setAttribute('aria-label', 'Open menu'); btn.setAttribute('aria-expanded', 'false');
    var set = function (want) {
      var h0 = nav.getBoundingClientRect().height;
      open = want;
      nav.classList.toggle('framer-v-lyc8pj', !open); nav.classList.toggle('framer-v-1ptemya', open);
      nav.setAttribute('data-framer-name', open ? 'Phone Open' : 'Phone');
      /* Phone Open variant: solid ink panel behind the drawer (the closed bar is transparent over the hero) */
      nav.style.backgroundColor = open ? 'var(--token-4da627ef-0cd5-4962-a6bd-8cb436b730fa, #14113c)' : 'rgba(20, 17, 60, 0)';
      icon.style.display = open ? 'none' : '';
      var x = btn.querySelector('.x-close'); if (open && !x) btn.insertAdjacentHTML('beforeend', X); else if (!open && x) x.remove();
      btn.setAttribute('aria-expanded', open ? 'true' : 'false'); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      var h1 = nav.getBoundingClientRect().height;
      if (!reduced && nav.animate) { nav.style.overflow = 'hidden'; nav.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 400, easing: springLinear(0.4, 0.2) }).onfinish = function () { nav.style.overflow = ''; }; }
    };
    btn.addEventListener('click', function () { set(!open); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!open); } });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (open) set(false); }); });
  });

  /* ------------------------------------------------ smooth scroll (template: Smooth Scroll component, duration 1.15) */
  if (window.Lenis && !reduced) {
    try { window.lenis = new window.Lenis({ duration: 1.15, autoRaf: true, anchors: true }); window.lenis.on('scroll', onScroll); } catch (e) {}
  }

  /* ------------------------------------------------ forms: no backend yet; show the template's sent state */
  $$('form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var b = f.querySelector('button[type="submit"], [type="submit"]');
      var p = b && b.querySelector('p');
      if (p) p.textContent = 'Thank you, we’ll be in touch';
      f.reset();
    });
  });
})();
