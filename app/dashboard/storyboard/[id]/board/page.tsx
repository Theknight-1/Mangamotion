"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Sparkles,
  Play,
  Pause,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  Volume2,
  Film,
  Camera,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Video,
  Eye,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Sliders,
  ShieldCheck,
  Zap,
  Music,
  Sun,
  Maximize2,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi, swrKeys } from "@/lib/api";
import { StoryboardUsageIndicator } from "@/components/storyboard/usage-indicator";
import {
  STORYBOARD_LIMITS,
  MODEL_LABELS,
  LIGHTING_PRESETS,
  LENS_PRESETS,
  AUDIO_CUE_PRESETS,
  type StoryboardModel,
  type StoryboardTierKey,
} from "@/lib/storyboard/tier-limits";
import type {
  StoryboardShot,
  StoryboardScene,
  StoryboardCharacter,
  ShotType,
  CameraAngle,
  Perspective,
  CameraMovement,
} from "@/types/storyboard";
import { Button } from "@/components/loader-button";
import { getAspectRatioClass } from "@/lib/utils";

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

interface Props {
  params: Promise<{ id: string }>;
}

export default function StoryboardBoardPage({ params }: Props) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [selectedModel, setSelectedModel] = useState<StoryboardModel>("flux");
  const [activeShotForEdit, setActiveShotForEdit] =
    useState<StoryboardShot | null>(null);
  const [activeShotForIterate, setActiveShotForIterate] =
    useState<StoryboardShot | null>(null);
  const [activeShotForInspect, setActiveShotForInspect] =
    useState<StoryboardShot | null>(null);
  const [iterationPrompt, setIterationPrompt] = useState("");
  const [generatingShotIds, setGeneratingShotIds] = useState<Set<string>>(
    new Set(),
  );
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const addGeneratingShotId = (id: string) => {
    setGeneratingShotIds((prev) => new Set(prev).add(id));
  };
  const removeGeneratingShotId = (id: string) => {
    setGeneratingShotIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAnimaticModal, setShowAnimaticModal] = useState(false);
  const [exportingType, setExportingType] = useState<
    "slideshow" | "render" | "pdf" | null
  >(null);

  // Animatic Player State
  const [animaticIndex, setAnimaticIndex] = useState(0);
  const [isPlayingAnimatic, setIsPlayingAnimatic] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null,
  );

  const { data: projectData } = useSWR(
    swrKeys.storyboardProject(projectId),
    () => storyboardApi.getProject(projectId),
    { revalidateOnFocus: false },
  );

  const { data: scenesData } = useSWR(
    swrKeys.storyboardScenes(projectId),
    () => storyboardApi.getScenes(projectId),
    { revalidateOnFocus: false },
  );

  const { data: charactersData } = useSWR(
    swrKeys.storyboardCharacters(projectId),
    () => storyboardApi.getCharacters(projectId),
    { revalidateOnFocus: false },
  );

  const {
    data: shotsData,
    mutate: mutateShots,
    isLoading: loadingShots,
  } = useSWR(
    swrKeys.storyboardShots(projectId),
    () => storyboardApi.getShots(projectId),
    { revalidateOnFocus: false },
  );

  const { data: usageData, mutate: mutateUsage } = useSWR(
    swrKeys.storyboardUsage(),
    () => storyboardApi.getUsage(),
    { revalidateOnFocus: false },
  );

  const project = projectData?.project;
  const scenes = scenesData?.scenes || [];
  const characters = charactersData?.characters || [];
  const shots = shotsData?.shots || [];

  const tier: StoryboardTierKey = usageData?.tier ?? "free";
  const allowedModels = STORYBOARD_LIMITS[tier]?.allowedModels ?? [
    "flux",
    "nano-banana",
  ];

  const sceneMap = new Map(scenes.map((s) => [s.id, s]));
  const characterMap = new Map(characters.map((c) => [c.id, c]));

  const handleGenerateShot = async (shot: StoryboardShot) => {
    addGeneratingShotId(shot.id);
    try {
      toast.loading(`Generating shot illustration...`, {
        id: `shot-toast-${shot.id}`,
      });
      const res = await storyboardApi.generateShotImage(shot.id, selectedModel);
      mutateShots();
      mutateUsage();
      toast.success(
        res.consistencyFlagged
          ? "Shot generated (Low consistency flagged — click Iterate to refine)"
          : "Shot generated with character consistency!",
        { id: `shot-toast-${shot.id}` },
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to generate shot image", {
        id: `shot-toast-${shot.id}`,
      });
    } finally {
      removeGeneratingShotId(shot.id);
    }
  };

  const handleRegenerateShot = async (shot: StoryboardShot) => {
    addGeneratingShotId(shot.id);
    try {
      toast.loading(`Re-rolling shot with character reference...`, {
        id: `shot-toast-${shot.id}`,
      });
      await storyboardApi.regenerateShotImage(shot.id, selectedModel);
      mutateShots();
      mutateUsage();
      toast.success("Shot regenerated!", { id: `shot-toast-${shot.id}` });
    } catch (err: any) {
      toast.error(err.message || "Regeneration failed", {
        id: `shot-toast-${shot.id}`,
      });
    } finally {
      removeGeneratingShotId(shot.id);
    }
  };

  const handleApplyIteration = async () => {
    if (!activeShotForIterate || !iterationPrompt.trim()) {
      toast.error("Please enter a refinement instruction");
      return;
    }

    const shotId = activeShotForIterate.id;
    addGeneratingShotId(shotId);
    try {
      toast.loading(`Applying iteration refinement...`, {
        id: `iter-toast-${shotId}`,
      });
      await storyboardApi.iterateShot(shotId, {
        instruction: iterationPrompt.trim(),
        model: selectedModel,
      });
      mutateShots();
      mutateUsage();
      setActiveShotForIterate(null);
      setIterationPrompt("");
      toast.success("Iterated shot generated!", {
        id: `iter-toast-${shotId}`,
      });
    } catch (err: any) {
      toast.error(err.message || "Iteration failed", {
        id: `iter-toast-${shotId}`,
      });
    } finally {
      removeGeneratingShotId(shotId);
    }
  };

  const handleGenerateAllShots = async () => {
    const pendingShots = shots.filter(
      (s) => !s.generatedImageUrl || s.generationStatus !== "complete",
    );

    if (pendingShots.length === 0) {
      toast("All storyboard shots have already been generated!", {
        icon: "✨",
      });
      return;
    }

    setIsGeneratingAll(true);
    // Mark all pending shots as generating immediately so loaders appear on all cards
    setGeneratingShotIds((prev) => {
      const next = new Set(prev);
      pendingShots.forEach((s) => next.add(s.id));
      return next;
    });

    toast.loading(`Generating ${pendingShots.length} storyboard shots...`, {
      id: "batch-toast",
    });

    let successCount = 0;
    let failCount = 0;

    // Run with concurrency pool of 2 for fast, smooth multi-shot generation without timeout
    const concurrencyLimit = 2;
    const queue = [...pendingShots];

    const worker = async () => {
      while (queue.length > 0) {
        const shot = queue.shift();
        if (!shot) break;

        try {
          await storyboardApi.generateShotImage(shot.id, selectedModel);
          successCount++;
          mutateShots();
        } catch (err: any) {
          console.error(`Shot ${shot.id} generation failed:`, err);
          failCount++;
        } finally {
          removeGeneratingShotId(shot.id);
        }
      }
    };

    try {
      const workers = Array.from(
        { length: Math.min(concurrencyLimit, pendingShots.length) },
        () => worker(),
      );
      await Promise.all(workers);
      mutateShots();
      mutateUsage();

      if (failCount === 0) {
        toast.success(`Successfully generated all ${successCount} shots!`, {
          id: "batch-toast",
        });
      } else if (successCount > 0) {
        toast.success(`Generated ${successCount} shots (${failCount} failed)`, {
          id: "batch-toast",
        });
      } else {
        toast.error(
          `Failed to generate shots. Please check your credits or connection.`,
          { id: "batch-toast" },
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Batch generation failed", {
        id: "batch-toast",
      });
    } finally {
      setIsGeneratingAll(false);
      setGeneratingShotIds((prev) => {
        const next = new Set(prev);
        pendingShots.forEach((s) => next.delete(s.id));
        return next;
      });
    }
  };

  const handleExportPdf = async () => {
    setExportingType("pdf");
    try {
      toast.loading("Generating professional storyboard PDF...", {
        id: "export-toast",
      });
      const res = await storyboardApi.exportPdf(projectId);
      toast.success("PDF ready! Opening download...", { id: "export-toast" });
      window.open(res.pdfUrl, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to export PDF", {
        id: "export-toast",
      });
    } finally {
      setExportingType(null);
    }
  };

  const handleExportSlideshow = async () => {
    setExportingType("slideshow");
    try {
      toast.loading("Rendering slideshow video with voice audio...", {
        id: "export-toast",
      });
      const res = await storyboardApi.exportSlideshow(projectId);
      toast.success("Slideshow video rendered!", { id: "export-toast" });
      window.open(res.videoUrl, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to export slideshow", {
        id: "export-toast",
      });
    } finally {
      setExportingType(null);
    }
  };

  const handleExportRender = async () => {
    setExportingType("render");
    try {
      toast.loading("Creating animated render video in Manga Recap...", {
        id: "export-toast",
      });
      const res = await storyboardApi.exportRender(projectId);
      toast.success(
        "Video project created! Redirecting to timeline editor...",
        { id: "export-toast" },
      );
      window.location.href = res.editorUrl;
    } catch (err: any) {
      toast.error(err.message || "Failed to hand off render", {
        id: "export-toast",
      });
      setExportingType(null);
    }
  };

  // Animatic Player loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAnimatic && shots.length > 0) {
      const currentShot = shots[animaticIndex];
      const parentScene = currentShot?.sceneId
        ? sceneMap.get(currentShot.sceneId)
        : null;

      if (parentScene?.voiceAudioUrl) {
        const audio = new Audio(parentScene.voiceAudioUrl);
        audio.play().catch(() => {});
        setCurrentAudio(audio);
      }

      const durationMs = Math.max(2, currentShot?.duration || 3) * 1000;
      timer = setTimeout(() => {
        if (animaticIndex < shots.length - 1) {
          setAnimaticIndex((prev) => prev + 1);
        } else {
          setIsPlayingAnimatic(false);
          setAnimaticIndex(0);
        }
      }, durationMs);
    }
    return () => {
      clearTimeout(timer);
      if (currentAudio) currentAudio.pause();
    };
  }, [isPlayingAnimatic, animaticIndex, shots]);

  return (
    <div className="min-h-screen bg-[#060e06] text-[#e8d5a3] selection:bg-[#c9a84c] selection:text-black">
      {/* Top Studio Toolbar */}
      <header className="sticky top-0 z-30 border-b border-[#c9a84c]/15 bg-[#080e08]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                router.push(`/dashboard/storyboard/${projectId}/characters`)
              }
              className="rounded-md border border-white/10 p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2 py-0.5 text-[10px] font-bold text-[#e8d5a3] uppercase">
                  {project?.genre || "Drama"}
                </span>
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60 uppercase">
                  {project?.artStyle} &middot; {project?.aspectRatio}
                </span>
              </div>
              <h1 className="text-sm font-bold text-white line-clamp-1">
                {project?.title || "Storyboard Canvas"}
              </h1>
            </div>
          </div>

          {/* Center/Right Toolbar */}
          <div className="flex items-center gap-2.5">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs">
              <Sparkles size={12} className="text-[#c9a84c]" />
              <select
                value={selectedModel}
                onChange={(e) =>
                  setSelectedModel(e.target.value as StoryboardModel)
                }
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {allowedModels.map((m) => (
                  <option key={m} value={m} className="bg-[#080d08] text-white">
                    {MODEL_LABELS[m] || m}
                  </option>
                ))}
              </select>
            </div>

            {/* Play Animatic */}
            <button
              onClick={() => {
                setAnimaticIndex(0);
                setIsPlayingAnimatic(true);
                setShowAnimaticModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white transition hover:border-[#c9a84c]/40 hover:text-[#e8d5a3]"
            >
              <Play size={12} /> Play Animatic
            </button>

            {/* Generate All Shots */}
            <button
              onClick={handleGenerateAllShots}
              disabled={isGeneratingAll}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-3.5 py-1.5 text-xs font-bold text-[#e8d5a3] hover:bg-[#c9a84c]/20 transition disabled:opacity-50"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Batch
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={12} className="text-[#c9a84c]" /> Generate All
                </>
              )}
            </button>

            {/* Export */}
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] px-4 py-1.5 text-xs font-bold text-[#060e06] shadow-md shadow-[#c9a84c]/20 hover:scale-[1.01] transition"
            >
              <Download size={12} /> Export
            </button>

            <StoryboardUsageIndicator />
          </div>
        </div>
      </header>

      {/* Main Studio Board Canvas */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loadingShots ? (
          <div className="flex flex-col gap-8">
            {[1, 2].map((i) => (
              <section className="space-y-4">
                <div className="space-y-2">
                  <div className="h-12 w-full animate-pulse rounded bg-white/5" />
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-64 animate-pulse rounded-md border border-white/[0.05] bg-[#0d120d]/90"
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : shots.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/10 bg-[#080d08] p-16 text-center">
            <Film size={32} className="mx-auto text-white/20" />
            <h3 className="mt-3 text-sm font-bold text-white">
              No shots generated yet
            </h3>
            <p className="mt-1 text-xs text-white/40">
              Return to Scene Breakdown or create your first shot below.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {scenes.map((scene, sceneIndex) => {
              const sceneShots = shots.filter((s) => s.sceneId === scene.id);

              return (
                <div key={scene.id} className="space-y-4">
                  {/* Scene Header Strip */}
                  <div className="flex flex-wrap items-center justify-between rounded-md border border-[#2c2a22] bg-[#0f0e0b] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] font-mono text-xs font-bold text-[#121210]">
                        {sceneIndex + 1}
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-white">
                          {scene.title}
                        </h2>
                        {scene.narrationText && (
                          <p className="mt-0.5 text-xs text-white/50 line-clamp-1">
                            &ldquo;{scene.narrationText}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {scene.voiceAudioUrl && (
                      <button
                        onClick={() => {
                          const audio = new Audio(scene.voiceAudioUrl!);
                          audio.play();
                        }}
                        className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-[#e8d5a3] hover:bg-white/10 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e08a3e]"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Grid of Shot Cards */}
                  <div
                    className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
                      project?.aspectRatio === "9:16"
                        ? "lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                        : project?.aspectRatio === "4:5" ||
                            project?.aspectRatio === "1:1"
                          ? "lg:grid-cols-3 xl:grid-cols-4"
                          : "lg:grid-cols-3 xl:grid-cols-3"
                    }`}
                  >
                    {sceneShots.map((shot, shotIdx) => {
                      const isGenerating = generatingShotIds.has(shot.id);
                      const hasImage = Boolean(shot.generatedImageUrl);
                      const isFlagged = shot.consistencyFlagged;

                      const taggedChars = (shot.characterIds || [])
                        .map((cId) => characterMap.get(cId))
                        .filter(Boolean) as StoryboardCharacter[];

                      return (
                        <div
                          key={shot.id}
                          className="group relative overflow-hidden rounded-md border border-[#2c2a22] bg-[#22331F]/60 transition-all duration-300 hover:border-[#e08a3e]/40 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
                        >
                          <div
                            className={`relative w-full overflow-hidden bg-[#0d0c0a] ${getAspectRatioClass(
                              project?.aspectRatio,
                            )}`}
                          >
                            {hasImage ? (
                              <>
                                <img
                                  src={shot.generatedImageUrl!}
                                  alt={shot.description}
                                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                                />

                                {/* Viewfinder corner brackets */}
                                <div className="pointer-events-none absolute inset-2.5 opacity-50 transition-opacity duration-300 group-hover:opacity-90">
                                  <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#e08a3e]/70" />
                                  <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[#e08a3e]/70" />
                                  <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-[#e08a3e]/70" />
                                  <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[#e08a3e]/70" />
                                </div>

                                {isGenerating && (
                                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
                                    <Loader2
                                      size={18}
                                      className="motion-safe:animate-spin text-[#e08a3e]"
                                    />
                                    <span className="mt-2 font-mono text-[10px] tracking-wide text-[#e08a3e]">
                                      DEVELOPING FRAME…
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                {/* Viewfinder corner brackets */}
                                <div className="pointer-events-none absolute inset-2.5 opacity-50">
                                  <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#e08a3e]/70" />
                                  <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[#e08a3e]/70" />
                                  <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-[#e08a3e]/70" />
                                  <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[#e08a3e]/70" />
                                </div>

                                {isGenerating ? (
                                  <>
                                    <Loader2
                                      size={18}
                                      className="motion-safe:animate-spin text-[#c9a84c]"
                                    />
                                    <span className="mt-2 font-mono text-[10px] tracking-wide text-[#c9a84c]">
                                      DEVELOPING FRAME…
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Camera
                                      size={18}
                                      className="text-[#948f80]/60"
                                    />

                                    <span className="mt-2 text-xs text-[#948f80]">
                                      No frame yet
                                    </span>

                                    <button
                                      onClick={() => handleGenerateShot(shot)}
                                      disabled={isGenerating || isGeneratingAll}
                                      className="mt-3 rounded border border-[#e08a3e]/40 bg-[#c9a84c]/10 px-3 py-1.5 text-[11px] font-semibold  transition-colors hover:bg-[#c9a84c] hover:text-[#121210] cursor-pointer disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e08a3e]"
                                    >
                                      Generate frame
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Cinematic gradient */}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                            {/* Timecode-style shot ID */}
                            <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-white/85 backdrop-blur-sm">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isGenerating
                                    ? "bg-[#e08a3e] motion-safe:animate-pulse"
                                    : "bg-[#7c8f96]"
                                }`}
                              />
                              SC{String(sceneIndex + 1).padStart(2, "0")} · SH
                              {String(shotIdx + 1).padStart(2, "0")}
                            </div>

                            {/* Match meter */}
                            {hasImage && (
                              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded border border-white/10 bg-black/60 px-2 py-1 backdrop-blur-sm">
                                <div className="flex items-end gap-[2px]">
                                  {Array.from({ length: 5 }).map((_, i) => {
                                    const score = isFlagged
                                      ? shot.consistencyScore || 0.6
                                      : shot.consistencyScore || 0.92;
                                    const filled = Math.round(score * 5);
                                    return (
                                      <span
                                        key={i}
                                        className="w-[3px] rounded-[1px]"
                                        style={{
                                          height: `${5 + i * 2}px`,
                                          background:
                                            i < filled
                                              ? isFlagged
                                                ? "#e08a3e"
                                                : "#7c8f96"
                                              : "rgba(255,255,255,0.15)",
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                                <span
                                  className="font-mono text-[10px] font-semibold tracking-tight"
                                  style={{
                                    color: isFlagged ? "#e08a3e" : "#c9d3d6",
                                  }}
                                >
                                  {Math.round(
                                    (isFlagged
                                      ? shot.consistencyScore || 0.6
                                      : shot.consistencyScore || 0.92) * 100,
                                  )}
                                  %
                                </span>
                              </div>
                            )}

                            {/* Hover actions */}
                            <div className="absolute bottom-3 right-3 flex translate-y-1 gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                              {hasImage && (
                                <button
                                  onClick={() => {
                                    setActiveShotForIterate(shot);
                                    setIterationPrompt("");
                                  }}
                                  className="flex h-7 items-center gap-1 rounded border border-white/15 bg-black/60 px-2.5 text-[10px] font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-[#e08a3e]/50 hover:text-[#e08a3e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e08a3e]"
                                >
                                  <Sparkles
                                    size={11}
                                    className="text-[#e08a3e]"
                                  />
                                  Iterate
                                </button>
                              )}

                              <button
                                onClick={() => handleRegenerateShot(shot)}
                                disabled={isGenerating}
                                className="flex h-7 w-7 items-center justify-center rounded border border-white/15 bg-black/60 text-white/70 backdrop-blur-sm transition-colors hover:border-[#e08a3e]/50 hover:text-[#e08a3e] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e08a3e]"
                                title="Regenerate frame"
                              >
                                <RefreshCw
                                  size={12}
                                  className={
                                    isGenerating
                                      ? "motion-safe:animate-spin text-[#e08a3e]"
                                      : ""
                                  }
                                />
                              </button>
                            </div>
                          </div>

                          {/* ═══════════════════════════════════════
          CARD CONTENT
      ═══════════════════════════════════════ */}
                          <div className="p-3">
                            {/* Characters */}
                            {taggedChars.length > 0 && (
                              <div className="mb-2.5 flex items-center gap-1.5 overflow-hidden">
                                {taggedChars.slice(0, 3).map((character) => (
                                  <span
                                    key={character.id}
                                    className="truncate rounded-[3px] border border-[#7c8f96]/25 bg-[#7c8f96]/[0.08] px-2 py-0.5 text-[11px] font-medium text-[#a9bcc2]"
                                  >
                                    {character.name}
                                  </span>
                                ))}

                                {taggedChars.length > 3 && (
                                  <span className="text-[10px] text-white/40">
                                    +{taggedChars.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Description */}
                            <p className="line-clamp-3 text-[13px] leading-[1.65] text-white/85">
                              {shot.description}
                            </p>

                            {/* Dialogue */}
                            {shot.dialogue && (
                              <div className="mt-2.5 border-l-2 border-[#e08a3e]/40 pl-2.5">
                                <p className="line-clamp-2 text-[11px] italic leading-relaxed text-white/50">
                                  “{shot.dialogue}”
                                </p>
                              </div>
                            )}

                            {/* Bottom bar */}
                            <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                              <Button
                                onClick={() => setActiveShotForEdit(shot)}
                               variant="secondary"
                               className="px-2 py-1.5"
                              >
                                Edit shot
                              </Button>

                              <div className="flex flex-col items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-white/40">
                                <span>{shot.shotType || "Medium"}</span>
                                <span className="line-clamp-1">
                                  {shot.cameraAngle || "Eye-level"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Comprehensive Shot Detail / Edit Modal with Lens & Sound Controls */}
      {activeShotForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-md border border-[#c9a84c]/20 bg-[#0a120a] p-6 shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-[#c9a84c]/10 p-2">
                  <svg
                    className="h-4 w-4 text-[#c9a84c]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  Shot Details <span className="text-[#c9a84c]/60">·</span>{" "}
                  Director Blocking
                </h3>
              </div>
              <button
                onClick={() => setActiveShotForEdit(null)}
                className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="mt-5 space-y-5">
              {/* Visual Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
                  Visual Description
                </label>
                <textarea
                  rows={3}
                  value={activeShotForEdit.description}
                  onChange={(e) =>
                    setActiveShotForEdit({
                      ...activeShotForEdit,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none"
                />
              </div>

              {/* Dialogue */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
                  Spoken Dialogue / Audio
                </label>
                <input
                  type="text"
                  value={activeShotForEdit.dialogue || ""}
                  onChange={(e) =>
                    setActiveShotForEdit({
                      ...activeShotForEdit,
                      dialogue: e.target.value,
                    })
                  }
                  placeholder="Spoken line in this shot…"
                  className="w-full rounded-md border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none"
                />
              </div>

              {/* Camera Controls */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]/80">
                    Framing
                  </label>
                  <select
                    value={activeShotForEdit.shotType || "medium"}
                    onChange={(e) =>
                      setActiveShotForEdit({
                        ...activeShotForEdit,
                        shotType: e.target.value as ShotType,
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white capitalize focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none"
                  >
                    {SHOT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]/80">
                    Angle
                  </label>
                  <select
                    value={activeShotForEdit.cameraAngle || "eye-level"}
                    onChange={(e) =>
                      setActiveShotForEdit({
                        ...activeShotForEdit,
                        cameraAngle: e.target.value as CameraAngle,
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white capitalize focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none"
                  >
                    {CAMERA_ANGLES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]/80">
                    Perspective
                  </label>
                  <select
                    value={activeShotForEdit.perspective || "1-point"}
                    onChange={(e) =>
                      setActiveShotForEdit({
                        ...activeShotForEdit,
                        perspective: e.target.value as Perspective,
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white capitalize focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none"
                  >
                    {PERSPECTIVES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]/80">
                    Movement
                  </label>
                  <select
                    value={activeShotForEdit.movement || "static"}
                    onChange={(e) =>
                      setActiveShotForEdit({
                        ...activeShotForEdit,
                        movement: e.target.value as CameraMovement,
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white capitalize focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30 focus:outline-none"
                  >
                    {CAMERA_MOVEMENTS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sound & Music Cues */}
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]/80">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                  Sound FX &amp; Musical Tension Cues
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AUDIO_CUE_PRESETS.map((cue) => (
                    <button
                      key={cue}
                      type="button"
                      onClick={() => {
                        const currentDesc = activeShotForEdit.description || "";
                        if (!currentDesc.includes(cue)) {
                          setActiveShotForEdit({
                            ...activeShotForEdit,
                            description: `${currentDesc} ${cue}`,
                          });
                        }
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 transition-all hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/10 hover:text-[#e8d5a3]"
                    >
                      {cue}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tagged Characters */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
                  Tagged Characters{" "}
                  <span className="font-normal lowercase text-white/30">
                    · facial &amp; attire
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {characters.map((char) => {
                    const isTagged = (
                      activeShotForEdit.characterIds || []
                    ).includes(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => {
                          const currentIds =
                            activeShotForEdit.characterIds || [];
                          const updatedIds = isTagged
                            ? currentIds.filter((id) => id !== char.id)
                            : [...currentIds, char.id];
                          setActiveShotForEdit({
                            ...activeShotForEdit,
                            characterIds: updatedIds,
                          });
                        }}
                        className={`flex items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-xs font-medium transition-all ${
                          isTagged
                            ? "border-[#c9a84c] bg-[#c9a84c]/15 text-[#e8d5a3] shadow-[0_0_12px_rgba(201,168,76,0.08)]"
                            : "border-white/5 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10 hover:text-white/70"
                        }`}
                      >
                        {isTagged && (
                          <svg
                            className="h-3 w-3 text-[#c9a84c]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {char.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/5 pt-5">
                <button
                  type="button"
                  onClick={() => setActiveShotForEdit(null)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
                >
                  Cancel
                </button>
                <Button
                  type="button"
                  onClick={async () => {
                    await storyboardApi.updateShot(
                      activeShotForEdit.id,
                      activeShotForEdit,
                    );
                    mutateShots();
                    setActiveShotForEdit(null);
                    toast.success("Shot updated");
                  }}
                  className="py-2"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Iterate Prompt Modal */}
      {activeShotForIterate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-md border border-[#c9a84c]/25 bg-[#090f09] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#c9a84c]" />
                <h3 className="text-base font-bold text-white">
                  Iterate &amp; Refine Shot
                </h3>
              </div>
              <button
                onClick={() => setActiveShotForIterate(null)}
                className="rounded-md p-1 text-white/40 hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="mt-2 text-xs text-white/50">
              Apply prompt adjustments while keeping character identity &amp;
              clothing locked.
            </p>

            <div className="mt-4 space-y-3">
              <textarea
                rows={3}
                value={iterationPrompt}
                onChange={(e) => setIterationPrompt(e.target.value)}
                placeholder="e.g. Add intense cyberpunk neon red rim lighting and make the character gaze at the camera..."
                className="w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
              />

              <div className="flex flex-wrap gap-1.5">
                {[
                  "Dramatic rim lighting",
                  "Close up on eyes",
                  "Action motion blur",
                  "Dark silhouette",
                  "Cinematic fog & haze",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setIterationPrompt((prev) =>
                        prev ? `${prev}, ${chip}` : chip,
                      )
                    }
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60 hover:border-[#c9a84c]/40 hover:text-[#e8d5a3]"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveShotForIterate(null)}
                  className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-white/50 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyIteration}
                  className="rounded-md bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] px-5 py-1.5 text-xs font-bold text-[#060e06] shadow-md shadow-[#c9a84c]/20"
                >
                  Regenerate with Refinement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Triple Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-md border border-[#c9a84c]/25 bg-[#090f09] p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Export Storyboard
                </h3>
                <p className="text-xs text-white/50">
                  Choose your desired final export format
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="rounded-md p-1 text-white/40 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Path 1: Slideshow Video + Voice Audio */}
              <div
                onClick={handleExportSlideshow}
                className="group flex flex-col justify-between rounded-md border border-white/10 bg-black/40 p-4 cursor-pointer hover:border-[#c9a84c]/50 hover:bg-[#0c140c] transition"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3] group-hover:bg-[#c9a84c] group-hover:text-black transition">
                    <Film size={18} />
                  </div>
                  <h4 className="mt-3 text-xs font-bold text-white">
                    Slideshow Video
                  </h4>
                  <p className="mt-1 text-[11px] text-white/50 leading-snug">
                    Concatenates illustrated shot images with scene narration
                    voice audio into an MP4 video.
                  </p>
                </div>
                <button
                  disabled={exportingType === "slideshow"}
                  className="mt-4 w-full rounded-md bg-white/5 py-1.5 text-xs font-bold text-white group-hover:bg-[#c9a84c] group-hover:text-black transition"
                >
                  {exportingType === "slideshow"
                    ? "Rendering..."
                    : "Export Video"}
                </button>
              </div>

              {/* Path 2: Animated Video Handoff */}
              <div
                onClick={handleExportRender}
                className="group flex flex-col justify-between rounded-md border border-white/10 bg-black/40 p-4 cursor-pointer hover:border-[#c9a84c]/50 hover:bg-[#0c140c] transition"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3] group-hover:bg-[#c9a84c] group-hover:text-black transition">
                    <Video size={18} />
                  </div>
                  <h4 className="mt-3 text-xs font-bold text-white">
                    Animated Video
                  </h4>
                  <p className="mt-1 text-[11px] text-white/50 leading-snug">
                    Hands off all shots into Manga Recap&apos;s dynamic camera
                    pan &amp; zoom timeline editor.
                  </p>
                </div>
                <button
                  disabled={exportingType === "render"}
                  className="mt-4 w-full rounded-md bg-white/5 py-1.5 text-xs font-bold text-white group-hover:bg-[#c9a84c] group-hover:text-black transition"
                >
                  {exportingType === "render"
                    ? "Transferring..."
                    : "Open in Editor"}
                </button>
              </div>

              {/* Path 3: Professional PDF */}
              <div
                onClick={handleExportPdf}
                className="group flex flex-col justify-between rounded-md border border-white/10 bg-black/40 p-4 cursor-pointer hover:border-[#c9a84c]/50 hover:bg-[#0c140c] transition"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3] group-hover:bg-[#c9a84c] group-hover:text-black transition">
                    <FileText size={18} />
                  </div>
                  <h4 className="mt-3 text-xs font-bold text-white">
                    Download PDF
                  </h4>
                  <p className="mt-1 text-[11px] text-white/50 leading-snug">
                    Generates a studio-grade storyboard PDF sheet with
                    thumbnails, dialogue, and camera directions.
                  </p>
                </div>
                <button
                  disabled={exportingType === "pdf"}
                  className="mt-4 w-full rounded-md bg-white/5 py-1.5 text-xs font-bold text-white group-hover:bg-[#c9a84c] group-hover:text-black transition"
                >
                  {exportingType === "pdf" ? "Building PDF..." : "Download PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sequential Animatic Player Modal */}
      {showAnimaticModal && shots.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Film size={16} className="text-[#c9a84c]" />
              <span className="font-bold text-xs">
                Animatic Player &middot; Shot {animaticIndex + 1} of{" "}
                {shots.length}
              </span>
            </div>
            <button
              onClick={() => {
                setIsPlayingAnimatic(false);
                setShowAnimaticModal(false);
              }}
              className="rounded-md p-1.5 text-white/50 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative my-auto mx-auto flex max-h-[75vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black shadow-2xl">
            {shots[animaticIndex]?.generatedImageUrl ? (
              <img
                src={shots[animaticIndex].generatedImageUrl!}
                alt="Animatic shot"
                className="max-h-[70vh] w-auto object-contain transition duration-500"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-white/30 text-xs">
                No illustration generated for this shot
              </div>
            )}

            {(shots[animaticIndex]?.dialogue ||
              shots[animaticIndex]?.description) && (
              <div className="absolute bottom-4 inset-x-4 mx-auto max-w-2xl rounded-md bg-black/80 p-3 text-center backdrop-blur-md border border-white/10">
                {shots[animaticIndex].dialogue ? (
                  <p className="text-xs font-bold text-[#e8d5a3] italic">
                    &ldquo;{shots[animaticIndex].dialogue}&rdquo;
                  </p>
                ) : (
                  <p className="text-[11px] text-white/70">
                    {shots[animaticIndex].description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-md border border-white/10 bg-[#080d08] p-3 text-white">
            <button
              onClick={() => setAnimaticIndex((prev) => Math.max(0, prev - 1))}
              disabled={animaticIndex === 0}
              className="rounded-md p-1.5 text-white/40 hover:text-white disabled:opacity-20"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => setIsPlayingAnimatic(!isPlayingAnimatic)}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] text-black shadow-md shadow-[#c9a84c]/20"
            >
              {isPlayingAnimatic ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              onClick={() =>
                setAnimaticIndex((prev) => Math.min(shots.length - 1, prev + 1))
              }
              disabled={animaticIndex === shots.length - 1}
              className="rounded-md p-1.5 text-white/40 hover:text-white disabled:opacity-20"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
