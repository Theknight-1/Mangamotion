import axios from "axios";
import crypto from "crypto";

export type TierKey = "free" | "creator" | "pro";
export type LimitKey = keyof typeof TIERS.free.limits;

export const TIERS = {
  free: {
    name: "Free",
    price: 0,
    description: "Try it out and make your first recap.",
    cta: "Get started free",
    razorpayPlanId: null,
    paypalPlanId: null,
    limits: {
      renderMinutes: 10,
      maxResolution: "1080p",
      voiceCharacters: 1,
      bgmTracks: true,
      sfxLibrary: false,
      priorityRendering: false,
      customBranding: false,
      api: false,
      watermark: true,
    },
    features: [
      "10 minutes of renders / month",
      "All aspect ratios (9:16, 16:9, 1:1)",
      "1080p Export",
      "Basic Ken Burns effects",
      "1 AI Voice",
      "Background Music library",
      "✨ Includes MangaMotion watermark",
    ],
  },
  creator: {
    name: "Creator",
    price: 19,
    description: "For YouTubers and TikTokers growing their channels.",
    cta: "Remove Watermark",
    razorpayPlanId: process.env.RAZORPAY_PLAN_CREATOR ?? "",
    paypalPlanId: process.env.PAYPAL_PLAN_CREATOR ?? "",
    limits: {
      renderMinutes: 120,
      maxResolution: "1080p",
      voiceCharacters: 5,
      bgmTracks: true,
      sfxLibrary: true,
      priorityRendering: false,
      customBranding: false,
      api: false,
      watermark: false,
    },
    features: [
      "120 minutes of renders / month",
      "NO Watermark",
      "1080p Export",
      "Advanced effects (Speed lines, Flash)",
      "5 AI Voices",
      "Full SFX & Music library",
      "Subtitle bubble tracking",
    ],
  },
  pro: {
    name: "Pro",
    price: 49,
    description: "For agencies and power users pushing limits.",
    cta: "Go Pro",
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO ?? "",
    paypalPlanId: process.env.PAYPAL_PLAN_PRO ?? "",
    limits: {
      renderMinutes: 500,
      maxResolution: "4K",
      voiceCharacters: "∞",
      bgmTracks: true,
      sfxLibrary: true,
      priorityRendering: true,
      customBranding: true,
      api: true,
      watermark: false,
    },
    features: [
      "500 minutes of renders / month",
      "4K Export",
      "Everything in Creator",
      "Unlimited AI Voices",
      "Priority rendering queue",
      "API Access",
      "Custom brand outro/watermark",
    ],
  },
} as const;

export function isPaidTier(tier: TierKey): tier is "creator" | "pro" {
  return tier === "creator" || tier === "pro";
}

// ── Razorpay ─────────────────────────────────────────────────────────────

function razorpayAuthHeader() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw new Error("Razorpay credentials not configured");
  return { username: key, password: secret };
}

/**
 * Creates a Razorpay Subscription (not a one-off order). The frontend opens
 * Razorpay Checkout with the returned subscription_id.
 */
export async function createRazorpaySubscription(
  tier: "creator" | "pro",
  userId: string,
) {
  const planId = TIERS[tier].razorpayPlanId;
  if (!planId)
    throw new Error(`No Razorpay plan configured for tier "${tier}"`);

  const response = await axios.post(
    "https://api.razorpay.com/v1/subscriptions",
    {
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      // 120 monthly cycles ~ 10 years; Razorpay requires a total_count for
      // fixed subscriptions, this effectively behaves as "until cancelled".
      total_count: 120,
      // Lets the webhook map events back to a user without a lookup table.
      notes: { userId, tier },
    },
    { auth: razorpayAuthHeader() },
  );

  return response.data as { id: string; status: string; short_url?: string };
}

export async function cancelRazorpaySubscription(
  razorpaySubscriptionId: string,
  cancelAtCycleEnd: boolean,
) {
  const response = await axios.post(
    `https://api.razorpay.com/v1/subscriptions/${razorpaySubscriptionId}/cancel`,
    { cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 },
    { auth: razorpayAuthHeader() },
  );
  return response.data;
}

