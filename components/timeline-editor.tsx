'use client'

import { useCallback } from 'react'
import { Plus, Film } from 'lucide-react'
import { createId } from '@paralleldrive/cuid2'
import { SceneCard } from './scene-card'
import type { Scene } from '@/types/scene'

// Re-export Scene so existing imports of TimelineScene still work during migration
export type TimelineScene = Scene
export type { Scene }

interface TimelineEditorProps {
  videoId: string
  scenes: Scene[]
  onScenesChange: (scenes: Scene[]) => void
}

export function TimelineEditor({ videoId, scenes, onScenesChange }: TimelineEditorProps) {

  const addScene = useCallback(() => {
    const newScene: Scene = {
      id: createId(),
      index: scenes.length,
      imageUrl: '',
      narration: '',
      keyframes: [],
      voiceId: '',
      status: 'idle',
    }
    onScenesChange([...scenes, newScene])
  }, [scenes, onScenesChange])

  const updateScene = useCallback((updated: Scene) => {
    onScenesChange(scenes.map(s => s.id === updated.id ? updated : s))
  }, [scenes, onScenesChange])

  const deleteScene = useCallback((sceneId: string) => {
    const filtered = scenes.filter(s => s.id !== sceneId)
    // Re-index
    onScenesChange(filtered.map((s, i) => ({ ...s, index: i })))
  }, [scenes, onScenesChange])

  const doneCount  = scenes.filter(s => s.status === 'done').length
  const totalDur   = scenes.reduce((sum, s) => sum + (s.voice?.duration ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Scenes</h2>
          <p className="text-xs text-white/30 mt-0.5">
            {scenes.length === 0
              ? "Add scenes — each is one manga panel"
              : `${doneCount}/${scenes.length} ready${totalDur > 0 ? ` · ~${totalDur}s total` : ""}`}
          </p>
        </div>
        <button
          onClick={addScene}
          className="flex items-center gap-2 bg-[#bbdf50] hover:bg-[#a8c746] text-black cursor-pointer text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          <Plus size={15} />
          Add Scene
        </button>
      </div>

      {/* Scene cards */}
      {scenes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.07] p-16 text-center">
          <Film size={28} className="mx-auto mb-3 text-white/15" />
          <p className="text-sm text-white/30">No scenes yet</p>
          <p className="text-xs text-white/20 mt-1 mb-5">
            Each scene is one manga panel with AI-generated narration and zoom
            effects
          </p>
          <button
            onClick={addScene}
            className="inline-flex items-center gap-2 bg-[#bbdf50] hover:bg-[#a8c746] cursor-pointer text-black text-sm px-5 py-2 rounded-xl transition"
          >
            <Plus size={14} /> Add First Scene
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {scenes.map((scene, i) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              number={i + 1}
              videoId={videoId}
              allScenes={scenes}
              onUpdate={updateScene}
              onDelete={() => deleteScene(scene.id)}
            />
          ))}

          {/* Add more button at bottom */}
          <button
            onClick={addScene}
            className="w-full py-3 rounded-2xl border cursor-pointer border-dashed border-white/[0.07] hover:border-[#bbdf50]/30 text-black hover:text-[#bbdf50] text-sm flex items-center justify-center gap-2 transition"
          >
            <Plus size={14} /> Add Scene
          </button>
        </div>
      )}
    </div>
  );
}