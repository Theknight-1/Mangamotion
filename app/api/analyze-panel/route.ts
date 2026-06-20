// app/api/analyze-panel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Keyframe } from "@/types/scene";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 🆕 Accept aspectRatio from the frontend, default to 9:16
    const body = (await request.json()) as {
      imageUrl?: string;
      aspectRatio?: string;
    };
    const { imageUrl, aspectRatio = "9:16" } = body;
    if (!imageUrl)
      return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
    const base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
    const mimeType = (imgRes.headers.get("content-type") ??
      "image/jpeg") as string;

    // 🆕 Dynamic aspect ratio description for the prompt
    const aspectDescMap = {
      "9:16": "PORTRAIT 9:16 (vertical, like TikTok/Shorts)",
      "16:9": "LANDSCAPE 16:9 (horizontal, like YouTube)",
      "1:1": "SQUARE 1:1 (Instagram post)",
      "4:5": "PORTRAIT 4:5 (Instagram feed portrait)",
    } as const;

    const aspectDesc: string =
      aspectDescMap[aspectRatio as keyof typeof aspectDescMap] ??
      aspectDescMap["9:16"];

    const prompt = `You are a manga story narrator and video director for a YouTube channel that explains manga panel by panel.
Your voice is engaging, dramatic, and immersive — like a storyteller reading aloud.

Analyze this manga/comic panel and return ONLY valid JSON (no markdown, no explanation).

OUTPUT FORMAT:
{
  "narration": "...",
  "dialogue": "...",
  "effects": ["..."],
  "focus_points": [ { "x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0, "type": "..." } ],
  "keyframes": [ { "t": 0.0, "x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0 }, ... ]
}

═══════════════════════════════════════
NARRATION RULES — CRITICAL:
═══════════════════════════════════════
This is a STORY EXPLANATION video, not a summary. You must:

1. READ every speech bubble and thought bubble visible in the panel
2. QUOTE or PARAPHRASE the dialogue naturally as part of the narration
3. DESCRIBE what is happening, who is speaking, and the emotional weight of the moment
4. WRITE as a narrator telling the story, not as a bullet-point summarizer

Length: 2-4 sentences, 150–400 characters. Long enough to fully explain what's happening.

Style examples (match this energy):
- "His coworker happily announces he's getting married, while another complains about missing his kid's sports day. But our protagonist sits silently, staring at his screen, thinking... a happy family sure sounds nice."
- "The enemy reveals his true power — he wasn't holding back at all. With a single glance, he makes it clear: this fight was never even close."
- "She finally says it. Three words she's been holding back for years. And from the look on his face, he already knew."

DO NOT write: "In this panel..." or "The image shows..."
DO write narration that flows like spoken commentary on a story.

═══════════════════════════════════════
DIALOGUE & CINEMATIC EFFECTS RULES:
═══════════════════════════════════════
1. DIALOGUE: Extract the EXACT text visible in speech or thought bubbles. This will be used for on-screen subtitles. If there is no text, return an empty string "".
2. EFFECTS: Suggest 0 to 2 cinematic effects to apply to this scene based on the mood:
   - "shake": For action, impact, explosions, or intense moments.
   - "flash": For reveals, sudden realizations, or power-ups.
   - "fade_in": For quiet, emotional, or transitional moments.
   Return an array of strings, e.g., ["shake"] or [].

═══════════════════════════════════════
KEYFRAME CINEMATOGRAPHY RULES:
═══════════════════════════════════════
Output is ${aspectDesc}. Coordinate system: x=0 left, y=0 top, w/h are 0–1 fractions.

First, identify "focus_points" (faces, action centers, important objects) with their bounding boxes (x, y, w, h) and type ("face", "action", "object"). Use these to guide your keyframes.

Motion strategy — pick the RIGHT pattern for this panel:

DIALOGUE PANEL (speech bubbles, characters talking):
  t=0: Full panel (x:0, y:0, w:1, h:1)
  t=1.5: Zoom to first speaker's bubble + face
  t=3.5: Pan to second speaker or their bubble
  t=5.5: Hold on most emotional element (thought bubble, reaction face)

ACTION PANEL (fight, power, impact):
  t=0: Full panel
  t=1.5: Push into the action/impact point
  t=4: Zoom in tighter for dramatic hold

REACTION PANEL (close-up face, emotion):
  t=0: Slight pull back from full (w:0.9, h:0.9)
  t=3: Slow push into the face
  t=6: Very tight on eyes/expression

REVEAL PANEL (something surprising shown):
  t=0: Start slightly cropped away from the reveal
  t=2: Slowly pan/zoom to reveal the key element
  t=5: Hold tight on the reveal

KEYFRAME CONSTRAINTS:
- First t must be 0.0, last t should be 6–9 (scaled to audio length by renderer)
- x + w ≤ 1.0, y + h ≤ 1.0
- Minimum w ≥ 0.3, h ≥ 0.3
- ${aspectRatio === "9:16" || aspectRatio === "4:5" ? "Portrait-friendly: prefer tall crops (w:0.5, h:0.65) over wide crops" : "Landscape/Square-friendly: ensure crops fit well within the frame without awkward black bars"}
- 3–5 keyframes total, each segment 1.5–2.5s apart

CRITICAL MOTION CONSTRAINTS:
- SMOOTHNESS: The camera must move slowly. Never jump more than 0.15 in x or y coordinates between keyframes.
- CONTINUITY: If you move Left, the next keyframe must be near the Left. Do not jump Left then instantly Right.
- ASPECT RATIO: The output is ${aspectDesc}. 
  - If source is Portrait (9:16) and output is Landscape (16:9), you MUST pan vertically (y: 0.0 -> 0.5) to show the whole image over time.
  - Prefer slow zooms (w: 1.0 -> 0.8) over fast pans.

Return ONLY the JSON object.`;

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      prompt,
    ]);

    const raw = result.response.text().trim();
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    // 🆕 Parse the new fields safely
    const parsed = JSON.parse(clean) as {
      narration: string;
      dialogue?: string;
      effects?: string[];
      keyframes: Keyframe[];
    };

    // Keep your exact, robust keyframe validation logic
    let kfs: Keyframe[] = (parsed.keyframes || [])
      .filter(
        (kf) =>
          typeof kf.t === "number" &&
          typeof kf.x === "number" &&
          kf.x >= 0 &&
          kf.x < 1 &&
          typeof kf.y === "number" &&
          kf.y >= 0 &&
          kf.y < 1 &&
          typeof kf.w === "number" &&
          kf.w >= 0.25 &&
          kf.w <= 1 &&
          typeof kf.h === "number" &&
          kf.h >= 0.25 &&
          kf.h <= 1 &&
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

    if (kfs.length === 0 || kfs[0].t > 0.1) {
      kfs.unshift({ t: 0, x: 0, y: 0, w: 1, h: 1 });
    } else {
      kfs[0].t = 0;
    }

    if (kfs.length < 2) {
      kfs = [
        { t: 0, x: 0, y: 0, w: 1, h: 1 },
        { t: 2.5, x: 0.1, y: 0.05, w: 0.75, h: 0.75 },
        { t: 6.0, x: 0.15, y: 0.1, w: 0.6, h: 0.75 },
      ];
    }

    return NextResponse.json({
      narration: parsed.narration?.trim() ?? "",
      dialogue: parsed.dialogue?.trim() ?? "", // 🆕 Return exact dialogue
      effects: parsed.effects ?? [], // 🆕 Return cinematic effects
      keyframes: kfs,
    });
  } catch (error) {
    console.error("[analyze-panel] error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
