import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  storyboardProjects,
  storyboardShots,
  storyboardScenes,
  videos,
  projects,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { headers } from "next/headers";
import { mapStoryboardToRenderScenes } from "@/lib/storyboard/export/render-mapper";

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

    const [storyboardProj] = await db
      .select()
      .from(storyboardProjects)
      .where(
        and(
          eq(storyboardProjects.id, projectId),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!storyboardProj) {
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

    const renderScenes = mapStoryboardToRenderScenes({
      shots: shots as any,
      scenes: scenes as any,
      genre: storyboardProj.genre,
    });

    if (!renderScenes.length) {
      return NextResponse.json(
        { error: "No rendered shot images found to export as animated video" },
        { status: 400 },
      );
    }

    // Check if user has an existing Manga Recap project or create an isolated one for handoff
    let [mangaProject] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.userId, session.user.id),
          eq(projects.title, storyboardProj.title),
        ),
      )
      .limit(1);

    if (!mangaProject) {
      const [newProj] = await db
        .insert(projects)
        .values({
          id: createId(),
          userId: session.user.id,
          title: storyboardProj.title,
          description: `Imported from Storyboarder AI Studio (${storyboardProj.genre || "Standard"})`,
          isOriginalContent: true,
          contentPurpose: "original",
          language: "en",
        })
        .returning();
      mangaProject = newProj;
    }

    const videoId = createId();
    const [createdVideo] = await db
      .insert(videos)
      .values({
        id: videoId,
        projectId: mangaProject.id,
        userId: session.user.id,
        title: storyboardProj.title,
        description: `Storyboard render: ${storyboardProj.title}`,
        sourceImage: renderScenes[0].imageUrl,
        aspectRatio: storyboardProj.aspectRatio as any,
        timeline: JSON.stringify(renderScenes),
        status: "draft",
        duration: renderScenes.reduce((acc, s) => acc + (s.voice?.duration || 3), 0),
      })
      .returning();

    return NextResponse.json({
      success: true,
      videoId: createdVideo.id,
      editorUrl: `/editor/${createdVideo.id}`,
      sceneCount: renderScenes.length,
    });
  } catch (error: any) {
    console.error("[export/render] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create animated render job" },
      { status: 500 },
    );
  }
}
