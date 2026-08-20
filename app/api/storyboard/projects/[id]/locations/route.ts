import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  storyboardLocations,
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

    // Verify project ownership
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

    const locations = await db
      .select()
      .from(storyboardLocations)
      .where(eq(storyboardLocations.projectId, projectId));

    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error("[GET Locations] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch locations" },
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

    // Verify project ownership
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
    const { name, description, lightingNotes, referenceImageUrl } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Location name is required" },
        { status: 400 },
      );
    }

    const [location] = await db
      .insert(storyboardLocations)
      .values({
        id: nanoid(),
        projectId,
        name: name.trim(),
        description: description?.trim() || null,
        lightingNotes: lightingNotes?.trim() || null,
        referenceImageUrl: referenceImageUrl || null,
      })
      .returning();

    return NextResponse.json({ location }, { status: 201 });
  } catch (error: any) {
    console.error("[POST Location] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create location" },
      { status: 500 },
    );
  }
}
