// app/api/analyze-panel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { detectEmotion } from "@/lib/effects/color-grading";
import { analyzeImageWithOpenRouter } from "@/lib/openrouter";
import type { Keyframe, Scene } from "@/types/scene";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ─── Gemini model chain — FALLBACK ONLY, OpenRouter is primary ─────────────
// Verify live models any time with:
//   curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
const GEMINI_MODEL_CHAIN = [
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
] as const;

const MAX_RETRIES_PER_MODEL = 2;
const RETRY_BASE_DELAY_MS = 1500;
const PREV_CHAPTER_CHAR_CAP = 1500;

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

async function generateWithGemini(
  imagePart: { inlineData: { data: string; mimeType: string } },
  prompt: string,
): Promise<{ text: string; modelUsed: string }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  let lastError: any = null;

  for (const modelName of GEMINI_MODEL_CHAIN) {
    const model: GenerativeModel = genai.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const result = await model.generateContent([imagePart, prompt]);
        const text = result.response.text().trim();
        console.log(`[analyze-panel] ✓ gemini:${modelName} (attempt ${attempt})`);
        return { text, modelUsed: `gemini:${modelName}` };
      } catch (error: any) {
        lastError = error;
        console.warn(`[analyze-panel] gemini:${modelName} attempt ${attempt} failed: ${error.message}`);
        if (!isRetryableError(error) || attempt === MAX_RETRIES_PER_MODEL) break;
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
    console.warn(`[analyze-panel] Moving to next Gemini model after exhausting ${modelName}`);
  }

  throw lastError ?? new Error("All Gemini models failed");
}

// ─── Defaults ────────────────────────────────────────────────────────────────

function getDefaultKeyframes(): Keyframe[] {
  return [
    { t: 0,   x: 0,    y: 0,    w: 1,    h: 1    },
    { t: 2.5, x: 0.1,  y: 0.05, w: 0.75, h: 0.75 },
    { t: 6.0, x: 0.15, y: 0.1,  w: 0.6,  h: 0.75 },
  ];
}

function getDefaultResult() {
  return {
    narration: "A powerful moment unfolds in this manga panel — the story continues to build.",
    keyframes: getDefaultKeyframes(),
    emotion: "drama" as const,
  };
}

function parseResponse(raw: string): { narration: string; keyframes: Keyframe[] } {
  const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(clean);
}

function validateKeyframes(kfs: Keyframe[]): Keyframe[] {
  let validated = (kfs || [])
    .filter(
      (kf) =>
        typeof kf.t === "number" && !isNaN(kf.t) &&
        typeof kf.x === "number" && !isNaN(kf.x) && kf.x >= 0 && kf.x < 1 &&
        typeof kf.y === "number" && !isNaN(kf.y) && kf.y >= 0 && kf.y < 1 &&
        typeof kf.w === "number" && !isNaN(kf.w) && kf.w >= 0.2 && kf.w <= 1 &&
        typeof kf.h === "number" && !isNaN(kf.h) && kf.h >= 0.2 && kf.h <= 1 &&
        kf.x + kf.w <= 1.02 &&
        kf.y + kf.h <= 1.02,
    )
    .map((kf) => ({
      t: kf.t,
      x: Math.max(0, Math.min(kf.x, 1 - kf.w)),
      y: Math.max(0, Math.min(kf.y, 1 - kf.h)),
      w: Math.min(kf.w, 1),
      h: Math.min(kf.h, 1),
    }))
    .sort((a, b) => a.t - b.t);

  validated = validated.filter((kf, i, arr) => i === 0 || Math.abs(kf.t - arr[i - 1].t) > 0.1);

  if (validated.length === 0 || validated[0].t > 0.1) {
    validated.unshift({ t: 0, x: 0, y: 0, w: 1, h: 1 });
  } else {
    validated[0].t = 0;
  }

  if (validated.length < 2) validated = getDefaultKeyframes();
  return validated;
}

