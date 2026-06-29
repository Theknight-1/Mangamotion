// lib/subscription/limits.ts

export type SubscriptionTier = "free" | "starter" | "pro" | "premium";

interface TierLimits {
  videosPerMonth: number;
  videoMinutesPerMonth: number;
  maxScenes: number;
  maxResolution: string;
  exportFormats: string[];
  voiceCharacters: number;
  bgmTracks: boolean;
  sfxLibrary: boolean;
  priorityRendering: boolean;
  customBranding: boolean;
  api: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    videosPerMonth: 1,
    videoMinutesPerMonth: 10,
    maxScenes: 8,
    maxResolution: "1080p",
    exportFormats: ["9:16"],
    voiceCharacters: 1,
    bgmTracks: false,
    sfxLibrary: false,
    priorityRendering: false,
    customBranding: false,
    api: false,
  },
  starter: {
    videosPerMonth: 20,
    videoMinutesPerMonth: 120,
    maxScenes: 25,
    maxResolution: "1080p",
    exportFormats: ["9:16", "1:1"],
    voiceCharacters: 3,
    bgmTracks: true,
    sfxLibrary: false,
    priorityRendering: false,
    customBranding: false,
    api: false,
  },
  pro: {
    videosPerMonth: 50,
    videoMinutesPerMonth: 300,
    maxScenes: 50,
    maxResolution: "4K",
    exportFormats: ["9:16", "16:9", "1:1", "4:5"],
    voiceCharacters: 5,
    bgmTracks: true,
    sfxLibrary: true,
    priorityRendering: true,
    customBranding: true,
    api: false,
  },
  premium: {
    videosPerMonth: 200,
    videoMinutesPerMonth: 1200,
    maxScenes: 100,
    maxResolution: "4K",
    exportFormats: ["9:16", "16:9", "1:1", "4:5"],
    voiceCharacters: 20,
    bgmTracks: true,
    sfxLibrary: true,
    priorityRendering: true,
    customBranding: true,
    api: true,
  },
};

export function getFeatureAccess(tier: SubscriptionTier) {
  return SUBSCRIPTION_LIMITS[tier];
}
