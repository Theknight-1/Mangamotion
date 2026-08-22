"use client";

import React, { useState, useCallback, memo } from "react";
import useSWR from "swr";
import {
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Film,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from "lucide-react";
import { storyboardApi, swrKeys } from "@/lib/api";
import { Button } from "@/components/loader-button";
import type {
  ShotType,
  CameraAngle,
  Perspective,
  CameraMovement,
  StoryboardShot,
  StoryboardScene,
} from "@/types/storyboard";

const SHOT_TYPES: ShotType[] = [
  "wide",
  "medium",
  "close-up",
  "extreme-close-up",
  "action",
  "reaction",
  "establishing",
  "pov",
];

const CAMERA_ANGLES: CameraAngle[] = [
  "eye-level",
  "low-angle",
  "high-angle",
  "birds-eye",
  "dutch-angle",
  "over-the-shoulder",
];

const CAMERA_MOVEMENTS: CameraMovement[] = [
  "static",
  "pan-left",
  "pan-right",
  "tilt-up",
  "tilt-down",
  "zoom-in",
  "zoom-out",
  "tracking",
  "handheld",
];

const SHOT_TYPE_COLORS: Record<string, string> = {
  wide: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  medium: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  "close-up": "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  "extreme-close-up": "text-purple-300 border-purple-500/30 bg-purple-500/10",
  action: "text-red-300 border-red-500/30 bg-red-500/10",
  reaction: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
  establishing: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10",
  pov: "text-rose-300 border-rose-500/30 bg-rose-500/10",
};

interface Props {
  projectId: string;
}

// --- Sub-component for individual rows (Optimized with memo) ---
interface ShotRowProps {
  shot: StoryboardShot;
  index: number;
  isBusy: boolean;
  onUpdate: (id: string, patch: Partial<StoryboardShot>) => void;
  onRegenerate: (shot: StoryboardShot) => void;
  onDelete: (id: string) => void;
  onPreview: (url: string) => void;
}

const tableInputClasses =
  "w-full bg-transparent border border-transparent rounded px-2 py-1.5 text-xs text-white/90 placeholder:text-white/20 transition hover:border-white/10 focus:border-[#c9a84c]/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20";

const tableSelectClasses =
  "w-full bg-[#0c130c] border border-white/10 rounded px-2 py-1.5 text-sm font-semibold text-white/80 capitalize focus:outline-none focus:border-[#c9a84c]/50 transition cursor-pointer";

const ShotRow = memo(
  ({
    shot,
    index,
    isBusy,
    onUpdate,
    onRegenerate,
    onDelete,
    onPreview,
  }: ShotRowProps) => {
    const shotColor =
      SHOT_TYPE_COLORS[shot.shotType || "medium"] ||
      "text-white/70 border-white/20 bg-white/5";

    return (
      <tr className="group transition-colors hover:bg-white/[0.02]">
        {/* Order Number */}
        <td className="px-3 py-2.5 text-center font-mono text-[11px] font-bold text-white/30">
          {index + 1}
        </td>

        {/* Visual Thumbnail */}
        <td className="px-3 py-2">
          <div
            onClick={() =>
              shot.generatedImageUrl && onPreview(shot.generatedImageUrl)
            }
            className="relative aspect-video w-20 overflow-hidden rounded border border-white/10 bg-black cursor-pointer group/img"
          >
            {shot.generatedImageUrl ? (
              <>
                <img
                  src={shot.generatedImageUrl}
                  alt={`Shot ${index + 1}`}
                  className="h-full w-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/img:opacity-100 transition">
                  <Eye size={12} className="text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-wider text-white/20">
                Pending
              </div>
            )}
          </div>
        </td>

        {/* Description */}
        <td className="px-3 py-2">
          <textarea
            rows={3}
            defaultValue={shot.description}
            onBlur={(e) =>
              e.target.value !== shot.description &&
              onUpdate(shot.id, { description: e.target.value })
            }
            className={`${tableInputClasses} resize-none`}
          />
        </td>

        {/* Dialogue */}
        <td className="px-3 py-2">
          <input
            defaultValue={shot.dialogue || ""}
            placeholder="Spoken line..."
            onBlur={(e) =>
              e.target.value !== (shot.dialogue || "") &&
              onUpdate(shot.id, { dialogue: e.target.value })
            }
            className={`${tableInputClasses} italic text-[#e8d5a3]`}
          />
        </td>

        {/* Shot Type (Color Coded) */}
        <td className="px-2 py-2">
          <select
            value={shot.shotType || "medium"}
            onChange={(e) =>
              onUpdate(shot.id, { shotType: e.target.value as ShotType })
            }
            className={`${tableSelectClasses} border-transparent ${shotColor} focus:ring-0`}
          >
            {SHOT_TYPES.map((t) => (
              <option key={t} value={t} className="bg-[#090f09] text-white">
                {t}
              </option>
            ))}
          </select>
        </td>

        {/* Camera Angle */}
        <td className="px-2 py-2">
          <select
            value={shot.cameraAngle || "eye-level"}
            onChange={(e) =>
              onUpdate(shot.id, { cameraAngle: e.target.value as CameraAngle })
            }
            className={tableSelectClasses}
          >
            {CAMERA_ANGLES.map((a) => (
              <option key={a} value={a} className="bg-[#090f09] text-white">
                {a}
              </option>
            ))}
          </select>
        </td>

        {/* Camera Movement */}
        <td className="px-2 py-2">
          <select
            value={shot.movement || "static"}
            onChange={(e) =>
              onUpdate(shot.id, { movement: e.target.value as CameraMovement })
            }
            className={tableSelectClasses}
          >
            {CAMERA_MOVEMENTS.map((m) => (
              <option key={m} value={m} className="bg-[#090f09] text-white">
                {m}
              </option>
            ))}
          </select>
        </td>

        {/* Duration */}
        <td className="px-2 py-2 text-center">
          <input
            type="number"
            min={1}
            max={30}
            defaultValue={shot.duration || shot.estDuration || 3}
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                onUpdate(shot.id, { duration: val });
              }
            }}
            className="w-12 text-center bg-transparent border border-transparent rounded py-1 font-mono text-xs text-white/80 transition hover:border-white/10 focus:border-[#c9a84c]/50 focus:bg-black/40 focus:outline-none"
          />
        </td>

        {/* Actions */}
        <td className="px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => onRegenerate(shot)}
              disabled={isBusy}
              title="Generate / Regenerate Shot Frame"
              className="p-1.5 rounded text-white/50 transition hover:bg-white/5 hover:text-[#c9a84c] disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={isBusy ? "animate-spin text-[#c9a84c]" : ""}
              />
            </button>
            <button
              onClick={() => onDelete(shot.id)}
              title="Delete Shot"
              className="p-1.5 rounded text-white/30 transition hover:bg-white/5 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </td>
      </tr>
    );
  },
);
ShotRow.displayName = "ShotRow";

