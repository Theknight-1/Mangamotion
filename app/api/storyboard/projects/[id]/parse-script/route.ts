// app/api/storyboard/projects/[id]/parse-script/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  storyboardProjects,
  storyboardShots,
  storyboardCharacters,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { headers } from "next/headers";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { getOrCreateSubscription } from "@/app/actions/subscription/usages";
import { getStoryboardTierLimits } from "@/lib/storyboard/usage";
import type { TierKey } from "@/lib/payment";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Same fallback chain as analyze-panel — keeps model-selection behavior
// consistent across both AI features in the app.
const GEMINI_MODEL_CHAIN = [
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
] as const;

const MAX_RETRIES_PER_MODEL = 2;
const RETRY_BASE_DELAY_MS = 1500;
const MAX_SCRIPT_CHARS = 40000; // guard against pathologically long uploads

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: any): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("overloaded") ||
    msg.includes("high demand") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

const SHOT_TYPES = ["wide", "close-up", "action", "reaction", "establishing"];

// Rewritten to AUTO-DETECT characters from the script, not just match
// against ones the user already manually created. This mirrors
// storyboarder.ai's flow: parsing a script surfaces its characters as a
// byproduct, rather than requiring the user to pre-define everyone by
// name before parsing works at all. Detected characters are inserted as
// new storyboardCharacters rows (unapproved, no portrait yet) for the
// user to review/edit/delete in the Character panel — see the
// Character Editor step in storyboarder.ai's flow.
const PARSE_PROMPT = (
  scriptText: string,
  existingCharacterNames: string[],
) => `
You are a master storyboard artist and cinematographic director. Read the following script/story and do two things:

1. IDENTIFY every distinct character who appears or is referred to. For each character, infer a rich visual description (appearance, distinctive hairstyle, exact signature clothing layers, colors, and visual anchors).
   Characters already known in this project: ${
     existingCharacterNames.length ? existingCharacterNames.join(", ") : "(none yet)"
   } — reuse these exact names for the same character.

2. BREAK the script into a granular, progressive sequence of cinematic shot beats for a storyboard (wide establishing, medium action, inserts/close-ups, reactions, over-the-shoulder).
   - For each shot, "description" MUST describe a concrete, frozen keyframe explicitly naming every character present, their poses, facial expressions, and props.
   - "characterNames" MUST list EVERY character who appears or is visible in that frame. If the text describes "the trio", "all three", "both of them", "everyone", or "the group", resolve and list EVERY individual character by their exact name.

Return ONLY a JSON object (no markdown, no prose) with this exact shape:
{
  "characters": [
    {
      "name": string,
      "description": string // physical appearance, hairstyle, and signature clothing details
    }
  ],
  "shots": [
    {
      "description": string,          // concrete keyframe visual description explicitly naming characters in frame
      "shotType": one of ${JSON.stringify(SHOT_TYPES)},
      "characterNames": string[],      // MUST list ALL characters present in this shot, or []
      "draftNarration": string,        // specific dialogue line or action recap
      "estDuration": number             // rough seconds, typically 2-6
    }
  ]
}

Script:
"""
${scriptText.slice(0, MAX_SCRIPT_CHARS)}
"""
`.trim();

interface ParsedCharacter {
  name: string;
  description?: string;
}

interface ParsedShot {
  description: string;
  shotType?: string;
  characterNames?: string[];
  draftNarration?: string;
  estDuration?: number;
}

interface ParsedScript {
  characters: ParsedCharacter[];
  shots: ParsedShot[];
}

