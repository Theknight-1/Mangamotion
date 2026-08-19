import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardScenes, storyboardProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { StoryboardScene } from "@/types/storyboard";

interface Params {
  params: Promise<{ id: string }>;
}

function serializeScene(row: typeof storyboardScenes.$inferSelect): StoryboardScene {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, narrationText, durationEstimate, voiceAudioUrl } = body;

    const updates: Partial<typeof storyboardScenes.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (narrationText !== undefined) updates.narrationText = narrationText;
    if (durationEstimate !== undefined) updates.durationEstimate = durationEstimate;
    if (voiceAudioUrl !== undefined) updates.voiceAudioUrl = voiceAudioUrl;

    const [updated] = await db
      .update(storyboardScenes)
      .set(updates)
      .where(eq(storyboardScenes.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    return NextResponse.json({ scene: serializeScene(updated) });
  } catch (error) {
    console.error("[PATCH Scene] Error:", error);
    return NextResponse.json({ error: "Failed to update scene" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const deleted = await db
      .delete(storyboardScenes)
      .where(eq(storyboardScenes.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE Scene] Error:", error);
    return NextResponse.json({ error: "Failed to delete scene" }, { status: 500 });
  }
}
