// lib/api.ts — centralized API client
// All fetch calls go through here. SWR handles caching/deduplication.

const BASE = ''

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => request<{ projects: Project[] }>('/api/projects'),
  create: (title: string, description?: string) =>
    request<{ project: Project }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
}

// ─── Videos ───────────────────────────────────────────────────────────────────
export const videosApi = {
  list: (projectId: string) =>
    request<{ videos: Video[] }>(`/api/videos?projectId=${projectId}`),
  create: (data: { projectId: string; title: string; sourceImage: string }) =>
    request<{ video: Video }>('/api/videos', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => request<{ video: Video }>(`/api/videos/${id}`),
  update: (id: string, data: Partial<Video>) =>
    request<{ video: Video }>(`/api/videos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/videos/${id}`, { method: 'DELETE' }),
}

// ─── Upload ───────────────────────────────────────────────────────────────────
export const uploadApi = {
  image: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Upload failed')
    }
    return res.json()
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Project {
  id: string
  userId: string
  title: string
  description?: string
  coverImage?: string
  createdAt: string
  updatedAt?: string
}

export interface Video {
  id: string
  projectId: string
  userId: string
  title: string
  sourceImage: string
  status: 'draft' | 'processing' | 'completed' | 'failed'
  timeline?: string
  videoUrl?: string
  duration?: number
  createdAt: string
  updatedAt?: string
}

// ─── SWR keys ─────────────────────────────────────────────────────────────────
// Centralized key factory — prevents typos causing cache misses
export const swrKeys = {
  projects: () => '/api/projects',
  videos: (projectId: string) => `/api/videos?projectId=${projectId}`,
  video: (id: string) => `/api/videos/${id}`,
}