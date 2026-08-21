"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Eye,
  Film,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  MessageSquare,
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

const PERSPECTIVES: Perspective[] = [
  "1-point",
  "2-point",
  "3-point",
  "isometric",
  "panoramic",
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
  wide: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "close-up": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "extreme-close-up": "bg-purple-500/15 text-purple-300 border-purple-500/30",
  action: "bg-red-500/15 text-red-300 border-red-500/30",
  reaction: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  establishing: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  pov: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

interface Props {
  projectId: string;
}

export function ShotListPanel({ projectId }: Props) {
  const { data: shotsData, mutate: mutateShots, isLoading: loadingShots } = useSWR(
    swrKeys.storyboardShots(projectId),
    () => storyboardApi.listShots(projectId),
    { revalidateOnFocus: false },
  );

  const { data: scenesData, mutate: mutateScenes } = useSWR(
    swrKeys.storyboardScenes(projectId),
    () => storyboardApi.getScenes(projectId),
    { revalidateOnFocus: false },
  );

  const shots = shotsData?.shots ?? [];
  const scenes = scenesData?.scenes ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSceneFilter, setSelectedSceneFilter] = useState<string>("all");
  const [collapsedScenes, setCollapsedScenes] = useState<Set<string>>(new Set());
  const [busyShotId, setBusyShotId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const toggleCollapseScene = (sceneId: string) => {
    setCollapsedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  async function handleAddShot(sceneId?: string) {
    await storyboardApi.createShot(projectId, {
      description: "New shot keyframe",
      sceneId: sceneId || (scenes[0]?.id ?? null),
      shotType: "medium",
      cameraAngle: "eye-level",
      duration: 3,
    });
    mutateShots();
  }

  async function handleUpdate(id: string, patch: Partial<StoryboardShot>) {
    await storyboardApi.updateShot(id, patch);
    mutateShots();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shot?")) return;
    await storyboardApi.deleteShot(id);
    mutateShots();
  }

  async function handleRegenerate(shot: StoryboardShot) {
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
  }

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
  const groupedShots: { scene: StoryboardScene | null; shots: StoryboardShot[] }[] = [];

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
      {/* Top Filter & Toolbar Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-[#080d08] p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, dialogue..."
              className="h-8 w-56 rounded border border-white/10 bg-black/40 pl-8 pr-3 text-xs text-white placeholder:text-white/30 focus:border-[#c9a84c]/50 focus:outline-none"
            />
          </div>

          {/* Scene selector filter */}
          {scenes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-white/40" />
              <select
                value={selectedSceneFilter}
                onChange={(e) => setSelectedSceneFilter(e.target.value)}
                className="h-8 rounded border border-white/10 bg-black/40 px-2 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
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

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<Plus size={13} />}
            onClick={() => handleAddShot()}
            className="py-1 text-xs"
          >
            Add New Shot
          </Button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loadingShots ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 w-full animate-pulse rounded border border-white/5 bg-[#0a0f0a]"
            />
          ))}
        </div>
      ) : filteredShots.length === 0 ? (
        <div className="rounded-md border border-dashed border-white/10 bg-[#080d08] p-12 text-center text-white/40">
          <Film size={24} className="mx-auto text-white/20 mb-2" />
          <p className="font-semibold text-white/60">No shots match your filter</p>
          <p className="text-[11px] text-white/30 mt-1">
            Try adjusting your search query or scene filter.
          </p>
        </div>
      ) : (
        /* Scene Grouped Tables */
        <div className="space-y-6">
          {groupedShots.map((group, gIdx) => {
            const isCollapsed = group.scene ? collapsedScenes.has(group.scene.id) : false;
            const sceneTitle = group.scene?.title || `Scene ${gIdx + 1}`;

            return (
              <div
                key={group.scene?.id || "unassigned"}
                className="overflow-hidden rounded-md border border-white/10 bg-[#080d08] shadow-lg"
              >
                {/* Scene Header Strip */}
                <div
                  onClick={() => group.scene && toggleCollapseScene(group.scene.id)}
                  className="flex cursor-pointer items-center justify-between border-b border-white/10 bg-[#0c130c] px-4 py-2.5 hover:bg-[#101810] transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-[#c9a84c]/10 text-xs font-bold text-[#e8d5a3] border border-[#c9a84c]/20">
                      {gIdx + 1}
                    </div>
                    <span className="font-bold text-white text-base">
                      {sceneTitle}
                    </span>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-white/40">
                      {group.shots.length} shot{group.shots.length === 1 ? "" : "s"}
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
                      className=" border border-white/10 py-1 text-xs font-semibold text-white/70 hover:border-[#c9a84c]/40 hover:text-[#e8d5a3]"
                    >
                      <Plus size={10} /> Add Shot
                    </Button>
                    {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                  </div>
                </div>

                {/* Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left">
                      <thead>
                        <tr className="border-b border-white/10 bg-black/40 text-xs font-bold uppercase tracking-wider text-white/40">
                          <th className="w-12 px-3 py-2.5 text-center">#</th>
                          <th className="w-24 px-3 py-2.5">Visual</th>
                          <th className="px-3 py-2.5">Shot Action &amp; Description</th>
                          <th className="w-60 px-3 py-2.5">Dialogue / Audio</th>
                          <th className="w-28 px-3 py-2.5">Framing</th>
                          <th className="w-28 px-3 py-2.5">Angle</th>
                          <th className="w-24 px-3 py-2.5">Movement</th>
                          <th className="w-16 px-3 py-2.5 text-center">Sec</th>
                          <th className="w-20 px-3 py-2.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {group.shots.map((shot, sIdx) => {
                          const isBusy = busyShotId === shot.id;
                          const shotColor =
                            SHOT_TYPE_COLORS[shot.shotType || "medium"] ||
                            "bg-white/10 text-white/70 border-white/20";

                          return (
                            <tr
                              key={shot.id}
                              className="group transition hover:bg-white/[0.02]"
                            >
                              {/* Order Number */}
                              <td className="px-3 py-2.5 text-center font-mono text-[11px] font-bold text-white/40">
                                {sIdx + 1}
                              </td>

                              {/* Visual Thumbnail */}
                              <td className="px-3 py-2">
                                <div
                                  onClick={() =>
                                    shot.generatedImageUrl &&
                                    setPreviewImageUrl(shot.generatedImageUrl)
                                  }
                                  className="relative aspect-video w-20 overflow-hidden rounded border border-white/10 bg-black cursor-pointer group/img"
                                >
                                  {shot.generatedImageUrl ? (
                                    <>
                                      <img
                                        src={shot.generatedImageUrl}
                                        alt={`Shot ${sIdx + 1}`}
                                        className="h-full w-full object-cover group-hover/img:scale-105 transition"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/img:opacity-100 transition">
                                        <Eye size={12} className="text-white" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[9px] text-white/25">
                                      Pending
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Description (Editable) */}
                              <td className="px-3 py-2">
                                <textarea
                                  rows={6}
                                  defaultValue={shot.description}
                                  onBlur={(e) =>
                                    e.target.value !== shot.description &&
                                    handleUpdate(shot.id, { description: e.target.value })
                                  }
                                  className="w-full rounded border border-transparent bg-transparent p-1.5 text-xs text-white/90 transition hover:border-white/10 focus:border-[#c9a84c]/50 focus:bg-black/40 focus:outline-none"
                                />
                              </td>

                              {/* Dialogue */}
                              <td className="px-3 py-2">
                                <input
                                  defaultValue={shot.dialogue || ""}
                                  placeholder="Spoken line..."
                                  onBlur={(e) =>
                                    e.target.value !== (shot.dialogue || "") &&
                                    handleUpdate(shot.id, { dialogue: e.target.value })
                                  }
                                  className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-xs italic text-[#e8d5a3] placeholder:text-white/20 transition hover:border-white/10 focus:border-[#c9a84c]/50 focus:bg-black/40 focus:outline-none"
                                />
                              </td>

                              {/* Shot Type */}
                              <td className="px-2 py-2">
                                <select
                                  value={shot.shotType || "medium"}
                                  onChange={(e) =>
                                    handleUpdate(shot.id, {
                                      shotType: e.target.value as ShotType,
                                    })
                                  }
                                  className={`w-full rounded border px-2 py-1 text-[11px] font-semibold capitalize focus:outline-none ${shotColor}`}
                                >
                                  {SHOT_TYPES.map((t) => (
                                    <option
                                      key={t}
                                      value={t}
                                      className="bg-[#090f09] text-white"
                                    >
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
                                    handleUpdate(shot.id, {
                                      cameraAngle: e.target.value as CameraAngle,
                                    })
                                  }
                                  className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/80 capitalize focus:border-[#c9a84c]/50 focus:outline-none"
                                >
                                  {CAMERA_ANGLES.map((a) => (
                                    <option
                                      key={a}
                                      value={a}
                                      className="bg-[#090f09] text-white"
                                    >
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
                                    handleUpdate(shot.id, {
                                      movement: e.target.value as CameraMovement,
                                    })
                                  }
                                  className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/70 capitalize focus:border-[#c9a84c]/50 focus:outline-none"
                                >
                                  {CAMERA_MOVEMENTS.map((m) => (
                                    <option
                                      key={m}
                                      value={m}
                                      className="bg-[#090f09] text-white"
                                    >
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
                                      handleUpdate(shot.id, { duration: val });
                                    }
                                  }}
                                  className="w-12 text-center rounded border border-white/10 bg-black/30 py-1 font-mono text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                                />
                              </td>

                              {/* Actions */}
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleRegenerate(shot)}
                                    disabled={isBusy}
                                    title="Generate / Regenerate Shot Frame"
                                    className="p-1 text-white/50 transition hover:text-[#c9a84c] disabled:opacity-50"
                                  >
                                    <RefreshCw
                                      size={12}
                                      className={isBusy ? "animate-spin text-[#c9a84c]" : ""}
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(shot.id)}
                                    title="Delete Shot"
                                    className="p-1 text-white/30 transition hover:text-red-400"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
          <div className="relative max-w-4xl overflow-hidden rounded-md border border-white/20 shadow-2xl">
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
