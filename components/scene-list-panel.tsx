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
import { BulkUploader } from "@/components/bulk-uploader";
import Image from "next/image";

interface SceneListPanelProps {
  videoId: string;
  scenes: Scene[];
  activeSceneId: string | null;
  onSelectScene: (id: string) => void;
  onScenesChange: (scenes: Scene[]) => void;
}

export function SceneListPanel({
  videoId,
  scenes,
  activeSceneId,
  onSelectScene,
  onScenesChange,
}: SceneListPanelProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  console.log(scenes);

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
    onSelectScene(newScene.id);
  }, [scenes, onScenesChange, onSelectScene]);

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
        onSelectScene(newScenes[0].id);
      }
    },
    [scenes, onScenesChange, activeSceneId, onSelectScene],
  );

  const deleteScene = useCallback(
    (sceneId: string) => {
      const filtered = scenes.filter((s) => s.id !== sceneId);
      onScenesChange(filtered.map((s, i) => ({ ...s, index: i })));
      if (activeSceneId === sceneId) {
        onSelectScene(filtered.length > 0 ? filtered[0].id : "");
      }
      setOpenMenuId(null);
    },
    [scenes, onScenesChange, activeSceneId, onSelectScene],
  );

  // ── Drag handlers ────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDraggingId(sceneId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, sceneId: string) => {
    e.preventDefault();
    if (draggingId !== sceneId) setDragOverId(sceneId);
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

    onScenesChange(updatedScenes.map((s, i) => ({ ...s, index: i })));
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const totalDur = scenes.reduce((sum, s) => sum + (s.voice?.duration ?? 0), 0);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-white/[0.07] bg-[#0a0f0a]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/[0.07] p-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white/90">
            Scene list
          </h2>
          <p className="mt-0.5 text-[11px] text-white/30">
            {scenes.length === 0
              ? "No scenes yet"
              : `${scenes.length} scene${scenes.length !== 1 ? "s" : ""} · ${totalDur > 0 ? `~${totalDur}s` : "0s"}`}
          </p>
        </div>
        <BulkUploader
          videoId={videoId}
          allScenes={scenes}
          onScenesCreated={handleScenesCreated}
        />
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-3">
        {scenes.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
            <Film size={22} className="mb-2 text-white/15" />
            <p className="text-xs text-white/30">No scenes yet</p>
            <Button
              onClick={addScene}
              className="mt-3 cursor-pointer text-xs px-4 py-1.5 rounded-lg"
            >
              <Plus size={12} /> Add scene
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {scenes.map((scene, i) => {
              const isActive = activeSceneId === scene.id;
              const isDone = scene.status === "done";
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
                  onClick={() => onSelectScene(scene.id)}
                  className={`group relative flex w-full items-center gap-2 rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                    isActive
                      ? "border-[#c9a84c]/60 bg-[#c9a84c]/10"
                      : "border-white/15 bg-white/2 hover:border-white/30 hover:bg-white/5"
                  } ${isDragging ? "opacity-40" : ""} ${isDragOver ? "ring-2 ring-[#c9a84c]" : ""}`}
                >
                  <div className="cursor-grab text-white/25 group-hover:text-white/40 transition-colors">
                    <GripVertical size={14} />
                  </div>

                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                      isDone
                        ? "border-[#4a8a42]/40 bg-[#4a8a42]/20 text-[#4a8a42]"
                        : isActive
                          ? "border-[#c9a84c]/40 bg-[#c9a84c]/15 text-[#e8d5a3]"
                          : "border-white/10 bg-white/5 text-white/30"
                    }`}
                  >
                    <Image
                      src={scene.imageUrl}
                      alt="Scene"
                      width={28}
                      height={28}
                    />
                  </div>

                  <div className="flex-1 flex flex-col items-start overflow-hidden">
                    <span
                      className={`flex-1 truncate text-sm font-medium ${
                        isActive ? "text-white" : "text-white/60"
                      }`}
                    >
                      Scene {i + 1}
                    </span>
                    {scene.voice?.duration ? (
                      <span className="ml-1 text-[10px] text-white/40">
                        ~{scene.voice.duration}s
                      </span>
                    ) : (
                      <span className="ml-1 text-[10px] text-red-400">
                        No voice generated
                      </span>
                    )}
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
                      className="p-1 text-white/35 hover:text-white"
                    >
                      <MoreVertical size={14} />
                    </button>
                  )}

                  {openMenuId === scene.id && (
                    <div
                      className="absolute right-0 top-12 z-50 w-36 rounded-lg border border-white/10 bg-[#1a1a24] py-1 shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => deleteScene(scene.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={12} /> Delete scene
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Button
        onClick={addScene}
        className="w-[95%] mx-auto cursor-pointer m-2 rounded-lg border border-dashed border-white/15 py-2 text-sm transition-colors"
      >
        <Plus size={14} /> Add scene
      </Button>
    </div>
  );
}
