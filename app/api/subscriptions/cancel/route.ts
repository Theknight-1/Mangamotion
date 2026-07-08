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
 * Cancel at the end of the current billing period. User keeps access
 * (and their current usage quota) until currentPeriodEnd, then rolls
 * over to Free automatically.
 *
 * Razorpay supports this natively (cancel_at_cycle_end). PayPal does not —
 * for PayPal we just flag it locally; a scheduled job (or the next visit
 * to /dashboard/billing) should call DELETE once currentPeriodEnd passes.
 * We surface that limitation to the user in the response.
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
      note:
        sub.provider === "paypal"
          ? "PayPal doesn't support scheduled cancellation — this subscription will be fully cancelled now, but you can keep using your current plan's minutes until the period ends."
          : "Your plan will switch to Free at the end of the current billing period.",
    });
  } catch (error) {
    console.error("[cancel] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to schedule cancellation" },
      { status: 500 },
    );
  }
}

/** Cancel immediately and downgrade to Free right away. */
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
