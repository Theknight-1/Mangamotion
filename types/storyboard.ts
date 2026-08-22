// types/storyboard.ts — shared across Storyboard Studio components and API routes
// This module is intentionally isolated and independent of Project/Scene/Video types.

export type Genre =
  | "Action"
  | "Animation"
  | "Comedy"
  | "Commercial"
  | "Documentary"
  | "Drama"
  | "Educational"
  | "Fantasy"
  | "Horror"
  | "Music Video"
  | "Mystery"
  | "Romance"
  | "Science Fiction"
  | "Thriller";

export type ArtStyle =
  | "comic"
  | "cinematic"
  | "soft_pencil"
  | "animation_3d"
  | "watercolor"
  | "photo_commercial"
  | "charcoal"
  | "dark_anime"
  | "flat_vector"
  | "noir"
  | "stick_figure"
  | "graphic_novel"
  | "anime"
  | "manga"
  | "custom";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "2.39:1";

export type StoryboardProjectStatus =
  | "draft"
  | "breakdown_ready"
  | "style_selected"
  | "shot_list"
  | "storyboard"
  | "ready"
  | "animatic"
  | "exported";

export interface StoryboardProject {
  id: string;
  userId: string;
  title: string;
  coverImage?: string | null;
  genre?: string | null;
  artStyle: ArtStyle;
  aspectRatio: AspectRatio;
  status: StoryboardProjectStatus;
  scriptText?: string | null;
  animaticUrl?: string | null;
  animaticStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoryboardScene {
  id: string;
  projectId: string;
  orderIndex: number;
  title: string;
  description?: string | null;
  narrationText?: string | null;
  durationEstimate?: number | null;
  voiceAudioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ConditioningMode = "description" | "image" | "both";

export interface StoryboardCharacter {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  clothing?: string | null;
  consistencyNotes?: string | null;
  referenceImageUrls: string[];
  pendingSheetUrl?: string | null;
  approvedSheetUrl?: string | null;
  conditioningMode: ConditioningMode;
  createdAt: string;
  updatedAt: string;
}

export type ShotType =
  | "wide"
  | "close-up"
  | "extreme-close-up"
  | "medium"
  | "action"
  | "reaction"
  | "establishing"
  | "pov";

export type CameraAngle =
  | "eye-level"
  | "low-angle"
  | "high-angle"
  | "birds-eye"
  | "dutch-angle"
  | "over-the-shoulder";

export type Perspective =
  | "1-point"
  | "2-point"
  | "3-point"
  | "isometric"
  | "panoramic";

export type CameraMovement =
  | "static"
  | "pan-left"
  | "pan-right"
  | "tilt-up"
  | "tilt-down"
  | "zoom-in"
  | "zoom-out"
  | "tracking"
  | "handheld";

export type GenerationStatus = "pending" | "generating" | "complete" | "failed";

export type StoryboardModel = "flux" | "nano-banana";

export interface StoryboardShot {
  id: string;
  projectId: string;
  sceneId?: string | null;
  orderIndex: number;
  order?: number;
  description: string;
  shotType?: ShotType | null;
  cameraAngle?: CameraAngle | null;
  perspective?: Perspective | null;
  movement?: CameraMovement | null;
  duration?: number | null;
  dialogue?: string | null;
  characterIds: string[];
  draftNarration?: string | null;
  estDuration?: number | null;

  generatedImageUrl?: string | null;
  voiceAudioUrl?: string | null;
  generationStatus: GenerationStatus;
  regenerateCount: number;
  modelUsed?: StoryboardModel | null;

  consistencyScore?: number | null;
  consistencyFlagged: boolean;

  createdAt: string;
  updatedAt: string;
}

export type ObjectImportance = "key_prop" | "recurring" | "background";

export interface StoryboardLocation {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  lightingNotes?: string | null;
  referenceImageUrl?: string | null;
  generatedImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoryboardObject {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  importance: ObjectImportance;
  referenceImageUrl?: string | null;
  generatedImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoryboardUsageSummary {
  tier: "free" | "creator" | "pro";
  used: number;
  limit: number;
  remaining: number;
  periodEnd: string;
}