// ─── Context builders (chapter + within-video continuity) ────────────────────

function buildWithinVideoContext(allScenes: Scene[], currentSceneIndex: number): string {
  const priorScenes = allScenes
    .filter((s) => s.index < currentSceneIndex && s.narration?.trim())
    .sort((a, b) => a.index - b.index);

  if (priorScenes.length === 0) return "";
  return priorScenes.map((s) => `Scene ${s.index + 1}: ${s.narration.trim()}`).join("\n");
}

async function buildPreviousChapterContext(
  projectId: string,
  currentVideoId: string,
  userId: string,
): Promise<{ title: string; text: string } | null> {
  const [prevVideo] = await db
    .select()
    .from(videos)
    .where(
      and(
        eq(videos.projectId, projectId),
        eq(videos.userId, userId),
        ne(videos.id, currentVideoId),
        eq(videos.status, "completed"),
      ),
    )
    .orderBy(desc(videos.createdAt))
    .limit(1);

  if (!prevVideo?.timeline) return null;

  let prevScenes: Scene[] = [];
  try {
    const parsed = typeof prevVideo.timeline === "string" ? JSON.parse(prevVideo.timeline) : prevVideo.timeline;
    prevScenes = Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }

  const narrations = prevScenes
    .filter((s) => s.narration?.trim())
    .sort((a, b) => a.index - b.index)
    .map((s) => s.narration.trim());

  if (narrations.length === 0) return null;

  let combined = narrations.join(" ");
  if (combined.length > PREV_CHAPTER_CHAR_CAP) {
    combined = "..." + combined.slice(combined.length - PREV_CHAPTER_CHAR_CAP);
  }

  return { title: prevVideo.title, text: combined };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { imageUrl, videoId, sceneIndex, allScenes, aspectRatio = "9:16" } = await request.json();
    if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
    const base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
    const mimeType = (imgRes.headers.get("content-type") ?? "image/jpeg") as string;

    // ── Context block ──────────────────────────────────────────────────────
    let contextBlock = "";

    if (typeof sceneIndex === "number" && sceneIndex > 0 && Array.isArray(allScenes)) {
      const withinVideo = buildWithinVideoContext(allScenes, sceneIndex);
      if (withinVideo) {
        contextBlock = `\n═══ STORY SO FAR (this video) ═══\n${withinVideo}\n\nContinue naturally. Do NOT repeat what was already narrated.\n`;
      }
    } else if (videoId) {
      const [video] = await db
        .select({ projectId: videos.projectId })
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, session.user.id)));

      if (video?.projectId) {
        const prevChapter = await buildPreviousChapterContext(video.projectId, videoId, session.user.id);
        if (prevChapter) {
          contextBlock = `\n═══ PREVIOUS CHAPTER ("${prevChapter.title}") ═══\n${prevChapter.text}\n\nThis is a new chapter continuing the series. Narrate as a natural continuation.\n`;
        }
      }
    }

    const aspectDescMap: Record<string, string> = {
      "9:16": "PORTRAIT 9:16 (vertical, TikTok/Shorts)",
      "16:9": "LANDSCAPE 16:9 (horizontal, YouTube)",
      "1:1":  "SQUARE 1:1 (Instagram post)",
      "4:5":  "PORTRAIT 4:5 (Instagram feed)",
    };
    const aspectDesc = aspectDescMap[aspectRatio] ?? aspectDescMap["9:16"];

    const prompt = `You are a manga story narrator for a YouTube channel that explains manga panel by panel.
Your voice is engaging, dramatic, and immersive — like a storyteller reading aloud.
${contextBlock}
Analyze this manga/comic panel and return ONLY valid JSON (no markdown, no explanation, no code fences).

OUTPUT FORMAT:
{
  "narration": "...",
  "keyframes": [ { "t": 0.0, "x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0 }, ... ]
}

═══ NARRATION RULES ═══
This is a STORY EXPLANATION video, not a summary.
1. READ every speech/thought bubble visible in the panel carefully
2. QUOTE or PARAPHRASE the dialogue naturally into the narration
3. DESCRIBE what's happening and the emotional weight
4. Use PRESENT TENSE, ACTIVE VOICE
5. Length: 2-4 sentences, 150–400 characters

DO NOT write: "In this panel..." / "The image shows..." / "Here we see..."

═══ KEYFRAME RULES ═══
Output is ${aspectDesc}. x=0 left, y=0 top, w/h are 0-1 fractions.
- First t=0.0, last t=6-9 (scaled to audio length later)
- x+w ≤ 1.0, y+h ≤ 1.0, min w≥0.6, h≥0.6  
- 3-5 keyframes, smooth motion (max 0.15 change in x/y between adjacent keyframes)
- Prefer tall crops for portrait output
- CRITICAL: Keep the ENTIRE panel readable. Do NOT zoom so far that speech bubbles or faces are cropped out.

Return ONLY the JSON object — no markdown fences, no commentary before or after.`;

    let parsed: { narration: string; keyframes: Keyframe[] };
    let modelUsed = "fallback-default";

    // ── Layer 1 (PRIMARY): OpenRouter ───────────────────────────────────────
    try {
      const { text, modelUsed: used } = await analyzeImageWithOpenRouter(base64, mimeType, prompt);
      parsed = parseResponse(text);
      modelUsed = `openrouter:${used}`;
    } catch (orErr: any) {
      console.warn("[analyze-panel] OpenRouter failed, trying Gemini fallback:", orErr.message);

      // ── Layer 2 (FALLBACK): Gemini chain ─────────────────────────────────
      try {
        const { text, modelUsed: used } = await generateWithGemini(
          { inlineData: { data: base64, mimeType } },
          prompt,
        );
        parsed = parseResponse(text);
        modelUsed = used;
      } catch (geminiErr: any) {
        console.error("[analyze-panel] Both OpenRouter and Gemini failed, using static default:", geminiErr.message);
        const defaults = getDefaultResult();
        return NextResponse.json({
          narration: defaults.narration,
          keyframes: defaults.keyframes,
          emotion: defaults.emotion,
          fallback: true,
          error: "AI services temporarily unavailable. Default narration provided — edit manually.",
        });
      }
    }

    const kfs = validateKeyframes(parsed.keyframes ?? []);
    const narration = parsed.narration?.trim() || getDefaultResult().narration;
    const emotion = detectEmotion(narration);

    return NextResponse.json({ narration, keyframes: kfs, emotion, modelUsed });
  } catch (error: any) {
    console.error("[analyze-panel] Fatal error:", error);
    const defaults = getDefaultResult();
    return NextResponse.json(
      {
        narration: defaults.narration,
        keyframes: defaults.keyframes,
        emotion: defaults.emotion,
        fallback: true,
        error: "Analysis failed. You can edit the narration manually.",
      },
      { status: 200 },
    );
  }
}





