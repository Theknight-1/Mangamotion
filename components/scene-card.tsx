"use client";

import { useRef, useState, useEffect } from "react";
import {
  ImageIcon,
  Sparkles,
  Trash2,
  CheckCircle2,
  Loader2,
  Upload,
  RotateCcw,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { requestQueue, createQueueKey } from "@/lib/request-queue";
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

export function SceneCard({
  scene,
  number,
  onUpdate,
  onDelete,
  videoId,
  allScenes,
}: SceneCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Local narration state (decoupled from parent) ── */
  const [draft, setDraft] = useState(scene.narration);
  const [dirty, setDirty] = useState(false);

  // Sync draft when scene updates from outside (e.g. after re-analysis)
  useEffect(() => {
    setDraft(scene.narration);
    setDirty(false);
  }, [scene.narration]);

  const hasImage = !!scene.imageUrl;
  const isAnalyzing = scene.status === "analyzing";
  const isDone = scene.status === "done";
  const canEditNarration =
    scene.status === "ready" ||
    scene.status === "done" ||
    scene.status === "generating_voice";

  /* ── Handlers ── */
  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Images only");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) throw new Error();

      const { files: uploadedFiles } = await res.json();
      const url = uploadedFiles[0]?.url;
      if (!url) throw new Error("Upload returned no URL");

      const base: Scene = {
        ...scene,
        imageUrl: url,
        status: "analyzing",
        narration: "",
        keyframes: [],
        clipUrl: undefined,
      };

      onUpdate(base);
      await analyzePanel(url, base);
    } catch {
      toast.error("Upload failed — please try again");
      onUpdate({ ...scene, status: "idle" });
    }
  }

  async function analyzePanel(imageUrl: string, base: Scene) {
    const queueKey = createQueueKey("analyze-panel", {
      imageUrl,
      videoId,
      sceneIndex: base.index,
    });

    try {
      const data = await requestQueue.enqueue(queueKey, async () => {
        const res = await fetch("/api/analyze-panel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            videoId,
            sceneIndex: base.index,
            allScenes,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Analysis failed");
        }
        return await res.json();
      });

      onUpdate({
        ...base,
        imageUrl,
        narration: data.narration,
        keyframes: data.keyframes,
        emotion: data.emotion,
        status: "ready",
        clipUrl: undefined,
      });
      if (data.fallback)
        toast.success("Scene ready — you can edit the narration");
      else toast.success(`Scene ${number} — AI narration generated`);
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "AI analysis failed");
      onUpdate({
        ...base,
        imageUrl,
        narration: "Edit this narration manually...",
        keyframes: [{ t: 0, x: 0, y: 0, w: 1, h: 1 }],
        status: "ready",
        clipUrl: undefined,
      });
    }
  }

  async function reAnalyze() {
    if (!scene.imageUrl || isAnalyzing) return;
    await analyzePanel(scene.imageUrl, {
      ...scene,
      voice: undefined,
      clipUrl: undefined,
    });
  }

  function saveNarration() {
    onUpdate({
      ...scene,
      narration: draft,
      clipUrl: undefined,
    });
    setDirty(false);
    toast.success("Narration saved");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
        isDone
          ? "border-[#4a8a42]/30 bg-[#0c170c]/80"
          : "border-white/[0.07] bg-[#0d0d18]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 p-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
              isDone
                ? "border-[#4a8a42]/35 bg-[#4a8a42]/20 text-[#4a8a42]"
                : "border-white/8 bg-white/5 text-white/30"
            }`}
          >
            {isDone ? <CheckCircle2 size={12} /> : number}
          </div>
          <span className="text-[13px] font-semibold text-white/75">
            Scene {number}
          </span>
          {isAnalyzing && (
            <Loader2 size={11} className="animate-spin text-[#c9a84c]" />
          )}
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete scene"
          className="flex h-7 w-7 items-center justify-center rounded-md border-0 cursor-pointer transition-colors hover:bg-red-500/10 bg-red-400 text-white hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[160px_1fr] sm:items-start">
        {/* Image */}
        {!hasImage ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className="flex aspect-3/4 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/8 bg-white/5 p-4 text-center transition-colors hover:border-[#4a8a42]/40 hover:bg-[#4a8a42]/5 sm:w-40"
          >
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
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-white/20">
              <ImageIcon size={18} />
            </div>
            <p className="text-xs font-semibold text-white/50">
              Drop panel here
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/20">
              or <span className="font-medium text-[#4a8a42]">browse</span>
            </p>
          </div>
        ) : (
          <div className="group/img relative aspect-3/4 w-full overflow-hidden rounded-lg border border-white/8 bg-white/5 sm:w-40">
            <img
              src={scene.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70">
                <Loader2 size={16} className="animate-spin text-[#c9a84c]" />
                <span className="text-[10px] text-white/50">AI analyzing…</span>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Replace image"
              className="img-replace absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-md border-0 bg-black/80 px-2 py-1 text-[10px] font-medium text-white/70 opacity-0 transition-opacity hover:text-white group-hover/img:opacity-100"
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
        )}

        {/* Narration */}
        {canEditNarration && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Narration
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/15">
                  {draft.length}/500
                </span>
                <button
                  onClick={reAnalyze}
                  disabled={isAnalyzing || !scene.imageUrl}
                  title="Re-run AI analysis"
                  className={`rounded-md border flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                    isAnalyzing
                      ? "border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c] cursor-not-allowed"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={12} />
                      <span>Analyzing…</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={12} />
                      <span>Re-analyze</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setDirty(e.target.value !== scene.narration);
              }}
              rows={6}
              maxLength={500}
              placeholder="AI will generate narration after upload. You can edit it here before generating voice in the Voices and settings panel…"
              className="w-full resize-none rounded-xl border border-white/8 bg-white/5 p-3 text-[13px] leading-relaxed text-white outline-none transition-colors focus:border-[#4a8a42]/40 font-[inherit]"
            />

            {/* Footer row: keyframes + save */}
            <div className="flex items-center justify-between min-h-7">
              {(scene.keyframes?.length ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/20">
                  <Sparkles size={10} className="text-[#3a6032]" />
                  {scene.keyframes.length} zoom keyframes detected by AI
                </div>
              )}

              {dirty && (
                <button
                  onClick={saveNarration}
                  className="ml-auto flex items-center gap-1.5 rounded-md bg-[#4a8a42] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#3d7336] active:scale-95"
                >
                  <Save size={12} />
                  Save narration
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}