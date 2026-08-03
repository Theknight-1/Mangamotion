"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useStore } from "@nanostores/react";
import useSWR, { mutate as globalMutate } from "swr";
import {
  Plus,
  Play,
  Trash2,
  Film,
  FolderOpen,
  Palette,
  Mic2,
  Users2,
  Clock,
  LayoutGrid,
  List,
  Sparkles,
  Lock,
  ImageIcon,
  Loader2,
  X,
  Check,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  projectsApi,
  videosApi,
  swrKeys,
  type Project,
  type Video,
} from "@/lib/api";
import ProjectList from "@/components/sidebar/project-list";
import { Button } from "@/components/loader-button";
import { CopyrightForm } from "@/components/copyright-form";
import { ProfileMenu } from "@/components/user/profile-menu";
import { IconRail, type RailKey } from "@/components/icon-rail";

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-white/6 text-white/40" },
  processing: { label: "Rendering", cls: "bg-amber-500/15 text-amber-300" },
  completed: { label: "Done", cls: "bg-[#4a8a42]/40 text-[#83d171]" },
  failed: { label: "Failed", cls: "bg-red-500/15 text-red-400" },
};

// ─── Create grid — the colorful feature cards (HeyGen/Kling pattern) ──────
interface CreateCard {
  key: string;
  title: string;
  subtitle: string;
  icon: typeof Film;
  wash: string; // tailwind gradient classes
  soon?: boolean;
}

const CREATE_CARDS: CreateCard[] = [
  {
    key: "manga-recap",
    title: "Manga Recap",
    subtitle: "Panels to cinematic MP4",
    icon: Film,
    wash: "from-[#4a8a42] via-[#2d5a27] to-[#0c170c]",
  },
  {
    key: "voice-studio",
    title: "Voice Studio",
    subtitle: "100+ AI character voices",
    icon: Sparkles,
    wash: "from-[#c9a84c] via-[#8a6f2f] to-[#0c170c]",
  },
  {
    key: "colorize",
    title: "Manga Colorize",
    subtitle: "B&W panels, in color",
    icon: Palette,
    wash: "from-white/10 via-white/5 to-[#0c170c]",
    soon: true,
  },
  {
    key: "auto-dub",
    title: "Auto Dub Studio",
    subtitle: "Multi-language dubbing",
    icon: Mic2,
    wash: "from-white/10 via-white/5 to-[#0c170c]",
    soon: true,
  },
];

// ─── Skeleton ────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/4 ${className}`} />;
}

// ─── Empty state ─────────────────────────────────────────────────────────
function EmptyVideos() {
  return (
    <div className="rounded-2xl border border-dashed border-white/8 p-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/4">
        <Film size={22} className="text-white/20" />
      </div>
      <p className="text-sm font-medium text-white/40">No videos yet</p>
      <p className="mt-1 text-xs text-white/20">
        Upload a manga cover above to create your first video
      </p>
    </div>
  );
}

