# App Store build & billing (SikaLens)

Android closed testing already uses EAS production AABs. iOS follows the same EAS project (`extra.eas.projectId` in `app.json`), bundle id **`com.sikalens.app`**.

## 1. Accounts (one-time)

1. **Apple Developer Program** (paid) — [developer.apple.com](https://developer.apple.com)
2. **App Store Connect** — create app:
   - Name: SikaLens  
   - Bundle ID: `com.sikalens.app`  
   - SKU: e.g. `sikalens`  
3. Complete **Paid Applications Agreement**, banking, and tax (required before subscriptions).
4. Link Expo → Apple: `eas credentials` / EAS will manage certs & profiles on first iOS build.

## 2. Build IPA with EAS

From the project root (macOS or Windows — build runs in the cloud):

```powershell
npx --yes eas-cli@latest login
npx --yes eas-cli@latest build --platform ios --profile production
```

First run asks for Apple ID / team and generates distribution credentials. When finished, download the IPA from the Expo build page.

Optional submit straight to App Store Connect:

```powershell
npx --yes eas-cli@latest submit --platform ios --profile production --latest
```

Or upload the IPA in Transporter / App Store Connect → TestFlight.

## 3. TestFlight

1. App Store Connect → your app → **TestFlight**
2. Wait for processing + compliance questions (export, encryption — SikaLens uses standard HTTPS/crypto; answer per Apple’s questionnaire)
3. Add internal testers (App Store Connect users) or external beta (may need Beta App Review)

## 4. Store listing assets

Use files under `store/appstore/`:

| Asset | Path |
|-------|------|
| Icon 1024×1024 | `store/appstore/icon-1024.png` |
| iPhone 6.7″ (large) | `store/appstore/screenshots-6.7/*.png` (**1290×2796**) |
| iPhone 6.1″ / 6.3″ (medium Dynamic Island) | `store/appstore/screenshots-6.1/*.png` (**1206×2622**) |

Upload each set into the matching ASC device slot. The “medium display” slot rejects 1290×2796.

Marketing frames (logo + headline + phone) are built from iPhone captures in `mockups/iphone/`:

```powershell
python scripts/build_marketing_screenshots.py
```

Also set Privacy Policy: `https://www.sikalens.app/privacy`  
Support URL / email: `https://www.sikalens.app` · `support@sikalens.app`

## 5. Subscriptions (before flipping billing live)

In App Store Connect → SikaLens → **Subscriptions**:

1. Create one **Subscription Group** (e.g. `SikaLens Premium`)
2. Add products with these IDs (must match `src/features/premium/products.ts`):

| Product ID | Reference name | Duration |
|------------|----------------|----------|
| `premium_weekly` | Premium Weekly | 1 week |
| `premium_monthly` | Premium Monthly | 1 month |
| `premium_annual` | Premium Yearly | 1 year |

3. Mirror the same IDs on **Google Play** → Monetize → Subscriptions  
4. Optional: **RevenueCat** — entitlement `premium`, attach the three products on both stores  
5. In code: implement `purchaseWithStore` / `restoreWithStore` in `src/features/premium/billing.ts`, then set `STORE_BILLING_LIVE = true`

Until then, production builds show **Coming soon**; `__DEV__` can unlock locally for QA.

## 6. App Store Connect — fields needed to submit for review

Work left → right in **App Store Connect → SikaLens → App Store** until every red/missing item is green, then **Add for Review** → **Submit to App Review**.

### A. App Information
| Field | Value for SikaLens |
|-------|-------------------|
| Name | `SikaLens` (≤30) |
| Subtitle (optional) | `MoMo & bank expense tracker` (≤30) |
| Privacy Policy URL | `https://www.sikalens.app/privacy` |
| Category (primary) | **Finance** |
| Category (secondary) | Productivity (optional) |
| Content Rights | Confirm you have rights to content/logos used as allowed |
| Age Rating | Complete questionnaire — expect **4+** / low (no violence, UGC, etc.) |

### B. Pricing and Availability
| Field | Value |
|-------|--------|
| Price | **Free** |
| Availability | Countries you want (include Ghana + as needed) |
| Pre-order | Off (unless you intend it) |

Paid Apps Agreement / banking / tax: required if you later sell subscriptions; for a free app with Premium “Coming soon”, you can still submit without live IAP.

### C. App Privacy (“Nutrition label”)
Declare what the **app binary** collects (not the marketing website’s Google Analytics).

Typical for SikaLens offline ledger:
| Question | Suggested answer |
|----------|------------------|
| Do you collect data? | **No** (ledger/PIN stay on device; no account) — or only declare what you truly send |
| Tracking | **No** (no ATT tracking for ads) |
| Biometrics | Used on-device to unlock; not collected by you |

Do **not** claim “no data” if you later add analytics/crash SDKs that send device data.

### D. Version / Prepare for Submission (this build)
| Field | Value |
|-------|--------|
| Version | `1.0.0` (match `app.json`) |
| Copyright | `© 2026 Celestial Web Solutions` |
| What’s New | First release / closed beta notes |
| Build | Select the processed TestFlight build from EAS IPA |
| App Review contact | Name, phone, `support@sikalens.app` |
| App Review notes | See template below |
| Sign-in required? | **Yes** (app PIN) — provide PIN instructions |
| Attachments | Optional screen recording of unlock |

**App Review notes (paste):**
```text
SikaLens does not use email/password accounts or cloud login.
It uses a local app PIN only.

First launch: finish welcome, create PIN 1234, confirm 1234.
Skip biometrics if prompted; unlock anytime with PIN 1234.

All features work offline after unlock (paste SMS, wallets, budgets, settings).
Premium shows "Coming soon" and is not charged in this build.
Privacy: https://www.sikalens.app/privacy
Support: support@sikalens.app
```

### E. Export compliance / encryption
`app.json` sets `ITSAppUsesNonExemptEncryption: false` (standard HTTPS / exempt encryption).

In Connect, answer:
- Uses encryption? → typically **Yes** (HTTPS) then **exempt** / documentation not required, matching the Info.plist flag  
Follow the exact questionnaire wording Apple shows for this build.

### F. Advertising Identifier / Tracking
| Field | Value |
|-------|--------|
| Uses IDFA / tracking? | **No** (unless you add ads later) |

### G. In-App Purchases
| This release | Action |
|--------------|--------|
| Premium = Coming soon | **Do not** attach IAP products to the version yet |
| Listing copy | Do not claim users can buy Premium now |
| Later | Create `premium_weekly` / `premium_monthly` / `premium_annual`, wire SDK, then submit IAP + app together |

### H. Screenshots & previews (required per device size)
Upload from `store/appstore/`:

| Size | Files |
|------|--------|
| iPhone 6.7″ large (required) | `store/appstore/screenshots-6.7/*.png` — 1290×2796 |
| iPhone 6.1″/6.3″ medium Dynamic Island | `store/appstore/screenshots-6.1/*.png` — 1206×2622 |
| Other sizes | iPad / Watch only if those targets are enabled |

### Listing copy (ASO / SEO) — paste into App Store Connect

**What Apple indexes for search:** Name, Subtitle, Keywords (primary). Description helps conversion more than ranking. **Promotional Text is not indexed** — use it for a benefit hook you can change anytime without a new version.

| Field | Limit | Paste |
|-------|-------|-------|
| **Name** | 30 | `SikaLens` |
| **Subtitle** | 30 | `MoMo & bank expense tracker` |
| **Promotional Text** | 170 | See block below |
| **Keywords** | 100 | See block below |
| **Description** | 4000 | See block below |
| Support URL | — | `https://www.sikalens.app` |
| Marketing URL | — | `https://www.sikalens.app` |
| App icon | — | `store/appstore/icon-1024.png` (1024×1024, no alpha) |

**Subtitle** (30 chars — `MoMo & bank expense tracker` = 28):

```text
MoMo & bank expense tracker
```

**Promotional Text** (170 max — conversion hook, editable anytime):

```text
Offline MoMo & bank tracker for Ghana. Paste MTN, Telecel & AirtelTigo SMS, track GHS wallets, budgets & insights — PIN-locked on your phone.
```

**Keywords** (100 max, comma-separated, no spaces; omit words already in Name/Subtitle):

```text
ghana,mobile money,sms,wallet,budget,offline,cedi,mtn,telecel,airteltigo,ledger,privacy,pin,export
```

**Description** (formal, SEO terms natural — do not claim live Premium purchase while Coming soon):

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

HOW WALLET BALANCES WORK
Each wallet starts with an opening balance you set. Every recorded transaction then adds or subtracts from that figure, similar to a bank book. For your MoMo balance to remain accurate, record every relevant message for that wallet—including sends, receives, cash-out, airtime, bills, and fees. If a message is skipped, the balance on your phone will not match your real MoMo balance.

PRIVACY AND SECURITY
SikaLens does not require account registration and does not upload your ledger to SikaLens servers. Your wallets, transactions, budgets, and PIN remain on the device. Encrypted backups use a passphrase you choose. CSV exports omit raw MoMo SMS text.

PREMIUM
Core MoMo and bank tracking features are available without Premium. Optional Premium features will be billed through the App Store when in-app purchases are enabled. Until billing is live, Premium may appear as Coming soon and will not be charged.

IMPORTANT NOTICE
SikaLens is a personal expense and wallet-tracking application. It is not a bank, mobile money operator, payment processor, or provider of financial advice. Brand names of mobile networks and banks belong to their respective owners and are referenced only to describe supported SMS formats and wallet types.

SUPPORT AND POLICY
Website: https://www.sikalens.app
Support: support@sikalens.app
Privacy Policy: https://www.sikalens.app/privacy
Terms of Use: https://www.sikalens.app/terms

Published by Celestial Web Solutions
```

Also keep the matching Play short description for parity:  
`Ghana MoMo & bank expense tracker. Offline SMS ledger with PIN privacy.`

### I. Before you click Submit
- [ ] IPA uploaded and **Ready to Submit** in TestFlight / build picker  
- [ ] Privacy URL opens on phone Safari  
- [ ] Review notes include PIN `1234`  
- [ ] Screenshots uploaded for 6.7″ (and 6.1″ medium if that slot is open)
- [ ] Age rating completed  
- [ ] Contact email/phone filled  
- [ ] No live IAP claimed while Coming soon  
- [ ] Trade / content rights acknowledged  

### J. After submit
Status → **Waiting for Review** → **In Review** → **Pending Developer Release** or **Ready for Sale**.  
Respond in Resolution Center within ~24–48h if rejected.

## Related Android reminder

```powershell
npx --yes eas-cli@latest build --platform android --profile production
```

Upload the `.aab` to Play Console → Closed / Open testing or Production.
