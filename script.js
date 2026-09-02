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
  var rotationTimer = 0;

  function puzzlePath(top, right, bottom, left) {
    var d = 'M0 0';
    d += top ? ' L38 0 C38 ' + (-14 * top) + ' 62 ' + (-14 * top) + ' 62 0 L100 0' : ' L100 0';
    d += right ? ' L100 38 C' + (100 + 14 * right) + ' 38 ' + (100 + 14 * right) + ' 62 100 62 L100 100' : ' L100 100';
    d += bottom ? ' L62 100 C62 ' + (100 + 14 * bottom) + ' 38 ' + (100 + 14 * bottom) + ' 38 100 L0 100' : ' L0 100';
    d += left ? ' L0 62 C' + (-14 * left) + ' 62 ' + (-14 * left) + ' 38 0 38 L0 0' : ' L0 0';
    return d + ' Z';
  }

  function addPieceIcon(svg, faceIndex, col, row) {
    var iconForFace = ['education', 'system', 'threat', 'research', 'agent', 'system'];
    var drawings = {
      education: [
        ['M14 28c14-5 25-1 36 7v39c-11-8-22-10-36-5z M86 28c-14-5-25-1-36 7v39c11-8 22-10 36-5z', ''],
        ['M50 35v39 M25 43c8-1 14 1 19 5 M75 43c-8-1-14 1-19 5', 'icon-detail']
      ],
      research: [
        ['M27 17a9 9 0 1 1 0 18a9 9 0 1 1 0-18 M20 40c8-5 16-3 21 4 4 5 5 12 6 18 M19 41v34h20', ''],
        ['M52 31h31v27H52z M67 58v8 M56 66h23 M43 74h41l-4 7H39z', ''],
        ['M32 47c5 2 8 7 12 12l13 7 M37 44c5 3 8 8 11 13l12 6', 'icon-detail'],
        ['M20 24h6 M28 24h6 M26 24h2 M22 38l5 8 6-8 M27 46v18 M19 75h25', 'icon-detail']
      ],
      agent: [
        ['M22 29L50 20 M22 29L50 40 M22 29L50 60 M22 50L50 20 M22 50L50 40 M22 50L50 60 M22 71L50 40 M22 71L50 60 M22 71L50 80 M50 20L78 35 M50 40L78 35 M50 40L78 65 M50 60L78 35 M50 60L78 65 M50 80L78 65', ''],
        ['M22 24a5 5 0 1 1 0 10a5 5 0 1 1 0-10 M22 45a5 5 0 1 1 0 10a5 5 0 1 1 0-10 M22 66a5 5 0 1 1 0 10a5 5 0 1 1 0-10 M50 15a5 5 0 1 1 0 10a5 5 0 1 1 0-10 M50 35a5 5 0 1 1 0 10a5 5 0 1 1 0-10 M50 55a5 5 0 1 1 0 10a5 5 0 1 1 0-10 M50 75a5 5 0 1 1 0 10a5 5 0 1 1 0-10 M78 30a5 5 0 1 1 0 10a5 5 0 1 1 0-10 M78 60a5 5 0 1 1 0 10a5 5 0 1 1 0-10', 'icon-detail']
      ],
      threat: [
        ['M50 15c10 8 20 11 31 13v20c0 19-12 30-31 38-19-8-31-19-31-38V28c11-2 21-5 31-13z', ''],
        ['M50 34a18 18 0 1 1 0 36a18 18 0 1 1 0-36 M50 52l13-10 M50 52h17 M50 52v-13', 'icon-detail']
      ],
      system: [
        ['M18 29h64v42H18z M28 42h12v12H28z M48 42h24 M48 51h18 M28 62h44', ''],
        ['M25 21v8 M75 21v8 M25 71v8 M75 71v8', 'icon-detail']
      ]
    };
    var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'piece-icon piece-icon-' + iconForFace[faceIndex]);
    group.setAttribute('transform', 'translate(' + (col * 100 + 9) + ' ' + (row * 100 + 9) + ') scale(.82)');
    drawings[iconForFace[faceIndex]].forEach(function (line) {
      var iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      iconPath.setAttribute('d', line[0]);
      if (line[1]) iconPath.setAttribute('class', line[1]);
      group.appendChild(iconPath);
    });
    svg.appendChild(group);
    group.querySelectorAll('path').forEach(function (iconPath) {
      iconPath.style.setProperty('--path-length', iconPath.getTotalLength());
    });
  }

  function buildCubeFaces() {
    var horizontal = [[1, -1, 1], [-1, 1, -1]];
    var vertical = [[-1, 1], [1, -1], [-1, 1]];
    var missing = [4, 2, 6, 0, 8, 3];
    document.querySelectorAll('.cube-face').forEach(function (face, faceIndex) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '-18 -18 336 336');
      svg.setAttribute('focusable', 'false');
      face.appendChild(svg);
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
            addPieceIcon(svg, faceIndex, col, row);
          } else {
            path.setAttribute('class', 'cube-piece tone-' + ((index + faceIndex) % 4));
            svg.appendChild(path);
          }
        }
      }
    });
  }

  function selectService(index, focusDot) {
    if (!serviceExplorer) return;
    index = (index + serviceDots.length) % serviceDots.length;
    var previous = Number(serviceExplorer.getAttribute('data-active-service'));
    serviceExplorer.setAttribute('data-active-service', String(index));
    if (previous !== index) {
      serviceExplorer.classList.add('is-rotating');
      if (cubeTilt) cubeTilt.style.transform = '';
      if (rotationTimer) clearTimeout(rotationTimer);
      rotationTimer = setTimeout(function () { serviceExplorer.classList.remove('is-rotating'); }, 920);
    }
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
    if ('IntersectionObserver' in window) {
      var cubeObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { serviceExplorer.classList.toggle('cube-awake', entry.isIntersecting); });
      }, { threshold: 0.08 });
      cubeObserver.observe(serviceExplorer);
    } else {
      serviceExplorer.classList.add('cube-awake');
    }
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
      var tiltFrame = 0;
      var tiltX = 0;
      var tiltY = 0;
      serviceCube.addEventListener('pointermove', function (e) {
        var rect = serviceCube.getBoundingClientRect();
        tiltX = ((e.clientX - rect.left) / rect.width - .5) * 2;
        tiltY = ((e.clientY - rect.top) / rect.height - .5) * 2;
        if (!tiltFrame) {
          tiltFrame = requestAnimationFrame(function () {
            cubeTilt.style.transform = 'translate3d(' + (tiltX * 4).toFixed(2) + 'px,' + (tiltY * 4).toFixed(2) + 'px,10px)';
            tiltFrame = 0;
          });
        }
      });
      serviceCube.addEventListener('pointerleave', function () {
        if (tiltFrame) cancelAnimationFrame(tiltFrame);
        tiltFrame = 0;
        cubeTilt.style.transform = '';
      });
    }
  }

  /* sticky nav hairline */
  var navScrolled = null;
  function onScroll() {
    var next = window.scrollY > 20;
    if (next === navScrolled) return;
    navScrolled = next;
    nav.classList.toggle('scrolled', next);
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
        else { typed.classList.add('done'); }
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
