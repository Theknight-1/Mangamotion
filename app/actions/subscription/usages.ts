import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { TIERS, type TierKey } from "@/lib/payment";

const PERIOD_DAYS = 30;

function newPeriod(now = new Date()) {
  const end = new Date(now);
  end.setDate(end.getDate() + PERIOD_DAYS);
  return { start: now, end };
}

/**
 * Fetches the user's subscription row, creating a default free-tier row
 * if one doesn't exist yet (e.g. brand new signup).
 */
export async function getOrCreateSubscription(userId: string) {
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing) return existing;

  const { start, end } = newPeriod();
  const [created] = await db
    .insert(subscriptions)
    .values({
      id: createId(),
      userId,
      tier: "free",
      status: "active",
      renderMinutes: TIERS.free.limits.renderMinutes,
      renderMinutesUsed: 0,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
    })
    .returning();

  return created;
}

/**
 * Rolls the billing period forward and resets usage if the current period
 * has ended. Applies any scheduled downgrade (pendingTier) at rollover.
 */
export async function rolloverIfNeeded(userId: string) {
  const sub = await getOrCreateSubscription(userId);
  const now = new Date();

  if (new Date(sub.currentPeriodEnd) > now) return sub;

  const { start, end } = newPeriod(now);
  const nextTier = (sub.pendingTier as TierKey | null) ?? (sub.tier as TierKey);

  const [updated] = await db
    .update(subscriptions)
    .set({
      tier: nextTier,
      renderMinutes: TIERS[nextTier].limits.renderMinutes,
      renderMinutesUsed: 0,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      pendingTier: null,
      updatedAt: now,
    })
    .where(eq(subscriptions.userId, userId))
    .returning();

  return updated;
}

export interface QuotaCheckResult {
  allowed: boolean;
  tier: TierKey;
  limitMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
}

/**
 * Call BEFORE starting a render. Blocks the render if the user has already
 * used up their monthly render-minutes quota.
 */
export async function checkRenderQuota(
  userId: string,
): Promise<QuotaCheckResult> {
  const sub = await rolloverIfNeeded(userId);
  const tier = sub.tier as TierKey;
  const limitMinutes = TIERS[tier].limits.renderMinutes;
  const usedMinutes = sub.renderMinutesUsed;

  return {
    allowed: usedMinutes < limitMinutes,
    tier,
    limitMinutes,
    usedMinutes,
    remainingMinutes: Math.max(0, limitMinutes - usedMinutes),
  };
}

/**
 * Call AFTER a render finishes successfully. Adds the rendered duration
 * (in seconds) to the user's usage for the current period.
 */
export async function recordRenderUsage(
  userId: string,
  durationSeconds: number,
) {
  const sub = await getOrCreateSubscription(userId);
  const minutesUsed = durationSeconds / 60;

  await db
    .update(subscriptions)
    .set({
      renderMinutesUsed: sub.renderMinutesUsed + minutesUsed,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));
}
