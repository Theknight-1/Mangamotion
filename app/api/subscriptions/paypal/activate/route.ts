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
  getPayPalAccessToken,
  getPayPalSubscription,
} from "@/lib/payment";

/**
 * PayPal redirects the user back to /success?subscription_id=I-XXXX after
 * they approve the subscription. This route double-checks the subscription
 * is actually ACTIVE with PayPal (the redirect alone isn't proof of payment)
 * and activates it locally so the user doesn't have to wait on the webhook.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subscriptionId, tier } = await request.json();
    if (!subscriptionId || !tier || !TIERS[tier as TierKey])
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const accessToken = await getPayPalAccessToken();
    const paypalSub = await getPayPalSubscription(accessToken, subscriptionId);

    if (paypalSub.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Subscription not active yet (status: ${paypalSub.status})` },
        { status: 400 },
      );
    }

    const tierKey = tier as TierKey;
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
      provider: "paypal" as const,
      paypalSubscriptionId: subscriptionId,
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
    console.error("[paypal/activate] error:", error);
    return NextResponse.json(
      { error: "Failed to activate subscription" },
      { status: 500 },
    );
  }
}
