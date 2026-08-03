// app/api/analyze-panel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { analyzeImageWithOpenRouter } from "@/lib/openrouter";
import type { Keyframe, Scene, Emotion } from "@/types/scene";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const GEMINI_MODEL_CHAIN = [
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
] as const;

const MAX_RETRIES_PER_MODEL = 2;
const RETRY_BASE_DELAY_MS = 1500;
const PREV_CHAPTER_CHAR_CAP = 1200; // Reduced to save tokens for vision

const VALID_EMOTIONS: Emotion[] = [
  "drama", "action", "horror", "romance", "comedy", "melancholy", "tension", "awe",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: any): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("503") || msg.includes("429") ||
    msg.includes("overloaded") || msg.includes("high demand") ||
    msg.includes("UNAVAILABLE") || msg.includes("RESOURCE_EXHAUSTED")
  );
}

async function generateWithGemini(
  imagePart: { inlineData: { data: string; mimeType: string } },
  prompt: string,
): Promise<{ text: string; modelUsed: string }> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  let lastError: any = null;

  for (const modelName of GEMINI_MODEL_CHAIN) {
    const model: GenerativeModel = genai.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: "application/json", // Structured output when supported
      },
    });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const result = await model.generateContent([imagePart, prompt]);
        const text = result.response.text().trim();
        console.log(`[analyze-panel] ✓ gemini:${modelName} (attempt ${attempt})`);
        return { text, modelUsed: `gemini:${modelName}` };
      } catch (error: any) {
        lastError = error;
        console.warn(`[analyze-panel] gemini:${modelName} attempt ${attempt}: ${error.message}`);
        if (!isRetryableError(error) || attempt === MAX_RETRIES_PER_MODEL) break;
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
    console.warn(`[analyze-panel] Exhausted ${modelName}, trying next`);
  }

  throw lastError ?? new Error("All Gemini models failed");
}

// ─── Defaults ────────────────────────────────────────────────────────────────

function getDefaultKeyframes(): Keyframe[] {
  return [
    { t: 0, x: 0, y: 0, w: 1, h: 1 },
    { t: 0.4, x: 0.03, y: 0.02, w: 0.94, h: 0.94 },
    { t: 1.0, x: 0.06, y: 0.04, w: 0.88, h: 0.88 },
  ];
}

function getDefaultResult() {
  return {
    narration: "A powerful moment unfolds in this manga panel — the story continues to build.",
    keyframes: getDefaultKeyframes(),
    emotion: "drama" as Emotion,
    effects: [] as string[],
  };
}

// ─── Robust JSON Parsing with Repair ──────────────────────────────────────────
interface AnalysisResponse {
  narration: string;
  keyframes: Keyframe[];
  emotion?: string;
  effects?: string[];
  bubbles?: Bubble[];        // NEW: speech/thought bubble positions
  beats?: number[];          // NEW: normalized timestamps of emotional peaks (0-1)
  focusPoints?: FocusPoint[]; // NEW: areas of interest beyond bubbles
}

interface Bubble {
  x: number; y: number; w: number; h: number; // normalized 0-1
  type: "speech" | "thought" | "shout";
  text: string;
  appearAt: number; // normalized 0-1 when this bubble should be focused
}

interface FocusPoint {
  x: number; y: number; w: number; h: number;
  reason: string; // "face", "action", "object", "reveal"
  priority: number; // 1-10, higher = more important
}

function parseResponse(raw: string): AnalysisResponse {
  // Strip markdown fences, code blocks, and leading/trailing noise
  let clean = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Attempt direct parse first
  try {
    return JSON.parse(clean);
  } catch {
    // Try to extract JSON object from mixed response
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch { /* fall through */ }
    }

    // Last resort: fix common LLM JSON errors
    const repaired = clean
      .replace(/,\s*([}\]])/g, "$1")   // trailing commas
      .replace(/'/g, '"')               // single quotes
      .replace(/(\w+):/g, '"$1":');     // unquoted keys

    try {
      return JSON.parse(repaired);
    } catch (e) {
      throw new Error(`Unparseable AI response: ${(e as Error).message}`);
    }
  }
}

// ─── Keyframe Validation (Aligned with Renderer) ───────────────────────────

