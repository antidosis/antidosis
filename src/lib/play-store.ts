import { GoogleAuth } from "google-auth-library";

const PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.antidosis.app";
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH;

export interface PlaySubscriptionLineItem {
  productId: string;
  expiryTime?: string;
  autoRenewingPlan?: { autoRenewEnabled?: boolean };
}

export interface PlaySubscription {
  lineItems?: PlaySubscriptionLineItem[];
  subscriptionState?: string;
  linkedPurchaseToken?: string;
}

/**
 * Fetch the authoritative subscription state from the Google Play Developer
 * API. This is the only source of truth for entitlement decisions — never
 * trust client- or webhook-supplied claims about subscription state.
 */
export async function fetchPlaySubscription(purchaseToken: string): Promise<PlaySubscription> {
  if (!SERVICE_ACCOUNT_KEY_PATH) {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH not configured");
  }

  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  const client = await auth.getClient();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(PACKAGE_NAME)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

  const response = await client.request({ url, method: "GET" });
  return response.data as PlaySubscription;
}

/**
 * True when the subscriber is currently entitled to Pro.
 * The subscriptionsv2 API returns string enum states
 * (e.g. "SUBSCRIPTION_STATE_ACTIVE"); a canceled subscription stays
 * entitled until its expiry time passes.
 */
export function isSubscriptionEntitled(state: string | undefined, expiresAt: Date | null): boolean {
  switch (state) {
    case "SUBSCRIPTION_STATE_ACTIVE":
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return true;
    case "SUBSCRIPTION_STATE_CANCELED":
      return expiresAt !== null && expiresAt.getTime() > Date.now();
    default:
      return false;
  }
}
