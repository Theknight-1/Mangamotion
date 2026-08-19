import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardProjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { genre } = body as { genre?: string };

    if (!genre) {
      return NextResponse.json({ error: "Genre is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(storyboardProjects)
      .set({
        genre,
        status: "breakdown_ready",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(storyboardProjects.id, id),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Storyboard project not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("[PATCH Genre] Error:", error);
    return NextResponse.json(
      { error: "Failed to update project genre" },
      { status: 500 },
    );
  }
}
