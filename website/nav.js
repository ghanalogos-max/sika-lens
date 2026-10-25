(function () {
  var header = document.querySelector('[data-site-header]') || document.querySelector('.top');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!header || !toggle || !nav) return;

  function setOpen(open) {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-locked', open);
  }

  toggle.addEventListener('click', function () {
    setOpen(!header.classList.contains('nav-open'));
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setOpen(false);
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setOpen(false);
  });

  document.addEventListener('pointerdown', function (event) {
    if (!header.classList.contains('nav-open')) return;
    if (header.contains(event.target)) return;
    setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.matchMedia('(min-width: 861px)').matches) setOpen(false);
  });
})();