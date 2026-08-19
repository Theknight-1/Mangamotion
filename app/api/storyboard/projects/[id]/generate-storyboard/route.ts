import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  storyboardProjects,
  storyboardShots,
  storyboardScenes,
  storyboardCharacters,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import {
  checkGenerationAllowed,
  incrementGenerationUsage,
  resolveAllowedModel,
} from "@/lib/storyboard/usage";
import {
  generateShotImagePipeline,
  resolveRelevantCharacters,
} from "@/lib/storyboard/ai/shot-gen";
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

    const { id: projectId } = await params;

    const [project] = await db
      .select()
      .from(storyboardProjects)
      .where(
        and(
          eq(storyboardProjects.id, projectId),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Storyboard project not found" },
        { status: 404 },
      );
    }

    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;

    const body = await request.json().catch(() => ({}));
    const requestedModel = body?.model as string | undefined;
    const model = resolveAllowedModel(tier, requestedModel);

    // Fetch all shots for this project
    const shots = await db
      .select()
      .from(storyboardShots)
      .where(eq(storyboardShots.projectId, projectId))
      .orderBy(asc(storyboardShots.orderIndex), asc(storyboardShots.order));

    // Filter only shots that have not been generated yet
    const shotsToGenerate = shots.filter(
      (s) => !s.generatedImageUrl || s.generationStatus !== "complete",
    );

    if (shotsToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All shots are already generated",
        results: [],
        completed: 0,
        failed: 0,
        alreadyComplete: true,
      });
    }

    const scenes = await db
      .select()
      .from(storyboardScenes)
      .where(eq(storyboardScenes.projectId, projectId));
    const sceneMap = new Map(scenes.map((s) => [s.id, s]));

    const characters = await db
      .select()
      .from(storyboardCharacters)
      .where(eq(storyboardCharacters.projectId, projectId));

    // Update status to generating
    await db
      .update(storyboardProjects)
      .set({ status: "generating", updatedAt: new Date() })
      .where(eq(storyboardProjects.id, projectId));

    // Track latest generated frame per scene to provide frame-to-frame flow continuity within each scene
    const lastGeneratedImagePerScene = new Map<string, string>();
    for (const s of shots) {
      if (s.sceneId && s.generatedImageUrl && s.generationStatus === "complete") {
        lastGeneratedImagePerScene.set(s.sceneId, s.generatedImageUrl);
      }
    }

    const results = [];

    for (const shot of shotsToGenerate) {
      // Check quota before each generation
      const quotaCheck = await checkGenerationAllowed(session.user.id, tier);
      if (!quotaCheck.allowed) {
        results.push({
          shotId: shot.id,
          status: "failed",
          error: "Monthly generation limit reached",
        });
        break; // Stop when limit is reached
      }

      const parentScene = shot.sceneId ? sceneMap.get(shot.sceneId) : null;
      const previousShotImageUrl = shot.sceneId
        ? lastGeneratedImagePerScene.get(shot.sceneId) || null
        : null;

      const relevantCharacters = resolveRelevantCharacters(characters, {
        characterIds: shot.characterIds as string[] | null,
        description: shot.description,
        dialogue: shot.dialogue,
      });

      try {
        const result = await generateShotImagePipeline({
          shotId: shot.id,
          projectId,
          description: shot.description,
          sceneTitle: parentScene?.title,
          sceneDescription: parentScene?.description,
          previousShotImageUrl,
          shotType: shot.shotType,
          cameraAngle: shot.cameraAngle,
          perspective: shot.perspective,
          movement: shot.movement,
          dialogue: shot.dialogue,
          artStyle: project.artStyle,
          aspectRatio: project.aspectRatio,
          model,
          characters: relevantCharacters.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            clothing: c.clothing,
            consistencyNotes: c.consistencyNotes,
            approvedSheetUrl: c.approvedSheetUrl,
            pendingSheetUrl: c.pendingSheetUrl,
            referenceImageUrls: (c.referenceImageUrls as string[]) || [],
          })),
        });

        await db
          .update(storyboardShots)
          .set({
            generatedImageUrl: result.imageUrl,
            generationStatus: "complete",
            modelUsed: result.modelUsed as any,
            consistencyScore: result.consistencyScore,
            consistencyFlagged: result.consistencyFlagged,
            updatedAt: new Date(),
          })
          .where(eq(storyboardShots.id, shot.id));

        // Update scene anchor frame for subsequent shots in the same scene
        if (shot.sceneId) {
          lastGeneratedImagePerScene.set(shot.sceneId, result.imageUrl);
        }

        await incrementGenerationUsage(session.user.id);
        results.push({ shotId: shot.id, status: "complete", url: result.imageUrl });
      } catch (err: any) {
        console.error(`[generate-storyboard] Shot ${shot.id} failed:`, err);
        await db
          .update(storyboardShots)
          .set({ generationStatus: "failed", updatedAt: new Date() })
          .where(eq(storyboardShots.id, shot.id));
        results.push({ shotId: shot.id, status: "failed", error: err.message });
      }
    }

    await db
      .update(storyboardProjects)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(storyboardProjects.id, projectId));

    const completedCount = results.filter((r) => r.status === "complete").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      success: completedCount > 0 || shotsToGenerate.length === 0,
      results,
      total: shotsToGenerate.length,
      completed: completedCount,
      failed: failedCount,
    });
  } catch (error: any) {
    console.error("[generate-storyboard] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate storyboard" },
      { status: 500 },
    );
  }
}
