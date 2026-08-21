import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  storyboardShots,
  storyboardProjects,
  storyboardScenes,
  storyboardCharacters,
  storyboardLocations,
  storyboardObjects,
} from "@/lib/db/schema";
import { eq, and, lt, desc, isNotNull } from "drizzle-orm";
import { headers } from "next/headers";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import {
  guardGenerationQuota,
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

    const { id: shotId } = await params;

    const [shotRow] = await db
      .select({
        shot: storyboardShots,
        project: storyboardProjects,
      })
      .from(storyboardShots)
      .innerJoin(
        storyboardProjects,
        eq(storyboardShots.projectId, storyboardProjects.id),
      )
      .where(
        and(
          eq(storyboardShots.id, shotId),
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

    const { shot, project } = shotRow;

    // Check tier usage (regenerations consume the same monthly generation counter)
    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;
    const { errorResponse } = await guardGenerationQuota(session.user.id, tier);
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => ({}));
    const requestedModel = body?.model as string | undefined;
    const model = resolveAllowedModel(tier, requestedModel);

    let sceneTitle: string | null = null;
    let sceneDescription: string | null = null;
    if (shot.sceneId) {
      const [scene] = await db
        .select()
        .from(storyboardScenes)
        .where(eq(storyboardScenes.id, shot.sceneId))
        .limit(1);
      if (scene) {
        sceneTitle = scene.title;
        sceneDescription = scene.description;
      }
    }

    // Query preceding shot in the SAME scene (scene-scoped flow continuity)
    let previousShotImageUrl: string | null = null;
    if (shot.sceneId) {
      const [prevShot] = await db
        .select({ generatedImageUrl: storyboardShots.generatedImageUrl })
        .from(storyboardShots)
        .where(
          and(
            eq(storyboardShots.sceneId, shot.sceneId),
            eq(storyboardShots.projectId, project.id),
            lt(storyboardShots.orderIndex, shot.orderIndex),
            isNotNull(storyboardShots.generatedImageUrl),
          ),
        )
        .orderBy(desc(storyboardShots.orderIndex))
        .limit(1);

      if (prevShot?.generatedImageUrl) {
        previousShotImageUrl = prevShot.generatedImageUrl;
      }
    }

    const projectCharacters = await db
      .select()
      .from(storyboardCharacters)
      .where(eq(storyboardCharacters.projectId, project.id));

    const relevantCharacters = resolveRelevantCharacters(projectCharacters, {
      characterIds: shot.characterIds as string[] | null,
      description: shot.description,
      dialogue: shot.dialogue,
    });

    // Fetch project locations and objects
    const projectLocations = await db
      .select()
      .from(storyboardLocations)
      .where(eq(storyboardLocations.projectId, project.id));

    const projectObjects = await db
      .select()
      .from(storyboardObjects)
      .where(eq(storyboardObjects.projectId, project.id));

    await db
      .update(storyboardShots)
      .set({ generationStatus: "generating", updatedAt: new Date() })
      .where(eq(storyboardShots.id, shotId));

    try {
      const result = await generateShotImagePipeline({
        shotId,
        projectId: project.id,
        description: shot.description,
        sceneTitle,
        sceneDescription,
        currentShotImageUrl: shot.generatedImageUrl || null,
        previousShotImageUrl,
        isRegeneration: true,
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
        locations: projectLocations.map((l) => ({
          name: l.name,
          description: l.description,
          lightingNotes: l.lightingNotes,
        })),
        objects: projectObjects.map((o) => ({
          name: o.name,
          description: o.description,
          importance: o.importance ?? "recurring",
        })),
      });

      const [updatedShot] = await db
        .update(storyboardShots)
        .set({
          generatedImageUrl: result.imageUrl,
          characterIds: relevantCharacters.map((c) => c.id),
          generationStatus: "complete",
          modelUsed: result.modelUsed as any,
          regenerateCount: (shot.regenerateCount || 0) + 1,
          consistencyScore: result.consistencyScore,
          consistencyFlagged: result.consistencyFlagged,
          updatedAt: new Date(),
        })
        .where(eq(storyboardShots.id, shotId))
        .returning();

      await incrementGenerationUsage(session.user.id);

      return NextResponse.json({
        shot: updatedShot,
        consistencyScore: result.consistencyScore,
        consistencyFlagged: result.consistencyFlagged,
      });
    } catch (genError: any) {
      await db
        .update(storyboardShots)
        .set({ generationStatus: "failed", updatedAt: new Date() })
        .where(eq(storyboardShots.id, shotId));

      const isSafety =
        genError?.isSafetyFlag === true ||
        /safety|flagged|3030|moderation/i.test(genError?.message || "");

      return NextResponse.json(
        {
          error: genError.message || "Shot regeneration failed",
          code: isSafety ? "SAFETY_FILTER_FLAGGED" : "REGENERATION_FAILED",
          isSafetyFlag: isSafety,
        },
        { status: isSafety ? 422 : 500 },
      );
    }
  } catch (error: any) {
    console.error("[POST Regenerate Shot] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to regenerate shot" },
      { status: 500 },
    );
  }
}
