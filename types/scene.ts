  // types/scene.ts — shared across all components and API routes

  export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";

  // ... rest of your types

  export interface Keyframe {
    t: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }

  export interface SceneVoice {
    audioUrl: string;
    duration: number;
    text: string;
  }

  export type SceneStatus =
    | "idle"
    | "analyzing"
    | "ready"
    | "generating_voice"
    | "done";

  export type Emotion =
    | "action"
    | "drama"
    | "horror"
    | "comedy"
    | "romance"
    | "mystery";

  export interface Scene {
    id: string;
    index: number;
    imageUrl: string;
    narration: string;
    keyframes: Keyframe[];
    voiceId: string;
    voice?: SceneVoice;
    status: SceneStatus;
    clipUrl?: string;

    // Detected from narration text via keyword matching (free, no API call).
    // Drives per-scene FFmpeg color grading in the render pipeline.
    emotion?: Emotion;

    // Cinematic effects applied to this scene (e.g. "shake", "flash", "fade_in")
    effects?: string[];

    // Extracted dialogue text for on-screen subtitles / VTT generation
    dialogue?: string;
  }