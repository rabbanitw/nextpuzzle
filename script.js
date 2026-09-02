/* Next Puzzle — interactions (editorial / terminal idiom) */
(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var themeToggle = document.getElementById('themeToggle');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* theme switch — system preference by default, remembered after manual choice */
  function reflectTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (!themeToggle) return;
    var next = theme === 'dark' ? 'light' : 'dark';
    var label = 'Switch to ' + next + ' theme';
    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('title', label);
    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', theme === 'dark' ? '#122c1f' : '#f7eff6');
  }

  if (themeToggle) {
    reflectTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('next-puzzle-theme', next); } catch (e) {}
      reflectTheme(next);
    });
  }

  /* services — interactive jigsaw cube + accessible service carousel */
  var serviceExplorer = document.querySelector('.service-explorer');
  var serviceCube = document.getElementById('serviceCube');
  var cubeTilt = document.getElementById('cubeTilt');
  var serviceDots = Array.prototype.slice.call(document.querySelectorAll('.service-dot'));
  var servicePanels = Array.prototype.slice.call(document.querySelectorAll('.service-panel'));

  function puzzlePath(top, right, bottom, left) {
    var d = 'M0 0';
    d += top ? ' L38 0 C38 ' + (-14 * top) + ' 62 ' + (-14 * top) + ' 62 0 L100 0' : ' L100 0';
    d += right ? ' L100 38 C' + (100 + 14 * right) + ' 38 ' + (100 + 14 * right) + ' 62 100 62 L100 100' : ' L100 100';
    d += bottom ? ' L62 100 C62 ' + (100 + 14 * bottom) + ' 38 ' + (100 + 14 * bottom) + ' 38 100 L0 100' : ' L0 100';
    d += left ? ' L0 62 C' + (-14 * left) + ' 62 ' + (-14 * left) + ' 38 0 38 L0 0' : ' L0 0';
    return d + ' Z';
  }

  function buildCubeFaces() {
    var horizontal = [[1, -1, 1], [-1, 1, -1]];
    var vertical = [[-1, 1], [1, -1], [-1, 1]];
    var missing = [4, 2, 6, 0, 8, 3];
    document.querySelectorAll('.cube-face').forEach(function (face, faceIndex) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '-18 -18 336 336');
      svg.setAttribute('focusable', 'false');
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 3; col++) {
          var index = row * 3 + col;
          var top = row === 0 ? 0 : -horizontal[row - 1][col];
          var right = col === 2 ? 0 : vertical[row][col];
          var bottom = row === 2 ? 0 : horizontal[row][col];
          var left = col === 0 ? 0 : -vertical[row][col - 1];
          var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', puzzlePath(top, right, bottom, left));
          path.setAttribute('transform', 'translate(' + (col * 100 + 2) + ' ' + (row * 100 + 2) + ') scale(.96)');
          if (index === missing[faceIndex]) {
            path.setAttribute('class', 'cube-hole');
            svg.appendChild(path);
          } else {
            path.setAttribute('class', 'cube-piece tone-' + ((index + faceIndex) % 4));
            svg.appendChild(path);
          }
        }
      }
      face.appendChild(svg);
    });
  }

  function selectService(index, focusDot) {
    if (!serviceExplorer) return;
    index = (index + serviceDots.length) % serviceDots.length;
    serviceExplorer.setAttribute('data-active-service', String(index));
    serviceDots.forEach(function (dot, i) {
      var active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
      dot.setAttribute('tabindex', active ? '0' : '-1');
    });
    servicePanels.forEach(function (panel, i) {
      panel.hidden = i !== index;
      panel.classList.toggle('is-active', i === index);
    });
    if (focusDot) serviceDots[index].focus();
  }

  if (serviceExplorer && serviceCube) {
    buildCubeFaces();
    selectService(0, false);
    serviceDots.forEach(function (dot) {
      dot.addEventListener('click', function () { selectService(Number(dot.getAttribute('data-service')), false); });
      dot.addEventListener('keydown', function (e) {
        var current = Number(dot.getAttribute('data-service'));
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectService(current + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectService(current - 1, true); }
        if (e.key === 'Home') { e.preventDefault(); selectService(0, true); }
        if (e.key === 'End') { e.preventDefault(); selectService(serviceDots.length - 1, true); }
      });
    });
    serviceCube.addEventListener('click', function () {
      selectService(Number(serviceExplorer.getAttribute('data-active-service')) + 1, false);
    });
    if (!reduce && cubeTilt) {
      serviceCube.addEventListener('pointermove', function (e) {
        var rect = serviceCube.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width - .5) * 2;
        var y = ((e.clientY - rect.top) / rect.height - .5) * 2;
        cubeTilt.style.transform = 'rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 7).toFixed(2) + 'deg) translateZ(10px)';
      });
      serviceCube.addEventListener('pointerleave', function () { cubeTilt.style.transform = ''; });
    }
  }

  /* sticky nav hairline */
  function onScroll() {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.textContent = open ? 'CLOSE' : 'MENU';
    });
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.textContent = 'MENU';
      });
    });
  }

  /* scroll reveal */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 0.07) + 's';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* hero readout: type the final status line */
  var typed = document.getElementById('typed');
  if (typed) {
    var msg = ' 12 shipped';
    if (reduce) { typed.textContent = msg; }
    else {
      var i = 0;
      (function tick() {
        if (i <= msg.length) { typed.textContent = msg.slice(0, i++); setTimeout(tick, 65); }
      })();
    }
  }

  /* footer year */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* inquiry form — client validation + async submit */
  var form = document.getElementById('inquiry');
  if (form) {
    var statusEl = document.getElementById('form-status');
    var submitBtn = document.getElementById('f-submit');

    function clearErrors() {
      form.querySelectorAll('.field.error').forEach(function (f) { f.classList.remove('error'); });
      statusEl.className = 'form-status';
      statusEl.textContent = '';
    }
    function markError(name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (el && el.closest('.field')) el.closest('.field').classList.add('error');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      if (!form.checkValidity()) {
        form.querySelectorAll('input, textarea').forEach(function (el) {
          if (el.name !== 'website' && !el.checkValidity()) markError(el.name);
        });
        statusEl.classList.add('err');
        statusEl.textContent = 'Please add your name, company, a valid e-mail, and a message.';
        return;
      }

      /* design-only preview (e.g. GitHub Pages A/B copy) — the live handler is prod-only */
      var PROD = location.hostname === 'nextpuzzleai.com' || location.hostname === 'www.nextpuzzleai.com';
      if (!PROD) {
        form.innerHTML = '<p class="form-thanks">Design preview — the live form is at ' +
          '<a href="https://nextpuzzleai.com/#contact" style="color:inherit;border-bottom:1px solid currentColor">nextpuzzleai.com</a>.</p>';
        return;
      }

      var original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      var payload = new FormData(form);
      // Submit; if the host's bot-check interstitial answers (sets a humans_* cookie
      // and asks to reload), replicate it and retry once.
      function post(retried) {
        return fetch(form.action, {
          method: 'POST', body: payload, credentials: 'same-origin',
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }).then(function (r) {
          return r.text().then(function (text) {
            var challenge = text.match(/humans_\d+=1/);
            if (challenge && !retried) {
              document.cookie = challenge[0] + '; path=/; max-age=86400; samesite=Lax';
              return post(true);
            }
            var data = null;
            try { data = JSON.parse(text); } catch (e) {}
            return { ok: r.ok, data: data };
          });
        });
      }

      post(false)
        .then(function (res) {
          if (res.ok && res.data && res.data.ok) {
            form.innerHTML = '<p class="form-thanks">Thank you — your note is on its way. ' +
              'We\'ll be in touch soon.</p>';
          } else {
            statusEl.classList.add('err');
            statusEl.textContent = (res.data && res.data.error) ||
              'Something went wrong — please try again in a moment.';
            (res.data && res.data.fields || []).forEach(markError);
            submitBtn.disabled = false;
            submitBtn.innerHTML = original;
          }
        })
        .catch(function () {
          statusEl.classList.add('err');
          statusEl.textContent = 'Network error — please check your connection and try again.';
          submitBtn.disabled = false;
          submitBtn.innerHTML = original;
        });
    });
  }
})();
