import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import {
  getOrCreateStoryboardUsage,
  getStoryboardTierLimits,
} from "@/lib/storyboard/usage";
import type { TierKey } from "@/lib/payment";
import type { StoryboardUsageSummary } from "@/types/storyboard";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;
    const usage = await getOrCreateStoryboardUsage(session.user.id);
    const limit = getStoryboardTierLimits(tier).maxGenerationsPerMonth;

    const summary: StoryboardUsageSummary = {
      tier: tier as StoryboardUsageSummary["tier"],
      used: usage.generationsThisPeriod,
      limit,
      remaining: Math.max(0, limit - usage.generationsThisPeriod),
      periodEnd: usage.periodEnd.toISOString(),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[GET Storyboard Usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch storyboard usage" },
      { status: 500 },
    );
  }
}