// const prompt = `You are a manga story narrator and video director for a YouTube channel that explains manga panel by panel.
// Your voice is engaging, dramatic, and immersive — like a storyteller reading aloud.

// Analyze this manga/comic panel and return ONLY valid JSON (no markdown, no explanation).

// OUTPUT FORMAT:
// {
//   "narration": "...",
//   "dialogue": "...",
//   "effects": ["..."],
//   "focus_points": [ { "x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0, "type": "..." } ],
//   "keyframes": [ { "t": 0.0, "x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0 }, ... ]
// }

// ═══════════════════════════════════════
// NARRATION RULES — CRITICAL:
// ═══════════════════════════════════════
// This is a STORY EXPLANATION video, not a summary. You must:

// 1. READ every speech bubble and thought bubble visible in the panel
// 2. QUOTE or PARAPHRASE the dialogue naturally as part of the narration
// 3. DESCRIBE what is happening, who is speaking, and the emotional weight of the moment
// 4. WRITE as a narrator telling the story, not as a bullet-point summarizer

// Length: 2-4 sentences, 150–400 characters. Long enough to fully explain what's happening.

// Style examples (match this energy):
// - "His coworker happily announces he's getting married, while another complains about missing his kid's sports day. But our protagonist sits silently, staring at his screen, thinking... a happy family sure sounds nice."
// - "The enemy reveals his true power — he wasn't holding back at all. With a single glance, he makes it clear: this fight was never even close."
// - "She finally says it. Three words she's been holding back for years. And from the look on his face, he already knew."

