"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, ImageIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Scene } from "@/types/scene";

interface BulkUploaderProps {
  videoId: string;
  allScenes: Scene[];
  onScenesCreated: (newScenes: Scene[]) => void;
}

export function BulkUploader({
  videoId,
  allScenes,
  onScenesCreated,
}: BulkUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setIsAnalyzing(false);
    setProgress({ current: 0, total: 0 });

    try {
      const fd = new FormData();
      Array.from(files).forEach((file) => fd.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) throw new Error();
      const { files: uploadedFiles } = await res.json();

      const startingIndex =
        allScenes.length > 0
          ? Math.max(...allScenes.map((s) => s.index)) + 1
          : 0;

      // Create a mutable array to track the state of newly uploaded scenes
      let currentNewScenes: Scene[] = uploadedFiles.map(
        (file: any, i: number) => ({
          id: `scene-${Date.now()}-${i}`,
          index: startingIndex + i,
          imageUrl: file.url,
          imageWidth: file.width,
          imageHeight: file.height,
          narration: "",
          keyframes: [],
          voiceId: "",
          status: "analyzing",
        }),
      );

      // Immediately add empty scenes to UI
      onScenesCreated(currentNewScenes);
      setIsUploading(false);
      setIsAnalyzing(true);
      setProgress({ current: 0, total: currentNewScenes.length });

      // Analyze sequentially
      for (let i = 0; i < currentNewScenes.length; i++) {
        const scene = currentNewScenes[i];
        try {
          const analyzeRes = await fetch("/api/analyze-panel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: scene.imageUrl,
              videoId,
              sceneIndex: scene.index,
              allScenes: [...allScenes, ...currentNewScenes.slice(0, i)],
            }),
          });

          if (!analyzeRes.ok) throw new Error();
          const data = await analyzeRes.json();

          // Update our local array with the new data
          currentNewScenes = currentNewScenes.map((s) =>
            s.id === scene.id
              ? {
                  ...s,
                  narration: data.narration,
                  keyframes: data.keyframes,
                  emotion: data.emotion,
                  status: "ready",
                }
              : s,
          );
        } catch (err) {
          // Update local array with error state
          currentNewScenes = currentNewScenes.map((s) =>
            s.id === scene.id
              ? { ...s, status: "ready", narration: "Manual edit required." }
              : s,
          );
        }

        // Send the fully accumulated array back to the parent
        onScenesCreated(currentNewScenes);
        setProgress({ current: i + 1, total: currentNewScenes.length });
      }

      toast.success(`${currentNewScenes.length} scenes uploaded and analyzed!`);
      setIsOpen(false); // Close dialog only when loop is fully done
    } catch (error) {
      toast.error("Bulk upload failed");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      setProgress({ current: 0, total: 0 });
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-[#4a8a42]/30 bg-[#4a8a42]/10 px-3 py-1.5 text-xs font-semibold text-[#7fb870] transition-colors hover:bg-[#4a8a42]/20"
      >
        <Upload size={14} /> Bulk Upload
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.07] bg-[#0d0d18] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white/80">
                Upload Manga Panels
              </h2>
              {!isUploading && !isAnalyzing && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {isUploading ? (
              <div className="flex flex-col items-center py-12 text-white/50">
                <Loader2
                  className="mb-3 animate-spin text-[#c9a84c]"
                  size={32}
                />
                Uploading images...
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center py-12 text-white/50">
                <Loader2
                  className="mb-3 animate-spin text-[#c9a84c]"
                  size={32}
                />
                Analyzing panels... ({progress.current} / {progress.total})
                <p className="mt-2 text-xs text-white/30">
                  You can continue using the editor while this runs.
                </p>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files.length > 0)
                    handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-12 text-center transition-colors hover:border-[#4a8a42]/40 hover:bg-[#4a8a42]/5"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (
                      e.currentTarget.files &&
                      e.currentTarget.files.length > 0
                    ) {
                      handleFiles(e.currentTarget.files);
                    }
                    e.currentTarget.value = "";
                  }}
                />
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-white/30">
                  <ImageIcon size={24} />
                </div>
                <p className="mb-1 text-sm font-semibold text-white/60">
                  Drop multiple panels here
                </p>
                <p className="text-xs text-white/30">
                  or click to browse · Bulk upload will create scenes
                  automatically
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