// ─── Video card ──────────────────────────────────────────────────────────
function VideoCard({
  video,
  onDelete,
  onOpen,
  compact,
}: {
  video: Video;
  onDelete: () => void;
  onOpen: () => void;
  compact: boolean;
}) {
  const s = STATUS[video.status] ?? STATUS.draft;
  const isProcessing = video.status === "processing";

  if (compact) {
    return (
      <div
        onClick={onOpen}
        className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-white/6 bg-[#0d1a0d] px-4 py-3 transition hover:border-[#4a8a42]/30"
      >
        <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-white/4">
          <img
            src={video.sourceImage}
            alt=""
            className="h-full w-full object-cover"
          />
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 size={12} className="animate-spin text-amber-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/80">
            {video.title}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/30">
            <Clock size={10} />
            {new Date(video.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${s.cls}`}
        >
          {s.label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 cursor-pointer rounded-lg p-1.5 text-white/20 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-lg border border-white/6 bg-[#142214] transition hover:border-[#4a8a42]/30"
    >
      <div
        className="relative w-full overflow-hidden bg-black "
        style={{ aspectRatio: "16/9", maxHeight: 250 }}
      >
        <img
          src={video.sourceImage}
          alt={video.title}
          className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
        />
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
            <Loader2 size={18} className="animate-spin text-amber-400" />
            <span className="text-xs text-white/50">Rendering…</span>
          </div>
        )}
        {video.status === "completed" && (
          <div className="absolute inset-0 flex items-end justify-center bg-linear-to-t from-black/70 via-transparent to-transparent pb-4 opacity-0 transition group-hover:opacity-100">
            <div className="flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/15 px-4 py-2 text-xs font-medium text-[#e8d5a3] backdrop-blur-sm">
              <Play size={12} className="fill-[#e8d5a3]" /> Open editor
            </div>
          </div>
        )}
        {video.status === "failed" && (
          <div className="absolute right-2 top-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-red-500/40 bg-red-500/20">
              <AlertCircle size={12} className="text-red-400" />
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium leading-tight text-white/80">
            {video.title}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="shrink-0 cursor-pointer rounded-lg p-1 text-white/20 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}
          >
            {s.label}
          </span>
          <span className="text-[11px] text-white/50">
            {new Date(video.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const session = useStore(useSession);
  const user = session?.data?.user;

  const [railActive, setRailActive] = useState<RailKey>("home");
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [showCopyrightForm, setShowCopyrightForm] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ─────────────────────────────────────────────────────
  const { data: projectsData, isLoading: loadingProjects } = useSWR(
    user ? swrKeys.projects() : null,
    () => projectsApi.list(),
    {
      onSuccess: (data) => {
        if (!selectedProjectId && data.projects.length > 0)
          setSelectedProjectId(data.projects[0].id);
      },
      revalidateOnFocus: false,
    },
  );

  const { data: videosData, isLoading: loadingVideos } = useSWR(
    selectedProjectId ? swrKeys.videos(selectedProjectId) : null,
    () => videosApi.list(selectedProjectId!),
    {
      revalidateOnFocus: false,
      refreshInterval: (data) =>
        data?.videos.some((v) => v.status === "processing") ? 4000 : 0,
    },
  );

  const projects = projectsData?.projects ?? [];
  const videos = videosData?.videos ?? [];
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // ── Actions ──────────────────────────────────────────────────────────
  const handleNewProjectClick = useCallback(() => {
    setPanelOpen(true);
    setShowNewProject(true);
  }, []);

  const handleProjectNameSubmit = useCallback(() => {
    if (!newProjectTitle.trim()) return;
    setShowNewProject(false);
    setShowCopyrightForm(true);
  }, [newProjectTitle]);

  const createProject = useCallback(
    async (copyrightData: {
      isOriginal: boolean;
      purpose: string;
      language: string;
    }) => {
      if (!newProjectTitle.trim()) return;
      setCreatingProject(true);
      try {
        const { project } = await projectsApi.create(newProjectTitle.trim(), {
          isOriginal: copyrightData.isOriginal,
          contentPurpose: copyrightData.purpose,
          language: copyrightData.language,
        });
        await globalMutate(swrKeys.projects());
        setSelectedProjectId(project.id);
        setNewProjectTitle("");
        setShowNewProject(false);
        setShowCopyrightForm(false);
        toast.success("Project created");
      } catch (e: any) {
        toast.error(e.message ?? "Failed to create project");
      } finally {
        setCreatingProject(false);
      }
    },
    [newProjectTitle],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      if (!selectedProjectId) {
        toast.error("Select or create a project first");
        setPanelOpen(true);
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Images only");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Max 2MB");
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("files", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        const url = data.files[0].url;

        const { video } = await videosApi.create({
          projectId: selectedProjectId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          sourceImage: url,
        });

        await globalMutate(swrKeys.videos(selectedProjectId));
        toast.success("Opening editor…");
        setTimeout(() => router.push(`/editor/${video.id}`), 300);
      } catch (e: any) {
        toast.error(e.message ?? "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [selectedProjectId, router],
  );

  const deleteVideo = useCallback(
    async (videoId: string) => {
      if (!confirm("Delete this video?")) return;
      try {
        await videosApi.delete(videoId);
        globalMutate(
          swrKeys.videos(selectedProjectId!),
          (prev: any) =>
            prev
              ? { videos: prev.videos.filter((v: Video) => v.id !== videoId) }
              : prev,
          { revalidate: false },
        );
        toast.success("Deleted");
      } catch (e: any) {
        toast.error(e.message ?? "Failed to delete");
      }
    },
    [selectedProjectId],
  );

  const selectProject = useCallback(
    (id: string) => setSelectedProjectId(id),
    [],
  );

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#060e06] text-white">
      {/* ── Icon rail ── */}
      <IconRail
        active={railActive}
        onSelect={(k) => {
          setRailActive(k);
          if (k === "projects") setPanelOpen(true);
        }}
      >
        <ProfileMenu email={user?.email} name={user?.name} variant="rail" />
      </IconRail>

      {/* ── Collapsible projects panel ── */}
      {panelOpen && (
        <aside className="flex w-64 shrink-0 flex-col border-r border-white/6 bg-[#080d08]">
          <div className="flex items-center justify-between border-b border-white/6 p-4">
            <span className="text-sm font-semibold text-[#e8d5a3]">
              Projects
            </span>
            <button
              onClick={() => setPanelOpen(false)}
              className="cursor-pointer rounded-lg p-1.5 text-white/25 transition hover:bg-white/5 hover:text-white/60"
              aria-label="Collapse panel"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <Button onClick={handleNewProjectClick} className="w-full py-2">
              <Plus size={15} /> New project
            </Button>

            {showNewProject && (
              <div className="space-y-2 rounded-xl border border-white/8 bg-white/2 p-3">
                <input
                  autoFocus
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleProjectNameSubmit();
                    if (e.key === "Escape") {
                      setShowNewProject(false);
                      setNewProjectTitle("");
                    }
                  }}
                  placeholder="Project name"
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/25 transition focus:border-[#4a8a42]/50 focus:outline-none"
                />
                <div className="flex gap-1.5">
                  <Button
                    className="flex-1 py-1.5"
                    loading={creatingProject}
                    disabled={!newProjectTitle.trim()}
                    leftIcon={<Check size={16} />}
                    onClick={handleProjectNameSubmit}
                  >
                    Next
                  </Button>
                  <button
                    onClick={() => {
                      setShowNewProject(false);
                      setNewProjectTitle("");
                    }}
                    className="cursor-pointer rounded-lg bg-white/5 px-2.5 py-1.5 text-white/40 transition hover:bg-white/9"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            )}

            {loadingProjects ? (
              <div className="space-y-1.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <p className="px-1 py-2 text-xs text-white/25">No projects yet</p>
            ) : (
              <ProjectList
                projects={projects}
                loadingProjects={loadingProjects}
                selectedProjectId={selectedProjectId}
                selectProject={selectProject}
                onProjectsChange={() => globalMutate(swrKeys.projects())}
              />
            )}
          </div>
        </aside>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* Top bar */}
          <div className="mb-8 flex items-center justify-between">
            {!panelOpen && (
              <button
                onClick={() => setPanelOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-lg font-semibold border border-white/50 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/30 hover:text-white/80"
              >
                <PanelLeftOpen size={13} /> Projects
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={() => router.push("/pricing")}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/10 px-4 py-1.5 text-xs font-semibold text-[#e8d5a3] transition hover:bg-[#c9a84c]/20"
            >
              <Sparkles size={12} /> Upgrade
            </button>
          </div>

          {/* Hero */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#e8d5a3] md:text-[40px]">
              Bring your manga panels to life
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#e8d5a3]/50">
              Drop a cover panel to start a new video
              {selectedProject ? ` in ${selectedProject.title}` : ""}.
            </p>
          </div>

          {/* Prompt-bar style upload */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => !uploading && fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            className={`group relative mx-auto mb-4 max-w-2xl cursor-pointer overflow-hidden rounded-3xl border p-6 text-center transition-all duration-300 ${
              drag
                ? "border-[#82e667]  bg-[#132513]"
                : "border-white/10 bg-[#0d1a0d]/90 hover:-translate-y-0.5 hover:border-[#4a8a42]/40"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) handleUpload(f);
            }}
          >
            {/* background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4a8a4225,transparent_70%)]" />

            {/* animated border glow */}
            <div
              className={`absolute inset-0 rounded-3xl transition-opacity ${
                drag ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              style={{
                background:
                  "linear-gradient(135deg, rgba(127,184,112,.25), transparent 45%, rgba(201,168,76,.18))",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1px",
              }}
            />

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) handleUpload(f);
                e.currentTarget.value = "";
              }}
            />

            <div className="relative z-10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-[#7fb870] via-[#5ea654] to-[#c9a84c] shadow-[0_0_40px_rgba(127,184,112,.35)] transition duration-300 group-hover:scale-105">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0d1a0d]/80 backdrop-blur">
                  {uploading ? (
                    <Loader2 className="animate-spin text-white" size={22} />
                  ) : (
                    <Upload size={22} className="text-white" />
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white">
                {drag ? "Drop your image" : "Upload Cover Panel"}
              </h3>

              <p className="mt-2 text-sm text-white/55">
                Drag & drop your image here or{" "}
                <span className="font-medium text-[#82e667]">
                  click anywhere to browse
                </span>
              </p>

              {!selectedProjectId && (
                <p className="mt-5 text-xs text-amber-400">
                  Select or create a project first
                </p>
              )}
            </div>
          </div>

          {/* Quick pills */}
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            {[
              "Fight scene",
              "Romance recap",
              "Comedy short",
              "Bulk upload",
            ].map((label) => (
              <button
                key={label}
                onClick={() => {
                  if (label === "Bulk upload") fileRef.current?.click();
                  else toast("Templates are coming soon");
                }}
                className="cursor-pointer rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/50 transition hover:border-white/25 hover:text-white/80"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Create grid — colorful feature cards */}
          <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {CREATE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.key}
                  disabled={card.soon}
                  onClick={() => fileRef.current?.click()}
                  className={`group relative aspect-4/5 overflow-hidden rounded-2xl border text-left transition ${
                    card.soon
                      ? "cursor-not-allowed border-white/6"
                      : "cursor-pointer border-white/10 hover:-translate-y-1 hover:border-white/20"
                  }`}
                >
                  {/* Base gradient wash */}
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${card.wash}`}
                  />

                  {/* Halftone screentone texture — manga's own shading language */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
                      backgroundSize: "6px 6px",
                      maskImage:
                        "radial-gradient(ellipse 90% 70% at 15% 15%, black 0%, transparent 60%)",
                      WebkitMaskImage:
                        "radial-gradient(ellipse 90% 70% at 15% 15%, black 0%, transparent 60%)",
                      opacity: 0.35,
                    }}
                  />

                  {/* Oversized ghost icon — watermark depth, bottom-right */}
                  <Icon
                    size={100}
                    strokeWidth={1.1}
                    className="pointer-events-none absolute -bottom-5 -right-5 rotate-[-8deg] text-white/8 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105"
                  />

                  {/* Fine diagonal speed-lines in the far corner — manga action-line motif */}
                  <svg
                    className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 opacity-[0.15]"
                    aria-hidden="true"
                  >
                    {[0, 6, 12, 18, 24].map((offset) => (
                      <line
                        key={offset}
                        x1={80 - offset}
                        y1={0}
                        x2={80}
                        y2={offset}
                        stroke="white"
                        strokeWidth="1"
                      />
                    ))}
                  </svg>

                  {card.soon && (
                    <div className="absolute inset-0 bg-black/50" />
                  )}

                  <div className="relative flex h-full flex-col justify-between p-4">
                    <Icon size={20} className="text-white/90" />
                    <div>
                      <p className="text-sm font-bold leading-tight text-white">
                        {card.title}
                      </p>
                      <p className="mt-1 text-[11px] text-white/70">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>

                  {card.soon && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-white/60">
                      <Lock size={9} /> Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Recent videos */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {selectedProject?.title ?? "Videos"}
                </h2>
                <p className="mt-0.5 text-xs text-white/30">
                  {loadingVideos
                    ? "Loading…"
                    : `${videos.length} video${videos.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex items-center gap-0.5 rounded-lg border border-white/5 bg-white/4 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`cursor-pointer rounded-md p-1.5 transition ${viewMode === "grid" ? "bg-[#4a8a42]/20 text-[#7fb870]" : "text-white/25 hover:text-white/50"}`}
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`cursor-pointer rounded-md p-1.5 transition ${viewMode === "list" ? "bg-[#4a8a42]/20 text-[#7fb870]" : "text-white/25 hover:text-white/50"}`}
                >
                  <List size={13} />
                </button>
              </div>
            </div>

            {loadingVideos ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-3 grid-cols-2 lg:grid-cols-3"
                    : "space-y-2"
                }
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className={viewMode === "grid" ? "h-56" : "h-14"}
                  />
                ))}
              </div>
            ) : !selectedProjectId ? (
              <div className="rounded-2xl border border-dashed border-white/6 p-12 text-center">
                <FolderOpen size={28} className="mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/30">
                  Select a project to see videos
                </p>
              </div>
            ) : videos.length === 0 ? (
              <EmptyVideos />
            ) : viewMode === "grid" ? (
              <div className="grid  gap-3 grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    compact={false}
                    onOpen={() => router.push(`/editor/${video.id}`)}
                    onDelete={() => deleteVideo(video.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    compact={true}
                    onOpen={() => router.push(`/editor/${video.id}`)}
                    onDelete={() => deleteVideo(video.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <CopyrightForm
        isOpen={showCopyrightForm}
        projectName={newProjectTitle}
        onClose={() => {
          setShowCopyrightForm(false);
          setShowNewProject(true);
        }}
        onSubmit={(data) => createProject(data)}
        isSubmitting={creatingProject}
      />
    </div>
  );
}
