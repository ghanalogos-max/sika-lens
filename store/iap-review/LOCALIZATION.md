# App Store Connect — subscription localization + review shots

Upload each PNG as the **App Review Screenshot** on that product (1290×2796, RGB, no alpha).

| Product ID | Review screenshot |
|------------|-------------------|
| `premium_weekly` | `premium_weekly.png` |
| `premium_monthly` | `premium_monthly.png` |
| `premium_annual` | `premium_annual.png` |

## English (U.S.) — paste into Localization

### premium_weekly
- **Subscription Display Name** (≤35): `Premium Weekly`
- **Description** (≤55): `Full MoMo history, wallets, themes & export. Weekly.`

### premium_monthly
- **Subscription Display Name** (≤35): `Premium Monthly`
- **Description** (≤55): `Full MoMo history, wallets, themes & export. Monthly.`

### premium_annual
- **Subscription Display Name** (≤35): `Premium Yearly`
- **Description** (≤55): `Best value Premium — all features. Renews yearly.`

## Reference names (App Store Connect only, not shown to users)

| Product ID | Reference name |
|------------|----------------|
| `premium_weekly` | Premium Weekly |
| `premium_monthly` | Premium Monthly |
| `premium_annual` | Premium Yearly |

(Fix the typo **yealy** → **Premium Yearly** on the annual product.)

## Regenerate shots

```powershell
python scripts/build_iap_review_shots.py
```
