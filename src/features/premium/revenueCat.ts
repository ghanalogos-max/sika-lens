import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';

import { approxExpiryDate, type PremiumPlan } from './pricing';
import { PREMIUM_ENTITLEMENT_ID, PREMIUM_PRODUCT_IDS, planFromProductId, productIdForPlan } from './products';
import { clearPremium, savePremium, type PremiumState } from './storage';

type RevenueCatExtra = {
  iosApiKey?: string;
  androidApiKey?: string;
};

let configured = false;

function extraKeys(): RevenueCatExtra {
  const extra = Constants.expoConfig?.extra as { revenueCat?: RevenueCatExtra } | undefined;
  return extra?.revenueCat ?? {};
}

/** Public SDK keys only — set via EXPO_PUBLIC_* or app.json `extra.revenueCat`. */
export function revenueCatApiKey(): string | null {
  if (Platform.OS === 'ios') {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ||
      extraKeys().iosApiKey?.trim() ||
      null
    );
  }
  if (Platform.OS === 'android') {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ||
      extraKeys().androidApiKey?.trim() ||
      null
    );
  }
  return null;
}

export function isRevenueCatSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function configureRevenueCat(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isRevenueCatSupported()) {
    return { ok: false, message: 'In-app purchases are only available on iOS and Android.' };
  }
  if (configured) return { ok: true };

  const apiKey = revenueCatApiKey();
  if (!apiKey) {
    return {
      ok: false,
      message:
        'RevenueCat API key missing. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY before building.',
    };
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });
  configured = true;
  return { ok: true };
}

function planFromCustomerInfo(info: CustomerInfo): { plan: PremiumPlan; expiresAt: string | null } | null {
  const entitlement = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  if (!entitlement?.isActive) return null;

  const productId = entitlement.productIdentifier;
  const fromProduct = planFromProductId(productId);
  const plan: PremiumPlan = fromProduct ?? 'monthly';
  const expiresAt = entitlement.expirationDate ?? null;
  return { plan, expiresAt };
}

/** Mirror RevenueCat entitlement into local SecureStore (offline gates). */
export async function mirrorCustomerInfo(info: CustomerInfo): Promise<PremiumState> {
  const active = planFromCustomerInfo(info);
  if (!active) {
    await clearPremium();
    return { active: false, plan: null, expiresAt: null };
  }

  // Prefer StoreKit / RC expiration. Sandbox renews yearly in ~1 hour, so the date can look
  // "tomorrow" on TestFlight — that is Apple sandbox behaviour, not a 1-day plan.
  const expiresAt = active.expiresAt ?? approxExpiryDate(active.plan).toISOString();

  return savePremium({ active: true, plan: active.plan, expiresAt });
}

export async function syncPremiumFromStore(): Promise<PremiumState> {
  const setup = await configureRevenueCat();
  if (!setup.ok) {
    await clearPremium();
    return { active: false, plan: null, expiresAt: null };
  }
  const info = await Purchases.getCustomerInfo();
  return mirrorCustomerInfo(info);
}

async function findPackageForPlan(plan: PremiumPlan): Promise<PurchasesPackage | null> {
  const productId = productIdForPlan(plan);
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return null;

  const all = [
    ...current.availablePackages,
    ...(offerings.all
      ? Object.values(offerings.all).flatMap((o) => o.availablePackages)
      : []),
  ];

  return all.find((pkg) => pkg.product.identifier === productId) ?? null;
}

export async function purchasePlanOnStore(plan: PremiumPlan): Promise<
  | { ok: true; state: PremiumState }
  | { ok: false; reason: 'cancelled' | 'failed' | 'unavailable'; message?: string }
> {
  const setup = await configureRevenueCat();
  if (!setup.ok) return { ok: false, reason: 'unavailable', message: setup.message };

  try {
    const pkg = await findPackageForPlan(plan);
    if (pkg) {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const state = await mirrorCustomerInfo(customerInfo);
      if (!state.active) {
        return {
          ok: false,
          reason: 'failed',
          message: 'Purchase completed but Premium entitlement is not active yet. Try Restore purchases.',
        };
      }
      return { ok: true, state };
    }

    // Fallback when offerings aren't configured yet — purchase by store product id.
    const productId = productIdForPlan(plan);
    const products = await Purchases.getProducts([productId]);
    const product = products[0];
    if (!product) {
      return {
        ok: false,
        reason: 'unavailable',
        message: `Store product "${productId}" was not found. Confirm it exists in App Store Connect / Play Console and is linked in RevenueCat.`,
      };
    }

    const { customerInfo } = await Purchases.purchaseStoreProduct(product);
    const state = await mirrorCustomerInfo(customerInfo);
    if (!state.active) {
      return {
        ok: false,
        reason: 'failed',
        message: 'Purchase completed but Premium entitlement is not active yet. Try Restore purchases.',
      };
    }
    return { ok: true, state };
  } catch (e) {
    return mapPurchaseError(e);
  }
}

export async function restorePurchasesOnStore(): Promise<
  | { ok: true; state: PremiumState }
  | { ok: false; reason: 'not_found' | 'failed' | 'unavailable'; message?: string }
> {
  const setup = await configureRevenueCat();
  if (!setup.ok) return { ok: false, reason: 'unavailable', message: setup.message };

  try {
    const info = await Purchases.restorePurchases();
    const state = await mirrorCustomerInfo(info);
    if (!state.active) {
      return {
        ok: false,
        reason: 'not_found',
        message: 'No Premium purchase found for this store account.',
      };
    }
    return { ok: true, state };
  } catch (e) {
    const err = e as PurchasesError;
    return {
      ok: false,
      reason: 'failed',
      message: typeof err?.message === 'string' ? err.message : 'Could not restore purchases.',
    };
  }
}

function mapPurchaseError(
  e: unknown,
):
  | { ok: true; state: PremiumState }
  | { ok: false; reason: 'cancelled' | 'failed' | 'unavailable'; message?: string } {
  const err = e as PurchasesError & { userCancelled?: boolean };
  if (err?.userCancelled || err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    return { ok: false, reason: 'cancelled' };
  }
  const message = typeof err?.message === 'string' ? err.message : 'Purchase failed. Try again.';
  if (err?.code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR) {
    return { ok: false, reason: 'unavailable', message };
  }
  return { ok: false, reason: 'failed', message };
}

/** Exported for diagnostics / App Review notes. */
export function expectedProductIds(): string[] {
  return Object.values(PREMIUM_PRODUCT_IDS);
}
