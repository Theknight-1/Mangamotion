import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardProjects, storyboardShots } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { headers } from "next/headers";
import type { StoryboardShot } from "@/types/storyboard";

interface Params {
  params: Promise<{ id: string }>;
}

function serialize(row: typeof storyboardShots.$inferSelect): StoryboardShot {
  return {
    ...row,
    characterIds: (row.characterIds as string[]) ?? [],
    orderIndex: row.orderIndex ?? row.order ?? 0,
    shotType: (row.shotType as StoryboardShot["shotType"]) ?? null,
    cameraAngle: (row.cameraAngle as StoryboardShot["cameraAngle"]) ?? null,
    perspective: (row.perspective as StoryboardShot["perspective"]) ?? null,
    movement: (row.movement as StoryboardShot["movement"]) ?? null,
    generationStatus: row.generationStatus as StoryboardShot["generationStatus"],
    modelUsed: (row.modelUsed as StoryboardShot["modelUsed"]) ?? null,
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
      return NextResponse.json(
        { error: "Storyboard project not found" },
        { status: 404 },
      );
    }

    const rows = await db
      .select()
      .from(storyboardShots)
      .where(eq(storyboardShots.projectId, id))
      .orderBy(asc(storyboardShots.orderIndex), asc(storyboardShots.order));

    return NextResponse.json({ shots: rows.map(serialize) });
  } catch (error) {
    console.error("[GET Storyboard Shots] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch storyboard shots" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
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
      return NextResponse.json(
        { error: "Storyboard project not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      sceneId,
      orderIndex,
      description = "",
      shotType,
      cameraAngle,
      perspective,
      movement,
      duration = 3,
      dialogue = "",
      characterIds = [],
    } = body;

    const [created] = await db
      .insert(storyboardShots)
      .values({
        id: createId(),
        projectId: id,
        sceneId: sceneId || null,
        orderIndex: typeof orderIndex === "number" ? orderIndex : 0,
        order: typeof orderIndex === "number" ? orderIndex : 0,
        description,
        shotType: shotType || "medium",
        cameraAngle: cameraAngle || "eye-level",
        perspective: perspective || "1-point",
        movement: movement || "static",
        duration: duration || 3,
        dialogue,
        characterIds,
        generationStatus: "pending",
      })
      .returning();

    return NextResponse.json({ shot: serialize(created) }, { status: 201 });
  } catch (error) {
    console.error("[POST Storyboard Shot] Error:", error);
    return NextResponse.json(
      { error: "Failed to create shot" },
      { status: 500 },
    );
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
    const { shotOrders } = body as {
      shotOrders: Array<{ id: string; orderIndex: number; sceneId?: string | null }>;
    };

    if (!Array.isArray(shotOrders)) {
      return NextResponse.json(
        { error: "shotOrders array is required" },
        { status: 400 },
      );
    }

    for (const item of shotOrders) {
      const updates: any = {
        orderIndex: item.orderIndex,
        order: item.orderIndex,
        updatedAt: new Date(),
      };
      if (item.sceneId !== undefined) {
        updates.sceneId = item.sceneId;
      }

      await db
        .update(storyboardShots)
        .set(updates)
        .where(
          and(
            eq(storyboardShots.id, item.id),
            eq(storyboardShots.projectId, id),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH Storyboard Shots Reorder] Error:", error);
    return NextResponse.json(
      { error: "Failed to reorder shots" },
      { status: 500 },
    );
  }
}
