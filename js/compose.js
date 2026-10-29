/* MarkRanc on the Compose template: the behaviour Framer's runtime provided, re-created.
   - load fade (every element the template server-renders at opacity 0.001: 1s tween [.12,.23,.5,1])
   - hover / pressed variants (adds .hover / .pressed like Framer; colours and opacity live in compose.css)
   - the phone menu (the Nav component's own "Mobile Open" variant, instant like the template)
   - Load More (pages of 6, cards cloned from the list's own first card, data from data/posts.json)
   - form button states (Loading spinner -> Success); no backend is connected yet
   The page-change wipe is CSS only (cross-document view transition, see compose.css). */
(function () {
  'use strict';
  var C = window.COMPOSE || {}, PRE = C.prefix || './';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------------------------------------------------------------- load fade
     Framer ends the fade on transform: perspective(1200px) and keeps it. That transform is load-bearing: it makes the
     section a stacking context, and the home header's gradient (z-index -1) is only visible inside one. */
  $$('[style*="opacity:0.001"]').forEach(function (el) {
    var st = el.getAttribute('style') || '';
    var tf = (st.match(/transform:\s*([^;]+)/) || [])[1] || 'none';
    var end = /translate/.test(tf) ? 'none' : tf;
    var done = function () { el.style.opacity = '1'; el.style.transform = end; };
    if (reduced || !el.animate) return done();
    var a = el.animate([{ opacity: 0.001, transform: tf }, { opacity: 1, transform: end }],
      { duration: 1000, easing: 'cubic-bezier(.12,.23,.5,1)', fill: 'forwards' });
    a.onfinish = function () { done(); a.cancel(); };
    /* a hidden tab never advances animations: make sure the page is never left invisible */
    setTimeout(function () { if (a.playState !== 'finished') { a.cancel(); done(); } }, 2600);
  });

  /* ---------------------------------------------------------------- hover / pressed variants */
  var canHover = matchMedia('(hover: hover)').matches;
  function gestures(el, also) {
    if (el.__g) return; el.__g = true;
    var targets = function () { return [el].concat(also ? also(el) : []); };
    if (canHover) {
      el.addEventListener('pointerenter', function () { targets().forEach(function (t) { t.classList.add('hover'); }); });
      el.addEventListener('pointerleave', function () { targets().forEach(function (t) { t.classList.remove('hover', 'pressed'); }); });
    }
    el.addEventListener('pointerdown', function () { targets().forEach(function (t) { t.classList.add('pressed'); }); });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      el.addEventListener(ev, function () { targets().forEach(function (t) { t.classList.remove('pressed'); }); });
    });
  }
  function wireGestures(root) {
    $$('.framer-1FOTy, .framer-Qfaoy, .framer-2XjAU, .framer-oQUrK, .framer-9E5RK', root).forEach(function (el) { gestures(el); });
    $$('a[data-framer-name="Work Layout"]', root).forEach(function (a) {
      gestures(a, function (x) { return $$('.framer-4jU32', x); });
    });
  }
  wireGestures(document);

  /* ---------------------------------------------------------------- phone menu (Mobile -> Mobile Open) */
  $$('nav[data-x-nav]').forEach(function (nav) {
    var btn = nav.querySelector('[data-framer-name="Mobile Menu Icon"] > div');
    var burger = nav.querySelector('.framer-j96Xb');
    var lines = burger ? [burger.querySelector('.framer-17y5z1o'), burger.querySelector('.framer-t8t6a1')] : [];
    var links = nav.querySelector('.framer-54jawh');
    var open = false;
    var set = function (want) {
      open = want;
      nav.classList.toggle('framer-v-8zdo7o', !open);
      nav.classList.toggle('framer-v-1o2zgfn', open);
      nav.setAttribute('data-framer-name', open ? 'Mobile Open' : 'Mobile');
      if (burger) {
        burger.classList.toggle('framer-v-4o0tdj', !open);
        burger.classList.toggle('framer-v-xr7683', open);
      }
      if (lines[0]) lines[0].style.transform = open ? 'rotate(45deg)' : 'none';
      if (lines[1]) lines[1].style.transform = open ? 'rotate(-45deg)' : 'none';
      if (links) links.style.opacity = open ? '1' : '0';
      if (btn) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    };
    if (!btn) return;
    btn.addEventListener('click', function () { set(!open); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!open); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(false); });
    $$('a', links).forEach(function (a) { a.addEventListener('click', function () { if (open) set(false); }); });
  });

  /* ---------------------------------------------------------------- spinners (the template's Spinner layers) */
  var MASK = "url('" + PRE + "img/brand/spinner-mask.svg') alpha no-repeat center / cover add";
  function spinner(kind) {
    var d = document.createElement('div');
    var ink = 'var(--token-0a481ec1-86f0-4e6d-86e6-79d7bce4ec1d, #241f58)', white = 'var(--token-c6382a73-6aed-449b-902c-5e757599ba02, #fff)';
    if (kind === 'more') {
      d.className = 'framer-8tiryr'; d.setAttribute('data-framer-name', 'Spinner');
      d.innerHTML = '<div class="framer-1mm7far x-spin" data-framer-name="Conic" style="background:conic-gradient(from 0deg at 50% 50%, ' +
        white + ' 0deg, ' + ink + ' 342deg)"><div class="framer-1dpuj6h" data-framer-name="Round" style="background-color:' + ink +
        ';border-radius:1px"></div></div>';
    } else {
      d.className = 'framer-16gj6xx'; d.setAttribute('data-framer-name', 'Spinner');
      d.innerHTML = '<div class="framer-60a8so x-spin" data-framer-name="Conic" style="background:conic-gradient(from 0deg at 50% 50%, ' +
        'rgba(36, 31, 88, 0) 7.2deg, ' + white + ' 342deg)"><div class="framer-k4b40a" data-framer-name="Rounding" style="background-color:' +
        white + ';border-radius:1px"></div></div>';
    }
    d.style.mask = MASK; d.style.webkitMask = MASK;
    return d;
  }

  /* ---------------------------------------------------------------- Load More */
  var data = null;
  function getData() {
    if (!data) data = fetch(PRE + 'data/posts.json').then(function (r) { return r.json(); });
    return data;
  }
  var ACCENTS = /--token-(8d014b65-03cb-4539-bf80-fc13caf0c590|05a392a4-506e-4e51-ad33-307b61de4110|e58dccd5-2ef9-4fb7-be37-8550dba06359|9417b8eb-c0fb-4faa-a2c9-6880b7ec3b2e)/g;
  function rowsFor(src, all) {
    var rows = all.posts;
    if (src.indexOf('all:not:') === 0) { var x = src.slice(8); return rows.filter(function (r) { return r[0] !== x; }); }
    if (src.indexOf('cat:') === 0) { var c = src.slice(4); return rows.filter(function (r) { return r[3] === c; }); }
    return rows;
  }
  function fillCard(proto, row, cats) {
    var a = proto.cloneNode(true), cat = cats[row[3]];
    a.setAttribute('href', PRE + row[0] + '/');
    a.__g = false;
    $$('[style*="--token-"]', a).forEach(function (e) { e.setAttribute('style', e.getAttribute('style').replace(ACCENTS, '--token-' + cat.token)); });
    $$('.framer-3z86bf p', a).forEach(function (p) { p.textContent = cat.name; });
    $$('.framer-ylxhvf h3', a).forEach(function (h) { h.textContent = row[1]; });
    $$('.framer-dzx7g0 p', a).forEach(function (p) { p.textContent = row[2]; });
    $$('img', a).forEach(function (img) {
      img.src = PRE + 'img/' + row[4] + '-1600.webp';
      img.srcset = PRE + 'img/' + row[4] + '-800.webp 800w, ' + PRE + 'img/' + row[4] + '-1600.webp 1600w';
      img.loading = 'lazy';
    });
    $$('.hover, .pressed', a).forEach(function (e) { e.classList.remove('hover', 'pressed'); });
    return a;
  }
  $$('[data-x-more]').forEach(function (btn) {
    var section = btn.closest('section, header') || document;
    var list = section.querySelector('[data-x-list]');
    if (!list) return;
    var src = list.getAttribute('data-x-list');
    var holder = btn.parentElement.closest('[class*="-container"]') || btn;
    var label = Array.prototype.slice.call(btn.childNodes);
    var busy = false;
    var setLoading = function (on) {
      btn.classList.toggle('framer-v-be6l0i', !on);
      btn.classList.toggle('framer-v-1wb4rx3', on);
      btn.setAttribute('data-framer-name', on ? 'Loading' : 'Default');
      btn.setAttribute('aria-busy', on ? 'true' : 'false');
      if (on) { label.forEach(function (n) { n.remove(); }); btn.appendChild(spinner('more')); }
      else { $$('[data-framer-name="Spinner"]', btn).forEach(function (s) { s.remove(); }); label.forEach(function (n) { btn.appendChild(n); }); }
    };
    var go = function () {
      if (busy) return; busy = true;
      setLoading(true);
      getData().then(function (all) {
        var rows = rowsFor(src, all), shown = +list.getAttribute('data-x-shown');
        var proto = list.querySelector('a[data-framer-name="Work Layout"]');
        var next = rows.slice(shown, shown + 6), frag = document.createDocumentFragment();
        next.forEach(function (r) { frag.appendChild(fillCard(proto, r, all.cats)); });
        var lastCard = list.querySelectorAll('a[data-framer-name="Work Layout"]');
        lastCard = lastCard[lastCard.length - 1];
        lastCard.parentNode.insertBefore(frag, lastCard.nextSibling);
        shown += next.length; list.setAttribute('data-x-shown', shown);
        wireGestures(list);
        setLoading(false); busy = false;
        if (shown >= rows.length) holder.remove();
      }).catch(function () { setLoading(false); busy = false; });
    };
    btn.addEventListener('click', go);
    btn.tabIndex = 0;
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  /* ---------------------------------------------------------------- forms: Submit -> Loading -> Success (nothing is sent yet) */
  var CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%" style="display:block" aria-hidden="true">' +
    '<polyline points="40 144 96 200 224 72" fill="none" stroke="var(--token-0a481ec1-86f0-4e6d-86e6-79d7bce4ec1d, #241f58)" ' +
    'stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>';
  $$('form[data-x-form]').forEach(function (f) {
    var btn = f.querySelector('button[type="submit"]');
    if (!btn) return;
    var label = btn.querySelector('.framer-xcxi1a');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      if (btn.classList.contains('framer-v-zjmrx') || btn.classList.contains('framer-v-15ipcac')) return;
      btn.classList.remove('framer-v-15xaynf', 'hover', 'pressed'); btn.classList.add('framer-v-zjmrx');
      btn.setAttribute('data-framer-name', 'Loading');
      if (label) label.style.display = 'none';
      var sp = spinner('submit'); btn.appendChild(sp);
      setTimeout(function () {
        sp.remove();
        btn.classList.remove('framer-v-zjmrx'); btn.classList.add('framer-v-15ipcac');
        btn.setAttribute('data-framer-name', 'Success');
        btn.style.backgroundColor = 'var(--token-e58dccd5-2ef9-4fb7-be37-8550dba06359, #dbf8fa)';
        var icon = document.createElement('div'); icon.className = 'framer-1yafqhr-container'; icon.innerHTML = CHECK;
        btn.insertBefore(icon, label);
        if (label) {
          label.style.display = '';
          var p = label.querySelector('p'); p.textContent = 'Success';
          p.style.setProperty('--framer-text-color', 'var(--token-0a481ec1-86f0-4e6d-86e6-79d7bce4ec1d, #241f58)');
        }
        f.reset();
      }, 900);
    });
  });
})();
