import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  cancelRazorpaySubscription,
  cancelPayPalSubscription,
  getPayPalAccessToken,
} from "@/lib/payment";

async function getSub(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return sub;
}

/**
 * Cancel at the end of the current billing period. This is the ONLY
 * self-serve cancellation path that should be exposed by default — the
 * user already paid for the current period, so their tier, quota, and
 * renderMinutesUsed are left completely untouched here. Access rolls over
 * to Free automatically once currentPeriodEnd passes (see rolloverIfNeeded).
 *
 * Razorpay supports "stop future billing but keep this cycle" natively via
 * cancel_at_cycle_end. PayPal has no equivalent flag — cancelling a PayPal
 * subscription is always immediate on PayPal's side (no more charges will
 * ever happen), but that only stops FUTURE billing. It does not mean we
 * have to revoke the user's already-paid-for access locally, so we still
 * leave tier/quota alone and let the period run out naturally.
 */
export async function PATCH() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sub = await getSub(session.user.id);
    if (!sub || sub.tier === "free")
      return NextResponse.json(
        { error: "No active paid subscription" },
        { status: 400 },
      );

    if (sub.provider === "razorpay" && sub.razorpaySubscriptionId) {
      await cancelRazorpaySubscription(sub.razorpaySubscriptionId, true);
    } else if (sub.provider === "paypal" && sub.paypalSubscriptionId) {
      const accessToken = await getPayPalAccessToken();
      await cancelPayPalSubscription(accessToken, sub.paypalSubscriptionId);
    }

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        pendingTier: "free",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, session.user.id));

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: sub.currentPeriodEnd,
      note: `Billing stopped. You'll keep your ${sub.tier} plan and render minutes until ${new Date(
        sub.currentPeriodEnd,
      ).toLocaleDateString()}, then you'll move to Free.`,
    });
  } catch (error) {
    console.error("[cancel] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to schedule cancellation" },
      { status: 500 },
    );
  }
}

/**
 * Immediately revokes access and downgrades to Free — no refund, no grace
 * period. This should NOT be the default/primary cancel action in the UI.
 * It only makes sense for: a support agent processing a refund alongside
 * it, fraud/abuse handling, or a user who explicitly understands they're
 * giving up time they already paid for. Keep this out of the main flow.
 */
export async function DELETE() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sub = await getSub(session.user.id);
    if (!sub || sub.tier === "free")
      return NextResponse.json(
        { error: "No active paid subscription" },
        { status: 400 },
      );

    if (sub.provider === "razorpay" && sub.razorpaySubscriptionId) {
      await cancelRazorpaySubscription(sub.razorpaySubscriptionId, false);
    } else if (sub.provider === "paypal" && sub.paypalSubscriptionId) {
      const accessToken = await getPayPalAccessToken();
      await cancelPayPalSubscription(accessToken, sub.paypalSubscriptionId);
    }

    await db
      .update(subscriptions)
      .set({
        tier: "free",
        status: "cancelled",
        renderMinutes: 10,
        cancelAtPeriodEnd: false,
        pendingTier: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, session.user.id));

    return NextResponse.json({ success: true, tier: "free" });
  } catch (error) {
    console.error("[cancel] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
