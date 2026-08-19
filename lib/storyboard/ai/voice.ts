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
  { id: "a8ea5c09-58bd-40ec-aece-2ffa6b862685", name: "Morgan Freeman — Deep Cinematic Narrator", gender: "male" },
  { id: "9a0c7265-d7ee-4eb7-bfb4-8076c981e0d4", name: "Jenna Ortega — Expressive Storyteller", gender: "female" },
  { id: "00f96196-e087-4674-aed1-7f6c451752e2", name: "Markiplier — Dramatic Thriller Voice", gender: "male" },
  { id: "8df1664d-0379-4d57-9088-e5b77bb04cbc", name: "Estelle — Anime Narrator", gender: "female" },
  { id: "08350065-cd0d-4ebf-a5df-ff9bccde241b", name: "Kevin Costner — Documentary / Action", gender: "male" },
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
