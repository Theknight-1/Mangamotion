'use client'

import { useState } from 'react'
import { Plus, Play, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Scene {
  id: string
  duration: number
  voice?: {
    audioUrl: string
    duration: number
    text: string
  }
}

interface VideoEditorProps {
  videoId: string
  sourceImage: string
  onExport?: () => void
}

export function VideoEditor({ videoId, sourceImage, onExport }: VideoEditorProps) {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)

  async function addScene() {
    const newScene: Scene = {
      id: Math.random().toString(36).substr(2, 9),
      duration: 3,
    }
    setScenes([...scenes, newScene])
    setSelectedScene(newScene.id)
  }

  async function renderVideo() {
    if (scenes.length === 0) {
      toast.error('Add at least one scene to render')
      return
    }

    setRendering(true)
    try {
      const response = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })

      if (!response.ok) throw new Error('Render failed')

      toast.success('Video rendering started! Check back in a moment.')
      onExport?.()
    } catch (error) {
      console.error('[v0] Render error:', error)
      toast.error('Failed to render video')
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="rounded-lg overflow-hidden bg-slate-700 aspect-video w-full">
        <img src={sourceImage} alt="Video preview" className="w-full h-full object-cover" />
      </div>

      {/* Timeline */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Timeline</h3>
          <button
            onClick={addScene}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Add Scene
          </button>
        </div>

        {scenes.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No scenes yet. Add a scene to get started.</p>
        ) : (
          <div className="space-y-2">
            {scenes.map((scene) => (
              <div
                key={scene.id}
                onClick={() => setSelectedScene(scene.id)}
                className={`p-4 rounded-lg cursor-pointer transition ${
                  selectedScene === scene.id ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-semibold">Scene {scenes.indexOf(scene) + 1}</p>
                    {scene.voice && <p className="text-slate-400 text-sm truncate">{scene.voice.text}</p>}
                  </div>
                  <span className="text-slate-300 text-sm">{scene.duration}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={renderVideo}
          disabled={rendering || scenes.length === 0}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={20} />
          {rendering ? 'Rendering...' : 'Render Video'}
        </button>
        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition disabled:opacity-50">
          <Download size={20} />
          Export
        </button>
      </div>
    </div>
  )
}
