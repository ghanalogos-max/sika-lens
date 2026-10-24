/** Publisher and public links for SikaLens. */
export const APP_NAME = 'SikaLens';
export const APP_OWNER = 'Celestial Web Solutions';
export const PUBLISHER_URL = 'https://www.celestialwebsolutions.net/';
export const APP_PACKAGE = 'com.sikalens.app';

/** Primary product site (.app). Apex + .com redirect to www (Vercel Production). */
export const SITE_HOST = 'sikalens.app';
export const SITE_HOST_COM = 'sikalens.com';
export const SITE_URL = `https://www.${SITE_HOST}`;
export const SITE_URL_COM = `https://www.${SITE_HOST_COM}`;

/** Hosted legal pages for store listings (mirror of in-app Privacy / Terms). */
export const PRIVACY_URL = `${SITE_URL}/privacy`;
export const TERMS_URL = `${SITE_URL}/terms`;

/** Google Play listing (same package as app.json). */
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${APP_PACKAGE}`;

/**
 * App Store listing. Replace APPLE_APP_ID with the numeric id from App Store Connect
 * (keep in sync with website/stores.js). Until then, search is the placeholder.
 */
export const APPLE_APP_ID = 'APPLE_APP_ID';
export const APP_STORE_URL =
  APPLE_APP_ID !== 'APPLE_APP_ID'
    ? `https://apps.apple.com/app/id${APPLE_APP_ID}`
    : 'https://apps.apple.com/search?term=SikaLens';

export const SUPPORT_EMAIL = `support@${SITE_HOST}`;

export const SHARE_MESSAGE =
  `Track MoMo and bank money with ${APP_NAME} by ${APP_OWNER}.\n\n` +
  `${SITE_URL}\n` +
  `Google Play: ${PLAY_STORE_URL}\n` +
  `App Store: ${APP_STORE_URL}`;
