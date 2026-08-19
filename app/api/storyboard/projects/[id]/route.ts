import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardProjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import type { StoryboardProject, ArtStyle, AspectRatio } from "@/types/storyboard";

interface Params {
  params: Promise<{ id: string }>;
}

function serialize(row: typeof storyboardProjects.$inferSelect): StoryboardProject {
  return {
    ...row,
    coverImage: row.coverImage ?? null,
    genre: row.genre ?? null,
    artStyle: (row.artStyle as ArtStyle) || "comic",
    aspectRatio: (row.aspectRatio as AspectRatio) || "16:9",
    status: row.status as StoryboardProject["status"],
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

    const [row] = await db
      .select()
      .from(storyboardProjects)
      .where(
        and(
          eq(storyboardProjects.id, id),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "Storyboard project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ project: serialize(row) });
  } catch (error) {
    console.error("[GET Storyboard Project] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch storyboard project" },
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
    const { title, coverImage, genre, artStyle, aspectRatio, status, scriptText } = body as {
      title?: string;
      coverImage?: string | null;
      genre?: string;
      artStyle?: string;
      aspectRatio?: string;
      status?: string;
      scriptText?: string;
    };

    const updates: Partial<typeof storyboardProjects.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (title !== undefined) updates.title = title;
    if (coverImage !== undefined) updates.coverImage = coverImage;
    if (genre !== undefined) updates.genre = genre;
    if (artStyle !== undefined) updates.artStyle = artStyle;
    if (aspectRatio !== undefined) updates.aspectRatio = aspectRatio;
    if (status !== undefined) updates.status = status;
    if (scriptText !== undefined) updates.scriptText = scriptText;

    const [updated] = await db
      .update(storyboardProjects)
      .set(updates)
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

    return NextResponse.json({ project: serialize(updated) });
  } catch (error) {
    console.error("[PATCH Storyboard Project] Error:", error);
    return NextResponse.json(
      { error: "Failed to update storyboard project" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const deleted = await db
      .delete(storyboardProjects)
      .where(
        and(
          eq(storyboardProjects.id, id),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Storyboard project not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE Storyboard Project] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete storyboard project" },
      { status: 500 },
    );
  }
}
