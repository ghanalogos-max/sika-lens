/**
 * Store download URLs for sikalens.app
 *
 * When App Store Connect assigns a numeric Apple ID, set APPLE_APP_ID and flip
 * APP_STORE_LIVE to true. Play uses the Android package id already.
 */
(function () {
  var PLAY_PACKAGE = 'com.sikalens.app';
  var PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=' + PLAY_PACKAGE;
  var PLAY_LIVE = false; // set true when the Play listing is public

  // App Store Connect numeric id for SikaLens
  var APPLE_APP_ID = '6826582927';
  var APP_STORE_LIVE = false;
  var APP_STORE_URL = 'https://apps.apple.com/app/id' + APPLE_APP_ID;

  function wire(id, href, live, label) {
    document.querySelectorAll('[data-store="' + id + '"],#' + id).forEach(function (el) {
      el.setAttribute('href', href);
      var status = el.querySelector('.store-badge-status');
      if (status) {
        status.textContent = live ? 'Available now' : 'Coming soon';
        status.classList.toggle('is-live', live);
      }
      el.setAttribute(
        'aria-label',
        live ? label : label + ' (listing coming soon — placeholder link)',
      );
    });
  }

  wire('btn-play', PLAY_STORE_URL, PLAY_LIVE, 'Get SikaLens on Google Play');
  wire('btn-apple', APP_STORE_URL, APP_STORE_LIVE, 'Download SikaLens on the App Store');
})();