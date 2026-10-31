# Google Play build & Premium (SikaLens)

Package id **`com.sikalens.app`**. Same EAS project as iOS (`extra.eas.projectId` in `app.json`). Billing is live in code (`STORE_BILLING_LIVE = true` via RevenueCat) — Android needs a **Google Play** app in RevenueCat plus a **`goog_…` public SDK key** baked into the production AAB.

iOS twin guide: [`docs/APP_STORE.md`](./APP_STORE.md).

## 1. Accounts (one-time)

1. **Google Play Console** — [play.google.com/console](https://play.google.com/console)  
2. Create app **SikaLens** (or open the existing one), package `com.sikalens.app`.  
3. Complete **Payments profile** / merchant account (required before paid subscriptions).  
4. Accept Play agreements (Payments, Developer Distribution, etc.).  
5. Link Expo: `npx --yes eas-cli@latest login` (project already in `app.json`).

## 2. Build a new production AAB (EAS)

From the project root (Windows PowerShell is fine — build runs in the cloud):

```powershell
npx --yes eas-cli@latest login
npx --yes eas-cli@latest build --platform android --profile production
```

| Detail | Value |
|--------|--------|
| Output | `.aab` (Android App Bundle) for Play Console |
| Profile | `production` in `eas.json` (`autoIncrement: true`) |
| Package | `com.sikalens.app` |
| Version | Match `app.json` (`version`); Play `versionCode` increments via EAS remote |

### Before you build (Premium)

Android production builds **will try RevenueCat**. Without a key, Premium shows a misconfiguration message.

Set **one** of:

| Method | How |
|--------|-----|
| `eas.json` | `build.production.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` = `goog_…` |
| EAS Secret | Same name, then rebuild |
| `app.json` | `extra.revenueCat.androidApiKey` (public SDK key only) |

Do **not** put secret/server keys in the app. Public SDK keys (`goog_` / `appl_`) are expected in the client.

Optional APK for sideload testers (not for Play production):

```powershell
npx --yes eas-cli@latest build --platform android --profile preview
```

### Upload / submit

```powershell
# Upload latest successful production AAB to Play (internal track by default in eas.json)
npx --yes eas-cli@latest submit --platform android --profile production --latest
```

Or download the AAB from the Expo build page → Play Console → **Testing** → Closed / Open / Internal → **Create new release** → upload AAB.

`eas.json` submit track is **`internal`**. Promote the release to Closed testing or Production when ready.

## 3. Release notes (current build — `1.1.0`)

Paste into Play Console → Release → **Release notes** (en-US / en-GB). Keep under ~500 characters per language if you want it short on the store page.

```text
SikaLens 1.1.0

• Move money between your wallets (bank ↔ MoMo ↔ cash) without counting as spend
• Reminders for daily logging and subscription renewals (ChatGPT, Spotify, …)
• Premium — weekly, monthly, or yearly via Google Play; restore on a new phone
• Bank and subscription logos, native date pickers, keyboard-friendly forms

Core MoMo & bank tracking stays free and offline on your phone.
```

Shorter variant (if the field is tight):

```text
Move money between wallets, renewal reminders, Premium via Play, and clearer forms. Ledger stays offline on your phone.
```

## 4. Play Console — testing tracks

| Track | Use |
|-------|-----|
| **Internal testing** | Fast upload; up to 100 testers; good for AAB + billing smoke tests |
| **Closed testing** | Wider QA; often required before Production for new apps |
| **Open testing** | Public opt-in beta |
| **Production** | Store listing live |

Add **license testers** (Play Console → Settings → License testing) with Gmail accounts that should get test charges without real money when configured correctly.

Install path for testers: opt-in link from the track → Play Store listing for that track.

## 5. Store listing assets

Files under `store/play/`:

| Asset | Path | Spec |
|-------|------|------|
| App icon | `store/play/icon-512.png` | 512×512 PNG |
| Feature graphic | `store/play/feature-graphic-1024x500.png` | 1024×500 PNG |
| Phone screenshots | `store/play/screenshots/*.png` | 1080×1920 (at least 2) |

Rebuild from mockups:

```powershell
python scripts/build_store_assets.py
```

Upload order suggestion: lock → home → activity → budgets → insights → MoMo / bank → settings.

Also set:

| Field | Value |
|-------|--------|
| Privacy policy | `https://www.sikalens.app/privacy` |
| App category | Finance (or Finance / Productivity) |
| Contact email | `support@sikalens.app` |
| Website | `https://www.sikalens.app` |

## 6. Listing copy (en-GB / en-US)

### App name
```text
SikaLens
```

### Short description (≤80 characters)
```text
Ghana MoMo & bank expense tracker. Offline SMS ledger with PIN privacy.
```

### Full description
```text
SikaLens is a Ghana-focused mobile money (MoMo) and bank expense tracker that keeps your personal finance ledger on your phone. Use it to record MTN MoMo, Telecel Cash, and AirtelTigo Money activity, manage wallet balances in Ghana cedi (GH₵), and understand spending without creating a cloud account.

OFFLINE MOMO AND BANK TRACKING
SikaLens is designed as an offline-first expense tracker for Ghana. Paste mobile money SMS into the app, confirm the amount and details, assign a category, and save the entry to your on-device ledger. Track MoMo wallets, bank accounts, and cash in one place so your GH₵ balances stay organised.

KEY FEATURES
• Paste and parse MoMo SMS from major Ghana networks
• Multi-wallet balances for MoMo, bank, and cash (GH₵)
• Budgets and monthly spending insights
• App PIN lock with optional biometric unlock
• Encrypted backups you create and control
• CSV and PDF export for records you choose to share
• Optional currency conversion when you need exchange rates
• Optional Premium for full history, every wallet, themes, and export

HOW WALLET BALANCES WORK
Each wallet starts with an opening balance you set. Every recorded transaction then adds or subtracts from that figure, similar to a bank book. For your MoMo balance to remain accurate, record every relevant message for that wallet—including sends, receives, cash-out, airtime, bills, and fees. If a message is skipped, the balance on your phone will not match your real MoMo balance.

PRIVACY AND SECURITY
SikaLens does not require account registration and does not upload your ledger to SikaLens servers. Your wallets, transactions, budgets, and PIN remain on the device. Encrypted backups use a passphrase you choose. CSV exports omit raw MoMo SMS text.

PREMIUM
Core MoMo and bank tracking features are available without Premium. Optional Premium subscriptions (weekly, monthly, or yearly) are billed through Google Play and renew until cancelled in Play Store → Payments & subscriptions. Prices may be shown in US dollars; you are charged in your local currency.

IMPORTANT NOTICE
SikaLens is a personal expense and wallet-tracking application. It is not a bank, mobile money operator, payment processor, or provider of financial advice. Brand names of mobile networks and banks belong to their respective owners and are referenced only to describe supported SMS formats and wallet types.

SUPPORT AND POLICY
Website: https://www.sikalens.app
Support: support@sikalens.app
Privacy Policy: https://www.sikalens.app/privacy
Terms of Use: https://www.sikalens.app/terms

Published by Celestial Web Solutions
```

## 7. Premium on Android (Play Billing + RevenueCat)

Product IDs must match `src/features/premium/products.ts`:

| Product ID | Plan | List price (USD, marketing) |
|------------|------|-----------------------------|
| `premium_weekly` | Weekly | $0.99 / week |
| `premium_monthly` | Monthly | $1.99 / month |
| `premium_annual` | Yearly | $14.99 / year |

Display copy / GHS approximations: `src/features/premium/pricing.ts`. **Play Console price** is what users are charged.

### 7a. Create subscriptions in Play Console

1. Play Console → SikaLens → **Monetize** → **Products** → **Subscriptions**.  
2. Create three subscriptions with the exact IDs above.  
3. For each, add a **base plan** (auto-renewing):
   - Weekly → 1 week period  
   - Monthly → 1 month  
   - Yearly → 1 year  
4. Set prices (USD and/or territories). Play bills in local currency where available.  
5. Activate base plans (and any offers you add).  
6. Subscriptions only become purchasable after the app is on a track that can serve them (usually at least an uploaded AAB on Internal/Closed testing).

Optional review / localization reference for Apple-style shots lives in `store/iap-review/` — Play does not use those PNGs the same way; use Play’s own product UI and listing screenshots instead.

### 7b. RevenueCat (Android)

1. RevenueCat project → add **Google Play** app with package `com.sikalens.app`.  
2. Connect Play service credentials (service account JSON) per [RevenueCat Play docs](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials).  
3. Entitlement id: **`premium`** (`PREMIUM_ENTITLEMENT_ID`).  
4. Import / add the three Play products; attach each to entitlement `premium`.  
5. **Current Offering** (e.g. `default`) with weekly / monthly / annual packages.  
6. Copy the **Google public SDK key** (`goog_…`).  
7. Bake it into the next EAS production Android build (see §2).  
8. Mirror the same entitlement / offering structure as iOS so one codebase works on both stores.

### 7c. How purchase works in the app

1. User opens **Premium** → picks Weekly / Monthly / Yearly.  
2. RevenueCat → Google Play Billing Library.  
3. Play charges the signed-in Google account.  
4. Entitlement `premium` unlocks; app mirrors status locally for offline gates.  
5. **Restore purchases** uses `Purchases.restorePurchases()` (same Google account).  
6. Cancel / manage: **Play Store → Payments & subscriptions** (not a custom cancel flow in-app).

Do **not** build a custom card checkout for digital Premium — Play requires Play Billing for this unlock.

### 7d. Test Premium on Android

| Step | Action |
|------|--------|
| License testers | Add tester Gmail in Play Console |
| Build | Production AAB with `goog_` key |
| Track | Install from Internal or Closed testing |
| Buy | Premium screen → Continue → Play purchase sheet |
| Restore | Reinstall or clear data → Restore purchases |
| Cancel | Tester manages subscription in Play Store |

## 8. Play Console — policy / questionnaires

### App access (sign-in)

| Question | Answer |
|----------|--------|
| Sign-in required? | **Yes** — local app PIN only (no Google/email account) |
| Instructions | First launch: create PIN `1234`, confirm `1234`. Unlock with `1234`. Skip biometrics. |

### Ads

| Question | Answer |
|----------|--------|
| Contains ads? | **No** (unless you add ads later) |

### Data safety

Declare what the **binary** collects. Ledger/PIN stay on device. With RevenueCat + Play Billing, purchase-related data may be processed by Google / RevenueCat — do **not** claim “no data collected” if the Purchases SDK contacts RevenueCat. Match [RevenueCat Data safety guidance](https://www.revenuecat.com/docs) and your actual SDK behaviour. Website Google Analytics is **not** the app binary.

### Permissions

Declared in `app.json` Android permissions (biometric, notifications for local reminders, boot completed for reminder reschedule). No SMS auto-read permission in production unless you add it and complete Play’s SMS declaration.

### Content rating

Complete the IARC questionnaire — expect a low rating (finance / utility, no violence/UGC).

## 9. Review notes (paste into Play if asked / tester notes)

```text
SikaLens does not use email/password or Google login.
It uses a local app PIN only.

First launch: finish welcome, create PIN 1234, confirm 1234.
Skip biometrics if prompted; unlock anytime with PIN 1234.

All features work offline after unlock (paste SMS, wallets, budgets, settings).

Premium is sold as auto-renewing subscriptions via Google Play / RevenueCat.
Product IDs: premium_weekly, premium_monthly, premium_annual
To test: open Premium → choose a plan → Continue (use a license tester account).
Restore purchases is on the same screen.

Privacy: https://www.sikalens.app/privacy
Support: support@sikalens.app
```

## 10. Go-live checklist

- [ ] Payments profile / merchant account active  
- [ ] Subscriptions `premium_weekly` / `premium_monthly` / `premium_annual` + base plans Active  
- [ ] RevenueCat Google Play app linked + entitlement `premium` + offering  
- [ ] `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (or `extra.revenueCat.androidApiKey`) in production AAB  
- [ ] New production AAB uploaded to Internal or Closed testing  
- [ ] License testers can purchase / restore  
- [ ] Store listing: icon, feature graphic, ≥2 screenshots, short + full description  
- [ ] Privacy URL opens: `https://www.sikalens.app/privacy`  
- [ ] Data safety + content rating + ads declaration complete  
- [ ] PIN instructions available for reviewers / testers  
- [ ] Promote to Production when Closed testing is healthy  
- [ ] Flip `PLAY_LIVE = true` in `website/stores.js` when the public listing is live  

## 11. Related commands

```powershell
npx --yes eas-cli@latest build --platform android --profile production
npx --yes eas-cli@latest submit --platform android --profile production --latest
npx --yes eas-cli@latest build --platform ios --profile production
```

After Android is live on Premium, keep product IDs and RevenueCat offerings in sync with iOS (`docs/APP_STORE.md` §5).
