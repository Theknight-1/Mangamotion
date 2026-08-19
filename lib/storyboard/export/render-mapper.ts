import type { Scene, Keyframe, Emotion } from "@/types/scene";
import type { StoryboardShot, StoryboardScene } from "@/types/storyboard";

/**
 * Builds dynamic keyframes matching the shot's specified camera movement.
 */
function buildKeyframesForMovement(movement?: string | null): Keyframe[] {
  switch (movement) {
    case "zoom-in":
      return [
        { t: 0, x: 0, y: 0, w: 1, h: 1 },
        { t: 0.5, x: 0.05, y: 0.05, w: 0.9, h: 0.9 },
        { t: 1.0, x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
      ];
    case "zoom-out":
      return [
        { t: 0, x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
        { t: 0.5, x: 0.05, y: 0.05, w: 0.9, h: 0.9 },
        { t: 1.0, x: 0, y: 0, w: 1, h: 1 },
      ];
    case "pan-left":
      return [
        { t: 0, x: 0.15, y: 0, w: 0.85, h: 1 },
        { t: 1.0, x: 0, y: 0, w: 0.85, h: 1 },
      ];
    case "pan-right":
      return [
        { t: 0, x: 0, y: 0, w: 0.85, h: 1 },
        { t: 1.0, x: 0.15, y: 0, w: 0.85, h: 1 },
      ];
    case "tilt-up":
      return [
        { t: 0, x: 0, y: 0.15, w: 1, h: 0.85 },
        { t: 1.0, x: 0, y: 0, w: 1, h: 0.85 },
      ];
    case "tilt-down":
      return [
        { t: 0, x: 0, y: 0, w: 1, h: 0.85 },
        { t: 1.0, x: 0, y: 0.15, w: 1, h: 0.85 },
      ];
    case "handheld":
      return [
        { t: 0, x: 0.02, y: 0.02, w: 0.96, h: 0.96 },
        { t: 0.3, x: 0.04, y: 0.01, w: 0.95, h: 0.95 },
        { t: 0.7, x: 0.01, y: 0.03, w: 0.96, h: 0.96 },
        { t: 1.0, x: 0.03, y: 0.02, w: 0.95, h: 0.95 },
      ];
    default:
      // Subtle cinematic drift
      return [
        { t: 0, x: 0, y: 0, w: 1, h: 1 },
        { t: 1.0, x: 0.03, y: 0.02, w: 0.94, h: 0.94 },
      ];
  }
}

function resolveEmotionFromGenre(genre?: string | null): Emotion {
  const g = (genre || "").toLowerCase();
  if (g.includes("action") || g.includes("thriller")) return "action";
  if (g.includes("horror")) return "horror";
  if (g.includes("comedy")) return "comedy";
  if (g.includes("romance")) return "romance";
  if (g.includes("mystery")) return "mystery";
  if (g.includes("fantasy") || g.includes("sci")) return "awe";
  return "drama";
}

/**
 * Maps Storyboard Studio shots & scenes directly to the Manga Recap render pipeline format.
 */
export function mapStoryboardToRenderScenes(params: {
  shots: StoryboardShot[];
  scenes: StoryboardScene[];
  genre?: string | null;
}): Scene[] {
  const { shots, scenes, genre } = params;
  const sceneMap = new Map(scenes.map((s) => [s.id, s]));

  const emotion = resolveEmotionFromGenre(genre);

  return shots
    .filter((shot) => Boolean(shot.generatedImageUrl))
    .map((shot, index) => {
      const parentScene = shot.sceneId ? sceneMap.get(shot.sceneId) : null;
      const duration = shot.duration || parentScene?.durationEstimate || 3;
      const narration =
        shot.draftNarration ||
        parentScene?.narrationText ||
        shot.description ||
        "";
      const keyframes = buildKeyframesForMovement(shot.movement);

      const mappedScene: Scene = {
        id: shot.id,
        index,
        imageUrl: shot.generatedImageUrl!,
        narration,
        keyframes,
        voiceId: "en-US-1",
        status: "ready",
        emotion,
        dialogue: shot.dialogue || undefined,
        effects: shot.movement === "handheld" ? ["shake"] : [],
      };

      if (parentScene?.voiceAudioUrl) {
        mappedScene.voice = {
          audioUrl: parentScene.voiceAudioUrl,
          duration,
          text: narration,
        };
      }

      return mappedScene;
    });
}
