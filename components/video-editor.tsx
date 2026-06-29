"use client";

import { useState, useEffect } from "react";
import { Download, Play, RotateCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface VideoStatus {
  id: string;
  status: "draft" | "processing" | "completed" | "failed";
  videoUrl?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

interface VideoExportProps {
  videoId: string;
  scenes: any[];
  aspectRatio?: string;
  subtitlesEnabled?: boolean;
  onExportStart?: () => void;
}

export function VideoExport({
  videoId,
  scenes,
  aspectRatio,
  subtitlesEnabled,
  onExportStart,
}: VideoExportProps) {
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (polling && videoId) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/videos/${videoId}`);
          if (response.ok) {
            const data = await response.json();
            setStatus(data.video);

            if (data.video.status === "completed") {
              setPolling(false);
              toast.success("Video rendering completed!");
            } else if (data.video.status === "failed") {
              setPolling(false);
              toast.error("Video rendering failed");
            }
          }
        } catch (error) {
          console.error("[VideoExport] Poll error:", error);
        }
      }, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [polling, videoId]);

  async function startRender() {
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
        }),
      });

      if (!response.ok) throw new Error("Render request failed");

      toast.success("Rendering started! Preparing your video...");
      setPolling(true);
      onExportStart?.();
    } catch (error) {
      console.error("[VideoExport] Render error:", error);
      toast.error("Failed to start rendering");
    } finally {
      setLoading(false);
    }
  }

  function downloadVideo() {
    if (status?.videoUrl) {
      const link = document.createElement("a");
      link.href = status.videoUrl;
      link.download = `MotionRecap-${videoId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  const hasCompletedScenes = scenes.some(
    (s: any) => s.status === "done" || s.voice?.audioUrl,
  );

  return (
    <div className="bg-[#0d0d18] border border-white/6 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Export Video</h3>

      {/* Render settings */}
      <div className="p-3 bg-white/2 rounded-lg border border-white/4 text-xs text-white/40 space-y-1.5">
        <div className="flex justify-between">
          <span>Format</span>
          <span className="text-white/70 font-medium">
            {aspectRatio || "9:16"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Subtitles</span>
          <span className="text-white/70 font-medium">
            {subtitlesEnabled ? "On" : "Off"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Scenes</span>
          <span className="text-white/70 font-medium">{scenes.length}</span>
        </div>
      </div>

      {status ? (
        <div className="space-y-3">
          <div className="p-3 bg-white/2 rounded-lg border border-white/4">
            <p className="text-xs text-white/40 mb-1">Status</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white capitalize">
                {status.status}
              </span>
              {status.status === "processing" && (
                <div className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin text-amber-400" />
                  <span className="text-xs text-amber-400">Processing</span>
                </div>
              )}
              {status.status === "completed" && (
                <span className="text-xs text-[#4a8a42]">✓ Complete</span>
              )}
              {status.status === "failed" && (
                <span className="text-xs text-red-400">✗ Failed</span>
              )}
            </div>
          </div>

          {status.status === "completed" && status.videoUrl && (
            <button
              onClick={downloadVideo}
              className="w-full flex items-center justify-center gap-2 bg-[#4a8a42] hover:bg-[#3a6a32] text-white font-semibold py-2.5 rounded-lg transition"
              type="button"
            >
              <Download size={16} />
              Download MP4
            </button>
          )}

          {status.status === "draft" && (
            <button
              onClick={startRender}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#4a8a42] hover:bg-[#3a6a32] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              type="button"
            >
              <Play size={16} />
              {loading ? "Starting..." : "Start Rendering"}
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={startRender}
          disabled={loading || scenes.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-[#4a8a42] hover:bg-[#3a6a32] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          <Play size={16} />
          {loading ? "Preparing..." : `Render Video (${scenes.length} scenes)`}
        </button>
      )}

      {!hasCompletedScenes && scenes.length > 0 && (
        <p className="text-xs text-amber-400/60 text-center">
          Complete scene narration & voice generation before rendering
        </p>
      )}
    </div>
  );
}