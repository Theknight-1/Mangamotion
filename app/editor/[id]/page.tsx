'use client'

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from 'next/navigation'
import { useSession } from "@/lib/auth-client";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";
import toast from 'react-hot-toast'
import { useStore } from '@nanostores/react'
import { IconLogo } from '@/components/icon-logo'
import Loading from '@/components/animation/animate-loading'
import type { Scene } from "@/types/scene";
import { SceneListPanel } from "@/components/scene-list-panel";
import { ScenePreview } from "@/components/scene-preview";
import { SceneCard } from "@/components/scene-card";
import { RightPanel, type RightPanelTab } from "@/components/right-panel";

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
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightPanelTab>("voice");

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
      if (normalized.timeline.length > 0) {
        setActiveSceneId(normalized.timeline[0].id);
      }
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

  const handleSceneUpdate = useCallback(
    (updated: Scene) => {
      if (!video) return;
      handleTimelineChange(
        video.timeline.map((s) => (s.id === updated.id ? updated : s)),
      );
    },
    [video, handleTimelineChange],
  );

  const handleSceneDelete = useCallback(
    (sceneId: string) => {
      if (!video) return;
      const filtered = video.timeline.filter((s) => s.id !== sceneId);
      handleTimelineChange(filtered.map((s, i) => ({ ...s, index: i })));
      if (activeSceneId === sceneId) {
        setActiveSceneId(filtered.length > 0 ? filtered[0].id : null);
      }
    },
    [video, handleTimelineChange, activeSceneId],
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060e06] flex items-center justify-center">
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
  const activeScene =
    video.timeline.find((s) => s.id === activeSceneId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-[#060e06] text-white">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/[0.07] bg-[#0a0f0a]/80 px-4 backdrop-blur-md">
        <button
          onClick={() => router.push("/dashboard")}
          className="shrink-0 rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
          aria-label="Back to dashboard"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="h-5 w-px shrink-0 bg-white/10" />

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#c9a84c]/30 bg-[#c9a84c]/10">
            <IconLogo />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="min-w-0 max-w-xs border-b border-transparent bg-transparent pb-0.5 text-sm font-medium text-white transition hover:border-white/20 focus:border-[#c9a84c] focus:outline-none"
            placeholder="Chapter title"
          />
          {saving && (
            <Loader2
              size={13}
              className="shrink-0 animate-spin text-white/30"
            />
          )}
        </div>

        <div
          className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${statusCfg.color}`}
        >
          <StatusIcon
            size={14}
            className={video.status === "processing" ? "animate-spin" : ""}
          />
          {statusCfg.label}
        </div>

        <button
          onClick={() => setRightTab("export")}
          className="shrink-0 cursor-pointer rounded-lg border border-[#c9a84c]/40 bg-[#c9a84c]/10 px-3 py-1.5 text-xs font-semibold text-[#e8d5a3] transition hover:bg-[#c9a84c]/20"
        >
          <span className="inline-flex items-center gap-1.5">
            <Download size={12} /> Export
          </span>
        </button>
      </header>

      {/* 3-column body */}
      <div className="grid h-full min-h-0 flex-1 overflow-hidden grid-cols-[300px_minmax(0,1fr)_400px]">
        {/* Left: scene list */}
        <SceneListPanel
          videoId={videoId}
          scenes={video.timeline}
          activeSceneId={activeSceneId}
          onSelectScene={setActiveSceneId}
          onScenesChange={handleTimelineChange}
        />

        {/* Center: preview + scene card */}
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-6">
          <ScenePreview
            status={video.status as any}
            videoUrl={video.videoUrl}
            subtitlesEnabled={video.subtitlesEnabled}
            subtitleUrl={video.subtitleUrl}
            aspectRatio={video.aspectRatio}
            activeScene={activeScene}
            sceneCount={video.timeline.length}
          />

          {activeScene ? (
            <SceneCard
              key={activeScene.id}
              scene={activeScene}
              number={activeScene.index + 1}
              videoId={videoId}
              allScenes={video.timeline}
              onUpdate={handleSceneUpdate}
              onDelete={() => handleSceneDelete(activeScene.id)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/[0.07] py-12 text-center">
              <p className="text-sm text-white/30">
                Select a scene from the list, or add a new one to get started
              </p>
            </div>
          )}
        </div>

        {/* Right: voices & export */}
        <RightPanel
          activeTab={rightTab}
          onTabChange={setRightTab}
          videoId={videoId}
          activeScene={activeScene}
          onSceneUpdate={handleSceneUpdate}
          scenes={video.timeline}
          aspectRatio={video.aspectRatio}
          subtitlesEnabled={video.subtitlesEnabled}
          onExportStart={() =>
            setVideo((v) => (v ? { ...v, status: "processing" } : v))
          }
        />
      </div>
    </div>
  );
}