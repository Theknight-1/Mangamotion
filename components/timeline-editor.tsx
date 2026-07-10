"use client";

import { useCallback, useState } from "react";
import {
  Plus,
  Film,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Trash2,
  GripVertical,
} from "lucide-react";
import { createId } from "@paralleldrive/cuid2";
import type { Scene } from "@/types/scene";
import { Button } from "./loader-button";
import { SceneCard } from "./scene-card";
import { BulkUploader } from "@/components/bulk-uploader";

export type TimelineScene = Scene;
export type { Scene };

interface TimelineEditorProps {
  videoId: string;
  scenes: Scene[];
  onScenesChange: (scenes: Scene[]) => void;
}

export function TimelineEditor({
  videoId,
  scenes,
  onScenesChange,
}: TimelineEditorProps) {
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Drag and drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || null;

  const addScene = useCallback(() => {
    const newScene: Scene = {
      id: createId(),
      index: scenes.length,
      imageUrl: "",
      narration: "",
      keyframes: [],
      voiceId: "",
      status: "idle",
    };
    onScenesChange([...scenes, newScene]);
    setActiveSceneId(newScene.id);
  }, [scenes, onScenesChange]);

  const handleScenesCreated = useCallback(
    (newScenes: Scene[]) => {
      const updated = [...scenes];
      newScenes.forEach((ns) => {
        const idx = updated.findIndex((s) => s.id === ns.id);
        if (idx >= 0) updated[idx] = ns;
        else updated.push(ns);
      });

      const reindexed = updated
        .sort((a, b) => a.index - b.index)
        .map((s, i) => ({ ...s, index: i }));

      onScenesChange(reindexed);

      if (newScenes.length > 0 && !activeSceneId) {
        setActiveSceneId(newScenes[0].id);
      }
    },
    [scenes, onScenesChange, activeSceneId],
  );

  const updateScene = useCallback(
    (updated: Scene) => {
      onScenesChange(scenes.map((s) => (s.id === updated.id ? updated : s)));
    },
    [scenes, onScenesChange],
  );

  const deleteScene = useCallback(
    (sceneId: string) => {
      const filtered = scenes.filter((s) => s.id !== sceneId);
      onScenesChange(filtered.map((s, i) => ({ ...s, index: i })));
      if (activeSceneId === sceneId) {
        setActiveSceneId(filtered.length > 0 ? filtered[0].id : null);
      }
      setOpenMenuId(null);
    },
    [scenes, onScenesChange, activeSceneId],
  );

  // ── Drag Handlers ──────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDraggingId(sceneId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, sceneId: string) => {
    e.preventDefault();
    if (draggingId !== sceneId) {
      setDragOverId(sceneId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const draggedIndex = scenes.findIndex((s) => s.id === draggingId);
    const targetIndex = scenes.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const updatedScenes = [...scenes];
    const [removed] = updatedScenes.splice(draggedIndex, 1);
    updatedScenes.splice(targetIndex, 0, removed);

    // Re-index and save
    const reindexed = updatedScenes.map((s, i) => ({ ...s, index: i }));
    onScenesChange(reindexed);

    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const totalDur = scenes.reduce((sum, s) => sum + (s.voice?.duration ?? 0), 0);

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden md:flex-row">
      {/* LEFT COLUMN: Scene List */}
      <div className="flex w-full shrink-0 flex-col border-r border-white/[0.07] md:w-72 lg:w-80">
        <div className="flex items-center justify-between p-4 pb-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Timeline editor
            </h2>
            <p className="mt-0.5 text-[11px] text-white/30">
              {scenes.length === 0
                ? "Add scenes"
                : `Total: ${totalDur > 0 ? `~${totalDur}s` : "0s"} · Drag to reorder`}
            </p>
          </div>
          <BulkUploader
            videoId={videoId}
            allScenes={scenes}
            onScenesCreated={handleScenesCreated}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0">
          {scenes.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.07] text-center">
              <Film size={24} className="mb-2 text-white/15" />
              <p className="text-xs text-white/30">No scenes yet</p>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={addScene}
                  className="cursor-pointer text-xs px-4 py-1.5 rounded-lg"
                >
                  <Plus size={12} /> Add Manually
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {scenes.map((scene, i) => {
                const isActive = activeSceneId === scene.id;
                const isDone = scene.status === "done";
                const hasVoice = !!scene.voice?.audioUrl;
                const isDragging = draggingId === scene.id;
                const isDragOver = dragOverId === scene.id;

                return (
                  <div
                    key={scene.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, scene.id)}
                    onDragOver={(e) => handleDragOver(e, scene.id)}
                    onDrop={(e) => handleDrop(e, scene.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setActiveSceneId(scene.id)}
                    className={`group relative flex w-full items-center gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isActive
                        ? "border-[#4a8a42]/50 bg-[#4a8a42]/15"
                        : "border-white/[0.07] bg-white/2 hover:border-white/15 hover:bg-white/4"
                    } ${isDragging ? "opacity-40" : ""} ${isDragOver ? "ring-2 ring-[#c9a84c]" : ""}`}
                  >
                    {/* Drag Handle */}
                    <div className="cursor-grab text-white/15 group-hover:text-white/40 transition-colors">
                      <GripVertical size={14} />
                    </div>

                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors ${
                        isDone
                          ? "border-[#4a8a42]/40 bg-[#4a8a42]/20 text-[#4a8a42]"
                          : isActive
                            ? "border-[#4a8a42]/30 bg-[#4a8a42]/10 text-[#7fb870]"
                            : "border-white/8 bg-white/4 text-white/30"
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

                    {scene.status === "analyzing" ? (
                      <Loader2
                        size={12}
                        className="animate-spin text-[#c9a84c]"
                      />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === scene.id ? null : scene.id,
                          );
                        }}
                        className="p-1 text-white/40 hover:text-white"
                      >
                        <MoreVertical size={14} />
                      </button>
                    )}

                    {/* Dropdown Menu */}
                    {openMenuId === scene.id && (
                      <div
                        className="absolute right-0 top-12 z-50 w-36 rounded-lg border border-white/10 bg-[#1a1a24] py-1 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => deleteScene(scene.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={12} /> Delete Scene
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <Button
                onClick={addScene}
                className="w-full cursor-pointer rounded-xl border border-dashed border-white/[0.07] py-2 text-sm transition-colors"
              >
                <Plus size={14} /> Add Scene
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Scene Details & Actions */}
      <div
        className="flex-1 overflow-y-auto bg-[#0d0d18] p-6"
        onClick={() => setOpenMenuId(null)}
      >
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
            isExpandedInPanel={true}
          />
        )}
      </div>
    </div>
  );
}