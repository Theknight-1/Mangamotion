'use client'

import { useState, useEffect } from 'react'
import { Download, Play, RotateCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from "./loader-button"
import type { Scene } from '@/types/scene'

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
  scenes: Scene[]
  aspectRatio?: string
  subtitlesEnabled?: boolean
  onExportStart?: () => void
}

export function VideoExport({ videoId, scenes, aspectRatio, subtitlesEnabled, onExportStart }: VideoExportProps) {
  const [status, setStatus] = useState<VideoStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)

  // Fetch initial status on mount so we know if incremental rendering is possible
  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch(`/api/videos/${videoId}`)
        if (response.ok) {
          const data = await response.json()
          setStatus(data.video)
        }
      } catch (error) {
        console.error('[v0] Fetch status error:', error)
      }
    }
    fetchStatus()
  }, [videoId])

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

  async function startRender(isFullRender = false) {
    if (scenes.length === 0) {
      toast.error("Add at least one scene to render");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/render-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          timeline: scenes,
          aspectRatio,
          subtitlesEnabled,
          isIncremental: !!status?.videoUrl && !isFullRender,
          forceFullRender: isFullRender,
        }),
      });

      // ── Parse error responses properly ──────────────────────────────────────
      if (!response.ok) {
        let errorMessage = "Render request failed";
        let errorDetails: any = {};

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || `Error ${response.status}`;
        }

        // ── Handle specific error codes with user-friendly messages ───────────
        switch (response.status) {
          case 401:
            toast.error("Session expired. Please log in again.");
            // Optionally redirect to login
            // router.push('/login');
            break;

          case 402:
            // Quota exceeded — show upgrade prompt
            const used = errorDetails.usedMinutes ?? 0;
            const limit = errorDetails.limitMinutes ?? 0;
            const tier = errorDetails.tier ?? "free";
            toast.error(
              `Render quota exceeded. You've used ${used.toFixed(1)} of ${limit} minutes on your ${tier} plan. Upgrade to render more.`,
              {
                duration: 6000,
                // If you use a custom toast with action buttons:
                // action: { label: 'Upgrade', onClick: () => router.push('/pricing') }
              },
            );
            break;

          case 409:
            toast.error(
              "This video is already rendering. Please wait for it to finish.",
            );
            break;

          case 404:
            toast.error("Video not found. It may have been deleted.");
            break;

          case 400:
            toast.error(
              errorMessage ||
                "Invalid request. Check your scenes and try again.",
            );
            break;

          case 500:
            toast.error(
              "Server error during render. Please try again in a moment.",
            );
            break;

          default:
            toast.error(`${errorMessage} (${response.status})`);
        }

        console.error("[render] API error:", response.status, errorDetails);
        return; // Exit early — don't set polling or show success
      }

      // ── Success path ────────────────────────────────────────────────────────
      toast.success(
        isFullRender
          ? "Re-rendering all scenes..."
          : "Rendering started! Preparing your video...",
      );
      setPolling(true);
      onExportStart?.();
    } catch (error) {
      console.error("[render] Network/client error:", error);

      // Distinguish network errors from API errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Network error. Check your connection and try again.");
      } else {
        toast.error("Failed to start rendering. Please try again.");
      }
    } finally {
      setLoading(false);
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

  // Check if an existing video URL is present (meaning incremental is possible)
  const canIncremental = !!status?.videoUrl

  return (
    <div className="rounded-lg p-3">
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
                className="w-full font-semibold py-2 hover:translate-y-none cursor-pointer rounded-lg"
              >
                <Download size={20} />
                Download Video
              </Button>
            </div>
          )}

          {status.status !== "processing" && (
            <div className={`space-y-2 ${status.status === 'completed' ? 'pt-4 mt-2 border-t border-white/5' : ''}`}>
              <Button
                onClick={() => startRender(false)}
                disabled={loading}
                className="w-full py-2 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                <Play size={20} className="fill-current" />
                {loading ? "Starting..." : canIncremental ? "Render New Scenes" : "Start Rendering"}
              </Button>
              {canIncremental && (
                <Button
                  onClick={() => startRender(true)}
                  disabled={loading}
                  className="w-full py-2 rounded-lg disabled:opacity-50 cursor-pointer text-slate-400 hover:text-white border border-white/10 bg-transparent hover:bg-white/5"
                >
                  <RotateCw size={18} />
                  Re-render All Scenes
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <Button
          onClick={() => startRender(false)}
          disabled={loading || scenes.length === 0}
          className="w-full cursor-pointer font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={20} className="fill-accent-foreground" />
          {loading ? "Preparing..." : `Render Video (${scenes.length} scenes)`}
        </Button>
      )}
    </div>
  );
}