'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'
import { useStore } from '@nanostores/react'
import useSWR, { mutate as globalMutate } from 'swr'
import {
  Plus, LogOut, Play, Trash2, Film, FolderOpen,
  Sparkles, ChevronRight, Clock, LayoutGrid, List,
  ImageIcon, Loader2, X, Check, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsApi, videosApi, uploadApi, swrKeys, type Project, type Video } from '@/lib/api'

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; cls: string }> = {
  draft:      { label: 'Draft',      cls: 'bg-white/[0.06] text-white/40' },
  processing: { label: 'Rendering',  cls: 'bg-amber-500/15 text-amber-300' },
  completed:  { label: 'Done',       cls: 'bg-[#bbdf50]/15 text-[#bbdf50]' },
  failed:     { label: 'Failed',     cls: 'bg-red-500/15 text-red-400' },
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyVideos({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
        <Film size={22} className="text-white/20" />
      </div>
      <p className="text-white/40 text-sm font-medium">No videos yet</p>
      <p className="text-white/20 text-xs mt-1 mb-6">Upload a manga panel to create your first video</p>
      <button
        onClick={onUpload}
        className="inline-flex items-center gap-2 bg-[#bbdf50] hover:bg-[#caea60] text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition"
      >
        <Plus size={15} /> Upload Panel
      </button>
    </div>
  )
}

// ─── Video card ───────────────────────────────────────────────────────────────
function VideoCard({
  video,
  onDelete,
  onOpen,
  compact,
}: {
  video: Video
  onDelete: () => void
  onOpen: () => void
  compact: boolean
}) {
  const s = STATUS[video.status] ?? STATUS.draft
  const isProcessing = video.status === 'processing'

  if (compact) {
    return (
      <div
        onClick={onOpen}
        className="group flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/6 bg-[#0f0f1a] cursor-pointer hover:border-white/12 transition"
      >
        <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-white/4 shrink-0">
          <img src={video.sourceImage} alt="" className="w-full h-full object-cover" />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={12} className="animate-spin text-amber-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80 truncate">{video.title}</p>
          <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
            <Clock size={10} />
            {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0 ${s.cls}`}>
          {s.label}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={onOpen}
      className="group rounded-2xl border border-white/6 bg-[#0f0f1a] overflow-hidden cursor-pointer hover:border-white/[0.14] transition"
    >
      {/* Thumbnail — portrait ratio to match 9:16 output */}
      <div className="relative overflow-hidden bg-black w-full" style={{ aspectRatio: '9/16', maxHeight: 250 }}>
        <img
          src={video.sourceImage}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-amber-400" />
            <span className="text-xs text-white/50">Rendering…</span>
          </div>
        )}
        {video.status === 'completed' && (
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center pb-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-white text-xs font-medium">
              <Play size={12} className="fill-white" /> Open Editor
            </div>
          </div>
        )}
        {video.status === 'failed' && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <AlertCircle size={12} className="text-red-400" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-white/80 truncate leading-tight">{video.title}</p>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="shrink-0 p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
            {s.label}
          </span>
          <span className="text-[11px] text-white/25">
            {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Upload drop zone ─────────────────────────────────────────────────────────
function UploadZone({
  disabled,
  onFile,
  uploading,
}: {
  disabled: boolean
  onFile: (file: File) => void
  uploading: boolean
}) {
  const [drag, setDrag] = useState(false)

  return (
    <label
      className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition cursor-pointer ${
        disabled
          ? 'opacity-40 cursor-not-allowed border-white/[0.06]'
          : drag
          ? 'border-[#bbdf50]/60 bg-[#bbdf50]/[0.04]'
          : 'border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.02]'
      }`}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault(); setDrag(false)
        if (!disabled) { const f = e.dataTransfer.files[0]; if (f) onFile(f) }
      }}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={e => { const f = e.currentTarget.files?.[0]; if (f) onFile(f); e.currentTarget.value = '' }}
      />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition ${
        drag ? 'bg-[#bbdf50]/10 border-[#bbdf50]/30' : 'bg-white/[0.04] border-white/[0.07]'
      }`}>
        {uploading
          ? <Loader2 size={18} className="text-white/40 animate-spin" />
          : <ImageIcon size={18} className={drag ? 'text-[#bbdf50]' : 'text-white/30'} />
        }
      </div>
      <div className="text-center">
        <p className="text-sm text-white/50">
          {uploading ? 'Uploading…' : drag ? 'Drop to upload' : 'Drop manga panel here'}
        </p>
        <p className="text-xs text-white/25 mt-0.5">
          or <span className="text-[#bbdf50]/70">click to browse</span> · JPG, PNG, WebP
        </p>
      </div>
    </label>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter()
  const session  = useStore(useSession)
  const user     = session?.data?.user

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [newProjectTitle, setNewProjectTitle]     = useState('')
  const [showNewProject, setShowNewProject]       = useState(false)
  const [creatingProject, setCreatingProject]     = useState(false)
  const [uploading, setUploading]                 = useState(false)
  const [viewMode, setViewMode]                   = useState<'grid' | 'list'>('grid')

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (session?.data === null) router.push('/login')
  }, [session?.data, router])

  // ── Data fetching with SWR ─────────────────────────────────────────────────
  // SWR deduplicates — multiple components can call the same key without extra requests
  const { data: projectsData, isLoading: loadingProjects } = useSWR(
    user ? swrKeys.projects() : null,
    () => projectsApi.list(),
    {
      onSuccess: data => {
        // Auto-select first project on initial load only
        if (!selectedProjectId && data.projects.length > 0) {
          setSelectedProjectId(data.projects[0].id)
        }
      },
      revalidateOnFocus: false, // don't re-fetch on tab focus — reduces noise
    }
  )

  const { data: videosData, isLoading: loadingVideos } = useSWR(
    selectedProjectId ? swrKeys.videos(selectedProjectId) : null,
    () => videosApi.list(selectedProjectId!),
    {
      revalidateOnFocus: false,
      // Poll if any video is processing — stops when none are
      refreshInterval: (data) => {
        const hasProcessing = data?.videos.some(v => v.status === 'processing')
        return hasProcessing ? 4000 : 0
      },
    }
  )

  const projects = projectsData?.projects ?? []
  const videos   = videosData?.videos ?? []
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // ── Actions ────────────────────────────────────────────────────────────────
  const createProject = useCallback(async () => {
    if (!newProjectTitle.trim()) return
    setCreatingProject(true)
    try {
      const { project } = await projectsApi.create(newProjectTitle.trim())
      // Optimistic update + revalidate
      await globalMutate(swrKeys.projects())
      setSelectedProjectId(project.id)
      setNewProjectTitle('')
      setShowNewProject(false)
      toast.success('Project created')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create project')
    } finally {
      setCreatingProject(false)
    }
  }, [newProjectTitle])

  const handleUpload = useCallback(async (file: File) => {
    if (!selectedProjectId) { toast.error('Select a project first'); return }
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return }

    setUploading(true)
    try {
      const { url } = await uploadApi.image(file)
      const { video } = await videosApi.create({
        projectId: selectedProjectId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        sourceImage: url,
      })
      // Revalidate video list
      await globalMutate(swrKeys.videos(selectedProjectId))
      toast.success('Opening editor…')
      setTimeout(() => router.push(`/editor/${video.id}`), 300)
    } catch (e: any) {
      toast.error(e.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [selectedProjectId, router])

  const deleteVideo = useCallback(async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this video?')) return
    try {
      await videosApi.delete(videoId)
      // Optimistically remove from cache
      globalMutate(
        swrKeys.videos(selectedProjectId!),
        (prev: any) => prev ? { videos: prev.videos.filter((v: Video) => v.id !== videoId) } : prev,
        { revalidate: false }
      )
      toast.success('Deleted')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to delete')
    }
  }, [selectedProjectId])

  const selectProject = useCallback((id: string) => {
    setSelectedProjectId(id)
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080810] text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#080810]/90 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo mark */}
            <div className="w-7 h-7 rounded-lg bg-[#bbdf50] flex items-center justify-center">
              <Sparkles size={13} className="text-black" />
            </div>
            <span className="font-semibold text-white tracking-tight text-sm">MangaMotion</span>
            <span className="text-white/15 text-xs ml-1">AI Studio</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white/30 text-xs hidden sm:block">{user?.email}</span>
            <button
              onClick={() => signOut().then(() => router.push('/login'))}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.16] text-white/40 hover:text-white/70 transition"
            >
              <LogOut size={12} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-7 flex gap-6">

        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 space-y-5">

          {/* New project button */}
          <button
            onClick={() => setShowNewProject(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#bbdf50] hover:bg-[#caea60] active:bg-[#b0d048] text-black text-sm font-semibold py-2.5 rounded-xl transition"
          >
            <Plus size={15} />
            New Project
          </button>

          {/* New project input */}
          {showNewProject && (
            <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-2">
              <input
                autoFocus
                type="text"
                value={newProjectTitle}
                onChange={e => setNewProjectTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') createProject()
                  if (e.key === 'Escape') { setShowNewProject(false); setNewProjectTitle('') }
                }}
                placeholder="Project name"
                className="w-full px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#bbdf50]/40 transition"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={createProject}
                  disabled={creatingProject || !newProjectTitle.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#bbdf50] hover:bg-[#caea60] disabled:opacity-40 text-black text-xs font-semibold py-1.5 rounded-lg transition"
                >
                  {creatingProject ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Create
                </button>
                <button
                  onClick={() => { setShowNewProject(false); setNewProjectTitle('') }}
                  className="px-2.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.09] text-white/40 rounded-lg transition"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Project list */}
          <div>
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-2 px-1">
              Projects
            </p>
            {loadingProjects ? (
              <div className="space-y-1.5">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : projects.length === 0 ? (
              <p className="text-xs text-white/25 px-1 py-2">No projects yet</p>
            ) : (
              <div className="space-y-1">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectProject(p.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition group ${
                      selectedProjectId === p.id
                        ? 'bg-[#bbdf50]/10 text-white border border-[#bbdf50]/20'
                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FolderOpen size={12} className="shrink-0" />
                      <span className="truncate font-medium">{p.title}</span>
                    </span>
                    <ChevronRight
                      size={11}
                      className={`shrink-0 transition ${
                        selectedProjectId === p.id ? 'opacity-50' : 'opacity-0 group-hover:opacity-30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Upload zone */}
          <section className="rounded-2xl border border-white/[0.06] bg-[#0c0c18] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">New Video</h2>
                <p className="text-xs text-white/30 mt-0.5">Upload a manga panel — Gemini will analyze it automatically</p>
              </div>
              {!selectedProjectId && (
                <span className="text-xs text-amber-400/70 bg-amber-500/10 border border-amber-500/15 px-2.5 py-1 rounded-full">
                  Select a project first
                </span>
              )}
            </div>
            <UploadZone
              disabled={!selectedProjectId || uploading}
              onFile={handleUpload}
              uploading={uploading}
            />
          </section>

          {/* Videos section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {selectedProject?.title ?? 'Videos'}
                </h2>
                <p className="text-xs text-white/30 mt-0.5">
                  {loadingVideos ? 'Loading…' : `${videos.length} video${videos.length !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-0.5 p-1 rounded-lg bg-white/[0.04] border border-white/[0.05]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/50'}`}
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/50'}`}
                >
                  <List size={13} />
                </button>
              </div>
            </div>

            {/* Loading state */}
            {loadingVideos ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                : 'space-y-2'
              }>
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className={viewMode === 'grid' ? 'h-56' : 'h-14'} />
                ))}
              </div>
            ) : !selectedProjectId ? (
              <div className="rounded-2xl border border-dashed border-white/[0.06] p-12 text-center">
                <FolderOpen size={28} className="mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/30">Select a project to see videos</p>
              </div>
            ) : videos.length === 0 ? (
              <EmptyVideos onUpload={() => {}} />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {videos.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    compact={false}
                    onOpen={() => router.push(`/editor/${video.id}`)}
                    onDelete={() => deleteVideo(video.id, { stopPropagation: () => {} } as any)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {videos.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    compact={true}
                    onOpen={() => router.push(`/editor/${video.id}`)}
                    onDelete={() => deleteVideo(video.id, { stopPropagation: () => {} } as any)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}