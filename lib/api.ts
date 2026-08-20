// lib/api.ts — centralized API client
// All fetch calls go through here. SWR handles caching/deduplication.
import type {
  StoryboardProject,
  StoryboardScene,
  StoryboardCharacter,
  StoryboardShot,
  StoryboardLocation,
  StoryboardObject,
  StoryboardUsageSummary,
} from "@/types/storyboard";

const BASE = "";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImage?: string;
  language: string;
  isOriginalContent: boolean;
  contentPurpose?: string;
  copyrightAgreedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  sourceImage: string;
  status: "draft" | "processing" | "completed" | "failed";
  timeline?: string;
  videoUrl?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Projects (Manga Recap) ───────────────────────────────────────────────────
export const projectsApi = {
  list: () => request<{ projects: Project[] }>("/api/projects"),
  create: (
    title: string,
    data?: {
      description?: string;
      isOriginal?: boolean;
      contentPurpose?: string;
      language?: string;
    },
  ) =>
    request<{ project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        title,
        description: data?.description,
        isOriginal: data?.isOriginal ?? true,
        contentPurpose: data?.contentPurpose,
        language: data?.language ?? "en",
      }),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/projects/${id}`, { method: "DELETE" }),
};

// ─── Videos (Manga Recap) ─────────────────────────────────────────────────────
export const videosApi = {
  list: (projectId: string) =>
    request<{ videos: Video[] }>(`/api/videos?projectId=${projectId}`),
  create: (data: { projectId: string; title: string; sourceImage: string }) =>
    request<{ video: Video }>("/api/videos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (id: string) => request<{ video: Video }>(`/api/videos/${id}`),
  update: (id: string, data: Partial<Video>) =>
    request<{ video: Video }>(`/api/videos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/videos/${id}`, { method: "DELETE" }),
};

// ─── Upload ───────────────────────────────────────────────────────────────────
export const uploadApi = {
  image: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("files", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Upload failed");
    }
    return res.json();
  },
};

// ─── Storyboard Studio (Isolated Module) ───────────────────────────────────────
export const storyboardApi = {
  getProjects: () =>
    request<{ projects: StoryboardProject[] }>("/api/storyboard/projects"),
  listProjects: () =>
    request<{ projects: StoryboardProject[] }>("/api/storyboard/projects"),
  createProject: (data: {
    title: string;
    coverImage?: string;
    genre?: string;
    artStyle?: string;
    aspectRatio?: string;
    scriptText?: string;
  }) =>
    request<{ project: StoryboardProject }>("/api/storyboard/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProject: (id: string) =>
    request<{ project: StoryboardProject }>(`/api/storyboard/projects/${id}`),
  updateProject: (id: string, data: Partial<StoryboardProject>) =>
    request<{ project: StoryboardProject }>(`/api/storyboard/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  generateCover: (data: {
    title: string;
    scriptText?: string;
    genre?: string;
    artStyle?: string;
    aspectRatio?: string;
    customPrompt?: string;
    projectId?: string;
    model?: string;
  }) =>
    request<{ success: boolean; imageUrl: string }>("/api/storyboard/generate-cover", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<{ success: boolean }>(`/api/storyboard/projects/${id}`, {
      method: "DELETE",
    }),

  uploadScript: (id: string, body: FormData | { text: string }) => {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return request<{ success: boolean; text: string; pageCount?: number }>(
      `/api/storyboard/projects/${id}/upload-script`,
      {
        method: "POST",
        headers: isFormData ? {} : { "Content-Type": "application/json" },
        body: isFormData ? body : JSON.stringify(body),
      },
    );
  },

  updateGenre: (id: string, genre: string) =>
    request<{ project: StoryboardProject }>(
      `/api/storyboard/projects/${id}/genre`,
      {
        method: "PATCH",
        body: JSON.stringify({ genre }),
      },
    ),

  generateBreakdown: (
    id: string,
    data: { scriptText?: string; genre?: string },
  ) =>
    request<{
      breakdown: any;
      scenes: StoryboardScene[];
      shots: StoryboardShot[];
    }>(`/api/storyboard/projects/${id}/generate-breakdown`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Scenes
  getScenes: (projectId: string) =>
    request<{ scenes: StoryboardScene[] }>(
      `/api/storyboard/projects/${projectId}/scenes`,
    ),
  createScene: (projectId: string, data: Partial<StoryboardScene>) =>
    request<{ scene: StoryboardScene }>(
      `/api/storyboard/projects/${projectId}/scenes`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),
  updateScene: (id: string, data: Partial<StoryboardScene>) =>
    request<{ scene: StoryboardScene }>(`/api/storyboard/scenes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  reorderScenes: (
    projectId: string,
    sceneOrders: Array<{ id: string; orderIndex: number }>,
  ) =>
    request<{ success: boolean }>(
      `/api/storyboard/projects/${projectId}/scenes`,
      {
        method: "PATCH",
        body: JSON.stringify({ sceneOrders }),
      },
    ),
  deleteScene: (id: string) =>
    request<{ success: boolean }>(`/api/storyboard/scenes/${id}`, {
      method: "DELETE",
    }),
  generateSceneVoice: (
    id: string,
    params?: { narrationText?: string; voiceId?: string; speed?: number },
  ) =>
    request<{
      success: boolean;
      audioUrl: string;
      duration: number;
      scene: StoryboardScene;
    }>(`/api/storyboard/scenes/${id}/generate-voice`, {
      method: "POST",
      body: JSON.stringify(params || {}),
    }),

  // Characters
  getCharacters: (projectId: string) =>
    request<{ characters: StoryboardCharacter[] }>(
      `/api/storyboard/projects/${projectId}/characters`,
    ),
  listCharacters: (projectId: string) =>
    request<{ characters: StoryboardCharacter[] }>(
      `/api/storyboard/projects/${projectId}/characters`,
    ),
  createCharacter: (projectId: string, data: Partial<StoryboardCharacter>) =>
    request<{ character: StoryboardCharacter }>(
      `/api/storyboard/projects/${projectId}/characters`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),
  updateCharacter: (id: string, data: Partial<StoryboardCharacter>) =>
    request<{ character: StoryboardCharacter }>(
      `/api/storyboard/characters/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    ),
  deleteCharacter: (id: string) =>
    request<{ success: boolean }>(`/api/storyboard/characters/${id}`, {
      method: "DELETE",
    }),
  generateCharacterSheet: (id: string, model?: string) =>
    request<{ character: StoryboardCharacter; modelUsed: string }>(
      `/api/storyboard/characters/${id}/generate-sheet`,
      { method: "POST", body: JSON.stringify({ model }) },
    ),
  approveCharacterSheet: (id: string, approvedSheetUrl?: string) =>
    request<{ success: boolean; character: StoryboardCharacter }>(
      `/api/storyboard/characters/${id}/approve-sheet`,
      { method: "POST", body: JSON.stringify({ approvedSheetUrl }) },
    ),

  // Locations
  getLocations: (projectId: string) =>
    request<{ locations: StoryboardLocation[] }>(
      `/api/storyboard/projects/${projectId}/locations`,
    ),
  createLocation: (projectId: string, data: Partial<StoryboardLocation>) =>
    request<{ location: StoryboardLocation }>(
      `/api/storyboard/projects/${projectId}/locations`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),
  updateLocation: (id: string, data: Partial<StoryboardLocation>) =>
    request<{ location: StoryboardLocation }>(
      `/api/storyboard/locations/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    ),
  deleteLocation: (id: string) =>
    request<{ success: boolean }>(`/api/storyboard/locations/${id}`, {
      method: "DELETE",
    }),

  // Objects
  getObjects: (projectId: string) =>
    request<{ objects: StoryboardObject[] }>(
      `/api/storyboard/projects/${projectId}/objects`,
    ),
  createObject: (projectId: string, data: Partial<StoryboardObject>) =>
    request<{ object: StoryboardObject }>(
      `/api/storyboard/projects/${projectId}/objects`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),
  updateObject: (id: string, data: Partial<StoryboardObject>) =>
    request<{ object: StoryboardObject }>(
      `/api/storyboard/objects/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    ),
  deleteObject: (id: string) =>
    request<{ success: boolean }>(`/api/storyboard/objects/${id}`, {
      method: "DELETE",
    }),

  // Shots
  getShots: (projectId: string) =>
    request<{ shots: StoryboardShot[] }>(
      `/api/storyboard/projects/${projectId}/shots`,
    ),
  listShots: (projectId: string) =>
    request<{ shots: StoryboardShot[] }>(
      `/api/storyboard/projects/${projectId}/shots`,
    ),
  createShot: (projectId: string, data: Partial<StoryboardShot>) =>
    request<{ shot: StoryboardShot }>(
      `/api/storyboard/projects/${projectId}/shots`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),
  updateShot: (id: string, data: Partial<StoryboardShot>) =>
    request<{ shot: StoryboardShot }>(`/api/storyboard/shots/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  reorderShots: (
    projectId: string,
    shotOrders: Array<{
      id: string;
      orderIndex: number;
      sceneId?: string | null;
    }>,
  ) =>
    request<{ success: boolean }>(
      `/api/storyboard/projects/${projectId}/shots`,
      {
        method: "PATCH",
        body: JSON.stringify({ shotOrders }),
      },
    ),
  deleteShot: (id: string) =>
    request<{ success: boolean }>(`/api/storyboard/shots/${id}`, {
      method: "DELETE",
    }),
  generateShotImage: (id: string, model?: string) =>
    request<{
      shot: StoryboardShot;
      consistencyScore?: number;
      consistencyFlagged?: boolean;
    }>(`/api/storyboard/shots/${id}/generate-image`, {
      method: "POST",
      body: JSON.stringify({ model }),
    }),
  regenerateShotImage: (id: string, model?: string) =>
    request<{
      shot: StoryboardShot;
      consistencyScore?: number;
      consistencyFlagged?: boolean;
    }>(`/api/storyboard/shots/${id}/regenerate`, {
      method: "POST",
      body: JSON.stringify({ model }),
    }),
  iterateShot: (id: string, params: { instruction: string; model?: string }) =>
    request<{
      shot: StoryboardShot;
      consistencyScore?: number;
      consistencyFlagged?: boolean;
    }>(`/api/storyboard/shots/${id}/iterate`, {
      method: "POST",
      body: JSON.stringify(params),
    }),

  // Orchestration & Exports
  generateStoryboard: (id: string, model?: string) =>
    request<{ success: boolean; results: any[] }>(
      `/api/storyboard/projects/${id}/generate-storyboard`,
      {
        method: "POST",
        body: JSON.stringify({ model }),
      },
    ),
  getAnimatic: (id: string) =>
    request<{ success: boolean; timeline: any[] }>(
      `/api/storyboard/projects/${id}/animatic`,
      { method: "POST" },
    ),
  exportPdf: (id: string) =>
    request<{ success: boolean; pdfUrl: string }>(
      `/api/storyboard/projects/${id}/export/pdf`,
      { method: "POST" },
    ),
  exportSlideshow: (id: string) =>
    request<{ success: boolean; videoUrl: string; duration: number }>(
      `/api/storyboard/projects/${id}/export/slideshow`,
      { method: "POST" },
    ),
  exportRender: (id: string) =>
    request<{
      success: boolean;
      videoId: string;
      editorUrl: string;
      sceneCount: number;
    }>(`/api/storyboard/projects/${id}/export/render`, { method: "POST" }),

  getUsage: () => request<StoryboardUsageSummary>("/api/storyboard/usage"),
};

// ─── SWR keys ─────────────────────────────────────────────────────────────────
export const swrKeys = {
  projects: () => "/api/projects",
  videos: (projectId: string) => `/api/videos?projectId=${projectId}`,
  video: (id: string) => `/api/videos/${id}`,

  storyboardProjects: () => "/api/storyboard/projects",
  storyboardProject: (id: string) => `/api/storyboard/projects/${id}`,
  storyboardScenes: (projectId: string) =>
    `/api/storyboard/projects/${projectId}/scenes`,
  storyboardCharacters: (projectId: string) =>
    `/api/storyboard/projects/${projectId}/characters`,
  storyboardShots: (projectId: string) =>
    `/api/storyboard/projects/${projectId}/shots`,
  storyboardLocations: (projectId: string) =>
    `/api/storyboard/projects/${projectId}/locations`,
  storyboardObjects: (projectId: string) =>
    `/api/storyboard/projects/${projectId}/objects`,
  storyboardUsage: () => "/api/storyboard/usage",
};
