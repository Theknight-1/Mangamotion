import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardProjects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { headers } from "next/headers";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import { checkProjectCreationAllowed } from "@/lib/storyboard/usage";
import type { TierKey } from "@/lib/payment";
import type { StoryboardProject, ArtStyle, AspectRatio } from "@/types/storyboard";

function serialize(row: typeof storyboardProjects.$inferSelect): StoryboardProject {
  return {
    ...row,
    coverImage: row.coverImage ?? null,
    genre: row.genre ?? null,
    artStyle: (row.artStyle as ArtStyle) || "anime",
    aspectRatio: (row.aspectRatio as AspectRatio) || "16:9",
    status: row.status as StoryboardProject["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(storyboardProjects)
      .where(eq(storyboardProjects.userId, session.user.id))
      .orderBy(desc(storyboardProjects.updatedAt));

    return NextResponse.json({ projects: rows.map(serialize) });
  } catch (error) {
    console.error("[GET Storyboard Projects] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch storyboard projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      coverImage,
      genre,
      artStyle = "comic",
      aspectRatio = "16:9",
      scriptText,
    } = body as {
      title?: string;
      coverImage?: string;
      genre?: string;
      artStyle?: string;
      aspectRatio?: string;
      scriptText?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Tier gate: enforce max active storyboard projects per subscription tier.
    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;
    const projectCheck = await checkProjectCreationAllowed(session.user.id, tier);

    if (!projectCheck.allowed) {
      return NextResponse.json(
        {
          error: "Storyboard project limit reached for your plan. Please Upgrade your plan.",
          code: "STORYBOARD_PROJECT_LIMIT",
          limit: projectCheck.limit,
          current: projectCheck.current,
          tier,
        },
        { status: 403 },
      );
    }

    const [created] = await db
      .insert(storyboardProjects)
      .values({
        id: createId(),
        userId: session.user.id,
        title: title.trim(),
        coverImage: coverImage || null,
        genre: genre || null,
        artStyle: artStyle || "comic",
        aspectRatio: aspectRatio || "16:9",
        status: "draft",
        scriptText: scriptText || null,
      })
      .returning();

    return NextResponse.json({ project: serialize(created) }, { status: 201 });
  } catch (error) {
    console.error("[POST Storyboard Project] Error:", error);
    return NextResponse.json(
      { error: "Failed to create storyboard project" },
      { status: 500 },
    );
  }
}
