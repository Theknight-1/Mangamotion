"use client";

import { useState, useRef } from "react";
import {
  ImageIcon,
  Sparkles,
  Mic,
  Trash2,
  CheckCircle2,
  Loader2,
  Play,
  Pause,
  Upload,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Volume2,
} from "lucide-react";
import toast from "react-hot-toast";
import { VoiceGenerator } from "./voice-generator";
import type { Scene } from "@/types/scene";
import { Button } from "./loader-button";

interface SceneCardProps {
  scene: Scene;
  number: number;
  onUpdate: (updated: Scene) => void;
  onDelete: () => void;
  videoId: string;
  allScenes: Scene[]; // needed to build within-video narration context for Gemini/OpenRouter
}


/* ─── Step badge ─────────────────────────────────────────────────────────── */
function StepBadge({
  step,
  current,
  isDone,
}: {
  step: number;
  current: Step;
  isDone: boolean;
}) {
  const isPast = isDone || step < current;
  const isActive = step === current && !isDone;

  const bg = isPast
    ? "rgba(74,138,66,0.2)"
    : isActive
      ? "rgba(74,138,66,0.12)"
      : "rgba(255,255,255,0.05)";
  const border = isPast
    ? "rgba(74,138,66,0.45)"
    : isActive
      ? "rgba(74,138,66,0.3)"
      : "rgba(255,255,255,0.07)";
  const color = isPast
    ? "#4a8a42"
    : isActive
      ? "#7fb870"
      : "rgba(255,255,255,0.2)";

  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        border: `1.5px solid ${border}`,
        transition: "all 0.25s",
      }}
    >
      {isPast && step < current ? (
        <CheckCircle2 size={11} style={{ color: "#4a8a42" }} />
      ) : (
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{step}</span>
      )}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
interface SceneCardProps {
  scene: Scene;
  number: number;
  onUpdate: (updated: Scene) => void;
  onDelete: () => void;
  videoId: string;
  allScenes: Scene[];
  isExpandedInPanel?: boolean;
}

type Step = 1 | 2 | 3;
function getStep(scene: Scene): Step {
  if (!scene.imageUrl || scene.status === "idle") return 1;
  if (scene.status === "analyzing" || scene.status === "ready") return 2;
  return 3;
}

