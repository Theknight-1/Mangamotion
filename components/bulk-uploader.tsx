"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Loader2,
  ImageIcon,
  X,
  GripVertical,
  Trash2,
  Plus,
  Wand2,
} from "lucide-react";
import toast from "react-hot-toast";
import { requestQueue, createQueueKey } from "@/lib/request-queue";
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
  const [activeTab, setActiveTab] = useState<"local" | "created">("local");

  // Queue state (before upload)
  const [pendingFiles, setPendingFiles] = useState<
    Array<{ id: string; file: File }>
  >([]);

  // Drag and drop state for queue
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Processing state
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const fileRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList) {
    const newFiles = Array.from(files).map((file) => ({
      id: `pending-${Math.random().toString(36).slice(2, 9)}`,
      file,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }

  function removePendingFile(id: string) {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }

  // Queue Reordering Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggingId !== id) setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const draggedIndex = pendingFiles.findIndex((f) => f.id === draggingId);
    const targetIndex = pendingFiles.findIndex((f) => f.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const updated = [...pendingFiles];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, removed);

    setPendingFiles(updated);
    setDraggingId(null);
    setDragOverId(null);
  };

  async function handleUploadAndAnalyze() {
    if (pendingFiles.length === 0) {
      toast.error("Please add at least one image.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload all files in the exact order of the queue
      const fd = new FormData();
      pendingFiles.forEach((pf) => fd.append("files", pf.file));

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) throw new Error();
      const { files: uploadedFiles } = await res.json();

      // 2. Create Scene objects
      const startingIndex =
        allScenes.length > 0
          ? Math.max(...allScenes.map((s) => s.index)) + 1
          : 0;

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

      // 3. Immediately add empty scenes to UI
      onScenesCreated(currentNewScenes);
      setPendingFiles([]); // Clear queue
      setIsUploading(false);
      setIsAnalyzing(true);
      setProgress({ current: 0, total: currentNewScenes.length });

      // 4. Analyze sequentially with request queue
      for (let i = 0; i < currentNewScenes.length; i++) {
        const scene = currentNewScenes[i];

        // Create queue key to prevent duplicate analysis
        const queueKey = createQueueKey("analyze-bulk", {
          imageUrl: scene.imageUrl,
          videoId,
          sceneIndex: scene.index,
        });

        try {
          const data = await requestQueue.enqueue(queueKey, async () => {
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
            return await analyzeRes.json();
          });

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
          currentNewScenes = currentNewScenes.map((s) =>
            s.id === scene.id
              ? { ...s, status: "ready", narration: "Manual edit required." }
              : s,
          );
        }

        onScenesCreated(currentNewScenes);
        setProgress({ current: i + 1, total: currentNewScenes.length });
      }

      toast.success(`${currentNewScenes.length} scenes created!`);
      setIsOpen(false);
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
        className="flex items-center gap-2 rounded-sm border border-[#4a8a42]/30 bg-[#212920] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#4a8a42]/20"
      >
        <Upload size={14} /> Bulk Upload
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-white/[0.07] bg-[#0d0d18] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-5">
              <h2 className="text-lg font-bold text-white/90">Add Scenes</h2>
              {!isUploading && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 cursor-pointer hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 px-5 pt-4">
              <button
                onClick={() => setActiveTab("local")}
                className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-colors ${
                  activeTab === "local"
                    ? "border-b-2 border-[#c9a84c] text-[#c9a84c]"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Upload size={14} /> Upload from Device
              </button>
              <button
                disabled // Placeholder for future feature
                className="flex cursor-not-allowed items-center gap-2 pb-3 text-xs font-semibold text-white/15"
              >
                <Wand2 size={14} /> Create with AI
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {isUploading || isAnalyzing ? (
                <div className="flex h-64 flex-col items-center justify-center text-white/50">
                  <Loader2
                    className="mb-3 animate-spin text-[#c9a84c]"
                    size={32}
                  />
                  {isUploading
                    ? "Uploading images..."
                    : `Analyzing panels... (${progress.current} / ${progress.total})`}
                  <p className="mt-2 text-xs text-white/30">
                    You can close this dialog while it processes in the
                    background.
                  </p>
                </div>
              ) : activeTab === "local" ? (
                <>
                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files.length > 0)
                        addFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className="mb-4 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-white/8 bg-white/1 p-8 text-center transition-colors hover:border-[#4a8a42]/40 hover:bg-[#4a8a42]/5"
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
                          addFiles(e.currentTarget.files);
                        }
                        e.currentTarget.value = "";
                      }}
                    />
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/4 text-white/30">
                      <ImageIcon size={24} />
                    </div>
                    <p className="mb-1 text-sm font-semibold text-white/60">
                      Drag & drop files here
                    </p>
                    <p className="text-xs text-white/30">
                      or click to browse · You can reorder after adding
                    </p>
                  </div>

                  {/* Queue List */}
                  <div className="mb-4 max-h-120 overflow-y-auto rounded-xl">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {pendingFiles.map((pf) => (
                        <div
                          key={pf.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, pf.id)}
                          onDragOver={(e) => handleDragOver(e, pf.id)}
                          onDrop={(e) => handleDrop(e, pf.id)}
                          className={`group relative overflow-hidden rounded-xl border transition-all ${
                            draggingId === pf.id
                              ? "opacity-40"
                              : dragOverId === pf.id
                                ? "border-[#c9a84c] ring-2 ring-[#c9a84c]"
                                : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <img
                            src={URL.createObjectURL(pf.file)}
                            alt={pf.file.name}
                            className="aspect-2/3 w-full object-cover"
                          />

                          {/* Top Bar */}
                          <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white flex items-center gap-2">
                            <GripVertical size={13} />
                            Drag
                          </div>

                          {/* Bottom Overlay */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                            <div className="truncate text-xs text-white">
                              {pf.file.name}
                            </div>

                            <div className="mt-1 flex justify-between items-center">
                              <span className="text-[10px] text-white/60">
                                {(pf.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>

                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <label
                                  htmlFor={`replace-${pf.id}`}
                                  className="cursor-pointer rounded bg-white/10 p-2 hover:bg-white/20"
                                >
                                  <Upload size={14} />
                                </label>

                                <button
                                  onClick={() => removePendingFile(pf.id)}
                                  className="rounded bg-red-500/20 p-2 hover:bg-red-500/40 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <input
                            id={`replace-${pf.id}`}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const newFile = e.target.files[0];
                                setPendingFiles((prev) =>
                                  prev.map((f) =>
                                    f.id === pf.id
                                      ? { ...f, file: newFile }
                                      : f,
                                  ),
                                );
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadAndAnalyze}
                      disabled={pendingFiles.length === 0}
                      className={`flex items-center cursor-pointer gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        pendingFiles.length === 0
                          ? "cursor-not-allowed bg-white/5 text-white/20"
                          : "border border-[#5a9a52]/50 bg-[#2d5a27] text-white hover:bg-[#4e8347]"
                      }`}
                    >
                      <Upload size={12} />
                      Upload{" "}
                      {pendingFiles.length > 0
                        ? `(${pendingFiles.length})`
                        : ""}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-white/30">
                  AI Generation coming soon...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
