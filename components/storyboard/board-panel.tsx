"use client";

import { useState } from "react";
import useSWR from "swr";
import { GripVertical, Sparkles, RefreshCw, AlertTriangle, Loader2, Clapperboard } from "lucide-react";
import { storyboardApi, swrKeys } from "@/lib/api";
import { STORYBOARD_LIMITS, MODEL_LABELS, type StoryboardModel, type StoryboardTierKey } from "@/lib/storyboard/tier-limits";
import type { StoryboardShot, CameraAngle } from "@/types/storyboard";

const CAMERA_ANGLES: CameraAngle[] = [
  "eye-level",
  "low-angle",
  "high-angle",
  "over-the-shoulder",
  "dutch-angle",
];

interface Props {
  projectId: string;
  tier: StoryboardTierKey;
}

// Signature element: a sprocket-hole rail along each card, echoing a
// physical film strip — ties the grid back to "Storyboard Studio" /
// Clapperboard branding without leaning on a generic AI-card look.
function FilmstripRail() {
  return (
    <div className="flex items-center justify-between px-2 py-1">
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="h-1 w-1 rounded-md l bg-white/25" />
      ))}
    </div>
  );
}

export function BoardPanel({ projectId, tier }: Props) {
  const { data, mutate } = useSWR(
    swrKeys.storyboardShots(projectId),
    () => storyboardApi.listShots(projectId),
    { revalidateOnFocus: false },
  );
  const shots = data?.shots ?? [];
  const allowedModels = STORYBOARD_LIMITS[tier].allowedModels;

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggingId !== id) setDragOverId(id);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const draggedIndex = shots.findIndex((s) => s.id === draggingId);
    const targetIndex = shots.findIndex((s) => s.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...shots];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    mutate({ shots: reordered }, false);
    await storyboardApi.reorderShots(
      projectId,
      reordered.map((s, idx) => ({ id: s.id, orderIndex: idx })),
    );
    mutate();
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  async function handleGenerate(shot: StoryboardShot, model?: StoryboardModel) {
    setBusyId(shot.id);
    try {
      if (shot.generatedImageUrl) {
        await storyboardApi.regenerateShotImage(shot.id, model);
      } else {
        await storyboardApi.generateShotImage(shot.id, model);
      }
      mutate();
    } catch (err: any) {
      alert(err.message ?? "Generation failed");
      mutate();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCameraAngle(shot: StoryboardShot, angle: CameraAngle | null) {
    await storyboardApi.updateShot(shot.id, { cameraAngle: angle ?? null });
    mutate();
  }

  if (shots.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-md  border border-dashed border-white/10 text-center">
        <Clapperboard size={24} className="mb-2 text-white/15" />
        <p className="text-sm text-white/35">
          No shots yet — add shots in the Shot List tab, or parse a script first.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {shots.map((shot, i) => {
        const isDragging = draggingId === shot.id;
        const isDragOver = dragOverId === shot.id;
        const isBusy = busyId === shot.id;
        const isGenerating = shot.generationStatus === "generating" || isBusy;

        return (
          <div
            key={shot.id}
            draggable
            onDragStart={(e) => handleDragStart(e, shot.id)}
            onDragOver={(e) => handleDragOver(e, shot.id)}
            onDrop={(e) => handleDrop(e, shot.id)}
            onDragEnd={handleDragEnd}
            className={`group flex flex-col overflow-hidden rounded-md  border bg-linear-to-b from-[#101510] to-[#0a0d0a] shadow-lg transition-all ${
              isDragOver ? "ring-2 ring-[#c9a84c]" : "border-white/10"
            } ${isDragging ? "opacity-40" : "hover:border-[#87da70]/25"}`}
          >
            <FilmstripRail />

            <div className="flex items-center justify-between px-3 text-[11px] text-white/35">
              <span className="flex items-center gap-1.5 font-medium tracking-wide text-white/50">
                <GripVertical size={12} className="cursor-grab text-white/25" />
                Scene 1 · Shot {i + 1}
              </span>
              {shot.consistencyFlagged && (
                <span
                  title="Low consistency score against character reference"
                  className="flex items-center gap-1 rounded-md l bg-amber-500/10 px-1.5 py-0.5 text-amber-400"
                >
                  <AlertTriangle size={10} />
                  Check
                </span>
              )}
            </div>

            <div className="relative mt-2 aspect-[9/16] w-full overflow-hidden bg-black/30">
              {isGenerating ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="animate-spin text-white/30" size={22} />
                </div>
              ) : shot.generatedImageUrl ? (
                <img
                  src={shot.generatedImageUrl}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  alt={shot.description}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-4 text-center">
                  <span className="text-[11px] text-white/20">Not generated yet</span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
              <p className="line-clamp-2 text-xs leading-relaxed text-white/60">
                {shot.description || <span className="text-white/25">No description</span>}
              </p>

              <select
                value={shot.cameraAngle ?? ""}
                onChange={(e) =>
                  handleCameraAngle(
                    shot,
                    e.target.value === "" ? null : (e.target.value as CameraAngle),
                  )
                }
                className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-[11px] text-white/55 focus:border-[#87da70]/40 focus:outline-none"
              >
                <option value="">Camera angle —</option>
                {CAMERA_ANGLES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <div className="mt-auto flex gap-1.5 pt-1">
                <select
                  disabled={isGenerating}
                  defaultValue={shot.modelUsed ?? allowedModels[0]}
                  onChange={(e) => handleGenerate(shot, e.target.value as StoryboardModel)}
                  className="flex-1 rounded-md border border-white/10 bg-black/20 px-1.5 py-1.5 text-[11px] text-white/55 focus:outline-none"
                >
                  {allowedModels.map((m) => (
                    <option key={m} value={m}>
                      {MODEL_LABELS[m]}
                    </option>
                  ))}
                </select>
                <button
                  disabled={isGenerating}
                  onClick={() => handleGenerate(shot)}
                  className="flex items-center justify-center rounded-md bg-[#87da70] px-3 text-black transition hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100"
                >
                  {isGenerating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : shot.generatedImageUrl ? (
                    <RefreshCw size={13} />
                  ) : (
                    <Sparkles size={13} />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
