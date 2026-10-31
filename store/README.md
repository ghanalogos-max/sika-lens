# Store listing assets

Graphics for Google Play and the App Store. Full console walkthroughs:

| Store | Guide |
|-------|--------|
| **Google Play** (AAB, Premium, listing) | [`docs/PLAY_STORE.md`](../docs/PLAY_STORE.md) |
| **App Store** (IPA, IAP, review) | [`docs/APP_STORE.md`](../docs/APP_STORE.md) |

Generated from device screenshots in `/mockups` plus the app icon.

## Google Play

| Asset | File | Spec |
|-------|------|------|
| App icon | `play/icon-512.png` | 512×512 PNG, 32-bit |
| Feature graphic | `play/feature-graphic-1024x500.png` | 1024×500 PNG |
| Phone screenshots | `play/screenshots/*.png` | 1080×1920 (9:16), upload at least 2 |

Upload order suggestion: lock → home → activity → insights → budgets → MoMo → bank → settings → currency.

```powershell
python scripts/build_store_assets.py
```

## Apple App Store

| Asset | File | Spec |
|-------|------|------|
| App icon | `appstore/icon-1024.png` | 1024×1024 PNG, no transparency |
| iPhone 6.7″ screenshots | `appstore/screenshots-6.7/*.png` | 1290×2796 |
| iPhone 6.1″ / 6.3″ screenshots | `appstore/screenshots-6.1/*.png` | 1206×2622 |
| IAP review shots | `iap-review/*.png` | See `iap-review/LOCALIZATION.md` |

```powershell
python scripts/build_marketing_screenshots.py
python scripts/build_iap_review_shots.py
```

## Website

Copies used by the marketing site live in `website/store/` (including QR codes for get-app).
