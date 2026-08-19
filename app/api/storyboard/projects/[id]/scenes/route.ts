import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardProjects, storyboardScenes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { headers } from "next/headers";
import type { StoryboardScene } from "@/types/storyboard";

interface Params {
  params: Promise<{ id: string }>;
}

function serializeScene(row: typeof storyboardScenes.$inferSelect): StoryboardScene {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [project] = await db
      .select({ id: storyboardProjects.id })
      .from(storyboardProjects)
      .where(
        and(
          eq(storyboardProjects.id, id),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const rows = await db
      .select()
      .from(storyboardScenes)
      .where(eq(storyboardScenes.projectId, id))
      .orderBy(asc(storyboardScenes.orderIndex));

    return NextResponse.json({ scenes: rows.map(serializeScene) });
  } catch (error) {
    console.error("[GET Scenes] Error:", error);
    return NextResponse.json({ error: "Failed to fetch scenes" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, narrationText, durationEstimate, orderIndex } = body;

    const [created] = await db
      .insert(storyboardScenes)
      .values({
        id: createId(),
        projectId: id,
        orderIndex: typeof orderIndex === "number" ? orderIndex : 0,
        title: title || "New Scene",
        description: description || "",
        narrationText: narrationText || "",
        durationEstimate: durationEstimate || 5,
      })
      .returning();

    return NextResponse.json({ scene: serializeScene(created) }, { status: 201 });
  } catch (error) {
    console.error("[POST Scene] Error:", error);
    return NextResponse.json({ error: "Failed to create scene" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { sceneOrders } = body as {
      sceneOrders: Array<{ id: string; orderIndex: number }>;
    };

    if (!Array.isArray(sceneOrders)) {
      return NextResponse.json(
        { error: "sceneOrders array required" },
        { status: 400 },
      );
    }

    // Update orderIndex for each scene in batch
    for (const item of sceneOrders) {
      await db
        .update(storyboardScenes)
        .set({
          orderIndex: item.orderIndex,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(storyboardScenes.id, item.id),
            eq(storyboardScenes.projectId, id),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH Scenes Reorder] Error:", error);
    return NextResponse.json({ error: "Failed to reorder scenes" }, { status: 500 });
  }
}
