import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
// After merging lib/db/schema.subscriptions.ts into lib/db/schema.ts,
// both of these should be exported from the same "@/lib/db/schema" module.
import { subscriptions, paymentEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import {
  TIERS,
  type TierKey,
  verifyRazorpayWebhookSignature,
} from "@/lib/payment";

// Configure this exact URL (https://yourdomain.com/api/webhooks/razorpay) in
// the Razorpay dashboard, subscribed to: subscription.activated,
// subscription.charged, subscription.cancelled, subscription.completed,
// subscription.halted, subscription.pending, payment.failed.

export async function POST(request: NextRequest) {
  // IMPORTANT: read the raw text body — do NOT call request.json() first,
  // it consumes the stream and the signature check needs the exact bytes.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    console.warn("[webhook:razorpay] invalid signature, rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType: string = event.event;
  const entity = event.payload?.subscription?.entity ?? {};
  const paymentEntity = event.payload?.payment?.entity ?? {};

  const userId: string | undefined = entity.notes?.userId;
  const tierFromNotes: TierKey | undefined = entity.notes?.tier;
  const razorpaySubscriptionId: string | undefined = entity.id;

  if (!userId) {
    // Can happen for events unrelated to a subscription we created notes for.
    console.warn(
      `[webhook:razorpay] event "${eventType}" missing userId in notes, ignoring`,
    );
    return NextResponse.json({ received: true });
  }

  try {
    await db.insert(paymentEvents).values({
      id: createId(),
      userId,
      provider: "razorpay",
      eventType,
      amount: paymentEntity.amount ?? null,
      currency: paymentEntity.currency ?? null,
      rawPayload: event,
    });

    switch (eventType) {
      case "subscription.activated":
      case "subscription.charged": {
        const tier = tierFromNotes ?? "creator";
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        await upsertSubscription(userId, {
          tier,
          status: "active",
          provider: "razorpay",
          razorpaySubscriptionId,
          renderMinutes: TIERS[tier].limits.renderMinutes,
          renderMinutesUsed: 0, // subscription.charged = new cycle, reset usage
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          pendingTier: null,
        });
        break;
      }

      case "subscription.halted":
      case "subscription.pending": {
        // Payment failed on renewal — mark past_due but don't yank access
        // immediately; Razorpay will retry a few times before halting for good.
        await db
          .update(subscriptions)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId));
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed": {
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
        // Unhandled event types are fine to ignore — we still logged it above.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook:razorpay] processing error:", error);
    // Return 200 anyway to prevent Razorpay retry storms on our own bugs;
    // the raw event is already persisted in paymentEvents for replay/debug.
    return NextResponse.json({ received: true, error: "processing_failed" });
  }
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
