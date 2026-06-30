'use client'

import { useState, useEffect } from 'react'
import { Download, Play, RotateCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from "./loader-button";

interface VideoStatus {
  id: string
  status: 'draft' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  duration?: number
  createdAt: string
  updatedAt: string
}

interface VideoExportProps {
  videoId: string
  scenes: any[]
  // 🆕 New props for render settings
  aspectRatio?: string
  subtitlesEnabled?: boolean
  onExportStart?: () => void
}

export function VideoExport({ videoId, scenes, aspectRatio, subtitlesEnabled, onExportStart }: VideoExportProps) {
  const [status, setStatus] = useState<VideoStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    let pollInterval: NodeJS.Timeout

    if (polling && videoId) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/videos/${videoId}`)
          if (response.ok) {
            const data = await response.json()
            setStatus(data.video)

            if (data.video.status === 'completed') {
              setPolling(false)
              toast.success('Video rendering completed!')
            } else if (data.video.status === 'failed') {
              setPolling(false)
              toast.error('Video rendering failed')
            }
          }
        } catch (error) {
          console.error('[v0] Poll error:', error)
        }
      }, 3000)
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [polling, videoId])

  async function startRender() {
    if (scenes.length === 0) {
      toast.error('Add at least one scene to render')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          timeline: scenes,
          aspectRatio,       // 🆕 Send selected aspect ratio
          subtitlesEnabled,  // 🆕 Send subtitle toggle state
        }),
      })

      if (!response.ok) throw new Error('Render request failed')

      toast.success('Rendering started! Preparing your video...')
      setPolling(true)
      onExportStart?.()
    } catch (error) {
      console.error('[v0] Render error:', error)
      toast.error('Failed to start rendering')
    } finally {
      setLoading(false)
    }
  }

  function downloadVideo() {
    if (status?.videoUrl) {
      const link = document.createElement('a')
      link.href = status.videoUrl
      link.download = `MotionRecap-${videoId}.mp4`;
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Export Video</h3>

      {/* 🆕 Show current render settings */}
      <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-white/5 text-xs text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Format:</span>
          <span className="text-white font-medium">
            {aspectRatio || "9:16"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Subtitles:</span>
          <span className="text-white font-medium">
            {subtitlesEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      {status ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-700 rounded-lg">
            <p className="text-sm text-slate-400 mb-2">Status</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white capitalize">
                {status.status}
              </span>
              {status.status === "processing" && (
                <div className="flex items-center gap-2">
                  <RotateCw
                    size={16}
                    className="animate-spin text-purple-400"
                  />
                  <span className="text-xs text-slate-400">Processing...</span>
                </div>
              )}
              {status.status === "completed" && (
                <span className="text-xs text-green-400">Complete</span>
              )}
              {status.status === "failed" && (
                <span className="text-xs text-red-400">Failed</span>
              )}
            </div>
          </div>

          {status.status === "completed" && status.videoUrl && (
            <div className="space-y-3">
              <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                <p className="text-sm text-[#bbdf50] mb-2">
                  Your video is ready!
                </p>
                <p className="text-xs text-slate-400">
                  Duration: {status.duration}s
                </p>
              </div>

              <Button
                onClick={downloadVideo}
                className="w-full font-semibold py-2"
              >
                <Download size={20} />
                Download Video
              </Button>
            </div>
          )}

          {status.status === "draft" && (
            <Button
              onClick={startRender}
              disabled={loading}
              className="w-full  py-2 rounded-lg  disabled:opacity-50"
            >
              <Play size={20} />
              {loading ? "Starting..." : "Start Rendering"}
            </Button>
          )}
        </div>
      ) : (
        <Button
          onClick={startRender}
          disabled={loading || scenes.length === 0}
          className="w-full  cursor-pointer  font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={20} className="fill-accent-foreground" />
          {loading ? "Preparing..." : `Render Video (${scenes.length} scenes)`}
        </Button>
      )}
    </div>
  );
}