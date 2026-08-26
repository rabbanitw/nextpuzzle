/* Next Puzzle — interactions (editorial / terminal idiom) */
(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