function validateKeyframes(kfs: Keyframe[]): Keyframe[] {
  let validated = (kfs || [])
    .filter((kf) =>
      typeof kf.t === "number" && !isNaN(kf.t) && kf.t >= 0 && kf.t <= 1 &&
      typeof kf.x === "number" && kf.x >= 0 && kf.x < 1 &&
      typeof kf.y === "number" && kf.y >= 0 && kf.y < 1 &&
      typeof kf.w === "number" && kf.w >= 0.5 && kf.w <= 1 &&
      typeof kf.h === "number" && kf.h >= 0.5 && kf.h <= 1 &&
      kf.x + kf.w <= 1.02 && kf.y + kf.h <= 1.02
    )
    .map((kf) => ({
      t: Math.max(0, Math.min(kf.t, 1)),
      x: Math.max(0, Math.min(kf.x, 1 - kf.w)),
      y: Math.max(0, Math.min(kf.y, 1 - kf.h)),
      w: Math.min(Math.max(0.5, kf.w), 1),
      h: Math.min(Math.max(0.5, kf.h), 1),
    }))
    .sort((a, b) => a.t - b.t);

  // Deduplicate close timestamps
  validated = validated.filter((kf, i, arr) => i === 0 || Math.abs(kf.t - arr[i - 1].t) > 0.05);

  // Ensure starts at t=0
  if (validated.length === 0 || validated[0].t > 0.05) {
    validated.unshift({ t: 0, x: 0, y: 0, w: 1, h: 1 });
  } else {
    validated[0].t = 0;
  }

  // Ensure ends at t=1
  if (validated[validated.length - 1].t < 0.95) {
    validated.push({ ...validated[validated.length - 1], t: 1 });
  } else {
    validated[validated.length - 1].t = 1;
  }

  if (validated.length < 2) return getDefaultKeyframes();
  return validated;
}

function validateEmotion(raw?: string): Emotion {
  if (!raw) return "drama";
  const lower = raw.toLowerCase().trim();
  return VALID_EMOTIONS.includes(lower as Emotion) ? (lower as Emotion) : "drama";
}

function validateEffects(raw?: string[]): string[] {
  const valid = ["shake", "flash", "fade_in"];
  if (!Array.isArray(raw)) return [];
  return raw.filter((e) => typeof e === "string" && valid.includes(e.toLowerCase()))
    .map((e) => e.toLowerCase());
}

// ─── Context Builders ───────────────────────────────────────────────────────

function buildWithinVideoContext(allScenes: Scene[], currentIndex: number): string {
  const prior = allScenes
    .filter((s) => s.index < currentIndex && s.narration?.trim())
    .sort((a, b) => a.index - b.index)
    .slice(-5); // Only last 5 scenes to save tokens

  if (prior.length === 0) return "";
  return prior.map((s) => `[Scene ${s.index + 1}] ${s.narration.trim()}`).join("\n");
}

async function buildPreviousChapterContext(
  projectId: string, currentVideoId: string, userId: string,
): Promise<{ title: string; text: string } | null> {
  const [prevVideo] = await db
    .select()
    .from(videos)
    .where(and(
      eq(videos.projectId, projectId),
      eq(videos.userId, userId),
      ne(videos.id, currentVideoId),
      eq(videos.status, "completed"),
    ))
    .orderBy(desc(videos.createdAt))
    .limit(1);

  if (!prevVideo?.timeline) return null;

  let prevScenes: Scene[] = [];
  try {
    const parsed = typeof prevVideo.timeline === "string"
      ? JSON.parse(prevVideo.timeline) : prevVideo.timeline;
    prevScenes = Array.isArray(parsed) ? parsed : [];
  } catch { return null; }

  const narrations = prevScenes
    .filter((s) => s.narration?.trim())
    .sort((a, b) => a.index - b.index)
    .map((s) => s.narration.trim());

  if (narrations.length === 0) return null;

  // Take first + last narrations for continuity without token waste
  let combined: string;
  if (narrations.length <= 4) {
    combined = narrations.join(" ");
  } else {
    combined = narrations.slice(0, 2).join(" ") +
      " [...] " +
      narrations.slice(-2).join(" ");
  }

  if (combined.length > PREV_CHAPTER_CHAR_CAP) {
    combined = combined.slice(0, PREV_CHAPTER_CHAR_CAP) + "...";
  }

  return { title: prevVideo.title, text: combined };
}

// ─── Aspect-Ratio-Aware Framing Guidance ────────────────────────────────────

