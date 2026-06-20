// types/scene.ts — shared across all components and API routes

export interface Keyframe {
  t: number   // seconds from scene start
  x: number   // crop left (0–1 normalized)
  y: number   // crop top  (0–1 normalized)
  w: number   // crop width (0–1 normalized)
  h: number   // crop height (0–1 normalized)
}

export interface SceneVoice {
  audioUrl: string
  duration: number
  text: string
}

export type SceneStatus =
  | 'idle'             // just created, no image yet
  | 'analyzing'        // Gemini API in progress
  | 'ready'            // narration generated, awaiting voice
  | 'generating_voice' // CVoice API in progress
  | 'done'             // audio ready, can render

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export interface Scene {
  id: string
  index: number
  imageUrl: string
  narration: string
  dialogue?: string       
  effects?: string[]     
  keyframes: Keyframe[]
  voiceId: string
  voice?: SceneVoice
  status: SceneStatus
  aspectRatio?: AspectRatio
  clipUrl?: string
}