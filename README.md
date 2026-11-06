# SikaLens

See where your mobile money goes. An Expo (React Native) expense and budget tracker for MTN, Telecel and AirtelTigo users in Ghana.

Everything is stored on the phone (SQLite). Nothing leaves the device.

**Site:** [www.sikalens.app](https://www.sikalens.app) (primary) · [sikalens.com](https://sikalens.com) redirects here  
**Support:** support@sikalens.app · **Privacy / Terms:** `/privacy` and `/terms` on the primary site (required for store listings)

Static pages live in `website/` (home, privacy, terms, store badges, sitemap). Root `vercel.json` sets `outputDirectory` to `website` so a Vercel project linked to this repo serves the site (not a 404 from the Expo root).

Or in Vercel → Project → Settings → General → **Root Directory** = `website`.

Point `sikalens.app` DNS at Vercel after the deploy is healthy. Store badges: edit `website/stores.js` — `APP_STORE_LIVE` is on; set `PLAY_LIVE` when Google Play goes public.

### Store guides & graphics

| Guide | Doc |
|-------|-----|
| **Google Play** — new AAB, listing, Android Premium / RevenueCat | [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md) |
| **App Store** — IPA, IAP, review | [`docs/APP_STORE.md`](docs/APP_STORE.md) |
| Asset paths | [`store/README.md`](store/README.md) |

Ready-to-upload assets (from device screenshots in `mockups/`):

| Console | Path |
|---------|------|
| Play icon 512×512 | `store/play/icon-512.png` |
| Play feature graphic 1024×500 | `store/play/feature-graphic-1024x500.png` |
| Play phone screenshots | `store/play/screenshots/*.png` (1080×1920) |
| App Store icon 1024×1024 | `store/appstore/icon-1024.png` |
| App Store 6.7″ / 6.1″ screenshots | `store/appstore/screenshots-6.7/` · `screenshots-6.1/` |

Rebuild after new mockups: `python scripts/build_store_assets.py` / `python scripts/build_marketing_screenshots.py` (needs Pillow). Web copies live under `website/store/`.

## Run it (Windows, PowerShell)

```powershell
npm install
npm test              # parser + database tests
npm run typecheck
npx expo start        # then press "a" for the Android emulator, or scan the QR code in Expo Go
```

You can't run the iOS simulator on Windows. Use an Android emulator or a real phone for development, and build iOS in the cloud with EAS.

When you start using native modules that Expo Go doesn't include (Android SMS auto-read later), switch to a development build:

```powershell
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

`eas build --profile preview --platform android` produces an installable APK you can send to testers.

## What works

- Paste a MoMo SMS, review the parsed fields, save. The same transaction ID is never saved twice.
- Add a transaction by hand.
- Home (the "lens" ring), Activity list (long press to delete), Budgets, Insights.
- Remembers the category you pick for each recipient and suggests it next time.
- Date and time on every transaction (pasted messages have no date, so check it).
- Settings: PIN lock with optional fingerprint/face unlock, and CSV export (this month or everything).

## Layout

```
src/app/                 routes only (Expo Router)
src/core/money/          integer-pesewa helpers
src/core/parser/         parseMomoSms(): pure TypeScript, no React Native
  providers/             per-network tuning (edit these first)
  fixtures.ts            sample SMS used by the tests
src/core/db/             schema, client, seed categories
src/features/            transactions, budgets, insights (queries + UI pieces)
  security/              PIN rules, secure storage, lock screen, auto-lock
  export/                CSV builder + share sheet
src/ui/                  theme + small component kit
drizzle/                 generated SQL migrations (committed)
```

Flow: screen -> repository/query functions -> SQLite. Screens never write SQL.

## Decisions baked in (change them in one place)

- **Money is integer pesewas.** Never floats.
- **"Spent" includes every outgoing amount** (sends, expenses, airtime, bills, cash-out, and other). **"Received" counts only money from other people** (receive + salary), not cash you deposited yourself. See `src/features/insights/queries.ts`.
- Ghana is on GMT all year, so SMS times are stored as UTC with no conversion.
- De-duplication key is network + the network's transaction ID.

## Parser status

MTN rules are tuned against real messages. **Telecel and AirtelTigo rules are guesses** (`verified: false` in `providers/*.ts`): their results never score above 0.75, so the screen asks you to check every field. Flip `verified` to `true` once real fixtures for that network pass.

## Before you trust the parser

`src/core/parser/fixtures.ts` is mostly **synthetic** messages written to look typical; entries marked REAL are real messages (with the transaction ID altered). Keep adding real, anonymised messages from your own phone (mask names and numbers), run `npm test`, and tune `providers/*.ts` and `common.ts` until they pass. When the parser isn't sure it says so (low `confidence`) and the screen asks you to check every field.

## Changing the database

Edit `src/core/db/schema.ts`, then:

```powershell
npm run db:generate
```

Commit the new files in `drizzle/`. Migrations run automatically at app start.

## About the lock

- The PIN is never stored, only a salted SHA-256 hash in the phone's secure storage. Five wrong tries start a timed block (30 s, then longer).
- The app locks on launch and after 15 seconds in the background.
- It keeps casual snoopers out. It does **not** encrypt the database file, and the app's preview in the recent-apps list is not hidden yet.
- A forgotten PIN cannot be recovered: the only way back in is clearing the app's data, which deletes the records. The Settings screen says so.

## Premium billing (Google Play & App Store)

SikaLens never takes card numbers. Optional **Premium** is billed by **Google Play** (Android) or the **App Store** (iOS) as auto-renewing subscriptions. Renewals and cancellations happen in the store’s subscription settings, not inside a custom payment form.

### Status today

| Build | Behaviour |
|-------|-----------|
| Production / store builds | Live subscriptions via **RevenueCat** (`STORE_BILLING_LIVE = true`) |
| Missing API key | Purchase fails with a clear misconfiguration message — set keys before EAS production |
| Restore purchases | `Purchases.restorePurchases()` then mirrors entitlement `premium` locally |

List prices live in `src/features/premium/pricing.ts` (USD + approximate GHS for display). The **store console price** is what the user is actually charged.

Set keys: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (see `.env.example` and `docs/APP_STORE.md` §5).

### How it works (both stores)

1. Create subscription products in the store console (weekly / monthly / annual).
2. The app requests a purchase through Play Billing or StoreKit.
3. Google or Apple charges the user (card, store balance, local methods where available).
4. On success, the app unlocks Premium (and must support **Restore purchases** after reinstall).
5. You receive payouts after the store’s commission (often ~15–30% depending on program).

### Android (Google Play)

Step-by-step (new AAB, listing copy, subscriptions, RevenueCat `goog_` key, checklist): **[`docs/PLAY_STORE.md`](docs/PLAY_STORE.md)**.

| Step | Where / notes |
|------|----------------|
| Merchant / payments profile | Play Console (required before paid products) |
| Create subscriptions | Monetize → Products → Subscriptions |
| Product IDs | `premium_weekly`, `premium_monthly`, `premium_annual` (+ base plans) |
| App | Play Billing via **RevenueCat** — set `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` before production AAB |
| Testing | License testers + Internal / Closed testing track |
| User cancels | Play Store → Payments & subscriptions |

Package: `com.sikalens.app`. `app.json` currently has empty `extra.revenueCat.androidApiKey` — set the `goog_` key (env or `app.json`) before shipping paid Premium on Android.

### iOS (App Store)

| Step | Where / notes |
|------|----------------|
| Agreements | App Store Connect → Paid Applications Agreement, banking, tax |
| Create subscriptions | App → Subscriptions (one **Subscription Group**) |
| Suggested product IDs | Match Android IDs where possible |
| Pricing | Price per territory / tier |
| App | StoreKit via **RevenueCat** (recommended) or `react-native-iap` |
| Testing | Sandbox Apple ID |
| User cancels | Settings → Apple ID → Subscriptions |

### Go-live checklist

1. Create the three subscription products on **App Store Connect** (and Play when shipping Android paid Premium).
2. RevenueCat: entitlement `premium`, current offering, link product IDs, bake public SDK keys into the EAS production build.
3. Attach IAP products to the app version and submit **with** the new binary (required after Guideline 2.1(b)).
4. Keep Privacy / Terms aligned (`support@sikalens.app`, store handles payments).
5. Test with Apple Sandbox / Play license testers before relying on production charges.

Do **not** build your own card checkout for digital Premium — both stores require IAP for this kind of unlock.

### Related build commands

```powershell
npx --yes eas-cli@latest login
npx --yes eas-cli@latest build --platform android --profile production   # Play AAB
npx --yes eas-cli@latest build --platform ios --profile production       # App Store IPA (macOS / EAS cloud)
```

EAS project is linked in `app.json` (`extra.eas.projectId`). Set RevenueCat public keys in the production profile before building; upload the IPA/AAB, attach IAP products, then submit.

## Next steps

1. Real Telecel and AirtelTigo fixtures (then set `verified: true`).
2. Finish App Store Connect + RevenueCat IAP (`docs/APP_STORE.md` §5) and Play Premium + AAB (`docs/PLAY_STORE.md`).
3. Encrypt the database (SQLCipher) and hide the app preview in the recent-apps list.
4. Cloud backup (optional, Supabase) so a lost phone doesn't lose the records.
5. Android-only SMS auto-read as an opt-in. Google Play restricts SMS permissions and needs a declaration form, so check the current policy first.
6. Charts on Insights (spending over time).