/**
 * Verifies the signature Razorpay Checkout returns to the client after a
 * successful subscription payment.
 * See: https://razorpay.com/docs/payments/subscriptions/verify/
 */
export function verifyRazorpayCheckoutSignature(params: {
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const payload = `${params.razorpayPaymentId}|${params.razorpaySubscriptionId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return timingSafeEqualHex(expected, params.razorpaySignature);
}

/**
 * Verifies an incoming Razorpay WEBHOOK request. This uses a *different*
 * secret than the API key — the one you set when registering the webhook
 * in the Razorpay dashboard (RAZORPAY_WEBHOOK_SECRET).
 *
 * IMPORTANT: `rawBody` must be the exact, unparsed request body string.
 * Re-serializing a parsed JSON object with JSON.stringify() will NOT
 * reliably match the signature because key ordering / whitespace can differ.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return timingSafeEqualHex(expected, signatureHeader);
}

// ── PayPal ───────────────────────────────────────────────────────────────

function paypalBaseUrl() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    throw new Error("PayPal credentials not configured");

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await axios.post(
    `${paypalBaseUrl()}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  return response.data.access_token as string;
}

export async function createPayPalSubscription(
  accessToken: string,
  tier: "creator" | "pro",
  email: string,
  userId: string,
) {
  const planId = TIERS[tier].paypalPlanId;
  if (!planId) throw new Error(`No PayPal plan configured for tier "${tier}"`);

  const response = await axios
    .post(
      `${paypalBaseUrl()}/v1/billing/subscriptions`,
      {
        plan_id: planId,
        // Lets the webhook map events back to a user without a lookup table.
        custom_id: userId,
        subscriber: { email_address: email },
        application_context: {
          brand_name: "MotionRecap",
          locale: "en-US",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
        },
      },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    .catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        throw new Error(
          `PayPal plan "${planId}" (tier: ${tier}) was not found. This usually means the plan ` +
            `was created under a different Sandbox/Live app than PAYPAL_CLIENT_ID belongs to — ` +
            `check the Sandbox/Live toggle in the PayPal Developer Dashboard and confirm the ` +
            `plan exists under the same app that owns these credentials.`,
        );
      }
      throw err;
    });

  return response.data as {
    id: string;
    status: string;
    links: { href: string; rel: string; method: string }[];
  };
}

export async function getPayPalSubscription(
  accessToken: string,
  paypalSubscriptionId: string,
) {
  const response = await axios.get(
    `${paypalBaseUrl()}/v1/billing/subscriptions/${paypalSubscriptionId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return response.data as { id: string; status: string; plan_id: string };
}

export async function cancelPayPalSubscription(
  accessToken: string,
  paypalSubscriptionId: string,
  reason = "User requested cancellation",
) {
  // PayPal has no "cancel at period end" — cancellation is immediate.
  await axios.post(
    `${paypalBaseUrl()}/v1/billing/subscriptions/${paypalSubscriptionId}/cancel`,
    { reason },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

/**
 * Verifies a PayPal webhook using PayPal's own verification endpoint.
 * HMAC-with-client-secret (the old approach) is NOT how PayPal signs
 * webhooks — they use a certificate-based signature, so verification
 * has to be an API call.
 */
export async function verifyPayPalWebhookSignature(params: {
  accessToken: string;
  headers: {
    transmissionId: string;
    transmissionTime: string;
    certUrl: string;
    authAlgo: string;
    transmissionSig: string;
  };
  webhookEvent: unknown;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  try {
    const response = await axios.post(
      `${paypalBaseUrl()}/v1/notifications/verify-webhook-signature`,
      {
        transmission_id: params.headers.transmissionId,
        transmission_time: params.headers.transmissionTime,
        cert_url: params.headers.certUrl,
        auth_algo: params.headers.authAlgo,
        transmission_sig: params.headers.transmissionSig,
        webhook_id: webhookId,
        webhook_event: params.webhookEvent,
      },
      { headers: { Authorization: `Bearer ${params.accessToken}` } },
    );
    return response.data?.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[paypal] webhook verification request failed:", err);
    return false;
  }
}

// ── shared ────────────────────────────────────────────────────────────────

function timingSafeEqualHex(expectedHex: string, actualHex: string): boolean {
  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(actualHex, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
