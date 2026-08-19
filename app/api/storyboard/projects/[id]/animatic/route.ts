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

    const timeline = shots.map((shot) => {
      const parentScene = shot.sceneId ? sceneMap.get(shot.sceneId) : null;
      return {
        id: shot.id,
        imageUrl: shot.generatedImageUrl,
        duration: shot.duration || parentScene?.durationEstimate || 3,
        description: shot.description,
        dialogue: shot.dialogue,
        movement: shot.movement,
        voiceAudioUrl: parentScene?.voiceAudioUrl,
        sceneTitle: parentScene?.title,
      };
    });

    await db
      .update(storyboardProjects)
      .set({ animaticStatus: "ready", updatedAt: new Date() })
      .where(eq(storyboardProjects.id, projectId));

    return NextResponse.json({
      success: true,
      timeline,
    });
  } catch (error: any) {
    console.error("[animatic] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate animatic" },
      { status: 500 },
    );
  }
}
