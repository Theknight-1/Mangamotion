"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Volume2,
  Play,
  Pause,
  Loader2,
  AlertTriangle,
  MoveUp,
  MoveDown,
  CheckCircle2,
  Clock,
  Layers,
  Edit3,
  Film,
  Music,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi, swrKeys } from "@/lib/api";
import { StoryboardUsageIndicator } from "@/components/storyboard/usage-indicator";
import type { StoryboardScene } from "@/types/storyboard";
import { Button } from "@/components/loader-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default function StoryboardBreakdownPage({ params }: Props) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [showLockModal, setShowLockModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [generatingVoiceId, setGeneratingVoiceId] = useState<string | null>(
    null,
  );
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );

  const { data: projectData, mutate: mutateProject } = useSWR(
    swrKeys.storyboardProject(projectId),
    () => storyboardApi.getProject(projectId),
    { revalidateOnFocus: false },
  );

  const {
    data: scenesData,
    mutate: mutateScenes,
    isLoading: loadingScenes,
  } = useSWR(
    swrKeys.storyboardScenes(projectId),
    () => storyboardApi.getScenes(projectId),
    { revalidateOnFocus: false },
  );

  const project = projectData?.project;
  const scenes = scenesData?.scenes || [];

  const handleTitleSave = async () => {
    if (!projectTitle.trim() || projectTitle === project?.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await storyboardApi.updateProject(projectId, {
        title: projectTitle.trim(),
      });
      mutateProject();
      toast.success("Title updated");
    } catch {
      toast.error("Failed to update title");
    } finally {
      setEditingTitle(false);
    }
  };

  const handleUpdateScene = async (
    sceneId: string,
    updates: Partial<StoryboardScene>,
  ) => {
    try {
      await storyboardApi.updateScene(sceneId, updates);
      mutateScenes();
    } catch {
      toast.error("Failed to update scene");
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (scenes.length <= 1) {
      toast.error("At least one scene is required");
      return;
    }
    try {
      await storyboardApi.deleteScene(sceneId);
      mutateScenes();
      toast.success("Scene removed");
    } catch {
      toast.error("Failed to delete scene");
    }
  };

  const handleAddScene = async () => {
    try {
      const orderIndex = scenes.length;
      await storyboardApi.createScene(projectId, {
        title: `Scene ${orderIndex + 1}: Dramatic Progression`,
        description:
          "Visual environment atmosphere, character actions, and camera cues.",
        narrationText: "Narrator voiceover audio beat for this sequence.",
        durationEstimate: 5,
        orderIndex,
      });
      mutateScenes();
      toast.success("Scene added");
    } catch {
      toast.error("Failed to add scene");
    }
  };

  const handleMoveScene = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const newScenes = [...scenes];
    const [moved] = newScenes.splice(index, 1);
    newScenes.splice(targetIndex, 0, moved);

    const sceneOrders = newScenes.map((s, idx) => ({
      id: s.id,
      orderIndex: idx,
    }));
    try {
      await storyboardApi.reorderScenes(projectId, sceneOrders);
      mutateScenes();
    } catch {
      toast.error("Failed to reorder scenes");
    }
  };

  const handleGenerateVoice = async (scene: StoryboardScene) => {
    if (!scene.narrationText?.trim()) {
      toast.error("Please add narration text first");
      return;
    }

    setGeneratingVoiceId(scene.id);
    try {
      const res = await storyboardApi.generateSceneVoice(scene.id, {
        narrationText: scene.narrationText,
      });
      mutateScenes();
      toast.success("Scene voice generated!");
      handlePlayAudio(res.audioUrl);
    } catch (err: any) {
      toast.error(err.message || "Voice generation failed");
    } finally {
      setGeneratingVoiceId(null);
    }
  };

  const handlePlayAudio = (url?: string | null) => {
    if (!url) return;
    if (playingAudioUrl === url && audioElement) {
      audioElement.pause();
      setPlayingAudioUrl(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(url);
    audio.play();
    setAudioElement(audio);
    setPlayingAudioUrl(url);

    audio.onended = () => {
      setPlayingAudioUrl(null);
    };
  };

  return (
    <div className="min-h-screen bg-[#060e06] text-[#e8d5a3] selection:bg-[#c9a84c] selection:text-black">
      {/* Main Breakdown Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c9a84c]/15 pb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-white md:text-3xl">
              Scene{" "}
              <span className="bg-gradient-to-r from-[#c9a84c] via-[#e8d5a3] to-[#c9a84c] bg-clip-text text-transparent">
                Breakdown &amp; Dramatic Pacing
              </span>
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Refine scene visual actions, spoken narration, and duration
              timings before locking style.
            </p>
          </div>

          <button
            onClick={handleAddScene}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-4 py-2 text-xs font-bold text-[#e8d5a3] transition hover:bg-[#c9a84c]/20"
          >
            <Plus size={13} /> Add Scene
          </button>
        </div>

        {loadingScenes ? (
          <div className="flex h-60 items-center justify-center text-white/40">
            <Loader2 size={20} className="animate-spin mr-2 text-[#c9a84c]" />{" "}
            Loading structured scene timeline...
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className="group relative overflow-hidden rounded-md border border-white/10 bg-[#22331F]/50 p-5 shadow-xl transition-all hover:border-[#c9a84c]/40"
              >
                {/* Scene Top Strip */}
                <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[11px] font-black text-[#e8d5a3]">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      defaultValue={scene.title}
                      onBlur={(e) =>
                        handleUpdateScene(scene.id, { title: e.target.value })
                      }
                      className=" bg-transparent font-bold text-white hover:bg-white/5 p-1.5 focus:bg-black/60 focus:px-2 focus:outline-none text-lg"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveScene(index, "up")}
                      disabled={index === 0}
                      className="rounded-md p-1.5 text-white/30 hover:bg-white/5 hover:text-white disabled:opacity-20"
                    >
                      <MoveUp size={13} />
                    </button>
                    <button
                      onClick={() => handleMoveScene(index, "down")}
                      disabled={index === scenes.length - 1}
                      className="rounded-md p-1.5 text-white/30 hover:bg-white/5 hover:text-white disabled:opacity-20"
                    >
                      <MoveDown size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteScene(scene.id)}
                      className="rounded-md p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Context & Narration Fields */}
                <div className="mt-4 grid  md:grid-rows-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#c9a84c]">
                      Visual Action &amp; Atmosphere
                    </label>
                    <textarea
                      rows={3}
                      defaultValue={scene.description || ""}
                      onBlur={(e) =>
                        handleUpdateScene(scene.id, {
                          description: e.target.value,
                        })
                      }
                      className="mt-1.5 w-full rounded-md border border-white/10 bg-black/40 p-3 text-base leading-relaxed text-white/80 placeholder:text-white/20 focus:border-[#c9a84c]/50 focus:outline-none"
                      placeholder="Describe the environment, lighting, character positions..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase text-[#c9a84c]">
                        Voiceover Narration (Audio Track)
                      </label>
                    </div>

                    <textarea
                      rows={3}
                      defaultValue={scene.narrationText || ""}
                      onBlur={(e) =>
                        handleUpdateScene(scene.id, {
                          narrationText: e.target.value,
                        })
                      }
                      className="mt-1.5 w-full rounded-md border border-white/10 bg-black/40 p-3 text-base leading-relaxed text-white/80 placeholder:text-white/20 focus:border-[#c9a84c]/50 focus:outline-none"
                      placeholder="Spoken narration for this scene..."
                    />
                  </div>
                </div>

                {/* Bottom Bar: Duration & Voiceover Action */}
                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-white/5 pt-3 text-xs">
                  <div className="flex items-center gap-2 text-white/50">
                    <Clock size={11} className="text-[#c9a84c]" />
                    <span className="text-sm">Duration:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      defaultValue={scene.durationEstimate || 5}
                      onBlur={(e) =>
                        handleUpdateScene(scene.id, {
                          durationEstimate: parseFloat(e.target.value) || 5,
                        })
                      }
                      className="w-12 border-b border-white/10 bg-black/40 px-2 py-0.5 text-center text-xs text-white"
                    />
                    <span className="text-sm text-white/30">seconds</span>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    {scene.voiceAudioUrl ? (
                      <button
                        onClick={() => handlePlayAudio(scene.voiceAudioUrl)}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#e8d5a3] border  border-[#c9a84c]/30 rounded-sm px-1.5 py-1.5 "
                      >
                        {playingAudioUrl === scene.voiceAudioUrl ? (
                          <>
                            <Pause size={16} />
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                          </>
                        )}
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleGenerateVoice(scene)}
                      disabled={generatingVoiceId === scene.id}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-[#c9a84c]/30 px-3 py-1.5 text-sm font-semibold text-[#e8d5a3] hover:bg-[#c9a84c]/20 transition cursor-pointer"
                    >
                      {generatingVoiceId === scene.id ? (
                        <>
                          <Loader2 size={11} className="animate-spin" />{" "}
                          Synthesizing Voice...
                        </>
                      ) : (
                        <>
                          <Volume2 size={12} className="text-[#c9a84c]" />{" "}
                          {scene.voiceAudioUrl
                            ? "Regenerate Voice"
                            : "Generate Scene Audio"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Bottom Action */}
        <div className="sticky bottom-6 mt-12 flex justify-end">
          <Button onClick={() => setShowLockModal(true)} className="text-sm">
            Lock Story &amp; Choose Visual Style <ArrowRight size={14} />
          </Button>
        </div>
      </main>

      {/* Lock Story Modal */}
      {showLockModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setShowLockModal(false)} // Click backdrop to close
        >
          <div
            className="w-full max-w-md rounded-md border border-[#c9a84c]/20 bg-[#121A13] p-8 shadow-2xl text-center animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
          >
            {/* Icon Container with Glow */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3] shadow-[0_0_20px_-5px_rgba(201,168,76,0.3)]">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-white">
              Lock Story Breakdown?
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-base leading-8 text-white/50">
              Locking your scene structure optimizes rendering and enables
              character reference conditioning across all subsequent shots.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowLockModal(false)}
                className="flex-1 rounded-lg border border-white/10 px-4 py-3 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Keep Editing
              </button>
              <Button
                onClick={() => {
                  setShowLockModal(false);
                  router.push(`/dashboard/storyboard/${projectId}/style`);
                }}
              >
                Lock & Continue <ArrowRight size={13} className="mt-px" />
              </Button>
            </div>

            <p className="mt-4 text-[10px] font-medium uppercase tracking-wider text-white/30">
              You won't be able to edit scenes after this step
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
