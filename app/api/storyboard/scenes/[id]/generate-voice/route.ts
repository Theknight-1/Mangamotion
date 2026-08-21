import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardScenes, storyboardProjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import {
  guardGenerationQuota,
  incrementGenerationUsage,
} from "@/lib/storyboard/usage";
import { generateSceneVoiceAudio } from "@/lib/storyboard/ai/voice";
import type { TierKey } from "@/lib/payment";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [scene] = await db
      .select({
        id: storyboardScenes.id,
        projectId: storyboardScenes.projectId,
        title: storyboardScenes.title,
        narrationText: storyboardScenes.narrationText,
        userId: storyboardProjects.userId,
      })
      .from(storyboardScenes)
      .innerJoin(
        storyboardProjects,
        eq(storyboardScenes.projectId, storyboardProjects.id),
      )
      .where(
        and(
          eq(storyboardScenes.id, id),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!scene) {
      return NextResponse.json(
        { error: "Scene not found or unauthorized" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const narrationText = body.narrationText || scene.narrationText;
    const voiceId = body.voiceId || "en-US-1";
    const speed = body.speed || 1.0;

    if (!narrationText?.trim()) {
      return NextResponse.json(
        { error: "Narration text is required for voice generation" },
        { status: 400 },
      );
    }

    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;

    const { errorResponse } = await guardGenerationQuota(session.user.id, tier);
    if (errorResponse) return errorResponse;

    const { audioUrl, duration } = await generateSceneVoiceAudio({
      sceneId: id,
      projectId: scene.projectId,
      narrationText,
      voiceId,
      speed,
    });
    

    // Update scene record
    const [updated] = await db
      .update(storyboardScenes)
      .set({
        voiceAudioUrl: audioUrl,
        durationEstimate: duration,
        narrationText,
        updatedAt: new Date(),
      })
      .where(eq(storyboardScenes.id, id))
      .returning();

    // Increment usage quota only on success
    await incrementGenerationUsage(session.user.id);

    return NextResponse.json({
      success: true,
      audioUrl,
      duration,
      scene: updated,
    });
  } catch (error: any) {
    console.error("[generate-voice] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate voice audio" },
      { status: 500 },
    );
  }
}
