import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  storyboardProjects,
  storyboardShots,
  storyboardScenes,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { generateStoryboardSlideshowVideo } from "@/lib/storyboard/export/slideshow";

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

    const shots = await db
      .select()
      .from(storyboardShots)
      .where(eq(storyboardShots.projectId, projectId))
      .orderBy(asc(storyboardShots.orderIndex), asc(storyboardShots.order));

    const scenes = await db
      .select()
      .from(storyboardScenes)
      .where(eq(storyboardScenes.projectId, projectId));
    const sceneMap = new Map(scenes.map((s) => [s.id, s]));

    const slideshowShots = shots.map((s) => {
      const scene = s.sceneId ? sceneMap.get(s.sceneId) : null;
      return {
        orderIndex: s.orderIndex ?? s.order ?? 0,
        imageUrl: s.generatedImageUrl,
        duration: s.duration,
        voiceAudioUrl: scene?.voiceAudioUrl,
      };
    });

    const result = await generateStoryboardSlideshowVideo({
      projectId,
      shots: slideshowShots,
      aspectRatio: project.aspectRatio,
    });

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      duration: result.duration,
    });
  } catch (error: any) {
    console.error("[export/slideshow] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate slideshow video" },
      { status: 500 },
    );
  }
}
