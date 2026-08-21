import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardCharacters, storyboardProjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import {
  guardGenerationQuota,
  incrementGenerationUsage,
  resolveAllowedModel,
} from "@/lib/storyboard/usage";
import {
  generateStoryboardImage,
  ImageGenerationError,
} from "@/lib/storyboard/image-generation";
import { buildCharacterTurnaroundPrompt } from "@/lib/storyboard/ai/character-sheet";
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

    const { id: characterId } = await params;

    const [row] = await db
      .select({
        character: storyboardCharacters,
        project: storyboardProjects,
      })
      .from(storyboardCharacters)
      .innerJoin(
        storyboardProjects,
        eq(storyboardCharacters.projectId, storyboardProjects.id),
      )
      .where(
        and(
          eq(storyboardCharacters.id, characterId),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "Character not found or unauthorized" },
        { status: 404 },
      );
    }

    const { character, project } = row;

    // Tier gate
    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;
    const { errorResponse } = await guardGenerationQuota(session.user.id, tier);
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => ({}));
    const requestedModel = body?.model as string | undefined;
    const model = resolveAllowedModel(tier, requestedModel);

    const prompt = buildCharacterTurnaroundPrompt({
      name: character.name,
      description: character.description,
      clothing: character.clothing,
      consistencyNotes: character.consistencyNotes,
      artStyle: project.artStyle,
    });

    let result;
    try {
      result = await generateStoryboardImage(model, {
        prompt,
        referenceImageUrls: character.referenceImageUrls as string[] | undefined,
        aspectRatio: "16:9",
      });
    } catch (error) {
      if (error instanceof ImageGenerationError) {
        console.error(`[generate-sheet] ${error.provider} failed:`, error.message);
        return NextResponse.json(
          { error: `Image generation failed: ${error.message}` },
          { status: 502 },
        );
      }
      throw error;
    }

    const ext = result.contentType.includes("png") ? "png" : "jpg";
    const blobPath = `storyboard/${session.user.id}/characters/${character.id}-${Date.now()}.${ext}`;
    const blob = await put(blobPath, result.imageBuffer, {
      access: "public",
      contentType: result.contentType,
      addRandomSuffix: false,
    });

    // Save as pendingSheetUrl (approval is a separate user action)
    const [updated] = await db
      .update(storyboardCharacters)
      .set({
        pendingSheetUrl: blob.url,
        updatedAt: new Date(),
      })
      .where(eq(storyboardCharacters.id, characterId))
      .returning();

    await incrementGenerationUsage(session.user.id);

    return NextResponse.json({
      character: updated,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error("[POST Generate Character Sheet] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate character sheet" },
      { status: 500 },
    );
  }
}
