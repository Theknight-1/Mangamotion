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

export interface GeneratedLocationData {
  name: string;
  description: string;
  lightingNotes: string;
}

export interface GeneratedObjectData {
  name: string;
  description: string;
  importance: "key_prop" | "recurring" | "background";
}

export interface BreakdownResult {
  title: string;
  synopsis: string;
  scenes: GeneratedSceneData[];
  characters: GeneratedCharacterData[];
  locations: GeneratedLocationData[];
  objects: GeneratedObjectData[];
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

  const prompt = `You are a master Hollywood screenwriter, executive storyboard director, and visual cinematographer specializing in "${genre}" storytelling.

Your task is to analyze the following story/script and convert it into a production-ready, highly cinematic Storyboard Package consisting of:
1. Complete, scene-by-scene SCREENPLAY NARRATIVE with full character action, dialogue, and beats.
2. Definitive ENVIRONMENTAL CONTINUITY ANCHORS for each scene (location, lighting sources, architecture, key props).
3. A meticulously detailed CHARACTER ROSTER with locked visual anchors (facial traits, hairstyle, exact clothing layers, colors, materials).
4. Granular, cinema-grade SHOTLIST (4 to 8 distinct shots per scene) capturing every dramatic beat, camera angle, character pose, insert/close-up, and dialogue exchange.

PROJECT TITLE SUGGESTION: ${title}
GENRE: ${genre}

STORY INPUT:
"""
${scriptText.slice(0, 15000)}
"""

CRITICAL PRODUCTION RULES:

1. SCREENPLAY FIDELITY & DIALOGUE PRESERVATION:
   - In each scene's "narrationText", provide the FULL, evocative screenplay narrative.
   - Do NOT summarize or write a generic voiceover! Preserve every joke, character beat, physical action, prop detail, and quote all character dialogue in full (e.g. Dave mutters: "Why do they even make shelves that need assembly?").
   - Maintain the authentic pacing, comedic/dramatic tone, and natural progression of the story.

2. SCENE-WIDE ENVIRONMENTAL CONTINUITY ANCHORS:
   - In each scene's "description", define the exact physical environment: room/location layout, specific lighting sources (e.g. "single warm leaning floor lamp in the corner casting dramatic golden shadows"), background architecture (e.g. "half-assembled pine bookshelf, dark teal couch, hardwood floor scattered with cardboard and screws"), and ambient color grading.
   - This environmental anchor will be injected into every shot within the scene to guarantee seamless visual continuity.

3. CHARACTER IDENTITY LOCKING:
   - For every character, define specific, invariant physical traits: age, facial features, hair style and color, and an EXACT signature outfit (e.g. "heather-grey crewneck t-shirt and blue denim jeans" or "burgundy zip-up hoodie over white tee").
   - Consistency Notes must include signature visual anchors so character model sheets lock their identity across all shots.

4. GRANULAR CINEMATIC SHOT DECOMPOSITION:
   - Break down each scene into 4 to 8 granular, progressive storyboard shots (Wide establishing -> Medium action -> Close-up insert -> Character entrance -> Reaction -> Over-the-shoulder / two-shot).
   - In each shot's "description": Describe a CONCRETE, FROZEN KEYFRAME. Explicitly name every character present, their exact spatial pose, emotional expression, visual interaction with props, and camera lighting.
   - In each shot's "characterNames": Explicitly list ALL characters visible in that frame (e.g. ["Dave", "Tina"]). If the scene features multiple characters interacting, list everyone in frame. NEVER leave out visible characters.
   - In each shot's "dialogue": Include the specific spoken dialogue line occurring during that shot, or empty string if silent/action.

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON object matching this exact schema:
{
  "title": "A captivating, polished title for the storyboard project",
  "synopsis": "A compelling 2-3 sentence overview of the narrative arc, characters, and dramatic tone",
  "characters": [
    {
      "name": "Character Name",
      "description": "Specific physical appearance, age, face shape, eye color, distinct hairstyle and hair color",
      "clothing": "Exact signature outfit: garment types, layers, colors, materials, footwear, and accessories",
      "consistencyNotes": "Visual identity anchors to lock across all shots (e.g. disheveled wavy brown hair, heather-grey crewneck, blue jeans)"
    }
  ],
  "scenes": [
    {
      "orderIndex": 0,
      "title": "Scene 1: Scene Headline / Location Heading",
      "description": "Definitive visual setting: exact location layout, background architecture, primary lighting sources (e.g. leaning floor lamp), color temperature, and key props",
      "narrationText": "Full screenplay scene text: complete character actions, environment interactions, physical comedy/drama, and formatted character dialogue in quotes",
      "durationEstimate": 8.0,
      "shots": [
        {
          "orderIndex": 0,
          "description": "Concrete frozen keyframe: explicitly name characters in frame, their exact poses, facial expressions, spatial placement (foreground/background), interaction with props, and lighting atmosphere",
          "shotType": "wide | medium | close-up | extreme-close-up | pov | establishing | over-the-shoulder",
          "cameraAngle": "eye-level | low-angle | high-angle | birds-eye | dutch-angle | over-the-shoulder",
          "perspective": "1-point | 2-point | 3-point | isometric | panoramic",
          "movement": "static | pan-left | pan-right | tilt-up | tilt-down | zoom-in | zoom-out | tracking | handheld",
          "duration": 3.0,
          "dialogue": "Character dialogue line for this specific shot or empty string",
          "characterNames": ["Dave"]
        }
      ]
    }
  ],
  "locations": [
    {
      "name": "Distinct location name (e.g. Dave's Apartment - Living Room)",
      "description": "Physical layout, architecture, furniture, notable background elements, color palette of the space",
      "lightingNotes": "Primary and secondary light sources, color temperature, time of day, ambient mood (e.g. warm leaning floor lamp casting golden shadows, blue-tinted window moonlight)"
    }
  ],
  "objects": [
    {
      "name": "Object or prop name (e.g. SuperBond Ultra Tube)",
      "description": "Visual details: shape, size, color, material, branding, distinctive features",
      "importance": "key_prop | recurring | background"
    }
  ]
}

5. LOCATION EXTRACTION:
   - Extract EVERY distinct physical location from the story.
   - Include room names, outdoor locations, building interiors.
   - Each location must have detailed lighting notes for visual consistency.

6. OBJECT & PROP EXTRACTION:
   - Extract significant objects, props, and items mentioned in the story.
   - Mark importance: "key_prop" for story-central items (the glue tube, the magic sword), "recurring" for items appearing across multiple scenes (a tote bag, a car), "background" for set dressing.
   - Only extract objects that would need visual consistency across shots.

Divide the story into 3 to 6 rich dramatic scenes.
Generate 4 to 8 granular, cinema-grade keyframe shots per scene.

MANDATORY SHOT DIVERSITY RULES:
- Each scene's shots MUST use a varied progression of shot types: start with a WIDE or ESTABLISHING shot, progress through MEDIUM shots for action, use CLOSE-UP or EXTREME-CLOSE-UP for emotional beats and inserts, and include at least one OVER-THE-SHOULDER or REACTION shot for dialogue exchanges.
- NO two consecutive shots may have the same shotType. If shot N is "medium", shot N+1 MUST be different (e.g. "close-up", "wide", "over-the-shoulder", "pov").
- Each shot description must describe a VISUALLY DISTINCT frozen frame. Two shots showing "both characters leaning toward each other" is NOT allowed — one should be a wide two-shot, the next a close-up of one character's face, etc.

Return ONLY the JSON object.`;

  // Layer 1: Gemini 2.5 Flash / Pro
  try {
    if (process.env.GEMINI_API_KEY) {
      const model = genai.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16384,
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
    locations: [
      {
        name: "Primary Setting",
        description: "Atmospheric location with dramatic cinematic lighting",
        lightingNotes: "Warm ambient glow with deep contrast shadows",
      },
    ],
    objects: [
      {
        name: "Key Story Item",
        description: "Significant object central to the plot",
        importance: "key_prop",
      },
    ],
  };
}
