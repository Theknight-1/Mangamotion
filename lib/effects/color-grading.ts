// lib/effects/color-grading.ts
//
// Detects scene emotion from narration text (pure keyword matching, free,
// no API call) and maps it to an FFmpeg color grading filter string.
// Used by the render pipeline to give each scene a distinct cinematic feel.

export type Emotion =
  | "action"
  | "drama"
  | "horror"
  | "comedy"
  | "romance"
  | "mystery";

interface EmotionProfile {
  contrast: number;
  brightness: number;
  saturation: number;
  gamma: number;
}

// NOTE: vignette and colorbalance filters are NOT universally available in
// all ffmpeg-static builds. We stick to `eq` only — it's compiled into every
// ffmpeg build, including the gyan.dev Windows build and ffmpeg-static's Linux
// binary. This avoids the "Filter not found" crash we hit before with vignette.
export const EMOTION_PROFILES: Record<Emotion, EmotionProfile> = {
  action: { contrast: 1.18, brightness: 0.03, saturation: 1.12, gamma: 1.05 },
  drama: { contrast: 1.08, brightness: -0.02, saturation: 0.95, gamma: 0.98 },
  horror: { contrast: 1.3, brightness: -0.1, saturation: 0.75, gamma: 0.88 },
  comedy: { contrast: 1.04, brightness: 0.06, saturation: 1.15, gamma: 1.04 },
  romance: { contrast: 1.0, brightness: 0.04, saturation: 1.18, gamma: 1.02 },
  mystery: { contrast: 1.12, brightness: -0.03, saturation: 0.85, gamma: 0.92 },
};

const EMOTION_KEYWORDS: Record<Emotion, string[]> = {
  action: [
    "fight",
    "battle",
    "attack",
    "power",
    "explosion",
    "strike",
    "clash",
    "punch",
    "kick",
    "war",
  ],
  drama: [
    "sad",
    "cry",
    "tears",
    "loss",
    "goodbye",
    "alone",
    "pain",
    "suffer",
    "silent",
    "lonely",
  ],
  horror: [
    "fear",
    "dark",
    "monster",
    "terror",
    "scream",
    "death",
    "evil",
    "nightmare",
    "blood",
  ],
  comedy: [
    "laugh",
    "funny",
    "joke",
    "hilarious",
    "smile",
    "prank",
    "silly",
    "giggle",
  ],
  romance: [
    "love",
    "heart",
    "kiss",
    "together",
    "romance",
    "date",
    "beautiful",
    "blush",
  ],
  mystery: [
    "mystery",
    "secret",
    "investigate",
    "clue",
    "hidden",
    "discover",
    "unknown",
    "suspect",
  ],
};

/**
 * Detect the dominant emotion in a piece of narration text using keyword counts.
 * Falls back to 'drama' if no keywords match — drama is the safest neutral default
 * for manga narration tone.
 */
export function detectEmotion(narration: string): Emotion {
  if (!narration?.trim()) return "drama";

  const lower = narration.toLowerCase();
  let bestEmotion: Emotion = "drama";
  let bestScore = 0;

  for (const [emotion, words] of Object.entries(EMOTION_KEYWORDS) as [
    Emotion,
    string[],
  ][]) {
    let score = 0;
    for (const word of words) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const matches = lower.match(regex);
      score += matches?.length ?? 0;
    }
    if (score > bestScore) {
      bestScore = score;
      bestEmotion = emotion;
    }
  }

  return bestScore > 0 ? bestEmotion : "drama";
}

/**
 * Build the FFmpeg `eq` filter string for a given emotion.
 * Safe to chain into any existing filter array with `.push()`.
 */
export function getColorGradingFilter(emotion: Emotion): string {
  const p = EMOTION_PROFILES[emotion] ?? EMOTION_PROFILES.drama;
  return `eq=contrast=${p.contrast}:brightness=${p.brightness}:saturation=${p.saturation}:gamma=${p.gamma}`;
}
