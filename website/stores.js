/**
 * Store download URLs for sikalens.app
 *
 * Flip PLAY_LIVE / APP_STORE_LIVE when each listing is public.
 * Keep APPLE_APP_ID in sync with src/features/about/brand.ts.
 */
(function () {
  var PLAY_PACKAGE = 'com.sikalens.app';
  var PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=' + PLAY_PACKAGE;
  var PLAY_LIVE = true;

  var APPLE_APP_ID = '6826582927';
  var APP_STORE_LIVE = true;
  var APP_STORE_URL = 'https://apps.apple.com/app/id' + APPLE_APP_ID;

  function wire(id, href, live, label) {
    document.querySelectorAll('[data-store="' + id + '"],#' + id).forEach(function (el) {
      el.setAttribute('href', href);
      el.setAttribute('aria-label', live ? label : label + ' (listing coming soon)');
    });
  }

  wire('btn-play', PLAY_STORE_URL, PLAY_LIVE, 'Get SikaLens on Google Play');
  wire('btn-apple', APP_STORE_URL, APP_STORE_LIVE, 'Download SikaLens on the App Store');
})();
