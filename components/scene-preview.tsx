"use client";

import { Loader2, ImageIcon } from "lucide-react";
import type { Scene } from "@/types/scene";

interface ScenePreviewProps {
  status: "draft" | "processing" | "completed" | "failed";
  videoUrl?: string;
  subtitlesEnabled?: boolean;
  subtitleUrl?: string;
  aspectRatio?: string;
  activeScene: Scene | null;
  sceneCount: number;
}

export function ScenePreview({
  status,
  videoUrl,
  subtitlesEnabled,
  subtitleUrl,
  aspectRatio,
  activeScene,
  sceneCount,
}: ScenePreviewProps) {
  const ratio = (aspectRatio || "9:16").replace(":", "/");
  const showFinalVideo = status === "completed" && !!videoUrl;
  const showFallbackImage = !showFinalVideo && activeScene?.imageUrl;

  return (
    <div
      className="relative xl:w-full 2xl:w-[70%] mx-auto overflow-hidden rounded-xl border border-white/8 bg-[#0d0d18]"
      style={{ aspectRatio: ratio, maxHeight: "60vh" }}
    >
      {showFinalVideo ? (
        <video
          src={videoUrl}
          controls
          className="h-full w-full"
          crossOrigin="anonymous"
        >
          {subtitlesEnabled !== false && subtitleUrl && (
            <track
              kind="subtitles"
              src={subtitleUrl}
              srcLang="en"
              label="English"
              default
            />
          )}
        </video>
      ) : showFallbackImage ? (
        <img
          src={activeScene!.imageUrl}
          alt={`Scene ${activeScene!.index + 1} preview`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/20">
          <ImageIcon size={28} />
          <span className="text-sm">Select or add a scene to preview</span>
        </div>
      )}

      {status === "processing" && (
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/55">
          <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
          <span className="text-sm text-white/70">Rendering…</span>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="rounded-lg bg-black/40 px-2 py-1 text-xs text-white/50 backdrop-blur-sm">
          {aspectRatio || "9:16"}
        </span>
        <span className="rounded-lg bg-black/40 px-2 py-1 text-xs text-white/50 backdrop-blur-sm">
          {sceneCount} scene{sceneCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
