import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardProjects } from "@/lib/db/schema";
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
import type { TierKey } from "@/lib/payment";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      scriptText,
      genre,
      artStyle = "cinematic",
      aspectRatio = "16:9",
      customPrompt,
      projectId,
      model: requestedModel,
    } = body as {
      title?: string;
      scriptText?: string;
      genre?: string;
      artStyle?: string;
      aspectRatio?: string;
      customPrompt?: string;
      projectId?: string;
      model?: string;
    };

    if (!title?.trim() && !scriptText?.trim() && !customPrompt?.trim()) {
      return NextResponse.json(
        { error: "Title or story text is required to generate a cover" },
        { status: 400 },
      );
    }

    // Tier usage gate
    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;
    const { errorResponse } = await guardGenerationQuota(session.user.id, tier);
    if (errorResponse) return errorResponse;

    const model = resolveAllowedModel(tier, requestedModel);

    // Build evocative cinematic cover prompt
    const promptParts = [
      `${artStyle}-style cinematic storyboard poster artwork for "${(title || "Storyboard").trim()}".`,
      genre ? `Genre: ${genre}.` : "",
      scriptText ? `Story concept: ${scriptText.slice(0, 400).trim()}.` : "",
      customPrompt ? customPrompt.trim() : "",
      "Dramatic key visual, master cinematic lighting, rich composition, stunning atmosphere, full-bleed artwork, no title typography, no text, no letters, no logos, no watermarks, no panel borders.",
    ].filter(Boolean);

    const prompt = promptParts.join(" ");

    let result;
    try {
      result = await generateStoryboardImage(model, {
        prompt,
        aspectRatio: (aspectRatio as any) || "16:9",
      });
    } catch (genError: any) {
      if (genError instanceof ImageGenerationError) {
        console.error(`[generate-cover] ${genError.provider} error:`, genError.message);
        return NextResponse.json(
          { error: `Cover generation failed: ${genError.message}` },
          { status: 500 },
        );
      }
      throw genError;
    }

    // Save image to Vercel Blob
    const filename = `storyboard/covers/${session.user.id}/${Date.now()}.png`;
    const blob = await put(filename, result.imageBuffer, {
      access: "public",
      contentType: result.contentType,
    });

    // Increment monthly generation usage
    await incrementGenerationUsage(session.user.id);

    // If projectId provided, update the project in DB
    if (projectId) {
      await db
        .update(storyboardProjects)
        .set({
          coverImage: blob.url,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(storyboardProjects.id, projectId),
            eq(storyboardProjects.userId, session.user.id),
          ),
        );
    }

    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
    });
  } catch (error: any) {
    console.error("[generate-cover] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate cover image" },
      { status: 500 },
    );
  }
}
