/* Fresh 4 U — site script.
   Part 1: pure functions (also loaded by test/enquiry.test.js with plain node).
   Part 2: page behaviour (runs only in a browser). */

(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Fresh4U = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var WHATSAPP_NUMBER = '201127222204';
  var EMAIL = 'info@fresh4ueg.com';

  /* Season status for a month (0 = January … 11 = December).
     Beauregard: August to May. Bellevue: July to January. */
  function seasonStatus(month) {
    var m = ((Number(month) % 12) + 12) % 12;
    var beauregard = m >= 7 || m <= 4;
    var bellevue = m >= 6 || m === 0;
    var inSeason = [];
    if (beauregard) inSeason.push('Beauregard');
    if (bellevue) inSeason.push('Bellevue');
    return {
      beauregard: beauregard,
      bellevue: bellevue,
      inSeason: inSeason,
      text: inSeason.length ? 'In season now: ' + inSeason.join(' and ') : 'Next harvest starts in July'
    };
  }

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function isSweetPotato(product) {
    return /^sweet potatoes/i.test(clean(product));
  }

  /* Plain-text enquiry. Empty fields are left out. Size is only for sweet potatoes. */
  function buildMessage(data) {
    data = data || {};
    var product = clean(data.product);
    var lines = ['Hello Fresh 4 U, please send us an offer.', ''];
    function add(label, value) {
      value = clean(value);
      if (value) lines.push(label + ': ' + value);
    }
    add('Product', product);
    if (isSweetPotato(product)) add('Size', data.size);
    add('Packaging', data.packaging);
    add('Volume', data.volume);
    add('Destination', data.destination);
    add('Terms', data.terms);
    add('From', data.contact);
    return lines.join('\n');
  }

  function whatsappUrl(message) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function mailtoUrl(product, message) {
    return 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent('Enquiry: ' + clean(product)) +
      '&body=' + encodeURIComponent(String(message).replace(/\r?\n/g, '\r\n'));
  }

  /* Returns an object with one error text per missing required field. */
  function validate(data) {
    data = data || {};
    var errors = {};
    if (!clean(data.product)) errors.product = 'Choose a product.';
    if (!clean(data.destination)) errors.destination = 'Enter a destination port or country.';
    return errors;
  }

  return {
    WHATSAPP_NUMBER: WHATSAPP_NUMBER,
    EMAIL: EMAIL,
    seasonStatus: seasonStatus,
    isSweetPotato: isSweetPotato,
    buildMessage: buildMessage,
    whatsappUrl: whatsappUrl,
    mailtoUrl: mailtoUrl,
    validate: validate
  };
});

