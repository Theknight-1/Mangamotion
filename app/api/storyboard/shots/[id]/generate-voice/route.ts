import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardShots, storyboardProjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import {
  guardGenerationQuota,
  incrementGenerationUsage,
} from "@/lib/storyboard/usage";
import { generateSceneVoiceAudio } from "@/lib/storyboard/ai/voice";
import type { TierKey } from "@/lib/payment";
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

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [shotRow] = await db
      .select({
        id: storyboardShots.id,
        projectId: storyboardShots.projectId,
        sceneId: storyboardShots.sceneId,
        dialogue: storyboardShots.dialogue,
        draftNarration: storyboardShots.draftNarration,
        description: storyboardShots.description,
        userId: storyboardProjects.userId,
      })
      .from(storyboardShots)
      .innerJoin(
        storyboardProjects,
        eq(storyboardShots.projectId, storyboardProjects.id),
      )
      .where(
        and(
          eq(storyboardShots.id, id),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!shotRow) {
      return NextResponse.json(
        { error: "Shot not found or unauthorized" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const textToSpeak =
      body.text ||
      shotRow.dialogue ||
      shotRow.draftNarration ||
      shotRow.description;
    const voiceId = body.voiceId || "a8ea5c09-58bd-40ec-aece-2ffa6b862685";
    const speed = body.speed || 1.0;

    if (!textToSpeak?.trim()) {
      return NextResponse.json(
        { error: "Shot has no dialogue, narration, or description text" },
        { status: 400 },
      );
    }

    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;

    const { errorResponse } = await guardGenerationQuota(session.user.id, tier);
    if (errorResponse) return errorResponse;

    const { audioUrl, duration } = await generateSceneVoiceAudio({
      sceneId: shotRow.sceneId || "",
      projectId: shotRow.projectId,
      narrationText: textToSpeak.trim(),
      voiceId,
      speed,
    });

    // Update shot record with voice audio and duration
    const [updated] = await db
      .update(storyboardShots)
      .set({
        voiceAudioUrl: audioUrl,
        duration: duration,
        estDuration: duration,
        updatedAt: new Date(),
      })
      .where(eq(storyboardShots.id, id))
      .returning();

    // Increment usage quota only on success
    await incrementGenerationUsage(session.user.id);

    return NextResponse.json({
      success: true,
      audioUrl,
      duration,
      shot: serialize(updated),
    });
  } catch (error: any) {
    console.error("[generate-shot-voice] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate shot voice audio" },
      { status: 500 },
    );
  }
}
