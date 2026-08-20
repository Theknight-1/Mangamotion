import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  storyboardObjects,
  storyboardProjects,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const [project] = await db
      .select({ id: storyboardProjects.id })
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
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const objects = await db
      .select()
      .from(storyboardObjects)
      .where(eq(storyboardObjects.projectId, projectId));

    return NextResponse.json({ objects });
  } catch (error: any) {
    console.error("[GET Objects] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch objects" },
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

    const { id: projectId } = await params;

    const [project] = await db
      .select({ id: storyboardProjects.id })
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
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, description, importance, referenceImageUrl } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Object name is required" },
        { status: 400 },
      );
    }

    const validImportance = ["key_prop", "recurring", "background"].includes(
      importance,
    )
      ? importance
      : "recurring";

    const [object] = await db
      .insert(storyboardObjects)
      .values({
        id: nanoid(),
        projectId,
        name: name.trim(),
        description: description?.trim() || null,
        importance: validImportance,
        referenceImageUrl: referenceImageUrl || null,
      })
      .returning();

    return NextResponse.json({ object }, { status: 201 });
  } catch (error: any) {
    console.error("[POST Object] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create object" },
      { status: 500 },
    );
  }
}
