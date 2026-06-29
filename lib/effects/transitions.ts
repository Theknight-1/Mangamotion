// lib/effects/transitions.ts

export type TransitionType =
  | "fade"
  | "fade_black"
  | "wipe_right"
  | "wipe_left"
  | "wipe_up"
  | "wipe_down"
  | "slide_right"
  | "slide_left"
  | "slide_up"
  | "slide_down"
  | "zoom_in"
  | "zoom_out"
  | "pixelize"
  | "dissolve";

interface TransitionConfig {
  type: TransitionType;
  duration: number; // seconds
  easing?: string;
}

export function getTransitionFilter(
  config: TransitionConfig,
  inputLabels: [string, string] = ["0:v", "1:v"],
): string {
  const { type, duration } = config;
  const [a, b] = inputLabels;

  const transitions: Record<TransitionType, string> = {
    fade: `[${a}][${b}]xfade=transition=fade:duration=${duration}:offset=0`,
    fade_black: `[${a}][${b}]xfade=transition=fadeblack:duration=${duration}:offset=0`,
    wipe_right: `[${a}][${b}]xfade=transition=wiperight:duration=${duration}:offset=0`,
    wipe_left: `[${a}][${b}]xfade=transition=wipeleft:duration=${duration}:offset=0`,
    wipe_up: `[${a}][${b}]xfade=transition=wipeup:duration=${duration}:offset=0`,
    wipe_down: `[${a}][${b}]xfade=transition=wipedown:duration=${duration}:offset=0`,
    slide_right: `[${a}][${b}]xfade=transition=slideright:duration=${duration}:offset=0`,
    slide_left: `[${a}][${b}]xfade=transition=slideleft:duration=${duration}:offset=0`,
    slide_up: `[${a}][${b}]xfade=transition=slideup:duration=${duration}:offset=0`,
    slide_down: `[${a}][${b}]xfade=transition=slidedown:duration=${duration}:offset=0`,
    zoom_in: `[${a}][${b}]xfade=transition=zoomin:duration=${duration}:offset=0`,
    zoom_out: `[${a}][${b}]xfade=transition=zoomout:duration=${duration}:offset=0`,
    pixelize: `[${a}][${b}]xfade=transition=pixelize:duration=${duration}:offset=0`,
    dissolve: `[${a}][${b}]xfade=transition=dissolve:duration=${duration}:offset=0`,
  };

  return transitions[type] || transitions.fade;
}

// Auto-select transition based on scenes
export function autoSelectTransition(
  fromScene: { emotion?: string; effects?: string[] },
  toScene: { emotion?: string; effects?: string[] },
): TransitionConfig {
  // Action scenes get dynamic transitions
  if (
    fromScene.effects?.includes("shake") ||
    toScene.effects?.includes("shake")
  ) {
    return { type: "slide_right", duration: 0.5 };
  }

  // Dramatic scenes get slow transitions
  if (fromScene.emotion === "drama" || toScene.emotion === "drama") {
    return { type: "fade_black", duration: 1.0 };
  }

  // Horror scenes get unsettling transitions
  if (fromScene.emotion === "horror" || toScene.emotion === "horror") {
    return { type: "pixelize", duration: 0.7 };
  }

  // Default smooth transition
  return { type: "fade", duration: 0.5 };
}
