import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TIERS, type TierKey } from "@/lib/payment";
import { rolloverIfNeeded } from "@/app/actions/subscription/usages";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sub = await rolloverIfNeeded(session.user.id);
    const tier = sub.tier as TierKey;
    const tierData = TIERS[tier];

    return NextResponse.json({
      subscription: {
        tier,
        status: sub.status,
        provider: sub.provider,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        pendingTier: sub.pendingTier,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
      },
      usage: {
        limitMinutes: tierData.limits.renderMinutes,
        usedMinutes: Math.round(sub.renderMinutesUsed * 10) / 10,
        remainingMinutes: Math.max(
          0,
          Math.round(
            (tierData.limits.renderMinutes - sub.renderMinutesUsed) * 10,
          ) / 10,
        ),
      },
      tierData,
    });
  } catch (error) {
    console.error("[subscriptions] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 },
    );
  }
}

/**
 * NOTE: This route no longer accepts POST to directly flip a user's tier.
 * That used to let anyone call this endpoint and grant themselves a paid
 * plan with no payment attached. Upgrades now go through:
 *   1. POST /api/subscriptions/checkout   → creates a provider subscription
 *   2. POST /api/subscriptions/verify     → verifies Razorpay checkout, OR
 *      GET  /api/subscriptions/paypal/activate → confirms PayPal approval
 *   3. Webhooks (/api/webhooks/razorpay, /api/webhooks/paypal) are the
 *      source of truth that actually activates/renews/cancels the plan.
 *
 * Cancellation lives in /api/subscriptions/cancel (PATCH = at period end,
 * DELETE = immediately).
 */