async function parseWithGemini(prompt: string): Promise<ParsedScript> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  let lastError: any = null;

  for (const modelName of GEMINI_MODEL_CHAIN) {
    const model: GenerativeModel = genai.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        console.log(`[parse-script] ✓ gemini:${modelName} (attempt ${attempt})`);
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed?.shots)) {
          throw new Error("Model did not return a shots array");
        }
        return {
          characters: Array.isArray(parsed.characters) ? parsed.characters : [],
          shots: parsed.shots,
        };
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[parse-script] gemini:${modelName} attempt ${attempt}: ${error.message}`,
        );
        if (!isRetryableError(error) || attempt === MAX_RETRIES_PER_MODEL) break;
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
    console.warn(`[parse-script] Exhausted ${modelName}, trying next`);
  }

  throw lastError ?? new Error("All Gemini models failed to parse script");
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const [project] = await db
      .select()
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
        { error: "Storyboard project not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { scriptText } = body as { scriptText?: string };

    if (!scriptText || scriptText.trim().length === 0) {
      return NextResponse.json(
        { error: "scriptText is required" },
        { status: 400 },
      );
    }

    // NOTE: this route accepts plain text only. PDF/Fountain files must
    // be extracted to plain text client-side (or in a small pre-step
    // route) before calling this — keeps this route's AI-facing surface
    // simple and format-agnostic. See build prompt Phase 4a.

    const existingCharacters = await db
      .select()
      .from(storyboardCharacters)
      .where(eq(storyboardCharacters.projectId, projectId));

    const nameToId = new Map(
      existingCharacters.map((c) => [c.name.toLowerCase(), c.id]),
    );

    const { characters: detectedCharacters, shots: parsedShots } =
      await parseWithGemini(
        PARSE_PROMPT(
          scriptText,
          existingCharacters.map((c) => c.name),
        ),
      );

    if (parsedShots.length === 0) {
      return NextResponse.json(
        { error: "No shots could be extracted from this script" },
        { status: 422 },
      );
    }

    // Auto-create newly detected characters (case-insensitive de-dupe
    // against existing ones). This is the core behavior change: parsing
    // a script surfaces its characters automatically, the same way
    // storyboarder.ai's Character Editor step works — the user reviews
    // and edits these afterward rather than having to pre-define every
    // character by hand before parsing works at all.
    //
    // Portraits are deliberately NOT auto-generated here — that's a
    // paid generation call per character, and auto-firing N of them on
    // every script parse would burn tier quota without confirmation.
    // The user triggers portrait generation per character (or could
    // batch it) from the Character panel after reviewing this list.
    const subscription = await getOrCreateSubscription(session.user.id);
    const tier = subscription.tier as TierKey;
    const { maxCharactersPerProject } = getStoryboardTierLimits(tier);

    let currentCharacterCount = existingCharacters.length;
    const newCharacterRows: (typeof storyboardCharacters.$inferSelect)[] = [];

    for (const detected of detectedCharacters) {
      if (!detected.name) continue;
      const key = detected.name.toLowerCase();
      if (nameToId.has(key)) continue; // already known, reuse existing id
      if (currentCharacterCount >= maxCharactersPerProject) {
        // Stop silently creating past the tier cap — shots referencing
        // any further characters just won't have that character linked
        // (characterIds resolution below skips unmatched names).
        break;
      }

      const [created] = await db
        .insert(storyboardCharacters)
        .values({
          id: createId(),
          projectId,
          name: detected.name,
          description: detected.description ?? null,
        })
        .returning();

      nameToId.set(key, created.id);
      newCharacterRows.push(created);
      currentCharacterCount++;
    }

    // Find current max order so re-parsing appends rather than
    // overwriting an in-progress shot list.
    const [{ maxOrder }] = await db
      .select({
        maxOrder: sql<number>`coalesce(max(${storyboardShots.order}), -1)`,
      })
      .from(storyboardShots)
      .where(eq(storyboardShots.projectId, projectId));

    const rowsToInsert = parsedShots.map((shot, i) => {
      const charIdSet = new Set<string>();

      for (const name of shot.characterNames ?? []) {
        const id = nameToId.get(name.toLowerCase());
        if (id) charIdSet.add(id);
      }

      const fullText = `${shot.description ?? ""} ${shot.draftNarration ?? ""}`;
      for (const [nameKey, charId] of nameToId.entries()) {
        if (nameKey.length > 1) {
          const escaped = nameKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          if (new RegExp(`\\b${escaped}\\b`, "i").test(fullText)) {
            charIdSet.add(charId);
          }
        }
      }

      const hasGroupTerm =
        /\b(all three|all \d+|the trio|trio|the duo|duo|both of them|both characters|the pair|pair of them|everyone|everybody|all of them|the gang|the group|the team|the crew|the friends|the roommates)\b/i.test(
          fullText,
        );
      if (hasGroupTerm && nameToId.size <= 5) {
        for (const charId of nameToId.values()) {
          charIdSet.add(charId);
        }
      }

      const characterIds = Array.from(charIdSet);

      return {
        id: createId(),
        projectId,
        order: maxOrder + 1 + i,
        description: shot.description ?? "",
        shotType: SHOT_TYPES.includes(shot.shotType ?? "")
          ? shot.shotType!
          : null,
        characterIds,
        draftNarration: shot.draftNarration ?? "",
        estDuration:
          typeof shot.estDuration === "number" && shot.estDuration > 0
            ? shot.estDuration
            : 3,
      };
    });

    const insertedShots = await db
      .insert(storyboardShots)
      .values(rowsToInsert)
      .returning();

    // Move the project into the next stage of its lifecycle now that a
    // shot list exists.
    await db
      .update(storyboardProjects)
      .set({
        status: "shot_list",
        scriptText,
        updatedAt: new Date(),
      })
      .where(eq(storyboardProjects.id, projectId));

    return NextResponse.json({
      shots: insertedShots,
      count: insertedShots.length,
      newCharacters: newCharacterRows,
      characterLimitReached: currentCharacterCount >= maxCharactersPerProject,
    });
  } catch (error) {
    console.error("[POST Parse Script] Error:", error);
    return NextResponse.json(
      { error: "Failed to parse script into shots" },
      { status: 500 },
    );
  }
}
