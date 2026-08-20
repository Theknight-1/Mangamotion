"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Sparkles,
  Clapperboard,
  Image as ImageIcon,
  Upload,
  Plus,
  ArrowRight,
  Trash2,
  Clock,
  Loader2,
  Film,
  X,
  PanelLeftClose,
  Pencil,
  Astroid,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi, swrKeys } from "@/lib/api";
import { StoryboardUsageIndicator } from "@/components/storyboard/usage-indicator";
import { Button } from "@/components/loader-button";
import { DeleteModal } from "@/components/ui/delete-modal";
import Image from "next/image";
import { getStoryboardStepRoute } from "@/lib/storyboard/steps";

const INSPIRATION_CHIPS = [
  "A cyberpunk detective investigates a rogue android partner in Neo-Tokyo",
  "A young chef in an underground tournament cooks a mythical golden ramen dish",
  "A lone astronaut on a mirror planet meets an alternate version of themselves",
];

import type { StoryboardProject } from "@/types/storyboard";

// ── Storyboard Modal (Create & Edit) ──────────────────────────────────────────
function StoryboardModal({
  initialTitle = "",
  projectToEdit = null,
  onClose,
  onSaved,
}: {
  initialTitle?: string;
  projectToEdit?: StoryboardProject | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const isEditMode = Boolean(projectToEdit);
  const [title, setTitle] = useState(
    projectToEdit?.title || initialTitle || "",
  );
  const [ideaText, setIdeaText] = useState(projectToEdit?.scriptText || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<string>(
    projectToEdit?.coverImage || "",
  );
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverTab, setCoverTab] = useState<"ai" | "upload">("ai");

  const handleUploadCoverImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file must be under 10MB");
      return;
    }

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = data.files?.[0]?.url;
      if (!url) throw new Error("No image URL returned from upload");

      setCoverImage(url);
      toast.success("Cover image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload cover image");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGenerateCoverAI = async () => {
    if (!title.trim() && !ideaText.trim() && !customPrompt.trim()) {
      toast.error("Please enter a title or story text to generate a cover.");
      return;
    }

    setIsGeneratingCover(true);
    try {
      const res = await storyboardApi.generateCover({
        title: title.trim() || "Untitled Storyboard",
        scriptText: ideaText.trim() || undefined,
        genre: projectToEdit?.genre || undefined,
        artStyle: projectToEdit?.artStyle || "comic",
        aspectRatio: "16:9",
        customPrompt: customPrompt.trim() || undefined,
        projectId: projectToEdit?.id,
      });

      if (res.imageUrl) {
        setCoverImage(res.imageUrl);
        toast.success("AI Cover generated successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI cover");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !ideaText.trim() && !selectedFile && !isEditMode) {
      toast.error("Please enter a title or story idea.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && projectToEdit) {
        await storyboardApi.updateProject(projectToEdit.id, {
          title: title.trim() || projectToEdit.title,
          scriptText: ideaText.trim() || null,
          coverImage: coverImage || null,
        });

        toast.success("Storyboard updated!");
        if (onSaved) onSaved();
        onClose();
      } else {
        const projectTitle =
          title.trim() ||
          (ideaText ? ideaText.slice(0, 36) + "…" : "Untitled Storyboard");

        const { project } = await storyboardApi.createProject({
          title: projectTitle,
          scriptText: ideaText.trim() || undefined,
          coverImage: coverImage || undefined,
          artStyle: "comic",
          aspectRatio: "16:9",
        });

        if (selectedFile) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          if (ideaText.trim()) formData.append("text", ideaText.trim());
          const uploadRes = await storyboardApi.uploadScript(
            project.id,
            formData,
          );
          if (!uploadRes.success) throw new Error("Script upload failed");
        }

        toast.success("New Storyboard created!");
        window.location.href = `/dashboard/storyboard/${project.id}/genre`;
      }
    } catch (err: any) {
      toast.error(
        err.message ||
          (isEditMode
            ? "Failed to update project"
            : "Failed to create project"),
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-[6px] animate-in fade-in duration-200">
      <div
        className="
        relative
        flex w-full max-w-[720px] max-h-[90vh] flex-col
        overflow-hidden
        rounded-md
        border border-white/[0.09]
        bg-[#121A13]
        shadow-[0_30px_100px_-20px_rgba(0,0,0,0.85)]
        animate-in zoom-in-[0.97] duration-200
      "
      >
        {/* Subtle cinematic lighting */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-40 h-80 w-80 rounded-full bg-[#c9a84c]/[0.045] blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-emerald-500/[0.018] blur-3xl" />
        </div>

        {/* Gold hairline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/60 to-transparent" />

        {/* ───────────────── HEADER ───────────────── */}
        <div className="relative border-b border-white/[0.08] px-6 py-5 md:px-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              {/* Step / Mode indicator */}
              <div className="mb-2 flex items-center gap-2">
                <span className="h-px w-5 bg-[#c9a84c]/50" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">
                  {isEditMode ? "Storyboard Edit" : "Step 1"}
                </span>
                <span className="text-[10px] text-white/20">/</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
                  {isEditMode ? "Details & Cover" : "Story Input"}
                </span>
              </div>

              <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-white">
                {isEditMode ? "Edit Storyboard" : "Create New Storyboard"}
              </h2>

              <p className="max-w-xl text-xs leading-relaxed text-white/40">
                {isEditMode
                  ? "Update your storyboard title, screenplay/description, and cover artwork."
                  : "Give your story a starting point. Write your narrative directly or import an existing screenplay."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onClose()}
              className="
              flex h-8 w-8 shrink-0 items-center justify-center
              cursor-pointer
              rounded-md
              text-white/70
              transition-all
              hover:bg-white/[0.06]
              hover:text-white/80
            "
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ───────────────── FORM ───────────────── */}
        <form
          onSubmit={handleSubmit}
          className="relative flex-1 hide-scrollbar overflow-y-auto"
        >
          <div className="px-6 py-6 md:px-7 space-y-6">
            {/* Project title */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70">
                Project Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Shadows of Shibuya"
                className="
                h-11 w-full
                rounded-lg
                border border-white/[0.08]
                bg-black/30
                px-3.5
                text-sm
                text-white
                outline-none
                placeholder:text-white/30
                transition-all
                hover:border-white/[0.12]
                focus:border-[#c9a84c]/35
                focus:bg-black/30
                focus:ring-1
                focus:ring-[#c9a84c]/10
              "
              />
            </div>

            {/* ───────── STORY INPUT ───────── */}
            <div className="space-y-2.5">
              <div className="flex items-end justify-between">
                <div>
                  <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70">
                    Story / Screenplay
                  </label>

                  <p className="text-xs text-white/50 tracking-wide">
                    Describe your story, scenes, or logline description.
                  </p>
                </div>

                <span className="hidden text-[9px] text-white/20 sm:block">
                  Text input
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={ideaText}
                  onChange={(e) => {
                    setIdeaText(e.target.value);
                    if (e.target.value.trim() && !isEditMode) {
                      setSelectedFile(null);
                    }
                  }}
                  placeholder={
                    "Paste your screenplay, write a narrative outline, or describe the sequence beat-by-beat..."
                  }
                  className="
                  min-h-[110px]
                  w-full
                  resize-none
                  rounded-lg
                  border border-white/[0.08]
                  bg-black/30
                  p-4
                  text-sm
                  leading-6
                  text-white
                  outline-none
                  placeholder:text-white/30
                  transition-all
                  hover:border-white/[0.12]
                  focus:border-[#c9a84c]/35
                  focus:bg-black/30
                  focus:ring-1
                  focus:ring-[#c9a84c]/10
                "
                />

                {/* Character count */}
                <div className="pointer-events-none absolute bottom-3 right-3">
                  <span className="rounded bg-black/30 px-1.5 py-0.5 text-[9px] text-white/20">
                    {ideaText.length > 0
                      ? `${ideaText.length.toLocaleString()} chars`
                      : "Optional"}
                  </span>
                </div>
              </div>
            </div>

            {/* ───────── FILE UPLOAD (Only for Create Mode) ───────── */}
            {!isEditMode && (
              <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                <div className="flex items-end justify-between">
                  <div>
                    <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">
                      Existing Screenplay (Optional)
                    </label>
                    <p className="text-xs text-white/50 tracking-wide">
                      Import a screenplay instead of typing it above.
                    </p>
                  </div>
                </div>

                <input
                  type="file"
                  id="script-file-upload"
                  accept=".pdf,.docx,.txt,.fdx,.fountain"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setIdeaText("");
                    }
                  }}
                  className="hidden"
                />

                <label
                  htmlFor="script-file-upload"
                  className="
                  group
                  relative
                  flex
                  min-h-[64px]
                  cursor-pointer
                  items-center
                  gap-4
                  overflow-hidden
                  rounded-lg
                  border
                  border-dashed
                  border-white/[0.10]
                  bg-black/30
                  px-4
                  transition-all
                  duration-200
                  hover:border-[#c9a84c]/30
                  hover:bg-[#c9a84c]/[0.025]
                "
                >
                  <div
                    className="
                    relative
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-lg
                    border border-[#c9a84c]/15
                    bg-[#c9a84c]/[0.06]
                    text-[#c9a84c]
                    transition-all
                    group-hover:border-[#c9a84c]/30
                    group-hover:bg-[#c9a84c]/[0.10]
                  "
                  >
                    <Upload size={16} strokeWidth={1.5} />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-white/70 transition-colors group-hover:text-white">
                      {selectedFile
                        ? selectedFile.name
                        : "Upload screenplay or script file"}
                    </div>
                    <div className="text-[10px] text-white/40">
                      PDF, DOCX, TXT, Fountain or FDX
                    </div>
                  </div>

                  <div className="text-xs font-medium text-white/50 group-hover:text-[#e8d5a3] transition-colors">
                    Browse
                  </div>
                </label>
              </div>
            )}

            {/* ───────── COVER IMAGE SECTION ───────── */}
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70">
                    Cover Image
                  </label>
                  <p className="text-xs text-white/50 tracking-wide">
                    Upload an image or generate an artwork using AI based on
                    your story.
                  </p>
                </div>

                {coverImage && (
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="text-[11px] text-red-400/80 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Remove cover
                  </button>
                )}
              </div>

              {coverImage ? (
                /* Cover Image Preview */
                <div className="group relative aspect-video w-full overflow-hidden rounded-lg border border-white/[0.12] bg-black/40 shadow-inner">
                  <Image
                    src={coverImage}
                    alt="Storyboard Cover"
                    fill
                    sizes="(max-width: 720px) 100vw, 720px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Actions overlay */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-[#e8d5a3] border border-[#c9a84c]/20 backdrop-blur-md">
                        Cover Image Active
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateCoverAI}
                        disabled={isGeneratingCover}
                        className="flex items-center gap-1.5 rounded-md border border-[#c9a84c]/30 bg-black/70 px-3 py-1.5 text-xs font-medium text-[#e8d5a3] backdrop-blur-md transition hover:border-[#c9a84c]/60 hover:bg-[#c9a84c]/20 cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingCover ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} className="text-[#c9a84c]" />
                            Regenerate AI
                          </>
                        )}
                      </button>

                      <label
                        htmlFor="replace-cover-upload"
                        className="flex items-center gap-1.5 rounded-md border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition hover:border-white/40 hover:text-white cursor-pointer"
                      >
                        <Upload size={12} />
                        Replace
                      </label>
                      <input
                        id="replace-cover-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCoverImage(file);
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Cover Image Selector (Tabs: AI vs Upload) */
                <div className="rounded-lg border border-white/[0.08] bg-black/20 p-3.5 space-y-3">
                  {/* Selector toggle tabs */}
                  <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2.5">
                    <button
                      type="button"
                      onClick={() => setCoverTab("ai")}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition cursor-pointer ${
                        coverTab === "ai"
                          ? "border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3]"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      <Sparkles size={13} className="text-[#c9a84c]" />
                      Create using AI
                    </button>

                    <button
                      type="button"
                      onClick={() => setCoverTab("upload")}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition cursor-pointer ${
                        coverTab === "upload"
                          ? "border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3]"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      <Upload size={13} />
                      Upload Cover
                    </button>
                  </div>

                  {coverTab === "ai" ? (
                    /* AI Generation panel */
                    <div className="space-y-3 pt-1">
                      <p className="text-[13px] text-white/50 leading-relaxed">
                        Generate a high-quality keyframe poster using the title
                        & story description.
                      </p>

                      {showCustomPrompt && (
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                            Custom Prompt Tuning (Optional)
                          </label>
                          <input
                            type="text"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g. Neon rain, cyberpunk street, dramatic lighting"
                            className="h-9 w-full rounded-md border border-white/[0.08] bg-black/40 px-3 text-xs text-white outline-none focus:border-[#c9a84c]/30 placeholder:text-white/20"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                          className="text-xs text-[#c9a84c]/70 hover:text-[#c9a84c] underline transition-colors cursor-pointer"
                        >
                          {showCustomPrompt
                            ? "Hide prompt tuning"
                            : "+ Add prompt tuning"}
                        </button>

                        <button
                          type="button"
                          onClick={handleGenerateCoverAI}
                          disabled={
                            isGeneratingCover ||
                            (!title.trim() &&
                              !ideaText.trim() &&
                              !customPrompt.trim())
                          }
                          className="flex items-center gap-2 rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/15 px-4 py-2 text-xs font-semibold text-[#e8d5a3] shadow-md shadow-[#c9a84c]/10 transition hover:bg-[#c9a84c]/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isGeneratingCover ? (
                            <>
                              <Loader2
                                size={13}
                                className="animate-spin text-[#c9a84c]"
                              />
                              Generating Cover...
                            </>
                          ) : (
                            <>
                              <Astroid size={13} className="text-[#c9a84c]" />
                              Generate Cover with AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload panel */
                    <div className="pt-1">
                      <input
                        type="file"
                        id="cover-file-upload"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCoverImage(file);
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="cover-file-upload"
                        className="flex min-h-[70px] cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed border-white/[0.12] bg-black/30 p-4 transition hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/[0.02]"
                      >
                        {isUploadingCover ? (
                          <div className="flex items-center gap-2 text-xs text-white/70">
                            <Loader2
                              size={15}
                              className="animate-spin text-[#c9a84c]"
                            />
                            Uploading image...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-center sm:text-left">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#c9a84c]/15 bg-[#c9a84c]/[0.06] text-[#c9a84c]">
                              <Upload size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white/80">
                                Click or drag image to upload
                              </p>
                              <p className="text-[10px] text-white/40">
                                JPG, PNG, or WebP up to 10MB
                              </p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ───────── FOOTER ───────── */}
          <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] p-5">
            <button
              type="button"
              onClick={() => onClose()}
              className="
              rounded-md px-5 py-2.5
              text-sm font-medium text-white/35
              transition-all duration-200
              hover:bg-white/[0.03]
              hover:text-white/60
              cursor-pointer
            "
            >
              Cancel
            </button>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (!isEditMode &&
                  !ideaText.trim() &&
                  !selectedFile &&
                  !title.trim())
              }
            >
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {isEditMode ? "Saving..." : "Processing..."}
                  </>
                ) : isEditMode ? (
                  <>Save Changes</>
                ) : (
                  <>
                    Continue to Genre Selection
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoryboardHubPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] =
    useState<StoryboardProject | null>(null);
  const [modalInitialTitle, setModalInitialTitle] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data, mutate, isLoading } = useSWR(
    swrKeys.storyboardProjects(),
    () => storyboardApi.getProjects(),
    { revalidateOnFocus: false },
  );

  const projects = data?.projects || [];

  function openCreate(initialTitle = "") {
    setEditingProject(null);
    setModalInitialTitle(initialTitle);
    setShowModal(true);
  }

  function openEdit(project: StoryboardProject) {
    setEditingProject(project);
    setModalInitialTitle("");
    setShowModal(true);
  }

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await storyboardApi.deleteProject(projectToDelete.id);
      toast.success("Project deleted");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project");
      throw err;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#060e06] text-[#e8d5a3]">
      {/* ═══════════════════════════════════════════════
      LEFT PROJECT PANEL
  ═══════════════════════════════════════════════ */}
      <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#080d08]">
        {/* Sidebar header */}
        <div className="flex h-[64px] items-center justify-between border-b border-white/[0.06] px-4">
          <div>
            <p className="text-lg font-semibold text-[#e8d5a3]">My Storyboards</p>
          </div>

          <button
            className="rounded-lg p-1.5 text-white/25 transition hover:bg-white/5 hover:text-white/60"
            aria-label="Collapse panel"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

        {/* New project */}
        <div className="border-b border-white/[0.06] p-3">
          <Button onClick={() => openCreate()} className="w-full py-2">
            <Plus size={14} />
            New project
          </Button>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="w-full h-10 rounded-md bg-white/10 animate-pulse" />
          ) : projects.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Film size={18} className="mx-auto mb-3 text-white/15" />

              <p className="text-[11px] text-white/30">No projects yet</p>

              <p className="mt-1 text-[10px] leading-relaxed text-white/20">
                Create your first storyboard to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => router.push(getStoryboardStepRoute(proj))}
                  className="group flex w-full items-center gap-3 rounded-md border border-transparent px-1.5 py-1.5 text-left transition-all hover:border-white/[0.06] hover:bg-white/[0.035] cursor-pointer"
                >
                  {/* Project thumbnail */}
                  <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    <Image
                      src={proj.coverImage || "/thumbnail-ex.jpg"}
                      alt={proj.title}
                      fill
                      sizes="56px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-black/20" />
                  </div>

                  {/* Project info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white/80 transition-colors group-hover:text-[#e8d5a3]">
                      {proj.title}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="truncate text-[10px] capitalize text-white/50">
                        {proj.genre || "Drama"}
                      </span>

                      <span className="h-0.5 w-0.5 rounded-full bg-white/15" />

                      <span className="truncate text-[10px] capitalize text-white/50">
                        {proj.artStyle}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
      RIGHT MAIN CONTENT
  ═══════════════════════════════════════════════ */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] px-8 py-10">
          {/* Header */}
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#e8d5a3]">
                Storyboard Studio
              </h1>

              <p className="mt-2 max-w-[580px] text-[13px] leading-relaxed text-white/35">
                Transform screenplays into multi-shot cinematic storyboards with
                approved character models, camera direction, voiceovers, and
                production-ready exports.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <StoryboardUsageIndicator />

              <Button onClick={() => openCreate()} variant="primary">
                <Plus size={14} />
                New Storyboard
              </Button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
          START FROM SCREENPLAY
      ═══════════════════════════════════════════════ */}
          <section className="mb-12">
            <button
              onClick={() => openCreate()}
              className="group relative w-full overflow-hidden rounded-md border border-[rgba(201,168,76,0.18)] bg-[linear-gradient(135deg,rgba(201,168,76,0.07),rgba(255,255,255,0.015))] p-6 text-left transition-all duration-300 hover:border-[rgba(201,168,76,0.4)] hover:bg-[linear-gradient(135deg,rgba(201,168,76,0.10),rgba(255,255,255,0.02))]"
            >
              {/* Decorative glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#c9a84c]/[0.06] blur-3xl transition-opacity group-hover:bg-[#c9a84c]/[0.10]" />

              <div className="relative flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {/* Icon */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-[#c9a84c]/20 bg-[#c9a84c]/10">
                    <Clapperboard size={23} className="text-[#c9a84c]" />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <h2 className="text-[16px] font-semibold text-[#e8d5a3]">
                        Start from screenplay
                      </h2>

                      <span className="rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#c9a84c]/80">
                        Recommended
                      </span>
                    </div>

                    <p className="max-w-[600px] text-[12px] leading-relaxed text-white/35">
                      Upload or paste your screenplay and turn it into
                      structured cinematic scenes, character sheets, camera
                      blocking, and storyboard shots.
                    </p>
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 text-[#c9a84c] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#c9a84c]/20">
                  <ArrowRight size={16} />
                </div>
              </div>
            </button>
          </section>

          {/* ═══════════════════════════════════════════════
          PROJECTS / EMPTY STATE
      ═══════════════════════════════════════════════ */}
          {isLoading ? (
            <section className="space-y-4">
              <div className="space-y-2">
                <div className="h-6 w-36 animate-pulse rounded bg-white/5" />
                <div className="h-3 w-56 animate-pulse rounded bg-white/5" />
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-md border border-white/[0.05] bg-[#0d120d]/90"
                  />
                ))}
              </div>
            </section>
          ) : projects.length > 0 ? (
            <section>
              <div className="mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-[#e8d5a3]">
                    Your storyboards
                  </h2>

                  <p className="mt-1 text-[11px] text-white/25">
                    Continue working on your cinematic projects.
                  </p>
                </div>
              </div>

              {/* Project cards */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div
                  onClick={() => openCreate()}
                  className="group flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-white/[0.12] bg-[#22331F]/50 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/40 hover:bg-[#101610]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/10 text-[#c9a84c] transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#c9a84c]/20">
                    <Plus size={22} />
                  </div>
                  <p className="mt-3 text-base font-semibold text-white/90 transition-colors group-hover:text-[#e8d5a3]">
                    Create new Storyboard
                  </p>
                  <p className="mt-1 text-xs text-white/35">
                    Start a fresh project from scratch
                  </p>
                </div>

                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => router.push(getStoryboardStepRoute(proj))}
                    className="group cursor-pointer overflow-hidden rounded-md border border-white/[0.07] bg-[#22331F]/50 transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/25 hover:bg-[#101610]"
                  >
                    {/* 16:9 thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-black">
                      <Image
                        src={proj.coverImage || "/thumbnail-ex.jpg"}
                        alt={proj.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                    </div>

                    {/* Card content */}
                    <div className="p-4">
                      <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
                        <h3 className="truncate text-base font-semibold text-white/85 transition-colors group-hover:text-[#e8d5a3]">
                          {proj.title}
                        </h3>

                        <ArrowRight
                          size={13}
                          className="mt-1 shrink-0 text-white/15 transition-all group-hover:translate-x-0.5 group-hover:text-[#c9a84c]"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        {/* Genre */}
                        <div className="flex items-center gap-1 ">
                          <span className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-xs capitalize tracking-wider text-white/75 backdrop-blur-md">
                            {proj.genre || "Drama"}
                          </span>

                          {/* Status */}
                          <span className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-xs capitalize tracking-wider text-white/75 backdrop-blur-md">
                            {proj.artStyle}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(proj);
                            }}
                            className="rounded-md border border-white/10 bg-black/50 p-2 text-white/45 backdrop-blur-md transition-all hover:text-white hover:border-white/50 cursor-pointer"
                            aria-label="Edit project"
                            title="Edit storyboard"
                          >
                            <Pencil size={14} />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete({
                                id: proj.id,
                                title: proj.title,
                              });
                            }}
                            className="rounded-md border border-white/10 bg-black/50 p-2 text-white/45 backdrop-blur-md transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                            aria-label="Delete project"
                            title="Delete storyboard"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#0d140d]/90 via-[#0a0f0a]/70 to-[#060a06]/95 p-8 text-center backdrop-blur-sm sm:p-12">
              {/* Subtle gold radial ambient glow */}
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-[#c9a84c]/[0.08] blur-3xl" />

              <div className="relative mx-auto max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c9a84c]/25 bg-[#c9a84c]/10 shadow-[0_0_35px_rgba(201,168,76,0.12)]">
                  <Film className="h-8 w-8 text-[#c9a84c]" />
                </div>

                <h3 className="text-xl font-bold tracking-tight text-[#e8d5a3]">
                  No storyboards created yet
                </h3>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={() => openCreate()}
                    variant="primary"
                    className="px-5 py-2.5 shadow-lg shadow-[#c9a84c]/10"
                  >
                    <Plus size={15} />
                    Create Your First Storyboard
                  </Button>
                </div>

                {/* Quick Inspiration Prompts */}
                <div className="mt-8 border-t border-white/[0.06] pt-6">
                  <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#c9a84c]/75">
                    <Sparkles size={12} />
                    Or start with an inspiration prompt
                  </p>
                  <div className="flex flex-col gap-2">
                    {INSPIRATION_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => openCreate(chip)}
                        className="group flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3.5 py-2 text-left text-xs text-white/80 tracking-wide transition hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/[0.06] hover:text-[#e8d5a3]"
                      >
                        <span className="truncate italic">"{chip}"</span>
                        <ArrowRight
                          size={12}
                          className="shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-[#c9a84c]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modals */}
      {showModal && (
        <StoryboardModal
          initialTitle={modalInitialTitle}
          projectToEdit={editingProject}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
          onSaved={() => mutate()}
        />
      )}

      <DeleteModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        itemName={projectToDelete?.title}
        itemType="storyboard project"
      />
    </div>
  );
}
