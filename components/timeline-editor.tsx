'use client'

import { useCallback, useState } from "react";
import {
  Plus,
  Film,
  Mic,
  CheckCircle2,
  Loader2,
  Play,
  Pause,
  Volume2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Upload,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { createId } from '@paralleldrive/cuid2'
import { VoiceGenerator } from "./voice-generator";
import type { Scene } from '@/types/scene'
import { Button } from "./loader-button";
import { SceneCard } from "./scene-card";

// Re-export Scene so existing imports of TimelineScene still work during migration
export type TimelineScene = Scene
export type { Scene }

interface TimelineEditorProps {
  videoId: string
  scenes: Scene[]
  onScenesChange: (scenes: Scene[]) => void
}

export function TimelineEditor({ videoId, scenes, onScenesChange }: TimelineEditorProps) {
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || null;

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
    setActiveSceneId(newScene.id);
  }, [scenes, onScenesChange])

  const updateScene = useCallback((updated: Scene) => {
    onScenesChange(scenes.map(s => s.id === updated.id ? updated : s))
  }, [scenes, onScenesChange])

  const deleteScene = useCallback(
    (sceneId: string) => {
      const filtered = scenes.filter((s) => s.id !== sceneId);
      onScenesChange(filtered.map((s, i) => ({ ...s, index: i })));
      if (activeSceneId === sceneId) {
        setActiveSceneId(filtered.length > 0 ? filtered[0].id : null);
      }
    },
    [scenes, onScenesChange, activeSceneId],
  );

  const doneCount = scenes.filter((s) => s.status === "done").length;
  const totalDur = scenes.reduce((sum, s) => sum + (s.voice?.duration ?? 0), 0);

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden md:flex-row">
      {/* LEFT COLUMN: Scene List */}
      <div className="flex w-full flex-shrink-0 flex-col border-r border-white/[0.07] md:w-72 lg:w-80">
        {/* Section header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Timeline editor
            </h2>
            <p className="mt-0.5 text-[11px] text-white/30">
              {scenes.length === 0
                ? "Add scenes — each is one manga panel"
                : `Total: ${totalDur > 0 ? `~${totalDur}s` : "0s"}`}
            </p>
          </div>
          <Button
            onClick={addScene}
            className="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg"
          >
            <Plus size={14} />
          </Button>
        </div>

        {/* Scene Cards Strip */}
        <div className="flex-1 overflow-y-auto p-4 pt-0">
          {scenes.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.07] text-center">
              <Film size={24} className="mb-2 text-white/15" />
              <p className="text-xs text-white/30">No scenes yet</p>
              <Button
                onClick={addScene}
                className="mt-3 cursor-pointer text-xs px-4 py-1.5 rounded-lg"
              >
                <Plus size={12} /> Add First Scene
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {scenes.map((scene, i) => {
                const isActive = activeSceneId === scene.id;
                const isDone = scene.status === "done";
                const hasVoice = !!scene.voice?.audioUrl;

                return (
                  <button
                    key={scene.id}
                    onClick={() => setActiveSceneId(scene.id)}
                    className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      isActive
                        ? "border-[#4a8a42]/50 bg-[#4a8a42]/15"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors ${
                        isDone
                          ? "border-[#4a8a42]/40 bg-[#4a8a42]/20 text-[#4a8a42]"
                          : isActive
                            ? "border-[#4a8a42]/30 bg-[#4a8a42]/10 text-[#7fb870]"
                            : "border-white/[0.08] bg-white/[0.04] text-white/30"
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={15} /> : i + 1}
                    </div>

                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span
                        className={`text-xs font-medium ${isActive ? "text-white/90" : "text-white/50"}`}
                      >
                        Scene {i + 1} — {scene.voice?.duration || 0}s
                      </span>
                      <span
                        className={`mt-0.5 truncate text-[10px] ${hasVoice ? "text-[#c9a84c]" : "text-red-500"}`}
                      >
                        {hasVoice ? "✓ Voice assigned" : "No voice"}
                      </span>
                    </div>

                    {scene.status === "analyzing" && (
                      <Loader2
                        size={12}
                        className="animate-spin text-[#c9a84c]"
                      />
                    )}
                  </button>
                );
              })}

              {/* Add more button */}
              <Button
                onClick={addScene}
                className=" w-full cursor-pointer rounded-xl border border-dashed border-white/[0.07] py-2 text-sm transition-colors "
              >
                <Plus size={14} /> Add Scene
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Scene Details & Actions */}
      <div className="flex-1 overflow-y-auto bg-[#0d0d18] p-6">
        {!activeScene ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <Film size={32} className="mx-auto mb-3 text-white/10" />
              <p className="text-sm text-white/30">Select a scene to edit</p>
              <p className="mt-1 text-xs text-white/15">
                Or add a new one to get started
              </p>
            </div>
          </div>
        ) : (
          <SceneCard
            key={activeScene.id}
            scene={activeScene}
            number={activeScene.index + 1}
            videoId={videoId}
            allScenes={scenes}
            onUpdate={updateScene}
            onDelete={() => deleteScene(activeScene.id)}
            // Always expanded in this view, so we hide the collapse logic by forcing expanded state
            isExpandedInPanel={true}
          />
        )}
      </div>
    </div>
  );
}