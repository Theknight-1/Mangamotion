'use client'

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from 'next/navigation'
import { useSession } from "@/lib/auth-client";
import { VideoExport } from '@/components/video-export'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from 'react-hot-toast'
import { useStore } from '@nanostores/react'
import { IconLogo } from '@/components/icon-logo'
import Loading from '@/components/animation/animate-loading'
import type { Scene } from "@/types/scene";
import { TimelineEditor } from "@/components/timeline-editor";

// ─── Types ────────────────────────────────────────────────────────────────
interface VideoRaw {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  sourceImage: string;
  status: string;
  timeline: string | Scene[] | null;
  videoUrl?: string;
  duration?: number;
  aspectRatio?: string;
  subtitlesEnabled?: boolean;
  subtitleUrl?: string;
}

interface Video extends Omit<VideoRaw, "timeline"> {
  timeline: Scene[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function parseTimeline(raw: string | Scene[] | null | undefined): Scene[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeVideo(raw: VideoRaw): Video {
  return { ...raw, timeline: parseTimeline(raw.timeline) }
}

// ─── Status config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: { icon: Clock, color: "text-white/40", label: "Draft" },
  processing: { icon: Loader2, color: "text-amber-400", label: "Processing" },
  completed: {
    icon: CheckCircle2,
    color: "text-[#c8e86b]",
    label: "Completed",
  },
  failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
} as const;

// ─── Main component ───────────────────────────────────────────────────────
export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const session = useStore(useSession);
  const videoId = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Auth guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.data?.user) router.push("/login");
  }, [session, router]);

  // ── Fetch video ───────────────────────────────────────────────────────
  useEffect(() => {
    if (session?.data?.user) fetchVideo();
  }, [session, videoId]);

  async function fetchVideo() {
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const normalized = normalizeVideo(data.video);
      setVideo(normalized);
      setTitle(normalized.title);
    } catch {
      toast.error("Failed to load video");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  // ── Update video ──────────────────────────────────────────────────────
  async function updateVideo(updates: Partial<Video>) {
    if (!video) return;
    setSaving(true);
    try {
      const payload = {
        ...updates,
        ...(updates.timeline !== undefined && {
          timeline: JSON.stringify(updates.timeline),
        }),
      };
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVideo(normalizeVideo(data.video));
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ── Save title ────────────────────────────────────────────────────────
  async function saveTitle() {
    if (!title.trim() || title === video?.title) return;
    await updateVideo({ title: title.trim() });
    toast.success("Title saved");
  }

  // ── Handle timeline changes ───────────────────────────────────────────
  const handleTimelineChange = useCallback(
    (scenes: Scene[]) => {
      updateVideo({ timeline: scenes });
    },
    [video],
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!video) return null;

  // ── Derived values ────────────────────────────────────────────────────
  const statusCfg =
    STATUS_CONFIG[video.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;
  const previewAspectRatio = (video.aspectRatio || "16:9").replace(":", "/");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/6 bg-[#0d0d14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition shrink-0"
            aria-label="Back to dashboard"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="w-px h-5 bg-white/10 shrink-0" />

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <IconLogo />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="text-sm font-medium text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-violet-500 focus:outline-none transition pb-0.5 min-w-0 max-w-xs"
              placeholder="Video title"
            />
            {saving && (
              <Loader2
                size={13}
                className="animate-spin text-white/30 shrink-0"
              />
            )}
          </div>

          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${statusCfg.color} shrink-0`}
          >
            <StatusIcon
              size={14}
              className={video.status === "processing" ? "animate-spin" : ""}
            />
            {statusCfg.label}
          </div>

          {/* <div className="w-px h-5 bg-white/10 shrink-0" /> */}

          {/* <div className="flex items-center gap-3 shrink-0">
            <select
              value={video.aspectRatio || "16:9"}
              onChange={(e) => updateVideo({ aspectRatio: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
            >
              <option value="9:16" className="bg-[#0d0d14]">
                📱 9:16 (Shorts)
              </option>
              <option value="16:9" className="bg-[#0d0d14]">
                🖥️ 16:9 (YouTube)
              </option>
              <option value="1:1" className="bg-[#0d0d14]">
                ⬜ 1:1 (Square)
              </option>
              <option value="4:5" className="bg-[#0d0d14]">
                📐 4:5 (IG Portrait)
              </option>
            </select>

            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer select-none hover:text-white/80 transition">
              <input
                type="checkbox"
                checked={video.subtitlesEnabled !== false}
                onChange={(e) =>
                  updateVideo({ subtitlesEnabled: e.target.checked })
                }
                className="rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <span className="text-xs font-medium">Subtitles</span>
            </label>
          </div> */}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <div className="lg:col-span-2 flex justify-center">
            <div
              className="rounded-2xl overflow-hidden bg-[#0f0f1a] border border-white/[0.07] w-full relative"
              style={{ aspectRatio: previewAspectRatio, maxHeight: "80vh" }}
            >
              <img
                src={video.sourceImage}
                alt={video.title}
                className="w-full h-full object-cover"
              />

              {video.status === "processing" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3">
                  <Loader2 size={20} className="animate-spin text-[#bbdf50]" />
                  <span className="text-sm text-white/60">Rendering…</span>
                </div>
              )}

              {video.status === "completed" && video.videoUrl && (
                <div className="absolute inset-0">
                  <video
                    src={video.videoUrl}
                    controls
                    className="w-full h-full"
                    crossOrigin="anonymous"
                  >
                    {video.subtitlesEnabled !== false && video.subtitleUrl && (
                      <track
                        kind="subtitles"
                        src={video.subtitleUrl}
                        srcLang="en"
                        label="English"
                        default
                      />
                    )}
                  </video>
                </div>
              )}

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="text-xs text-white/40 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                  {video.aspectRatio || "9:16"}
                </span>
                <span className="text-xs text-white/40 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                  {video.timeline.length} scene
                  {video.timeline.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="lg:col-span-1">
            <VideoExport
              videoId={videoId}
              scenes={video.timeline}
              aspectRatio={video.aspectRatio || "9:16"}
              subtitlesEnabled={video.subtitlesEnabled !== false}
              onExportStart={() =>
                setVideo((v) => (v ? { ...v, status: "processing" } : v))
              }
            />
          </div>
        </div>

        {/* Scene Timeline Editor */}
        <TimelineEditor
          videoId={videoId}
          scenes={video.timeline}
          onScenesChange={handleTimelineChange}
        />
      </div>
    </div>
  );
}