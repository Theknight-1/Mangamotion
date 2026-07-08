import type { TierKey } from "@/lib/payment";

export type PaymentProvider = "razorpay" | "paypal";

export type SubscriptionStatus =
  | "active"
  | "pending"
  | "cancelled"
  | "past_due"
  | "expired";

export interface SubscriptionRow {
  id: string;
  userId: string;
  tier: TierKey;
  status: SubscriptionStatus;
  provider: PaymentProvider | null;
  razorpaySubscriptionId: string | null;
  paypalSubscriptionId: string | null;
  renderMinutes: number; // quota for the current tier (denormalized from TIERS)
  renderMinutesUsed: number; // consumed this billing period
  currentPeriodStart: Date | string;
  currentPeriodEnd: Date | string;
  cancelAtPeriodEnd: boolean;
  pendingTier: TierKey | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentEventRow {
  id: string;
  userId: string;
  provider: PaymentProvider;
  eventType: string;
  amount: number | null;
  currency: string | null;
  rawPayload: unknown;
  createdAt: Date | string;
}

export interface CheckoutRequestBody {
  tier: TierKey;
  provider: PaymentProvider;
}

export interface CheckoutResponseRazorpay {
  provider: "razorpay";
  subscriptionId: string;
  keyId: string;
  tier: TierKey;
}

export interface CheckoutResponsePaypal {
  provider: "paypal";
  approveUrl: string;
  paypalSubscriptionId: string;
  tier: TierKey;
}

export type CheckoutResponse =
  | CheckoutResponseRazorpay
  | CheckoutResponsePaypal;
