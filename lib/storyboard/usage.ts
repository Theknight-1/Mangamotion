import { db } from "@/lib/db";
import { storyboardUsage, storyboardProjects } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { TierKey } from "@/lib/payment";
import {
  STORYBOARD_LIMITS,
  type StoryboardTierKey,
  type StoryboardTierLimits,
  type StoryboardModel,
} from "./tier-limits";

export type { StoryboardModel, StoryboardTierKey, StoryboardTierLimits };

const PERIOD_DAYS = 30;

export function getStoryboardTierLimits(tier: TierKey): StoryboardTierLimits {
  const normalizedTier = (tier as StoryboardTierKey) || "free";
  return STORYBOARD_LIMITS[normalizedTier] || STORYBOARD_LIMITS.free;
}

function newPeriod(now = new Date()) {
  const end = new Date(now);
  end.setDate(end.getDate() + PERIOD_DAYS);
  return { start: now, end };
}

/**
 * Fetches (or creates) the user's current-period storyboard usage row.
 * Rolls the period forward and resets the counter if the previous
 * period has ended.
 */
export async function getOrCreateStoryboardUsage(userId: string) {
  const [existing] = await db
    .select()
    .from(storyboardUsage)
    .where(eq(storyboardUsage.userId, userId))
    .limit(1);

  const now = new Date();

  if (!existing) {
    const { start, end } = newPeriod(now);
    const [created] = await db
      .insert(storyboardUsage)
      .values({
        id: createId(),
        userId,
        periodStart: start,
        periodEnd: end,
        generationsThisPeriod: 0,
      })
      .returning();
    return created;
  }

  if (new Date(existing.periodEnd) <= now) {
    const { start, end } = newPeriod(now);
    const [updated] = await db
      .update(storyboardUsage)
      .set({
        periodStart: start,
        periodEnd: end,
        generationsThisPeriod: 0,
        updatedAt: now,
      })
      .where(eq(storyboardUsage.userId, userId))
      .returning();
    return updated;
  }

  return existing;
}

export interface GenerationCheckResult {
  allowed: boolean;
  tier: StoryboardTierKey;
  limit: number;
  used: number;
  remaining: number;
}

/**
 * Call BEFORE any generation call (character sheet, shot image, regeneration, or iterate).
 */
export async function checkGenerationAllowed(
  userId: string,
  tier: TierKey,
): Promise<GenerationCheckResult> {
  const normalizedTier = (tier as StoryboardTierKey) || "free";
  const usage = await getOrCreateStoryboardUsage(userId);
  const limit = getStoryboardTierLimits(tier).maxGenerationsPerMonth;
  const used = usage.generationsThisPeriod;

  return {
    allowed: used < limit,
    tier: normalizedTier,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Call AFTER a generation call succeeds. Never call this on failure.
 */
export async function incrementGenerationUsage(userId: string) {
  const usage = await getOrCreateStoryboardUsage(userId);

  await db
    .update(storyboardUsage)
    .set({
      generationsThisPeriod: usage.generationsThisPeriod + 1,
      updatedAt: new Date(),
    })
    .where(eq(storyboardUsage.userId, userId));
}

/**
 * Validates requested PDF page count against tier limit (server-side enforcement).
 */
export function checkPdfPageLimit(
  tier: TierKey,
  pageCount: number,
): { allowed: boolean; maxPages: number } {
  const limits = getStoryboardTierLimits(tier);
  return {
    allowed: pageCount <= limits.maxPdfPages,
    maxPages: limits.maxPdfPages,
  };
}

/**
 * Validates a user-requested model against their tier's allowed list.
 */
export function resolveAllowedModel(
  tier: TierKey,
  requestedModel?: string,
): StoryboardModel {
  const allowed = getStoryboardTierLimits(tier).allowedModels;

  if (requestedModel && allowed.includes(requestedModel as StoryboardModel)) {
    return requestedModel as StoryboardModel;
  }

  return allowed[0];
}

/**
 * Call before creating a new storyboard project — enforces the
 * per-tier active-project cap.
 */
export async function checkProjectCreationAllowed(
  userId: string,
  tier: TierKey,
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const limit = getStoryboardTierLimits(tier).maxProjects;

  const [{ value: current }] = await db
    .select({ value: count() })
    .from(storyboardProjects)
    .where(eq(storyboardProjects.userId, userId));

  return { allowed: current < limit, limit, current };
}
