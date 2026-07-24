"use client";

import { Volume2, Play, Pause, Mic } from "lucide-react";
import type { Scene } from "@/types/scene";
import { VoiceGenerator } from "./voice-generator";
import { VideoExport } from "./video-export";
import { useState, useRef } from "react";

export type RightPanelTab = "voice" | "export";

interface RightPanelProps {
  activeTab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  videoId: string;
  activeScene: Scene | null;
  onSceneUpdate: (updated: Scene) => void;
  scenes: Scene[];
  aspectRatio?: string;
  subtitlesEnabled?: boolean;
  onExportStart?: () => void;
}

export function RightPanel({
  activeTab,
  onTabChange,
  videoId,
  activeScene,
  onSceneUpdate,
  scenes,
  aspectRatio,
  subtitlesEnabled,
  onExportStart,
}: RightPanelProps) {
  const [playingAudio, setPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggleAudio() {
    if (!activeScene?.voice?.audioUrl) return;
    if (playingAudio) {
      audioRef.current?.pause();
      setPlayingAudio(false);
      return;
    }
    const a = new Audio(activeScene.voice.audioUrl);
    a.onended = () => setPlayingAudio(false);
    a.play();
    audioRef.current = a;
    setPlayingAudio(true);
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0f0a]">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.07]">
        <button
          onClick={() => onTabChange("voice")}
          className={`flex-1 cursor-pointer border-b-2 px-3 py-3.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "voice"
              ? "border-[#c9a84c] text-[#e8d5a3]"
              : "border-transparent text-white/35 hover:text-white/60"
          }`}
        >
          Voices &amp; settings
        </button>
        <button
          onClick={() => onTabChange("export")}
          className={`flex-1 cursor-pointer border-b-2 px-3 py-3.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "export"
              ? "border-[#c9a84c] text-[#e8d5a3]"
              : "border-transparent text-white/35 hover:text-white/60"
          }`}
        >
          Export
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "voice" ? (
          !activeScene ? (
            <div className="flex h-40 flex-col items-center justify-center text-center text-white/25">
              <Mic size={22} className="mb-2" />
              <p className="text-xs">Select a scene to assign a voice</p>
            </div>
          ) : !activeScene.narration.trim() ? (
            <div className="flex h-40 flex-col items-center justify-center text-center text-white/25">
              <Mic size={22} className="mb-2" />
              <p className="text-xs">Write narration for this scene first</p>
            </div>
          ) : activeScene.voice?.audioUrl ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-[#4a8a42]/25 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4a8a42]/20">
                  <Volume2 size={15} className="text-[#4a8a42]" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="m-0 text-sm font-semibold text-[#7fb870]">
                    Voice generated
                  </p>
                  <p className="m-0 mt-0.5 truncate text-[11px] text-white/30">
                    Scene {activeScene.index + 1} · {activeScene.voice.duration}
                    s
                  </p>
                </div>
                <button
                  onClick={toggleAudio}
                  aria-label={playingAudio ? "Pause" : "Play preview"}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-[#4a8a42]/20 text-[#7fb870] transition-colors hover:bg-[#4a8a42]/30"
                >
                  {playingAudio ? (
                    <Pause size={12} />
                  ) : (
                    <Play size={12} className="ml-0.5" />
                  )}
                </button>
              </div>
              <p className="text-center text-[11px] text-white/25">
                Regenerate with a different voice below
              </p>
              <VoiceGenerator
                key={activeScene.id}
                videoId={videoId}
                sceneIndex={activeScene.index}
                prefillText={activeScene.narration}
                onVoiceGenerated={(audioUrl, duration) => {
                  onSceneUpdate({
                    ...activeScene,
                    voice: { audioUrl, duration, text: activeScene.narration },
                    status: "done",
                    clipUrl: undefined,
                  });
                }}
              />
            </div>
          ) : (
            <VoiceGenerator
              key={activeScene.id}
              videoId={videoId}
              sceneIndex={activeScene.index}
              prefillText={activeScene.narration}
              onVoiceGenerated={(audioUrl, duration) => {
                onSceneUpdate({
                  ...activeScene,
                  voice: { audioUrl, duration, text: activeScene.narration },
                  status: "done",
                  clipUrl: undefined,
                });
              }}
            />
          )
        ) : (
          <VideoExport
            videoId={videoId}
            scenes={scenes}
            aspectRatio={aspectRatio}
            subtitlesEnabled={subtitlesEnabled}
            onExportStart={onExportStart}
          />
        )}
      </div>
    </div>
  );
}