export function SceneCard({
  scene,
  number,
  onUpdate,
  onDelete,
  videoId,
  allScenes,
  isExpandedInPanel = false,
}: SceneCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // If it's in the right panel, force it to be expanded
  const isCollapsed = isExpandedInPanel ? false : collapsed;
  const step = getStep(scene);
  const isDone = scene.status === "done";
  const isAnalyzing = scene.status === "analyzing";
  const hasImage = !!scene.imageUrl;
  const hasVoice = !!scene.voice?.audioUrl;
  const hasNarration = !!scene.narration.trim();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Images only");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      const base: Scene = { ...scene, imageUrl: url, status: "analyzing", narration: "", keyframes: [], clipUrl: undefined };
      onUpdate(base);
      await analyzePanel(url, base);
    } catch {
      toast.error("Upload failed — please try again");
      onUpdate({ ...scene, status: "idle" });
    } finally {
      setUploading(false);
    }
  }

  async function analyzePanel(imageUrl: string, base: Scene) {
    try {
      const res = await fetch("/api/analyze-panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, videoId, sceneIndex: base.index, allScenes }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Analysis failed");
      }
      const data = await res.json();
      onUpdate({ ...base, imageUrl, narration: data.narration, keyframes: data.keyframes, emotion: data.emotion, status: "ready", clipUrl: undefined });
      if (data.fallback) toast.success("Scene ready — you can edit the narration");
      else toast.success(`Scene ${number} — AI narration generated`);
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "AI analysis failed");
      onUpdate({ ...base, imageUrl, narration: "Edit this narration manually...", keyframes: [{ t: 0, x: 0, y: 0, w: 1, h: 1 }], status: "ready", clipUrl: undefined });
    }
  }

  async function reAnalyze() {
    if (!scene.imageUrl) return;
    await analyzePanel(scene.imageUrl, { ...scene, voice: undefined, clipUrl: undefined });
  }

  function toggleAudio() {
    if (playingAudio) {
      audioRef.current?.pause();
      setPlayingAudio(false);
      return;
    }
    if (!scene.voice?.audioUrl) return;
    const a = new Audio(scene.voice.audioUrl);
    a.onended = () => setPlayingAudio(false);
    a.play();
    audioRef.current = a;
    setPlayingAudio(true);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-2xl border transition-colors ${
      isDone ? 'border-[#4a8a42]/30 bg-[#0c170c]/80' : 'border-white/[0.07] bg-[#0d0d18]'
    }`}>
      {/* HEADER */}
      {!isExpandedInPanel && (
        <div
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
          onClick={() => setCollapsed((c) => !c)}
          onKeyDown={(e) => e.key === "Enter" && setCollapsed((c) => !c)}
          className="flex cursor-pointer items-center gap-3 p-3 select-none"
        >
          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${
            isDone ? 'border-[#4a8a42]/35 bg-[#4a8a42]/20 text-[#4a8a42]' : 'border-white/[0.08] bg-white/[0.05] text-white/30'
          }`}>
            {isDone ? <CheckCircle2 size={13} /> : number}
          </div>
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <span className="text-[13px] font-semibold text-white/75">Scene {number}</span>
            {isAnalyzing && <Loader2 size={11} className="animate-spin text-[#c9a84c]" />}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete scene"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-white/15 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={12} />
          </button>
          <div className="text-white/15 flex-shrink-0">
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </div>
      )}

      {/* BODY (Always visible if in panel, otherwise toggleable) */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto border-t border-white/[0.05]">
          {/* Step Indicators (Visible mostly in panel mode) */}
          {isExpandedInPanel && (
            <div className="flex items-center gap-0 border-b border-white/[0.05] p-4 pb-3">
              {(["Upload panel", "Write narration", "Add voice"] as const).map((label, idx) => {
                const s = (idx + 1) as Step;
                const isPast = isDone || s < step;
                const isActive = s === step && !isDone;
                return (
                  <div key={s} className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isPast ? 'border-[#4a8a42]/45 bg-[#4a8a42]/20 text-[#4a8a42]' 
                        : isActive ? 'border-[#4a8a42]/30 bg-[#4a8a42]/12 text-[#7fb870]'
                        : 'border-white/[0.07] bg-white/[0.05] text-white/20'
                      }`}>
                        {isPast && s < step ? <CheckCircle2 size={10} /> : <span className="text-[9px] font-bold">{s}</span>}
                      </div>
                      <span className={`whitespace-nowrap text-[11px] font-medium ${
                        isPast ? 'text-[#4a8a42]' : isActive ? 'text-white/65' : 'text-white/20'
                      }`}>
                        {label}
                      </span>
                    </div>
                    {s < 3 && <div className={`mx-3 h-px flex-1 min-w-[12px] transition-colors ${
                      isPast ? 'bg-[#4a8a42]/35' : 'bg-white/[0.05]'
                    }`} />}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex flex-col gap-4 p-5">
            {/* STEP 1 — Upload drop zone */}
            {!hasImage && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => !uploading && fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-10 text-center transition-colors hover:border-[#4a8a42]/40 hover:bg-[#4a8a42]/5"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    if (f) handleFile(f);
                    e.currentTarget.value = "";
                  }}
                />
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-white/20">
                  {uploading ? <Loader2 size={20} className="animate-spin text-[#c9a84c]" /> : <ImageIcon size={20} />}
                </div>
                <p className="mb-1 text-sm font-semibold text-white/50">
                  {uploading ? "Uploading…" : "Drop your manga panel here"}
                </p>
                <p className="text-xs leading-relaxed text-white/20">
                  or <span className="font-medium text-[#4a8a42]">click to browse</span> · JPG, PNG, WebP · max 10 MB
                </p>
              </div>
            )}

            {/* STEP 1 done — panel + STEP 2 narration */}
            {hasImage && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr] items-start">
                <div className="group/img relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-white/[0.07] bg-[#0c170c] sm:w-[120px]">
                  <img src={scene.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70">
                      <Loader2 size={16} className="animate-spin text-[#c9a84c]" />
                      <span className="text-[10px] text-white/50">AI analyzing…</span>
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    aria-label="Replace image"
                    className="img-replace absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-md border-0 bg-black/80 px-2 py-1 text-[10px] font-medium text-white/70 opacity-0 transition-opacity hover:text-white"
                  >
                    <Upload size={9} /> Replace
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.currentTarget.files?.[0];
                      if (f) handleFile(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>

                {(scene.status === "ready" || scene.status === "done" || scene.status === "generating_voice") && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Narration</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/15">{scene.narration.length}/500</span>
                        <Button
                          onClick={reAnalyze}
                          title="Re-run AI analysis"
                          className=" rounded-md border-0 gap-1 px-1.5 py-0.5 text-[11px] font-semibold  transition-colors cursor-pointer"
                        >
                          <RotateCcw size={9} /> Re-analyze
                        </Button>
                      </div>
                    </div>

                    <textarea
                      value={scene.narration}
                      onChange={(e) => onUpdate({ ...scene, narration: e.target.value, clipUrl: undefined })}
                      rows={5}
                      maxLength={500}
                      placeholder="AI will generate narration after upload. You can edit it here before generating voice…"
                      className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-[13px] leading-relaxed text-white outline-none transition-colors focus:border-[#4a8a42]/40 font-[inherit]"
                    />

                    {(scene.keyframes?.length ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-white/20">
                        <Sparkles size={10} className="text-[#3a6032]" />
                        {scene.keyframes.length} zoom keyframes detected by AI
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 — Voice */}
            {(scene.status === "ready" || scene.status === "done" || scene.status === "generating_voice") && (
              <div className="border-t border-white/[0.05] pt-4">
                {hasVoice ? (
                  <div className="flex items-center gap-3 rounded-xl border border-[#4a8a42]/22 p-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#4a8a42]/20">
                      <Volume2 size={14} className="text-[#4a8a42]" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="m-0 text-sm font-semibold text-[#7fb870]">Voice generated</p>
                      <p className="m-0 mt-0.5 truncate text-[11px] text-white/25">
                        {scene.voice!.text.slice(0, 55)}{scene.voice!.text.length > 55 ? "…" : ""}
                      </p>
                    </div>
                    <button
                      onClick={toggleAudio}
                      aria-label={playingAudio ? "Pause" : "Play preview"}
                      className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-[#4a8a42]/20 text-[#7fb870] transition-colors hover:bg-[#4a8a42]/30"
                    >
                      {playingAudio ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                    </button>
                    <button
                      onClick={() => setShowVoice((v) => !v)}
                      className="flex-shrink-0 cursor-pointer rounded-lg border border-white/[0.08] bg-transparent px-3 py-1.5 text-[11px] font-medium text-white/30 transition-colors hover:border-white/[0.18] hover:text-white/60"
                    >
                      {showVoice ? "Cancel" : "Regenerate"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowVoice((v) => !v)}
                    disabled={!hasNarration}
                    className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-[13px] font-semibold transition-colors ${
                      hasNarration 
                        ? 'border-[#4a8a42]/30 bg-[#4a8a42]/10 text-[#7fb870] hover:border-[#4a8a42]/50 hover:bg-[#4a8a42]/18'
                        : 'border-white/[0.05] bg-white/[0.02] text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <Mic size={14} />
                    {!hasNarration
                      ? "Write narration above before generating voice"
                      : showVoice
                        ? "Hide voice generator"
                        : "Generate voice for this scene →"}
                  </button>
                )}

                {showVoice && (
                  <div className="mt-3">
                    <VoiceGenerator
                      videoId={videoId}
                      sceneIndex={scene.index}
                      prefillText={scene.narration}
                      onVoiceGenerated={(audioUrl, duration) => {
                        onUpdate({ ...scene, voice: { audioUrl, duration, text: scene.narration }, status: "done", clipUrl: undefined });
                        setShowVoice(false);
                        toast.success(`Scene ${number} voice ready!`);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}