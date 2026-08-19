import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardCharacters, storyboardProjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import type { StoryboardCharacter, ConditioningMode } from "@/types/storyboard";

interface Params {
  params: Promise<{ id: string }>;
}

function serialize(
  row: typeof storyboardCharacters.$inferSelect,
): StoryboardCharacter {
  return {
    ...row,
    clothing: row.clothing ?? null,
    consistencyNotes: row.consistencyNotes ?? null,
    referenceImageUrls: (row.referenceImageUrls as string[]) ?? [],
    conditioningMode: (row.conditioningMode as ConditioningMode) || "description",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function findOwnedCharacter(characterId: string, userId: string) {
  const [row] = await db
    .select({ character: storyboardCharacters })
    .from(storyboardCharacters)
    .innerJoin(
      storyboardProjects,
      eq(storyboardCharacters.projectId, storyboardProjects.id),
    )
    .where(
      and(
        eq(storyboardCharacters.id, characterId),
        eq(storyboardProjects.userId, userId),
      ),
    )
    .limit(1);
  return row?.character;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await findOwnedCharacter(id, session.user.id);
    if (!existing) {
      return NextResponse.json(
        { error: "Character not found or unauthorized" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      clothing,
      consistencyNotes,
      referenceImageUrls,
      pendingSheetUrl,
      approvedSheetUrl,
      conditioningMode,
    } = body as {
      name?: string;
      description?: string;
      clothing?: string;
      consistencyNotes?: string;
      referenceImageUrls?: string[];
      pendingSheetUrl?: string | null;
      approvedSheetUrl?: string | null;
      conditioningMode?: ConditioningMode;
    };

    const updates: Partial<typeof storyboardCharacters.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (clothing !== undefined) updates.clothing = clothing;
    if (consistencyNotes !== undefined) updates.consistencyNotes = consistencyNotes;
    if (referenceImageUrls !== undefined)
      updates.referenceImageUrls = referenceImageUrls;
    if (pendingSheetUrl !== undefined) updates.pendingSheetUrl = pendingSheetUrl;
    if (approvedSheetUrl !== undefined)
      updates.approvedSheetUrl = approvedSheetUrl;
    if (conditioningMode !== undefined)
      updates.conditioningMode = conditioningMode;

    const [updated] = await db
      .update(storyboardCharacters)
      .set(updates)
      .where(eq(storyboardCharacters.id, id))
      .returning();

    return NextResponse.json({ character: serialize(updated) });
  } catch (error) {
    console.error("[PATCH Storyboard Character] Error:", error);
    return NextResponse.json(
      { error: "Failed to update character" },
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
    const existing = await findOwnedCharacter(id, session.user.id);
    if (!existing) {
      return NextResponse.json(
        { error: "Character not found or unauthorized" },
        { status: 404 },
      );
    }

    await db.delete(storyboardCharacters).where(eq(storyboardCharacters.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE Storyboard Character] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete character" },
      { status: 500 },
    );
  }
}
