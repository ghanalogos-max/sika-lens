/**
 * Site motion: scroll reveal, sticky header, mockup tilt / rail drag.
 * Honours prefers-reduced-motion.
 */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* —— Year —— */
  var year = document.getElementById('y');
  if (year) year.textContent = String(new Date().getFullYear());

  /* —— Sticky header —— */
  var header = document.querySelector('[data-site-header]');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* —— Scroll reveal —— */
  var reveals = document.querySelectorAll('.reveal');
  if (reduce) {
    reveals.forEach(function (el) {
      el.classList.add('in');
    });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    reveals.forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', 0.06 * (i % 6) + 's');
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add('in');
    });
  }

  if (reduce) return;

  /* —— Hero phone tilt —— */
  var heroVisual = document.querySelector('.hero-visual');
  var heroShot = document.querySelector('.hero-shot');
  if (heroVisual && heroShot && window.matchMedia('(pointer: fine)').matches) {
    heroVisual.addEventListener('pointermove', function (event) {
      var rect = heroVisual.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      heroShot.style.transform =
        'perspective(900px) rotateY(' +
        (x * 10).toFixed(2) +
        'deg) rotateX(' +
        (-y * 8).toFixed(2) +
        'deg) translateY(-4px)';
    });
    heroVisual.addEventListener('pointerleave', function () {
      heroShot.style.transform = '';
    });
  }

  /* —— Shot / feature mockup lift on enter —— */
  document.querySelectorAll('.shot-card, .feature-shot').forEach(function (card) {
    card.addEventListener('pointerenter', function () {
      card.classList.add('is-hot');
    });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('is-hot');
    });
  });

  /* —— Horizontal shot rail: drag + wheel —— */
  var rail = document.querySelector('.shot-rail');
  if (rail) {
    var dragging = false;
    var startX = 0;
    var startScroll = 0;

    rail.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'touch') return;
      dragging = true;
      rail.classList.add('is-dragging');
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      rail.setPointerCapture(event.pointerId);
    });

    rail.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      rail.scrollLeft = startScroll - (event.clientX - startX);
    });

    function endDrag() {
      dragging = false;
      rail.classList.remove('is-dragging');
    }

    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);

    rail.addEventListener(
      'wheel',
      function (event) {
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          rail.scrollLeft += event.deltaY;
          event.preventDefault();
        }
      },
      { passive: false },
    );

    /* Soft nudge once so visitors notice the rail scrolls */
    if (rail.scrollWidth > rail.clientWidth + 40) {
      window.setTimeout(function () {
        rail.scrollTo({ left: 48, behavior: 'smooth' });
        window.setTimeout(function () {
          rail.scrollTo({ left: 0, behavior: 'smooth' });
        }, 700);
      }, 900);
    }
  }

  /* —— Feature shots: light parallax while in view —— */
  var featureShots = document.querySelectorAll('.feature-shot img');
  if (featureShots.length && 'IntersectionObserver' in window) {
    var active = new Set();
    var fio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) active.add(entry.target);
          else active.delete(entry.target);
        });
      },
      { threshold: 0.2 },
    );
    featureShots.forEach(function (img) {
      fio.observe(img);
    });

    window.addEventListener(
      'scroll',
      function () {
        var mid = window.innerHeight / 2;
        active.forEach(function (img) {
          var rect = img.getBoundingClientRect();
          var offset = ((rect.top + rect.height / 2 - mid) / mid) * -12;
          img.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
        });
      },
      { passive: true },
    );
  }
})();
