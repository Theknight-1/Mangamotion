import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardProjects, storyboardCharacters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { headers } from "next/headers";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import { getStoryboardTierLimits } from "@/lib/storyboard/usage";
import type { TierKey } from "@/lib/payment";
import type { StoryboardCharacter, ConditioningMode } from "@/types/storyboard";

interface Params {
  params: Promise<{ id: string }>;
}

function serialize(row: typeof storyboardCharacters.$inferSelect): StoryboardCharacter {
  return {
    ...row,
    clothing: row.clothing ?? null,
    consistencyNotes: row.consistencyNotes ?? null,
    referenceImageUrls: (row.referenceImageUrls as string[]) || [],
    conditioningMode: (row.conditioningMode as ConditioningMode) || "description",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [project] = await db
      .select({ id: storyboardProjects.id })
      .from(storyboardProjects)
      .where(
        and(
          eq(storyboardProjects.id, id),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const rows = await db
      .select()
      .from(storyboardCharacters)
      .where(eq(storyboardCharacters.projectId, id))
      .orderBy(storyboardCharacters.createdAt);

    return NextResponse.json({ characters: rows.map(serialize) });
  } catch (error) {
    console.error("[GET Characters] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [project] = await db
      .select({ id: storyboardProjects.id })
      .from(storyboardProjects)
      .where(
        and(
          eq(storyboardProjects.id, id),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;
    const limits = getStoryboardTierLimits(tier);

    const existing = await db
      .select()
      .from(storyboardCharacters)
      .where(eq(storyboardCharacters.projectId, id));

    if (existing.length >= limits.maxCharactersPerProject) {
      return NextResponse.json(
        {
          error: `Character limit reached for your plan (${limits.maxCharactersPerProject} characters max). Upgrade to add more characters.`,
          code: "CHARACTER_LIMIT_REACHED",
          limit: limits.maxCharactersPerProject,
          tier,
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      clothing,
      consistencyNotes,
      referenceImageUrls = [],
      conditioningMode = "description",
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Character name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(storyboardCharacters)
      .values({
        id: createId(),
        projectId: id,
        name: name.trim(),
        description: description || "",
        clothing: clothing || "",
        consistencyNotes: consistencyNotes || "",
        referenceImageUrls,
        conditioningMode,
      })
      .returning();

    return NextResponse.json({ character: serialize(created) }, { status: 201 });
  } catch (error) {
    console.error("[POST Character] Error:", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 },
    );
  }
}
