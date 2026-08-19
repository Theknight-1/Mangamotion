import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyboardProjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import { checkPdfPageLimit } from "@/lib/storyboard/usage";
import { parseScriptBuffer } from "@/lib/storyboard/ai/script-parser";
import type { TierKey } from "@/lib/payment";

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

    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;

    const contentType = request.headers.get("content-type") || "";

    let extractedText = "";
    let pageCount: number | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const rawText = formData.get("text") as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = await parseScriptBuffer(buffer, file.name);

        if (parsed.format === "pdf" && parsed.pageCount) {
          const limitCheck = checkPdfPageLimit(tier, parsed.pageCount);
          if (!limitCheck.allowed) {
            return NextResponse.json(
              {
                error: `PDF exceeds maximum allowed page count (${limitCheck.maxPages} pages) for your ${tier.toUpperCase()} plan. Your PDF has ${parsed.pageCount} pages. Please upgrade or upload a shorter excerpt.`,
                code: "PDF_PAGE_LIMIT_EXCEEDED",
                pageCount: parsed.pageCount,
                maxAllowed: limitCheck.maxPages,
                tier,
              },
              { status: 403 },
            );
          }
          pageCount = parsed.pageCount;
        }

        extractedText = parsed.text;
      } else if (rawText) {
        extractedText = rawText;
      }
    } else {
      const body = await request.json();
      extractedText = body.text || "";
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "No script content could be extracted." },
        { status: 400 },
      );
    }

    // Save extracted script to the project
    const [updated] = await db
      .update(storyboardProjects)
      .set({
        scriptText: extractedText,
        updatedAt: new Date(),
      })
      .where(eq(storyboardProjects.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      text: extractedText,
      pageCount,
      project: updated,
    });
  } catch (error: any) {
    console.error("[upload-script] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process script" },
      { status: 500 },
    );
  }
}
