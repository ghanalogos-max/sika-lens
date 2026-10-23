# SikaLens

See where your mobile money goes. An Expo (React Native) expense and budget tracker for MTN, Telecel and AirtelTigo users in Ghana.

Everything is stored on the phone (SQLite). Nothing leaves the device.

**Site:** [sikalens.app](https://sikalens.app) (primary) · [sikalens.com](https://sikalens.com) (redirect once DNS is live)  
**Support:** support@sikalens.app · **Privacy / Terms:** `/privacy` and `/terms` on the primary site (required for store listings)

Static pages live in `website/` (home, privacy, terms, store badges, sitemap). Deploy that folder to Vercel/Netlify/Cloudflare Pages and point the domain DNS at the host. Until then, opening the domain shows nothing useful (registrar parking or DNS error).

Store badges: edit `website/stores.js` — set `PLAY_LIVE` / `APP_STORE_LIVE` and replace `APPLE_APP_ID` when listings go public.

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

## Next steps

1. Real Telecel and AirtelTigo fixtures (then set `verified: true`).
2. Encrypt the database (SQLCipher) and hide the app preview in the recent-apps list.
3. Cloud backup (optional, Supabase) so a lost phone doesn't lose the records.
4. Android-only SMS auto-read as an opt-in. Google Play restricts SMS permissions and needs a declaration form, so check the current policy first.
5. Charts on Insights (spending over time).
