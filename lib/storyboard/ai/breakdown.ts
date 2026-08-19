import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeImageWithOpenRouter } from "@/lib/openrouter";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export interface GeneratedShotData {
  orderIndex: number;
  description: string;
  shotType: string;
  cameraAngle: string;
  perspective: string;
  movement: string;
  duration: number;
  dialogue?: string;
  characterNames: string[];
}

export interface GeneratedSceneData {
  orderIndex: number;
  title: string;
  description: string;
  narrationText: string;
  durationEstimate: number;
  shots: GeneratedShotData[];
}

export interface GeneratedCharacterData {
  name: string;
  description: string;
  clothing: string;
  consistencyNotes: string;
}

export interface BreakdownResult {
  title: string;
  synopsis: string;
  scenes: GeneratedSceneData[];
  characters: GeneratedCharacterData[];
}

function parseJsonWithRepair(raw: string): any {
  let clean = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through
      }
    }
    const repaired = clean
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":');
    return JSON.parse(repaired);
  }
}

export async function generateSceneBreakdown(params: {
  scriptText: string;
  genre: string;
  title?: string;
}): Promise<BreakdownResult> {
  const { scriptText, genre, title = "Untitled Storyboard" } = params;

  const prompt = `You are a legendary Hollywood film director, master storyboard artist, and visual cinematographer specializing in "${genre}" storytelling.

Analyze the following script or story concept and produce a comprehensive, structured scene-by-scene storyboard breakdown and character roster.

PROJECT TITLE SUGGESTION: ${title}
GENRE: ${genre}

STORY INPUT:
"""
${scriptText.slice(0, 15000)}
"""

CRITICAL STORYBOARD ART DIRECTION RULES:
1. VISUAL KEYFRAME FORMATTING (NOT SCREENPLAY PROSE):
   - Image models generate 1 static frozen frame at a time.
   - NEVER use temporal literature or motion words like "Suddenly", "quick cuts", "afterwards", "meanwhile", or "as time passes".
   - NEVER describe negative action transitions (e.g. do NOT write "the lights turn off" or "lanterns extinguish" — instead describe the concrete visual state: "pitch-black darkness, cold blue moonlight on cobblestone, dark unlit glass lanterns, terrified villagers staring into shadows").
2. SCENE-WIDE ENVIRONMENTAL CONTINUITY:
   - In each scene's "description", establish the definitive visual setting: architecture, location landmarks, time-of-day, ambient lighting direction, and color temperature.
   - Every shot within the same scene MUST explicitly stay anchored in that exact environment so consecutive shots feel like one seamless continuous film sequence.
3. CHARACTER VISUAL ANCHORS:
   - Identify every distinct character with specific physical features, signature hairstyle, clothing materials, and visual anchors so model sheets can maintain 100% identity locking across shots.
   - In shot descriptions, explicitly state which characters are in frame, their exact poses, emotional expressions, and spatial placement (foreground/midground/background).

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object matching this exact schema:
{
  "title": "A captivating, polished title for the storyboard project",
  "synopsis": "A 2-3 sentence overview of the narrative arc and tone",
  "characters": [
    {
      "name": "Character Name",
      "description": "Physical appearance, age, hair color/style, eye color, facial features",
      "clothing": "Signature outfit, materials, colors, accessories",
      "consistencyNotes": "Key visual anchors that must stay identical across all shots (e.g. scar over left eye, emerald tunic, silver belt buckle)"
    }
  ],
  "scenes": [
    {
      "orderIndex": 0,
      "title": "Scene 1: Scene Headline",
      "description": "Definitive visual setting: exact location architecture, time-of-day, ambient lighting, color palette, and atmosphere",
      "narrationText": "Engaging spoken voiceover / narration for this scene (2-4 sentences)",
      "durationEstimate": 5.0,
      "shots": [
        {
          "orderIndex": 0,
          "description": "Concrete frozen keyframe description: environment setting, lighting sources/shadows, character pose/expression/placement",
          "shotType": "wide | medium | close-up | extreme-close-up | pov | establishing",
          "cameraAngle": "eye-level | low-angle | high-angle | birds-eye | dutch-angle | over-the-shoulder",
          "perspective": "1-point | 2-point | 3-point | isometric | panoramic",
          "movement": "static | pan-left | pan-right | tilt-up | tilt-down | zoom-in | zoom-out | tracking | handheld",
          "duration": 3.5,
          "dialogue": "Spoken dialogue in quotes or empty string if silent",
          "characterNames": ["Character Name"]
        }
      ]
    }
  ]
}

RULES:
- Divide the story into 3 to 8 structured, coherent dramatic scenes.
- Each scene should contain 2 to 4 detailed keyframe shots.
- Pacing must match the "${genre}" genre.

Return ONLY the JSON object.`;

  // Layer 1: Gemini 2.5 Flash / Pro
  try {
    if (process.env.GEMINI_API_KEY) {
      const model = genai.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const parsed = parseJsonWithRepair(text);
      if (parsed?.scenes?.length) {
        return parsed as BreakdownResult;
      }
    }
  } catch (error: any) {
    console.warn("[generateSceneBreakdown] Gemini failed, falling back:", error.message);
  }

  // Layer 2: OpenRouter Text Fallback
  try {
    if (process.env.OPENROUTER_API_KEY) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          models: ["google/gemini-2.5-flash", "meta-llama/llama-3.3-70b-instruct"],
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = parseJsonWithRepair(content);
          if (parsed?.scenes?.length) {
            return parsed as BreakdownResult;
          }
        }
      }
    }
  } catch (orError: any) {
    console.error("[generateSceneBreakdown] OpenRouter failed:", orError.message);
  }

  // Fallback default structure if AI is offline
  return {
    title: title || "Storyboard Project",
    synopsis: "An engaging cinematic sequence based on the story concept.",
    characters: [
      {
        name: "Protagonist",
        description: "Young adult with sharp determined eyes and messy dark hair",
        clothing: "Dark utility jacket with high collar and silver zipper",
        consistencyNotes: "Always wears high collar utility jacket, amber eyes",
      },
    ],
    scenes: [
      {
        orderIndex: 0,
        title: "Scene 1: The Inciting Incident",
        description: "The story opens with dramatic atmosphere establishing the mood.",
        narrationText: "In the heart of the city, an unexpected event alters the course of history.",
        durationEstimate: 5,
        shots: [
          {
            orderIndex: 0,
            description: "Wide establishing shot of the sprawling environment with dramatic atmospheric lighting.",
            shotType: "establishing",
            cameraAngle: "high-angle",
            perspective: "1-point",
            movement: "pan-left",
            duration: 3,
            dialogue: "",
            characterNames: [],
          },
          {
            orderIndex: 1,
            description: "Medium close-up of the protagonist looking toward the horizon with intense focus.",
            shotType: "close-up",
            cameraAngle: "eye-level",
            perspective: "2-point",
            movement: "zoom-in",
            duration: 3,
            dialogue: "It begins now.",
            characterNames: ["Protagonist"],
          },
        ],
      },
    ],
  };
}