(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var F = window.Fresh4U;
  var html = document.documentElement;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var motion = html.classList.contains('motion') && !!gsap && !!ScrollTrigger;
  if (!motion) html.classList.remove('motion');

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }

  var lenis = null;

  /* ------------------------------------------------------------------
     Season calendar
     ------------------------------------------------------------------ */
  (function season() {
    var cal = $('.cal');
    if (!cal) return;
    var month = new Date().getMonth();
    var status = F.seasonStatus(month);
    var col = (month + 6) % 12; // July is the first column
    $('.cal-status', cal).textContent = status.text;
    var now = $('.cal-now', cal);
    now.style.setProperty('--col', col);
    now.classList.add('is-set');
    var cells = $$('.cal-months li', cal);
    if (cells[col]) cells[col].classList.add('is-now');
    if (motion && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { cal.classList.add('is-in'); io.disconnect(); }
      }, { threshold: 0.5 });
      io.observe(cal);
    } else {
      cal.classList.add('is-in');
    }
  })();

  /* ------------------------------------------------------------------
     Enquiry builder
     ------------------------------------------------------------------ */
  (function enquiry() {
    var form = $('#enquiry-form');
    if (!form) return;
    var sizeField = $('#field-size');
    var preview = $('#preview');
    var wa = $('#send-whatsapp');
    var mail = $('#send-email');
    var required = { product: $('#f-product'), destination: $('#f-destination') };
    var errorEls = { product: $('#e-product'), destination: $('#e-destination') };
    var showErrors = false;

    function read() {
      var terms = form.querySelector('input[name="terms"]:checked');
      return {
        product: form.elements.product.value,
        size: form.elements.size.value,
        packaging: form.elements.packaging.value,
        volume: form.elements.volume.value,
        destination: form.elements.destination.value,
        terms: terms ? terms.value : '',
        contact: form.elements.contact.value
      };
    }

    function update() {
      var data = read();
      sizeField.hidden = !F.isSweetPotato(data.product);
      var message = F.buildMessage(data);
      preview.textContent = message;
      wa.href = F.whatsappUrl(message);
      mail.href = F.mailtoUrl(data.product, message);
      var errors = F.validate(data);
      Object.keys(required).forEach(function (key) {
        var bad = showErrors && !!errors[key];
        errorEls[key].hidden = !bad;
        errorEls[key].textContent = errors[key] || errorEls[key].textContent;
        if (bad) required[key].setAttribute('aria-invalid', 'true');
        else required[key].removeAttribute('aria-invalid');
      });
      return errors;
    }

    function guard(event) {
      showErrors = true;
      var errors = update();
      var keys = Object.keys(errors);
      if (keys.length) {
        event.preventDefault();
        required[keys[0]].focus();
      }
    }

    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    wa.addEventListener('click', guard);
    mail.addEventListener('click', guard);
    update();
  })();

  /* ------------------------------------------------------------------
     Film (the section exists only when assets/film.mp4 exists)
     ------------------------------------------------------------------ */
  (function film() {
    var video = $('.film-video');
    if (!video) return;
    video.addEventListener('click', function () { video.controls = true; });
    if (!motion || !('IntersectionObserver' in window)) { video.controls = true; return; }
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        var p = video.play();
        if (p && p.catch) p.catch(function () { video.controls = true; });
      } else {
        video.pause();
      }
    }, { threshold: 0.6 }).observe(video);
  })();

  /* ------------------------------------------------------------------
     Grounds: body colour, ink and line colour follow the scroll
     ------------------------------------------------------------------ */
  var GOLD = [217, 180, 90, 1];
  var GROUNDS = {
    soil: { bg: [30, 19, 13, 1], ink: [244, 239, 230, 1], line: GOLD, grain: 1 },
    field: { bg: [15, 42, 30, 1], ink: [244, 239, 230, 1], line: GOLD, grain: 1 },
    packhouse: { bg: [242, 244, 238, 1], ink: [20, 32, 26, 1], line: [20, 32, 26, 0.4], grain: 0 },
    sea: { bg: [10, 42, 58, 1], ink: [244, 239, 230, 1], line: GOLD, grain: 1 },
    flesh: { bg: [240, 122, 26, 1], ink: [30, 19, 13, 1], line: [30, 19, 13, 0.4], grain: 0 }
  };
  function mixColor(a, b, t) {
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
  }
  function css(c) {
    return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (Math.round(c[3] * 1000) / 1000) + ')';
  }

  var groundEls = $$('[data-ground]');
  var header = $('.site-header');
  var progressBar = $('.progress span');
  var hero = $('.hero');
  var boundaries = [];   // motion mode: where the ground changes
  var sectionTops = [];  // static mode: which ground is under the header
  var lastGroundKey = '';

  function measureGrounds() {
    var vh = window.innerHeight;
    boundaries = [];
    sectionTops = [];
    groundEls.forEach(function (el, i) {
      var top = docTop(el);
      var name = el.getAttribute('data-ground');
      sectionTops.push({ top: top, name: name });
      if (i === 0) return;
      var prev = groundEls[i - 1].getAttribute('data-ground');
      if (prev === name) return;
      if (groundEls[i - 1] === hero) {
        // The photo covers the viewport here, so the change is not seen.
        var len = hero.offsetHeight - vh;
        boundaries.push({ start: len * 0.5, len: len * 0.12, to: name });
      } else {
        boundaries.push({ start: top - vh * 0.62, len: vh * 0.35, to: name });
      }
    });
  }

  function updateGround(y) {
    var name = groundEls[0].getAttribute('data-ground');
    var g = GROUNDS[name];
    var state = { bg: g.bg, ink: g.ink, line: g.line, grain: g.grain };
    for (var i = 0; i < boundaries.length; i++) {
      var b = boundaries[i];
      var t = clamp((y - b.start) / b.len);
      if (t <= 0) break;
      var to = GROUNDS[b.to];
      state = {
        bg: mixColor(state.bg, to.bg, t),
        ink: mixColor(state.ink, to.ink, t),
        line: mixColor(state.line, to.line, t),
        grain: lerp(state.grain, to.grain, t)
      };
      if (t >= 0.5) name = b.to;
    }
    var bg = css(state.bg);
    var key = bg + state.grain.toFixed(3);
    if (key !== lastGroundKey) {
      lastGroundKey = key;
      html.style.setProperty('--ground', bg);
      html.style.setProperty('--ink', css(state.ink));
      html.style.setProperty('--line', css(state.line));
      html.style.setProperty('--grain', state.grain.toFixed(3));
    }
    if (html.getAttribute('data-live') !== name) html.setAttribute('data-live', name);
  }

  /* Static mode: sections keep their own ground. Only the header follows. */
  function updateHeaderInk(y) {
    var probe = y + 44;
    var name = sectionTops.length ? sectionTops[0].name : 'soil';
    for (var i = 0; i < sectionTops.length; i++) {
      if (sectionTops[i].top <= probe) name = sectionTops[i].name;
    }
    if (html.getAttribute('data-live') !== name) {
      html.setAttribute('data-live', name);
      header.style.setProperty('--ink', css(GROUNDS[name].ink));
      header.style.setProperty('--ground', css(GROUNDS[name].bg));
    }
  }

  /* ------------------------------------------------------------------
     Header: hides on scroll down, shows on scroll up
     ------------------------------------------------------------------ */
  var lastY = window.scrollY;
  function updateHeader(y) {
    var d = y - lastY;
    header.classList.toggle('is-solid', y >= 80);
    if (y < 80) header.classList.remove('is-hidden');
    else if (d > 4) header.classList.add('is-hidden');
    else if (d < -4) header.classList.remove('is-hidden');
    if (Math.abs(d) > 4 || y < 80) lastY = y;
  }

  /* ------------------------------------------------------------------
     Root line rail (desktop, motion mode)
     ------------------------------------------------------------------ */
  var rail = $('.rail');
  var railLine = $('.rail-line');
  var rootlets = $$('.rail-rootlet');
  var railLinks = $$('.rail a');
  var railOn = false;
  var R = { nodeY: [], len: [], scroll: [], total: 0, attach: [], current: -1 };

  function measureRail() {
    railOn = motion && rail && getComputedStyle(rail).display !== 'none';
    if (!railOn) return;
    var X = 40;
    R.nodeY = railLinks.map(function (a) {
      var r = a.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    var y0 = R.nodeY[0], y1 = R.nodeY[1], h = y1 - y0, yEnd = R.nodeY[R.nodeY.length - 1];
    function Y(f) { return (y0 + h * f).toFixed(1); }
    // A root: it wanders a little between Soil and Field, then it is a straight stem.
    var root = 'M' + X + ' ' + y0 +
      'C' + X + ' ' + Y(0.1) + ' ' + (X - 6) + ' ' + Y(0.18) + ' ' + (X - 5) + ' ' + Y(0.28) +
      'S' + (X + 4) + ' ' + Y(0.45) + ' ' + (X + 3) + ' ' + Y(0.55) +
      'S' + (X - 2) + ' ' + Y(0.72) + ' ' + (X - 1.5) + ' ' + Y(0.8) +
      'S' + X + ' ' + Y(0.94) + ' ' + X + ' ' + y1;
    railLine.setAttribute('d', root);
    var rootLen = railLine.getTotalLength();
    railLine.setAttribute('d', root + 'L' + X + ' ' + yEnd);
    R.total = railLine.getTotalLength();
    railLine.style.strokeDasharray = R.total + ' ' + R.total;
    R.len = R.nodeY.map(function (y, k) { return k === 0 ? 0 : rootLen + (y - y1); });

    var side = [
      'M' + (X - 5) + ' ' + Y(0.28) + 'c-5 5 -13 7 -19 19',
      'M' + (X + 3) + ' ' + Y(0.55) + 'c4 4 8 8 9 16',
      'M' + (X - 1.5) + ' ' + Y(0.8) + 'c-4 5 -8 9 -9 18'
    ];
    R.attach = [rootLen * 0.28, rootLen * 0.55, rootLen * 0.8];
    rootlets.forEach(function (p, i) {
      p.setAttribute('d', side[i]);
      p.setAttribute('pathLength', '1');
      p.style.strokeDasharray = '1 1';
    });

    // The line reaches a node when the top of that stage reaches the node.
    R.scroll = railLinks.map(function (a, k) {
      if (k === 0) return 0;
      var target = $(a.getAttribute('href'));
      return Math.max(0, docTop(target) - R.nodeY[k]);
    });
    for (var k = 1; k < R.scroll.length; k++) {
      if (R.scroll[k] <= R.scroll[k - 1]) R.scroll[k] = R.scroll[k - 1] + 1;
    }
    R.current = -1;
  }

  function updateRail(y) {
    if (!railOn) return;
    var n = R.scroll.length, drawn = R.total, current = n - 1;
    for (var k = 1; k < n; k++) {
      if (y < R.scroll[k]) {
        var t = (y - R.scroll[k - 1]) / (R.scroll[k] - R.scroll[k - 1]);
        drawn = lerp(R.len[k - 1], R.len[k], t);
        current = k - 1;
        break;
      }
    }
    railLine.style.strokeDashoffset = (R.total - drawn).toFixed(1);
    rootlets.forEach(function (p, i) {
      p.style.strokeDashoffset = (1 - clamp((drawn - R.attach[i]) / 34)).toFixed(3);
    });
    if (current !== R.current) {
      R.current = current;
      railLinks.forEach(function (a, i) {
        a.classList.toggle('is-current', i === current);
        if (i === current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
  }

  /* ------------------------------------------------------------------
     One scroll handler for the light work
     ------------------------------------------------------------------ */
  var ticking = false;
  function onFrame() {
    ticking = false;
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    updateHeader(y);
    progressBar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max) : 0).toFixed(4) + ')';
    if (motion) { updateGround(y); updateRail(y); }
    else updateHeaderInk(y);
  }
  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }
  function measureAll() {
    measureGrounds();
    measureRail();
    lastGroundKey = '';
    onFrame();
  }
  window.addEventListener('scroll', requestFrame, { passive: true });

  /* ------------------------------------------------------------------
     Anchor links
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (event) {
    var a = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    var target = id === '#top' ? document.body : $(id);
    if (!target) return;
    event.preventDefault();
    if (lenis) {
      lenis.scrollTo(id === '#top' ? 0 : target, { duration: 1.5 });
    } else {
      window.scrollTo(0, id === '#top' ? 0 : docTop(target) - (id === '#season' ? 96 : 0));
    }
  });

  /* ------------------------------------------------------------------
     Static mode ends here
     ------------------------------------------------------------------ */
  if (!motion) {
    measureAll();
    window.addEventListener('resize', measureAll);
    window.addEventListener('load', measureAll);
    return;
  }

  /* ==================================================================
     Motion mode
     ================================================================== */
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---- Section headlines: lock the lines, then let the width axis grow ---- */
  var headlines = $$('.headline').map(function (el) {
    return { el: el, words: el.textContent.trim().split(/\s+/), width: -1 };
  });
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function lockLines() {
    headlines.forEach(function (h) {
      var el = h.el;
      var w = el.parentNode.clientWidth;
      if (w === h.width) return;
      h.width = w;
      el.style.setProperty('--wdth', 100); // widest state: the lines can only get shorter
      el.innerHTML = h.words.map(function (word) { return '<span>' + esc(word) + '</span>'; }).join(' ');
      var lines = [], top = null;
      $$('span', el).forEach(function (span) {
        if (top === null || Math.abs(span.offsetTop - top) > 4) { lines.push([]); top = span.offsetTop; }
        lines[lines.length - 1].push(span.textContent);
      });
      el.innerHTML = lines.map(function (l) { return '<span class="l">' + esc(l.join(' ')) + '</span>'; }).join(' ');
      el.style.setProperty('--wdth', 75);
    });
  }
  lockLines();
  headlines.forEach(function (h) {
    gsap.fromTo(h.el, { '--wdth': 75 }, {
      '--wdth': 100, ease: 'none',
      scrollTrigger: { trigger: h.el, start: 'top bottom', end: 'top 30%', scrub: true }
    });
  });

  /* ---- Hero ---- */
  var stage = $('.hero-stage');
  var photo = $('.hero-photo');
  var slot = $('.hero-slot');
  var livePath = $('#potato-live-path');
  var heroTitle = $('.hero-title');
  var heroSub = $('.hero-sub');
  var heroActions = $('.hero-actions');
  var heroTint = $('.hero-tint');
  var heroShade = $('.hero-shade');
  var H = { cx: 0, cy: 0, a: 1, aEnd: 1, vw: 0, vh: 0, intro: 0, q: 0, full: false };

  function measureHero() {
    var s = stage.getBoundingClientRect();
    var r = slot.getBoundingClientRect();
    H.vw = s.width; H.vh = s.height;
    H.cx = r.left - s.left + r.width / 2;
    H.a = Math.max(40, Math.min(r.width / 2.0, r.height / 1.02));
    H.cy = r.top - s.top + r.height / 2 + 0.115 * H.a; // the tilted shape is not centred on its origin
    H.aEnd = Math.hypot(H.vw, H.vh) / 2 / 0.28; // the potato then covers the whole stage
  }

  function renderHero() {
    var q = H.q, i = H.intro;
    var p = clamp(q / 0.6);
    var e = Math.pow(p, 1.35);
    var a = H.a * (0.6 + 0.4 * i) * Math.pow(H.aEnd / H.a, e);
    var m = 1 - (1 - p) * (1 - p);
    var cx = lerp(H.cx, H.vw / 2, m);
    var cy = lerp(H.cy, H.vh / 2, m);
    var rot = 20 + 6 * (1 - i) - 12 * e;
    livePath.setAttribute('transform',
      'translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ') rotate(' + rot.toFixed(3) + ') scale(' + a.toFixed(2) + ')');
    var full = p >= 1;
    if (full !== H.full) { H.full = full; photo.classList.toggle('is-full', full); }
    heroTint.style.opacity = (0.35 * clamp((p - 0.3) / 0.6)).toFixed(3);
    heroShade.style.opacity = clamp((q - 0.5) / 0.22).toFixed(3);
    var out = clamp(q / 0.36) * H.vh;
    heroTitle.style.transform = 'translate3d(0,' + (-out).toFixed(1) + 'px,0)';
    heroSub.style.transform = heroActions.style.transform = 'translate3d(0,' + (-out).toFixed(1) + 'px,0)';
  }

  measureHero();
  renderHero();
  photo.classList.add('is-ready');

  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: function (self) { H.q = self.progress; renderHero(); }
  });

  // Load sequence, about 1.6 s: lines rise, the window grows, then the sub line and buttons.
  gsap.timeline({ delay: 0.1 })
    .fromTo($$('.hero-title .mask > span'), { y: 0, yPercent: 118 },
      { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.12 }, 0)
    .to(H, { intro: 1, duration: 1.15, ease: 'power3.out', onUpdate: renderHero }, 0.3)
    .to([heroSub, heroActions], { opacity: 1, duration: 0.6, ease: 'power1.out', stagger: 0.1 }, 0.95);

  /* ---- Own farms: second photo, parallax of about 8% ---- */
  gsap.fromTo('.farms-photo img', { yPercent: -13.8 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.farms-photo', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  /* ---- Process: horizontal track on desktop ---- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function () {
    var section = $('.process');
    var view = $('.process-view');
    var track = $('.process-track');
    var fill = $('.process-progress span');
    var steps = $$('.step', track);
    var len = 0;
    function setLen() {
      var last = steps[steps.length - 1];
      var gutter = parseFloat(getComputedStyle(view.parentNode).paddingRight) || 0;
      gsap.set(track, { x: 0 });
      var right = last.getBoundingClientRect().right - view.getBoundingClientRect().left;
      len = Math.max(0, Math.round(right + gutter - view.clientWidth));
      section.style.setProperty('--len', len + 'px');
    }
    setLen();
    ScrollTrigger.addEventListener('refreshInit', setLen);
    var st = ScrollTrigger.create({
      trigger: section, start: 'top top', end: function () { return '+=' + len; },
      scrub: true, invalidateOnRefresh: true,
      onUpdate: function (self) {
        track.style.transform = 'translate3d(' + (-len * self.progress).toFixed(1) + 'px,0,0)';
        fill.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
      }
    });
    return function () {
      ScrollTrigger.removeEventListener('refreshInit', setLen);
      st.kill();
      track.style.transform = '';
      section.style.removeProperty('--len');
    };
  });

  /* ---- Export: the root line leaves the rail and becomes the routes ---- */
  var map = $('.map');
  var mapSvg = $('.map-svg');
  var lead = $('.map-lead');
  var M = { top: 0, h: 0, sticky: false };
  function measureMap() {
    M.sticky = getComputedStyle(map).position === 'sticky';
    if (!M.sticky) return;
    var vh = window.innerHeight;
    M.h = map.offsetHeight;
    var mid = (R.nodeY[2] + R.nodeY[3]) / 2;
    M.top = Math.round(Math.min(Math.max(mid - (500 / 600) * M.h, 16), Math.max(16, vh - M.h - 16)));
    map.style.setProperty('--map-top', M.top + 'px');
    var box = mapSvg.getBoundingClientRect();
    var railX = rail.getBoundingClientRect().left;
    var x0 = (railX - box.left) / (box.width / 720);
    lead.setAttribute('d', 'M' + x0.toFixed(1) + ' 500H0');
  }
  var routeTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.export-grid', scrub: true, invalidateOnRefresh: true,
      start: function () { return M.sticky ? 'top ' + M.top + 'px' : 'top 60%'; },
      end: function () {
        var grid = $('.export-grid');
        if (M.sticky && grid.offsetHeight - M.h > 120) return 'bottom ' + (M.top + M.h) + 'px';
        return M.sticky ? '+=' + Math.round(window.innerHeight * 0.6) : 'top+=' + Math.round(map.offsetHeight * 0.9) + ' 45%';
      }
    }
  });
  gsap.set('.map-port', { attr: { r: 0 } });
  routeTl
    .to(lead, { strokeDashoffset: 0, duration: 0.14 }, 0)
    .to('.map-stem', { strokeDashoffset: 0, duration: 0.2 }, 0.12)
    .to(lead, { strokeDashoffset: -1, duration: 0.16 }, 0.2)
    .to('.map-branch', { strokeDashoffset: 0, duration: 0.14, stagger: 0.02 }, 0.32)
    .to('.map-port', { attr: { r: 6 }, duration: 0.06, stagger: 0.02 }, 0.44)
    .to('.map-sail', { strokeDashoffset: 0, duration: 0.44, stagger: 0.03 }, 0.5);

  /* ---- Measure and refresh ---- */
  ScrollTrigger.addEventListener('refreshInit', function () {
    lockLines();
    measureHero();
    measureRail();
    measureMap();
  });
  ScrollTrigger.addEventListener('refresh', function () {
    measureAll();
    measureMap();
    renderHero();
  });
  measureRail();
  measureMap();
  ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      headlines.forEach(function (h) { h.width = -1; });
      ScrollTrigger.refresh();
    });
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
