import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  storyboardProjects,
  storyboardScenes,
  storyboardShots,
  storyboardCharacters,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { headers } from "next/headers";
import { generateSceneBreakdown } from "@/lib/storyboard/ai/breakdown";

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

    const [project] = await db
      .select()
      .from(storyboardProjects)
      .where(
        and(
          eq(storyboardProjects.id, id),
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

    const body = await request.json().catch(() => ({}));
    const scriptText = body.scriptText || project.scriptText;
    const genre = body.genre || project.genre || "Action";

    if (!scriptText?.trim()) {
      return NextResponse.json(
        { error: "Script text is required to generate breakdown" },
        { status: 400 },
      );
    }

    const breakdown = await generateSceneBreakdown({
      scriptText,
      genre,
      title: project.title,
    });

    // Delete existing scenes/shots for fresh generation
    await db.delete(storyboardShots).where(eq(storyboardShots.projectId, id));
    await db.delete(storyboardScenes).where(eq(storyboardScenes.projectId, id));

    // Also insert detected characters if none exist yet
    const existingCharacters = await db
      .select()
      .from(storyboardCharacters)
      .where(eq(storyboardCharacters.projectId, id));

    const characterNameToId = new Map<string, string>();
    for (const c of existingCharacters) {
      characterNameToId.set(c.name.toLowerCase().trim(), c.id);
    }

    if (existingCharacters.length === 0 && breakdown.characters?.length) {
      for (const charData of breakdown.characters) {
        const charId = createId();
        await db.insert(storyboardCharacters).values({
          id: charId,
          projectId: id,
          name: charData.name,
          description: charData.description,
          clothing: charData.clothing,
          consistencyNotes: charData.consistencyNotes,
          referenceImageUrls: [],
          conditioningMode: "description",
        });
        characterNameToId.set(charData.name.toLowerCase().trim(), charId);
      }
    }

    // Insert scenes and shots
    const createdScenes = [];
    const createdShots = [];

    for (let sceneIdx = 0; sceneIdx < breakdown.scenes.length; sceneIdx++) {
      const sceneData = breakdown.scenes[sceneIdx];
      const sceneId = createId();

      const [scene] = await db
        .insert(storyboardScenes)
        .values({
          id: sceneId,
          projectId: id,
          orderIndex: sceneIdx,
          title: sceneData.title || `Scene ${sceneIdx + 1}`,
          description: sceneData.description || "",
          narrationText: sceneData.narrationText || "",
          durationEstimate: sceneData.durationEstimate || 5,
        })
        .returning();

      createdScenes.push(scene);

      for (let shotIdx = 0; shotIdx < (sceneData.shots || []).length; shotIdx++) {
        const shotData = sceneData.shots[shotIdx];
        const shotId = createId();

        // Resolve character IDs
        const matchedCharIds: string[] = [];
        for (const name of shotData.characterNames || []) {
          const matched = characterNameToId.get(name.toLowerCase().trim());
          if (matched) matchedCharIds.push(matched);
        }

        const [shot] = await db
          .insert(storyboardShots)
          .values({
            id: shotId,
            projectId: id,
            sceneId: sceneId,
            orderIndex: shotIdx,
            order: shotIdx,
            description: shotData.description || "Storyboard shot description",
            shotType: shotData.shotType || "medium",
            cameraAngle: shotData.cameraAngle || "eye-level",
            perspective: shotData.perspective || "1-point",
            movement: shotData.movement || "static",
            duration: shotData.duration || 3,
            dialogue: shotData.dialogue || "",
            characterIds: matchedCharIds,
            generationStatus: "pending",
          })
          .returning();

        createdShots.push(shot);
      }
    }

    // Update project title & status
    await db
      .update(storyboardProjects)
      .set({
        title: breakdown.title || project.title,
        status: "breakdown_ready",
        updatedAt: new Date(),
      })
      .where(eq(storyboardProjects.id, id));

    return NextResponse.json({
      breakdown,
      scenes: createdScenes,
      shots: createdShots,
    });
  } catch (error: any) {
    console.error("[generate-breakdown] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate scene breakdown" },
      { status: 500 },
    );
  }
}
