import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, paymentEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import {
  TIERS,
  type TierKey,
  getPayPalAccessToken,
  verifyPayPalWebhookSignature,
} from "@/lib/payment";

// Configure this exact URL (https://yourdomain.com/api/webhooks/paypal) in
// the PayPal Developer Dashboard webhook settings, subscribed to:
// BILLING.SUBSCRIPTION.ACTIVATED, BILLING.SUBSCRIPTION.CANCELLED,
// BILLING.SUBSCRIPTION.SUSPENDED, BILLING.SUBSCRIPTION.EXPIRED,
// PAYMENT.SALE.COMPLETED.

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const webhookEvent = JSON.parse(rawBody);

  const accessToken = await getPayPalAccessToken();
  const verified = await verifyPayPalWebhookSignature({
    accessToken,
    headers: {
      transmissionId: request.headers.get("paypal-transmission-id") ?? "",
      transmissionTime: request.headers.get("paypal-transmission-time") ?? "",
      certUrl: request.headers.get("paypal-cert-url") ?? "",
      authAlgo: request.headers.get("paypal-auth-algo") ?? "",
      transmissionSig: request.headers.get("paypal-transmission-sig") ?? "",
    },
    webhookEvent,
  });

  if (!verified) {
    console.warn("[webhook:paypal] signature verification failed, rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType: string = webhookEvent.event_type;
  const resource = webhookEvent.resource ?? {};
  const userId: string | undefined = resource.custom_id;
  const paypalSubscriptionId: string | undefined =
    resource.id ?? resource.billing_agreement_id;

  if (!userId) {
    console.warn(
      `[webhook:paypal] event "${eventType}" missing custom_id, ignoring`,
    );
    return NextResponse.json({ received: true });
  }

  try {
    await db.insert(paymentEvents).values({
      id: createId(),
      userId,
      provider: "paypal",
      eventType,
      amount: resource.amount?.total
        ? Math.round(Number(resource.amount.total) * 100)
        : null,
      currency: resource.amount?.currency ?? null,
      rawPayload: webhookEvent,
    });

    const planId = resource.plan_id as string | undefined;
    const tier = tierFromPlanId(planId);

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "PAYMENT.SALE.COMPLETED": {
        const resolvedTier = tier ?? "creator";
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        await upsertSubscription(userId, {
          tier: resolvedTier,
          status: "active",
          provider: "paypal",
          paypalSubscriptionId,
          renderMinutes: TIERS[resolvedTier].limits.renderMinutes,
          renderMinutesUsed: 0,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          pendingTier: null,
        });
        break;
      }

      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        await db
          .update(subscriptions)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId));
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        await db
          .update(subscriptions)
          .set({
            tier: "free",
            status: "cancelled",
            renderMinutes: TIERS.free.limits.renderMinutes,
            cancelAtPeriodEnd: false,
            pendingTier: null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.userId, userId));
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook:paypal] processing error:", error);
    return NextResponse.json({ received: true, error: "processing_failed" });
  }
}

function tierFromPlanId(planId?: string): TierKey | null {
  if (!planId) return null;
  if (planId === TIERS.creator.paypalPlanId) return "creator";
  if (planId === TIERS.pro.paypalPlanId) return "pro";
  return null;
}

async function upsertSubscription(
  userId: string,
  data: Partial<typeof subscriptions.$inferInsert>,
) {
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({
      id: createId(),
      userId,
      ...data,
    } as typeof subscriptions.$inferInsert);
  }
}