function getAspectFramingGuide(aspectRatio: string): string {
  switch (aspectRatio) {
    case "9:16":
      return `VERTICAL FRAME (9:16): Panel is likely taller than wide.
- Use Y-axis panning (top→bottom or bottom→top) to follow vertical action
- Keep w ≥ 0.7, h can go down to 0.6 for dramatic close-ups on faces
- First keyframe should show full panel, later keyframes can focus on upper/lower half`;
    case "16:9":
      return `HORIZONTAL FRAME (16:9): Panel is likely wider than tall.
- Use X-axis panning (left→right) to follow reading direction
- Keep h ≥ 0.7, w can go down to 0.6 for wide establishing shots
- Avoid extreme vertical crops — side panels may be cut off`;
    case "1:1":
      return `SQUARE FRAME (1:1): Balanced composition.
- Gentle diagonal or center-inward motion works best
- Keep both w and h ≥ 0.7
- Center-weighted keyframes feel most natural`;
    case "4:5":
      return `PORTRAIT FRAME (4:5): Slightly taller than square.
- Moderate Y-axis panning with gentle X drift
- Keep w ≥ 0.7, h ≥ 0.65
- Good for character-focused panels`;
    default:
      return `Standard framing: gentle pan, keep w,h ≥ 0.7`;
  }
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

    // ── Build Context ──────────────────────────────────────────────────────
    let contextBlock = "";

    if (typeof sceneIndex === "number" && sceneIndex > 0 && Array.isArray(allScenes)) {
      const withinVideo = buildWithinVideoContext(allScenes, sceneIndex);
      if (withinVideo) {
        contextBlock = `\n═══ STORY SO FAR (this video) ═══\n${withinVideo}\nContinue naturally. Do NOT repeat prior narration.\n`;
      }
    } else if (videoId) {
      const [video] = await db
        .select({ projectId: videos.projectId })
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, session.user.id)));

      if (video?.projectId) {
        const prevChapter = await buildPreviousChapterContext(video.projectId, videoId, session.user.id);
        if (prevChapter) {
          contextBlock = `\n═══ PREVIOUS CHAPTER ("${prevChapter.title}") ═══\n${prevChapter.text}\nNew chapter continuation. Narrate as natural follow-up.\n`;
        }
      }
    }

    const framingGuide = getAspectFramingGuide(aspectRatio);

    const prompt = `You are a manga story narrator for YouTube recap videos.
Your voice is engaging, dramatic, immersive — like a storyteller reading aloud.
${contextBlock}
Analyze this manga/comic panel and return ONLY valid JSON.

OUTPUT SCHEMA:
{
  "narration": "string (2-4 sentences, 150-400 chars)",
  "emotion": "one of: drama|action|horror|romance|comedy|melancholy|tension|awe",
  "effects": ["optional array of: shake|flash|fade_in"],
  "keyframes": [
    { "t": 0.0, "x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0 },
    { "t": 0.5, "x": 0.05, "y": 0.03, "w": 0.85, "h": 0.85 },
    { "t": 1.0, "x": 0.08, "y": 0.05, "w": 0.78, "h": 0.78 }
  ]
}

═══ NARRATION RULES ═══
• READ every speech/thought bubble carefully
• QUOTE or PARAPHRASE dialogue naturally into narration
• DESCRIBE action and emotional weight
• PRESENT TENSE, ACTIVE VOICE
• 2-4 sentences, 150–400 characters
• NEVER write: "In this panel..." / "The image shows..." / "Here we see..."

═══ EMOTION & EFFECTS ═══
• Classify emotion from VISUAL CONTENT (expressions, lighting, composition), not just text
• "shake": impact hits, explosions, sudden violence, shock reveals
• "flash": bright attacks, lightning, divine power, memory transitions  
• "fade_in": dream sequences, flashbacks, gentle scene openings
• Use 0-2 effects max. Most panels need NONE. Less is more.

═══ KEYFRAME RULES ═══
${framingGuide}
• t values are NORMALIZED 0.0 → 1.0 (renderer scales to actual audio duration)
• First keyframe MUST have t=0.0, last MUST have t=1.0
• x+w ≤ 1.0, y+h ≤ 1.0 always
• Minimum w=0.5, h=0.5 (renderer clamps to safe bounds)
• 3-4 keyframes with SMOOTH motion (max 0.15 change in x/y between adjacent)
• Motion should FOLLOW the visual focus: pan toward faces, action, or speech bubbles
• Start wide (full panel), then gently move to area of interest

Return ONLY the JSON object.`;

    let parsed: AnalysisResponse;
    let modelUsed = "fallback-default";

    // ── Layer 1: OpenRouter ────────────────────────────────────────────────
    try {
      const { text, modelUsed: used } = await analyzeImageWithOpenRouter(base64, mimeType, prompt);
      parsed = parseResponse(text);
      modelUsed = `openrouter:${used}`;
    } catch (orErr: any) {
      console.warn("[analyze-panel] OpenRouter failed:", orErr.message);

      // ── Layer 2: Gemini Fallback ─────────────────────────────────────────
      try {
        const { text, modelUsed: used } = await generateWithGemini(
          { inlineData: { data: base64, mimeType } }, prompt,
        );
        parsed = parseResponse(text);
        modelUsed = used;
      } catch (geminiErr: any) {
        console.error("[analyze-panel] All AI failed:", geminiErr.message);
        const defaults = getDefaultResult();
        return NextResponse.json({
          ...defaults,
          fallback: true,
          error: "AI services unavailable. Default narration provided — edit manually.",
        });
      }
    }

    // ── Validate & Normalize Output ────────────────────────────────────────
    const keyframes = validateKeyframes(parsed.keyframes);
    const narration = parsed.narration?.trim() || getDefaultResult().narration;
    const emotion = validateEmotion(parsed.emotion);
    const effects = validateEffects(parsed.effects);

    return NextResponse.json({ narration, keyframes, emotion, effects, modelUsed });
  } catch (error: any) {
    console.error("[analyze-panel] Fatal:", error);
    const defaults = getDefaultResult();
    return NextResponse.json({
      ...defaults,
      fallback: true,
      error: "Analysis failed. Edit narration manually.",
    }, { status: 200 });
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