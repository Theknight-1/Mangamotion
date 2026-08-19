import type { StoryboardProject, StoryboardProjectStatus } from "@/types/storyboard";

export interface StoryboardStepConfig {
  id: "genre" | "breakdown" | "style" | "characters" | "board";
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
  path: (projectId: string) => string;
}

export const STORYBOARD_STEPS: StoryboardStepConfig[] = [
  {
    id: "genre",
    stepNumber: 1,
    label: "Genre & Tone",
    shortLabel: "Genre",
    description: "Screenplay genre & tone selection",
    path: (id: string) => `/dashboard/storyboard/${id}/genre`,
  },
  {
    id: "breakdown",
    stepNumber: 2,
    label: "Scene Breakdown",
    shortLabel: "Breakdown",
    description: "Scene beats, pacing & narration",
    path: (id: string) => `/dashboard/storyboard/${id}/breakdown`,
  },
  {
    id: "style",
    stepNumber: 3,
    label: "Visual Style",
    shortLabel: "Style",
    description: "Art style, framing & lighting",
    path: (id: string) => `/dashboard/storyboard/${id}/style`,
  },
  {
    id: "characters",
    stepNumber: 4,
    label: "Character Roster",
    shortLabel: "Characters",
    description: "Model sheets & face consistency",
    path: (id: string) => `/dashboard/storyboard/${id}/characters`,
  },
  {
    id: "board",
    stepNumber: 5,
    label: "Storyboard Studio",
    shortLabel: "Studio Board",
    description: "Multi-shot canvas & director controls",
    path: (id: string) => `/dashboard/storyboard/${id}/board`,
  },
];

/**
 * Maps a storyboard project status to its active / in-progress route
 */
export function getStoryboardStepRoute(project?: Partial<StoryboardProject> | null): string {
  if (!project?.id) return "/dashboard/storyboard";

  const status = project.status;
  switch (status) {
    case "draft":
      return `/dashboard/storyboard/${project.id}/genre`;
    case "breakdown_ready":
      return `/dashboard/storyboard/${project.id}/breakdown`;
    case "style_selected":
      return `/dashboard/storyboard/${project.id}/characters`;
    case "shot_list":
    case "storyboard":
    case "ready":
    case "animatic":
    case "exported":
      return `/dashboard/storyboard/${project.id}/board`;
    default:
      return `/dashboard/storyboard/${project.id}/genre`;
  }
}

/**
 * Returns which steps are completed, active, and accessible
 */
export function getStoryboardStepsProgress(
  project: Partial<StoryboardProject> | null | undefined,
  currentPathname: string,
) {
  const status: StoryboardProjectStatus = project?.status || "draft";

  // Step indices: 0 = genre, 1 = breakdown, 2 = style, 3 = characters, 4 = board
  let completedUntilIndex = -1;

  switch (status) {
    case "draft":
      completedUntilIndex = project?.genre ? 0 : -1;
      break;
    case "breakdown_ready":
      completedUntilIndex = 0; // Genre completed, on Breakdown
      break;
    case "style_selected":
      completedUntilIndex = 2; // Genre, Breakdown, Style completed, on Characters
      break;
    case "shot_list":
      completedUntilIndex = 3; // Genre, Breakdown, Style, Characters completed, on Board
      break;
    case "storyboard":
    case "ready":
    case "animatic":
    case "exported":
      completedUntilIndex = 4; // All completed
      break;
    default:
      completedUntilIndex = -1;
  }

  const stepsWithState = STORYBOARD_STEPS.map((step, idx) => {
    const isActive = currentPathname.includes(`/${step.id}`);
    const isCompleted = idx <= completedUntilIndex;
    // Allow navigation to any completed step, active step, or next available step
    const isUnlocked = isCompleted || idx <= completedUntilIndex + 1 || isActive;

    return {
      ...step,
      isActive,
      isCompleted,
      isUnlocked,
    };
  });

  const completedCount = stepsWithState.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / STORYBOARD_STEPS.length) * 100);

  return {
    steps: stepsWithState,
    completedCount,
    totalSteps: STORYBOARD_STEPS.length,
    progressPercent,
  };
}
