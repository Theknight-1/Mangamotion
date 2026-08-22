import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardShots, storyboardProjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import type { StoryboardShot } from "@/types/storyboard";

interface Params {
  params: Promise<{ id: string }>;
}

function serialize(row: typeof storyboardShots.$inferSelect): StoryboardShot {
  return {
    ...row,
    characterIds: (row.characterIds as string[]) ?? [],
    orderIndex: row.orderIndex ?? row.order ?? 0,
    shotType: (row.shotType as StoryboardShot["shotType"]) ?? null,
    cameraAngle: (row.cameraAngle as StoryboardShot["cameraAngle"]) ?? null,
    perspective: (row.perspective as StoryboardShot["perspective"]) ?? null,
    movement: (row.movement as StoryboardShot["movement"]) ?? null,
    generationStatus: row.generationStatus as StoryboardShot["generationStatus"],
    modelUsed: (row.modelUsed as StoryboardShot["modelUsed"]) ?? null,
    voiceAudioUrl: row.voiceAudioUrl ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function findOwnedShot(shotId: string, userId: string) {
  const [row] = await db
    .select({ shot: storyboardShots })
    .from(storyboardShots)
    .innerJoin(
      storyboardProjects,
      eq(storyboardShots.projectId, storyboardProjects.id),
    )
    .where(
      and(
        eq(storyboardShots.id, shotId),
        eq(storyboardProjects.userId, userId),
      ),
    )
    .limit(1);
  return row?.shot;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await findOwnedShot(id, session.user.id);
    if (!existing) {
      return NextResponse.json(
        { error: "Shot not found or unauthorized" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      description,
      shotType,
      cameraAngle,
      perspective,
      movement,
      duration,
      dialogue,
      characterIds,
      sceneId,
      draftNarration,
      estDuration,
      voiceAudioUrl,
    } = body;

    const updates: Partial<typeof storyboardShots.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (description !== undefined) updates.description = description;
    if (shotType !== undefined) updates.shotType = shotType;
    if (cameraAngle !== undefined) updates.cameraAngle = cameraAngle;
    if (perspective !== undefined) updates.perspective = perspective;
    if (movement !== undefined) updates.movement = movement;
    if (duration !== undefined) updates.duration = duration;
    if (dialogue !== undefined) updates.dialogue = dialogue;
    if (characterIds !== undefined) updates.characterIds = characterIds;
    if (sceneId !== undefined) updates.sceneId = sceneId;
    if (draftNarration !== undefined) updates.draftNarration = draftNarration;
    if (estDuration !== undefined) updates.estDuration = estDuration;
    if (voiceAudioUrl !== undefined) updates.voiceAudioUrl = voiceAudioUrl;

    const [updated] = await db
      .update(storyboardShots)
      .set(updates)
      .where(eq(storyboardShots.id, id))
      .returning();

    return NextResponse.json({ shot: serialize(updated) });
  } catch (error) {
    console.error("[PATCH Storyboard Shot] Error:", error);
    return NextResponse.json(
      { error: "Failed to update shot" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await findOwnedShot(id, session.user.id);
    if (!existing) {
      return NextResponse.json(
        { error: "Shot not found or unauthorized" },
        { status: 404 },
      );
    }

    await db.delete(storyboardShots).where(eq(storyboardShots.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE Storyboard Shot] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete shot" },
      { status: 500 },
    );
  }
}
