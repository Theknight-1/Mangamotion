import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardCharacters, storyboardProjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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

    const { id: characterId } = await params;

    const [row] = await db
      .select({
        character: storyboardCharacters,
      })
      .from(storyboardCharacters)
      .innerJoin(
        storyboardProjects,
        eq(storyboardCharacters.projectId, storyboardProjects.id),
      )
      .where(
        and(
          eq(storyboardCharacters.id, characterId),
          eq(storyboardProjects.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "Character not found or unauthorized" },
        { status: 404 },
      );
    }

    const { character } = row;
    const body = await request.json().catch(() => ({}));
    const sheetUrlToApprove =
      body?.approvedSheetUrl || character.pendingSheetUrl;

    if (!sheetUrlToApprove) {
      return NextResponse.json(
        { error: "No pending sheet URL available to approve" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(storyboardCharacters)
      .set({
        approvedSheetUrl: sheetUrlToApprove,
        updatedAt: new Date(),
      })
      .where(eq(storyboardCharacters.id, characterId))
      .returning();

    return NextResponse.json({
      success: true,
      character: updated,
    });
  } catch (error) {
    console.error("[POST Approve Character Sheet] Error:", error);
    return NextResponse.json(
      { error: "Failed to approve character sheet" },
      { status: 500 },
    );
  }
}
