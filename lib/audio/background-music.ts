// lib/audio/background-music.ts

export interface BGMTrack {
  id: string;
  title: string;
  mood: string;
  intensity: "low" | "medium" | "high";
  bpm: number;
  url: string;
  duration: number;
  loopable: boolean;
}

export const BGM_LIBRARY: BGMTrack[] = [
  {
    id: "action-epic",
    title: "Epic Battle",
    mood: "action",
    intensity: "high",
    bpm: 140,
    url: "/bgm/action-epic.mp3",
    duration: 120,
    loopable: true,
  },
  {
    id: "drama-emotional",
    title: "Emotional Journey",
    mood: "drama",
    intensity: "medium",
    bpm: 80,
    url: "/bgm/drama-emotional.mp3",
    duration: 180,
    loopable: true,
  },
  {
    id: "mystery-tension",
    title: "Dark Mystery",
    mood: "mystery",
    intensity: "low",
    bpm: 60,
    url: "/bgm/mystery-tension.mp3",
    duration: 150,
    loopable: true,
  },
  {
    id: "comedy-upbeat",
    title: "Happy Days",
    mood: "comedy",
    intensity: "medium",
    bpm: 120,
    url: "/bgm/comedy-upbeat.mp3",
    duration: 100,
    loopable: true,
  },
];

export function selectBackgroundMusic(
  scenes: Array<{ emotion?: string; effects?: string[] }>,
  totalDuration: number,
): BGMTrack | null {
  // Determine overall mood from scenes
  const moodScores: Record<string, number> = {};

  scenes.forEach((scene) => {
    const emotion = scene.emotion || "drama";
    moodScores[emotion] = (moodScores[emotion] || 0) + 1;
  });

  const dominantMood =
    Object.entries(moodScores).sort((a, b) => b[1] - a[1])[0]?.[0] || "drama";

  // Find matching track
  const matching = BGM_LIBRARY.filter((t) => t.mood === dominantMood);

  if (matching.length === 0) return null;

  // Select based on duration
  const bestMatch = matching.find(
    (t) => t.duration >= totalDuration && t.loopable,
  );
  return bestMatch || matching[0];
}

// Generate ffmpeg filter for background music with ducking
export function generateBGMFilter(
  bgmTrack: BGMTrack,
  totalDuration: number,
  voiceVolume: number = 1.0,
  bgmVolume: number = 0.3,
): string {
  return `
    [2:a]volume=${bgmVolume},aloop=loop=-1:size=2e+09[bgm];
    [1:a]volume=${voiceVolume}[voice];
    [voice]asplit[voice_sidechain][voice_out];
    [bgm][voice_sidechain]sidechaincompress=threshold=0.1:ratio=4:attack=5:release=200[bgm_ducked];
    [bgm_ducked][voice_out]amix=inputs=2:duration=first:dropout_transition=3,atrim=duration=${totalDuration}[aout]
  `;
}
