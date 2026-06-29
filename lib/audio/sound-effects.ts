// lib/audio/sound-effects.ts

export interface SoundEffect {
  id: string;
  name: string;
  category:
    | "impact"
    | "whoosh"
    | "ambient"
    | "magic"
    | "emphasis"
    | "transition";
  url: string;
  duration: number;
  tags: string[];
  volume: number;
}

// Pre-defined sound effect presets
export const SOUND_EFFECTS: SoundEffect[] = [
  {
    id: "whoosh-fast",
    name: "Fast Whoosh",
    category: "whoosh",
    url: "/sfx/whoosh-fast.mp3",
    duration: 0.3,
    tags: ["action", "speed", "movement"],
    volume: 0.8,
  },
  {
    id: "impact-heavy",
    name: "Heavy Impact",
    category: "impact",
    url: "/sfx/impact-heavy.mp3",
    duration: 0.5,
    tags: ["action", "fight", "explosion"],
    volume: 1.0,
  },
  {
    id: "dramatic-reveal",
    name: "Dramatic Reveal",
    category: "emphasis",
    url: "/sfx/dramatic-reveal.mp3",
    duration: 1.5,
    tags: ["drama", "reveal", "suspense"],
    volume: 0.9,
  },
  {
    id: "magic-sparkle",
    name: "Magic Sparkle",
    category: "magic",
    url: "/sfx/magic-sparkle.mp3",
    duration: 1.0,
    tags: ["magic", "fantasy", "transformation"],
    volume: 0.7,
  },
  {
    id: "ambient-tension",
    name: "Tension Builder",
    category: "ambient",
    url: "/sfx/ambient-tension.mp3",
    duration: 3.0,
    tags: ["horror", "suspense", "thriller"],
    volume: 0.5,
  },
];

// Auto-select sound effects based on scene content
export function autoSelectSoundEffects(
  narration: string,
  effects: string[] = [],
  emotion: string = "drama",
): SoundEffect[] {
  const selected: SoundEffect[] = [];

  // Check narration keywords
  const actionWords = [
    "fight",
    "battle",
    "attack",
    "strike",
    "hit",
    "punch",
    "kick",
  ];
  const magicWords = [
    "magic",
    "spell",
    "transform",
    "power",
    "energy",
    "light",
  ];
  const dramaticWords = ["reveal", "appear", "discover", "find", "secret"];

  if (
    effects.includes("shake") ||
    actionWords.some((w) => narration.toLowerCase().includes(w))
  ) {
    selected.push(SOUND_EFFECTS.find((s) => s.id === "impact-heavy")!);
    selected.push(SOUND_EFFECTS.find((s) => s.id === "whoosh-fast")!);
  }

  if (magicWords.some((w) => narration.toLowerCase().includes(w))) {
    selected.push(SOUND_EFFECTS.find((s) => s.id === "magic-sparkle")!);
  }

  if (
    dramaticWords.some((w) => narration.toLowerCase().includes(w)) ||
    emotion === "drama"
  ) {
    selected.push(SOUND_EFFECTS.find((s) => s.id === "dramatic-reveal")!);
  }

  if (emotion === "horror") {
    selected.push(SOUND_EFFECTS.find((s) => s.id === "ambient-tension")!);
  }

  return selected.filter((s): s is SoundEffect => s !== undefined);
}

// Generate ffmpeg audio filter for sound effects
export function generateSFXFilter(
  effects: SoundEffect[],
  sceneStartTime: number,
  sceneDuration: number,
): string {
  if (effects.length === 0) return "";

  const filterParts = effects.map((sfx, index) => {
    const delay = sceneStartTime + (index * sceneDuration) / effects.length;
    return `[${index + 1}:a]adelay=${delay * 1000}|${delay * 1000},volume=${sfx.volume}[sfx${index}]`;
  });

  return filterParts.join(";");
}
