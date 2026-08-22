import { generateVoice } from "@/lib/cvoice";

export interface GenerateSceneVoiceParams {
  sceneId: string;
  projectId: string;
  narrationText: string;
  voiceId?: string;
  speed?: number;
  pitch?: number;
}

export const DEFAULT_STORYBOARD_VOICE_ID = "a8ea5c09-58bd-40ec-aece-2ffa6b862685";

export const STORYBOARD_VOICES = [
  { id: "a8ea5c09-58bd-40ec-aece-2ffa6b862685", name: "Morgan Freeman — Deep Cinematic Narrator", gender: "male", tag: "Narrator / Deep" },
  { id: "9a0c7265-d7ee-4eb7-bfb4-8076c981e0d4", name: "Jenna Ortega — Expressive Storyteller", gender: "female", tag: "Young Female / Mystery" },
  { id: "00f96196-e087-4674-aed1-7f6c451752e2", name: "Markiplier — Dramatic Thriller Voice", gender: "male", tag: "Energetic Male / Action" },
  { id: "8df1664d-0379-4d57-9088-e5b77bb04cbc", name: "Estelle — Anime Narrator", gender: "female", tag: "Anime / Gentle Female" },
  { id: "08350065-cd0d-4ebf-a5df-ff9bccde241b", name: "Kevin Costner — Documentary / Action", gender: "male", tag: "Grounded / Mature Male" },
  { id: "00a77add-48d0-4088-b16b-695e5bd0fb73", name: "Jungkook — Youthful & Crisp", gender: "male", tag: "Young Hero / Modern" },
  { id: "550e8400-e29b-41d4-a716-446655440000", name: "Scarlett — Seductive & Elegant", gender: "female", tag: "Heroine / Elegant" },
  { id: "7c9e6679-7425-40de-944b-e07fc1f90ae7", name: "David Attenborough — Naturalist & Epic", gender: "male", tag: "Wise Elder / Lore" },
  { id: "b2d8e4f1-9c3a-4e2b-8a5f-1e9c7d3b5a8e", name: "Aria — Vibrant Anime Protagonist", gender: "female", tag: "High-Energy / Adventure" },
  { id: "e1f3a5c7-8b9d-4e2f-a1c3-6b8d0e2f4a6c", name: "Geralt — Gritty Warrior", gender: "male", tag: "Anti-Hero / Rough" },
];

// Map any legacy placeholder IDs to valid CVoice UUIDs
const LEGACY_VOICE_MAP: Record<string, string> = {
  "en-US-1": "a8ea5c09-58bd-40ec-aece-2ffa6b862685",
  "en-US-2": "9a0c7265-d7ee-4eb7-bfb4-8076c981e0d4",
  "en-US-3": "00f96196-e087-4674-aed1-7f6c451752e2",
  "en-US-4": "8df1664d-0379-4d57-9088-e5b77bb04cbc",
  "en-US-5": "08350065-cd0d-4ebf-a5df-ff9bccde241b",
};

export async function generateSceneVoiceAudio(
  params: GenerateSceneVoiceParams,
): Promise<{ audioUrl: string; duration: number }> {
  const { narrationText, voiceId = DEFAULT_STORYBOARD_VOICE_ID, speed = 1.0, pitch = 0 } = params;

  if (!narrationText || !narrationText.trim()) {
    throw new Error("Narration text is required for voice generation");
  }

  // Resolve legacy IDs if present
  const resolvedVoiceId = LEGACY_VOICE_MAP[voiceId] || voiceId || DEFAULT_STORYBOARD_VOICE_ID;

  try {
    const result = await generateVoice({
      text: narrationText.trim(),
      voiceId: resolvedVoiceId,
      speed,
      pitch,
    });

    return {
      audioUrl: result.audioUrl,
      duration: result.duration || Math.max(3, Math.ceil(narrationText.length / 15)),
    };
  } catch (error: any) {
    console.error("[generateSceneVoiceAudio] Error:", error.message);
    throw error;
  }
}