// DO NOT write: "In this panel..." or "The image shows..."
// DO write narration that flows like spoken commentary on a story.

// ═══════════════════════════════════════
// DIALOGUE & CINEMATIC EFFECTS RULES:
// ═══════════════════════════════════════
// 1. DIALOGUE: Extract the EXACT text visible in speech or thought bubbles. This will be used for on-screen subtitles. If there is no text, return an empty string "".
// 2. EFFECTS: Suggest 0 to 2 cinematic effects to apply to this scene based on the mood:
//    - "shake": For action, impact, explosions, or intense moments.
//    - "flash": For reveals, sudden realizations, or power-ups.
//    - "fade_in": For quiet, emotional, or transitional moments.
//    Return an array of strings, e.g., ["shake"] or [].

// ═══════════════════════════════════════
// KEYFRAME CINEMATOGRAPHY RULES:
// ═══════════════════════════════════════
// Output is ${aspectDesc}. Coordinate system: x=0 left, y=0 top, w/h are 0–1 fractions.

// First, identify "focus_points" (faces, action centers, important objects) with their bounding boxes (x, y, w, h) and type ("face", "action", "object"). Use these to guide your keyframes.

// Motion strategy — pick the RIGHT pattern for this panel:

// DIALOGUE PANEL (speech bubbles, characters talking):
//   t=0: Full panel (x:0, y:0, w:1, h:1)
//   t=1.5: Zoom to first speaker's bubble + face
//   t=3.5: Pan to second speaker or their bubble
//   t=5.5: Hold on most emotional element (thought bubble, reaction face)

// ACTION PANEL (fight, power, impact):
//   t=0: Full panel
//   t=1.5: Push into the action/impact point
//   t=4: Zoom in tighter for dramatic hold

// REACTION PANEL (close-up face, emotion):
//   t=0: Slight pull back from full (w:0.9, h:0.9)
//   t=3: Slow push into the face
//   t=6: Very tight on eyes/expression

// REVEAL PANEL (something surprising shown):
//   t=0: Start slightly cropped away from the reveal
//   t=2: Slowly pan/zoom to reveal the key element
//   t=5: Hold tight on the reveal

// KEYFRAME CONSTRAINTS:
// - First t must be 0.0, last t should be 6–9 (scaled to audio length by renderer)
// - x + w ≤ 1.0, y + h ≤ 1.0
// - Minimum w ≥ 0.3, h ≥ 0.3
// - ${aspectRatio === "9:16" || aspectRatio === "4:5" ? "Portrait-friendly: prefer tall crops (w:0.5, h:0.65) over wide crops" : "Landscape/Square-friendly: ensure crops fit well within the frame without awkward black bars"}
// - 3–5 keyframes total, each segment 1.5–2.5s apart

// CRITICAL MOTION CONSTRAINTS:
// - SMOOTHNESS: The camera must move slowly. Never jump more than 0.15 in x or y coordinates between keyframes.
// - CONTINUITY: If you move Left, the next keyframe must be near the Left. Do not jump Left then instantly Right.
// - ASPECT RATIO: The output is ${aspectDesc}. 
//   - If source is Portrait (9:16) and output is Landscape (16:9), you MUST pan vertically (y: 0.0 -> 0.5) to show the whole image over time.
//   - Prefer slow zooms (w: 1.0 -> 0.8) over fast pans.

// Return ONLY the JSON object.`;