// --- Main Component ---
export function ShotListPanel({ projectId }: Props) {
  const {
    data: shotsData,
    mutate: mutateShots,
    isLoading: loadingShots,
  } = useSWR(
    swrKeys.storyboardShots(projectId),
    () => storyboardApi.listShots(projectId),
    { revalidateOnFocus: false },
  );

  const { data: scenesData } = useSWR(
    swrKeys.storyboardScenes(projectId),
    () => storyboardApi.getScenes(projectId),
    { revalidateOnFocus: false },
  );

  const shots = shotsData?.shots ?? [];
  const scenes = scenesData?.scenes ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSceneFilter, setSelectedSceneFilter] = useState<string>("all");
  const [collapsedScenes, setCollapsedScenes] = useState<Set<string>>(
    new Set(),
  );
  const [busyShotId, setBusyShotId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const toggleCollapseScene = useCallback((sceneId: string) => {
    setCollapsedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  }, []);

  const handleAddShot = useCallback(
    async (sceneId?: string) => {
      await storyboardApi.createShot(projectId, {
        description: "New shot keyframe",
        sceneId: sceneId || (scenes[0]?.id ?? null),
        shotType: "medium",
        cameraAngle: "eye-level",
        duration: 3,
      });
      mutateShots();
    },
    [projectId, scenes, mutateShots],
  );

  const handleUpdate = useCallback(
    async (id: string, patch: Partial<StoryboardShot>) => {
      await storyboardApi.updateShot(id, patch);
      mutateShots();
    },
    [mutateShots],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this shot?")) return;
      await storyboardApi.deleteShot(id);
      mutateShots();
    },
    [mutateShots],
  );

  const handleRegenerate = useCallback(
    async (shot: StoryboardShot) => {
      setBusyShotId(shot.id);
      try {
        if (shot.generatedImageUrl) {
          await storyboardApi.regenerateShotImage(shot.id);
        } else {
          await storyboardApi.generateShotImage(shot.id);
        }
        mutateShots();
      } finally {
        setBusyShotId(null);
      }
    },
    [mutateShots],
  );

  // Filter shots
  const filteredShots = shots.filter((shot) => {
    if (selectedSceneFilter !== "all" && shot.sceneId !== selectedSceneFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = shot.description?.toLowerCase().includes(q);
      const matchDial = shot.dialogue?.toLowerCase().includes(q);
      const matchType = shot.shotType?.toLowerCase().includes(q);
      if (!matchDesc && !matchDial && !matchType) return false;
    }
    return true;
  });

  // Group by scenes
  const groupedShots: {
    scene: StoryboardScene | null;
    shots: StoryboardShot[];
  }[] = [];

  if (scenes.length > 0) {
    scenes.forEach((scene) => {
      const sceneShots = filteredShots.filter((s) => s.sceneId === scene.id);
      if (selectedSceneFilter === "all" || selectedSceneFilter === scene.id) {
        groupedShots.push({ scene, shots: sceneShots });
      }
    });
    // Unassigned shots
    const unassigned = filteredShots.filter(
      (s) => !s.sceneId || !scenes.some((sc) => sc.id === s.sceneId),
    );
    if (unassigned.length > 0 && selectedSceneFilter === "all") {
      groupedShots.push({ scene: null, shots: unassigned });
    }
  } else {
    groupedShots.push({ scene: null, shots: filteredShots });
  }

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#080d08]/90 p-3 backdrop-blur-sm shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search descriptions, dialogue..."
              className="h-9 w-64 rounded-md border border-white/10 bg-black/40 pl-9 pr-3 text-xs text-white placeholder:text-white/30 transition focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20"
            />
          </div>

          {/* Scene selector filter */}
          {scenes.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-white/40" />
              <select
                value={selectedSceneFilter}
                onChange={(e) => setSelectedSceneFilter(e.target.value)}
                className="h-9 rounded-md border border-white/10 bg-black/40 px-2 text-xs text-white transition focus:border-[#c9a84c]/50 focus:outline-none cursor-pointer"
              >
                <option value="all">All Scenes ({shots.length} shots)</option>
                {scenes.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    Scene {idx + 1}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          leftIcon={<Plus size={13} />}
          onClick={() => handleAddShot()}
          className="py-1.5 text-xs"
        >
          Add New Shot
        </Button>
      </div>

      {/* Content */}
      {loadingShots ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-md border border-white/5 bg-[#0a0f0a]"
            />
          ))}
        </div>
      ) : filteredShots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-[#080d08] p-16 text-center">
          <Film size={28} className="mx-auto text-white/20 mb-3" />
          <p className="font-semibold text-white/60">
            No shots match your filter
          </p>
          <p className="text-[11px] text-white/30 mt-1 max-w-xs">
            Try adjusting your search query or scene filter. Or click "Add New
            Shot" to start.
          </p>
        </div>
      ) : (
        /* Scene Grouped Tables */
        <div className="space-y-8">
          {groupedShots.map((group, gIdx) => {
            const isCollapsed = group.scene
              ? collapsedScenes.has(group.scene.id)
              : false;
            const sceneTitle = group.scene?.title || `Scene ${gIdx + 1}`;

            return (
              <div
                key={group.scene?.id || "unassigned"}
                className="overflow-hidden rounded-lg border border-white/10 bg-[#080d08] shadow-xl"
              >
                {/* Scene Header */}
                <div
                  onClick={() =>
                    group.scene && toggleCollapseScene(group.scene.id)
                  }
                  className="flex cursor-pointer items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#0c130c] to-[#080d08] px-4 py-3 hover:from-[#101810] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[#c9a84c]/10 text-xs font-bold text-[#e8d5a3] border border-[#c9a84c]/20">
                      {gIdx + 1}
                    </div>
                    <span className="font-bold text-white text-sm tracking-wide">
                      {sceneTitle}
                    </span>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                      {group.shots.length} shot
                      {group.shots.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-white/50">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddShot(group.scene?.id);
                      }}
                      className="border border-white/10 py-1 text-xs font-semibold text-white/70 hover:border-[#c9a84c]/40 hover:text-[#e8d5a3] hover:bg-transparent"
                    >
                      <Plus size={10} /> Add Shot
                    </Button>
                    {isCollapsed ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronUp size={16} />
                    )}
                  </div>
                </div>

                {/* Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-black/20 text-[10px] font-bold uppercase tracking-wider text-white/40">
                          <th className="w-12 px-3 py-3 text-center">#</th>
                          <th className="w-24 px-3 py-3">Visual</th>
                          <th className="px-3 py-3">
                            Shot Action &amp; Description
                          </th>
                          <th className="w-64 px-3 py-3">Dialogue / Audio</th>
                          <th className="w-32 px-3 py-3">Framing</th>
                          <th className="w-32 px-3 py-3">Angle</th>
                          <th className="w-28 px-3 py-3">Movement</th>
                          <th className="w-16 px-3 py-3 text-center">Sec</th>
                          <th className="w-20 px-3 py-3 text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {group.shots.map((shot, sIdx) => (
                          <ShotRow
                            key={shot.id}
                            shot={shot}
                            index={sIdx}
                            isBusy={busyShotId === shot.id}
                            onUpdate={handleUpdate}
                            onRegenerate={handleRegenerate}
                            onDelete={handleDelete}
                            onPreview={setPreviewImageUrl}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Lightbox Preview */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-pointer"
        >
          <button
            className="absolute top-6 right-6 p-2 text-white/60 hover:text-white transition"
            onClick={() => setPreviewImageUrl(null)}
          >
            <X size={24} />
          </button>
          <div className="relative max-w-5xl overflow-hidden rounded-lg border border-white/10 shadow-2xl">
            <img
              src={previewImageUrl}
              alt="Shot Preview"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
