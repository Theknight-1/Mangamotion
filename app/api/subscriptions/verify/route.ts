import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import {
  TIERS,
  type TierKey,
  verifyRazorpayCheckoutSignature,
} from "@/lib/payment";

/**
 * Optimistic activation right after Razorpay Checkout succeeds client-side.
 * The webhook (/api/webhooks/razorpay) is still the source of truth and will
 * reconcile status on renewals, failures, and cancellations — this route
 * just avoids making the user wait for the webhook to land in dev/local
 * environments where Razorpay can't reach localhost.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      tier,
    } = await request.json();

    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature ||
      !tier
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const tierKey = tier as TierKey;
    if (!TIERS[tierKey])
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

    const valid = verifyRazorpayCheckoutSignature({
      razorpayPaymentId: razorpay_payment_id,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpaySignature: razorpay_signature,
    });

    if (!valid)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    const data = {
      tier: tierKey,
      status: "active" as const,
      provider: "razorpay" as const,
      razorpaySubscriptionId: razorpay_subscription_id,
      renderMinutes: TIERS[tierKey].limits.renderMinutes,
      renderMinutesUsed: 0,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      pendingTier: null,
      updatedAt: now,
    };

    if (existing) {
      await db
        .update(subscriptions)
        .set(data)
        .where(eq(subscriptions.userId, session.user.id));
    } else {
      await db.insert(subscriptions).values({
        id: createId(),
        userId: session.user.id,
        ...data,
      });
    }

    return NextResponse.json({ success: true, tier: tierKey });
  } catch (error) {
    console.error("[verify] razorpay verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 },
    );
  }
}
