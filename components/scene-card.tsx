'use client'

import { useState, useRef } from 'react'
import {
  ImageIcon, Sparkles, Mic, Trash2, CheckCircle2,
  Loader2, Play, Pause, Upload, ChevronDown, ChevronUp,
  RotateCcw, Volume2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { VoiceGenerator } from './voice-generator'
import type { Scene } from '@/types/scene'

interface SceneCardProps {
  scene: Scene
  number: number
  onUpdate: (updated: Scene) => void
  onDelete: () => void
  videoId: string
}

/* ─── Step logic ─────────────────────────────────────────────────────────── */
type Step = 1 | 2 | 3
function getStep(scene: Scene): Step {
  if (!scene.imageUrl || scene.status === 'idle') return 1
  if (scene.status === 'analyzing' || scene.status === 'ready') return 2
  return 3
}

/* ─── Step badge ─────────────────────────────────────────────────────────── */
function StepBadge({ step, current, isDone }: { step: number; current: Step; isDone: boolean }) {
  const isPast   = isDone || step < current
  const isActive = step === current && !isDone

  const bg     = isPast ? 'rgba(74,138,66,0.2)' : isActive ? 'rgba(74,138,66,0.12)' : 'rgba(255,255,255,0.05)'
  const border  = isPast ? 'rgba(74,138,66,0.45)' : isActive ? 'rgba(74,138,66,0.3)' : 'rgba(255,255,255,0.07)'
  const color   = isPast ? '#4a8a42' : isActive ? '#7fb870' : 'rgba(255,255,255,0.2)'

  return (
    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg, border: `1.5px solid ${border}`, transition: 'all 0.25s' }}>
      {isPast && step < current
        ? <CheckCircle2 size={11} style={{ color: '#4a8a42' }} />
        : <span style={{ fontSize: 10, fontWeight: 700, color }}>{step}</span>}
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export function SceneCard({ scene, number, onUpdate, onDelete, videoId }: SceneCardProps) {
  const [collapsed, setCollapsed]     = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [showVoice, setShowVoice]     = useState(false)
  const [playingAudio, setPlayingAudio] = useState(false)
  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const fileRef     = useRef<HTMLInputElement>(null)

  const step        = getStep(scene)
  const isDone      = scene.status === 'done'
  const isAnalyzing = scene.status === 'analyzing'
  const hasImage    = !!scene.imageUrl
  const hasVoice    = !!scene.voice?.audioUrl
  const hasNarration = !!scene.narration.trim()

  /* ── upload ── */
  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      const base: Scene = { ...scene, imageUrl: url, status: 'analyzing', narration: '', keyframes: [] }
      onUpdate(base)
      await analyzePanel(url, base)
    } catch {
      toast.error('Upload failed — please try again')
      onUpdate({ ...scene, status: 'idle' })
    } finally { setUploading(false) }
  }

  async function analyzePanel(imageUrl: string, base: Scene) {
    try {
      const res = await fetch('/api/analyze-panel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      if (!res.ok) throw new Error()
      const { narration, keyframes } = await res.json()
      onUpdate({ ...base, imageUrl, narration, keyframes, status: 'ready' })
      toast.success(`Scene ${number} — Narration generated`)
    } catch {
      toast.error('AI failed — you can type narration manually')
      onUpdate({ ...base, imageUrl, narration: '', keyframes: [{ t: 0, x: 0, y: 0, w: 1, h: 1 }], status: 'ready' })
    }
  }

  async function reAnalyze() {
    if (!scene.imageUrl) return
    await analyzePanel(scene.imageUrl, { ...scene, voice: undefined })
  }

  function toggleAudio() {
    if (playingAudio) { audioRef.current?.pause(); setPlayingAudio(false); return }
    if (!scene.voice?.audioUrl) return
    const a = new Audio(scene.voice.audioUrl)
    a.onended = () => setPlayingAudio(false)
    a.play(); audioRef.current = a; setPlayingAudio(true)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  /* ─────────────────────────── RENDER ─────────────────────────────────── */
  return (
    <div style={{
      borderRadius: 16,
      border: `1.5px solid ${isDone ? 'rgba(74,138,66,0.3)' : 'rgba(255,255,255,0.07)'}`,
      background: isDone ? 'rgba(6,14,6,0.8)' : '#0d0d18',
      transition: 'border-color 0.3s',
      overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(c => !c)}
        onKeyDown={e => e.key === 'Enter' && setCollapsed(c => !c)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', userSelect: 'none' }}
      >
        {/* Number badge */}
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isDone ? 'rgba(74,138,66,0.18)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isDone ? 'rgba(74,138,66,0.35)' : 'rgba(255,255,255,0.08)'}`,
          fontSize: 11, fontWeight: 700,
          color: isDone ? '#4a8a42' : 'rgba(255,255,255,0.3)',
        }}>
          {isDone ? <CheckCircle2 size={13} style={{ color: '#4a8a42' }} /> : number}
        </div>

        {/* Thumb when collapsed */}
        {collapsed && hasImage && (
          <img src={scene.imageUrl} alt="" style={{ width: 42, height: 28, objectFit: 'cover', borderRadius: 5, flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)' }} />
        )}

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Scene {number}</span>
            {/* Step dots (collapsed) */}
            {collapsed && (
              <div style={{ display: 'flex', gap: 3 }}>
                {[1,2,3].map(s => (
                  <div key={s} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: isDone ? '#4a8a42' : s < step ? '#3a6032' : s === step ? '#7fb870' : 'rgba(255,255,255,0.07)',
                    transition: 'background 0.25s',
                  }} />
                ))}
              </div>
            )}
          </div>
          {collapsed && scene.narration && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scene.narration}
            </p>
          )}
        </div>

        {/* Status chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {isAnalyzing && <Loader2 size={11} style={{ color: '#c9a84c', animation: 'spin 1s linear infinite' }} />}
          <span style={{ fontSize: 11, fontWeight: 500, color: isDone ? '#4a8a42' : isAnalyzing ? '#c9a84c' : !hasImage ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.35)' }}>
            {isDone ? 'Complete' : isAnalyzing ? 'Analyzing…' : !hasImage ? 'Upload panel' : hasVoice ? 'Voice ready' : 'Add voice'}
          </span>
        </div>

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          aria-label="Delete scene"
          style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', transition: 'all 0.15s', flexShrink: 0 }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(239,68,68,0.1)'; b.style.color = '#f87171'; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'rgba(255,255,255,0.15)'; }}
        ><Trash2 size={12} /></button>

        {/* Chevron */}
        <div style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      {!collapsed && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Step progress track */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 20px 4px' }}>
            {(['Upload panel', 'Write narration', 'Add voice'] as const).map((label, idx) => {
              const s = (idx + 1) as Step
              const isPast   = isDone || s < step
              const isActive = s === step && !isDone
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 3 ? 1 : undefined, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <StepBadge step={s} current={step} isDone={isDone} />
                    <span style={{
                      fontSize: 11, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap',
                      color: isPast ? '#4a8a42' : isActive ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)',
                    }}>{label}</span>
                  </div>
                  {s < 3 && (
                    <div style={{ flex: 1, height: 1, margin: '0 10px', background: isPast ? 'rgba(74,138,66,0.35)' : 'rgba(255,255,255,0.05)', transition: 'background 0.3s', minWidth: 12 }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* ─ Content area ─────────────────────────────────────────────── */}
          <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* STEP 1 — Upload drop zone */}
            {!hasImage && (
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => !uploading && fileRef.current?.click()}
                style={{
                  border: '1.5px dashed rgba(255,255,255,0.08)', borderRadius: 12,
                  padding: '36px 24px', textAlign: 'center',
                  cursor: uploading ? 'default' : 'pointer', transition: 'all 0.2s',
                  background: 'rgba(255,255,255,0.01)',
                }}
                onMouseEnter={e => { if (!uploading) { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'rgba(74,138,66,0.4)'; d.style.background = 'rgba(74,138,66,0.025)'; }}}
                onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'rgba(255,255,255,0.08)'; d.style.background = 'rgba(255,255,255,0.01)'; }}
              >
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
                  onChange={e => { const f = e.currentTarget.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ''; }} />
                <div style={{ width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: uploading ? '#c9a84c' : 'rgba(255,255,255,0.2)' }}>
                  {uploading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={20} />}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
                  {uploading ? 'Uploading…' : 'Drop your manga panel here'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                  or <span style={{ color: '#4a8a42', fontWeight: 500 }}>click to browse</span> · JPG, PNG, WebP · max 10 MB
                </p>
              </div>
            )}

            {/* STEP 1 done — panel + STEP 2 narration side by side */}
            {hasImage && (
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'start' }}>
                {/* Thumbnail */}
                <div style={{ position: 'relative', width: 120, borderRadius: 10, overflow: 'hidden', background: '#060e06', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}
                  onMouseEnter={e => { const btn = (e.currentTarget as HTMLDivElement).querySelector('.img-replace') as HTMLElement; if (btn) btn.style.opacity = '1'; }}
                  onMouseLeave={e => { const btn = (e.currentTarget as HTMLDivElement).querySelector('.img-replace') as HTMLElement; if (btn) btn.style.opacity = '0'; }}
                >
                  <img src={scene.imageUrl} alt="" loading="lazy" style={{ width: '100%', display: 'block', aspectRatio: '3/4', objectFit: 'cover' }} />
                  {isAnalyzing && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Loader2 size={16} style={{ color: '#c9a84c', animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>AI analyzing…</span>
                    </div>
                  )}
                  <button className="img-replace" onClick={() => fileRef.current?.click()} aria-label="Replace image"
                    style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.8)', color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s', whiteSpace: 'nowrap' }}>
                    <Upload size={9} /> Replace
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.currentTarget.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ''; }} />
                </div>

                {/* Narration (step 2) */}
                {(scene.status === 'ready' || scene.status === 'done' || scene.status === 'generating_voice') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Narration</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>{scene.narration.length}/500</span>
                        <button onClick={reAnalyze} title="Re-run AI analysis"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: '#3a7033', border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 5px', borderRadius: 5, transition: 'all 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,138,66,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#5aaa52'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#3a7033'; }}
                        ><RotateCcw size={9} /> Re-analyze</button>
                      </div>
                    </div>

                    <textarea
                      value={scene.narration}
                      onChange={e => onUpdate({ ...scene, narration: e.target.value })}
                      rows={5} maxLength={500}
                      placeholder="AI will generate narration after upload. You can edit it here before generating voice…"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', resize: 'none', outline: 'none', lineHeight: 1.65, fontFamily: 'inherit', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                      onFocus={e => (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'rgba(74,138,66,0.4)'}
                      onBlur={e => (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.08)'}
                    />

                    {(scene.keyframes?.length ?? 0) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>
                        <Sparkles size={10} style={{ color: '#3a6032' }} />
                        {scene.keyframes.length} zoom keyframes detected by AI
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 — Voice */}
            {(scene.status === 'ready' || scene.status === 'done' || scene.status === 'generating_voice') && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>

                {hasVoice ? (
                  /* ── Voice ready ── */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 11, border: '1px solid rgba(74,138,66,0.22)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(74,138,66,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Volume2 size={14} style={{ color: '#4a8a42' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#7fb870', margin: 0 }}>Voice generated</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {scene.voice!.text.slice(0, 55)}{scene.voice!.text.length > 55 ? '…' : ''}
                      </p>
                    </div>
                    <button onClick={toggleAudio} aria-label={playingAudio ? 'Pause' : 'Play preview'}
                      style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(74,138,66,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7fb870', flexShrink: 0, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,138,66,0.32)'}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,138,66,0.2)'}
                    >{playingAudio ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: 1 }} />}</button>
                    <button onClick={() => setShowVoice(v => !v)}
                      style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 10px', background: 'transparent', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = 'rgba(255,255,255,0.6)'; b.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = 'rgba(255,255,255,0.28)'; b.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      {showVoice ? 'Cancel' : 'Regenerate voice'}
                    </button>
                  </div>
                ) : (
                  /* ── Generate voice CTA ── */
                  <button
                    onClick={() => setShowVoice(v => !v)}
                    disabled={!hasNarration}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '12px 16px', borderRadius: 11, border: `1.5px solid ${hasNarration ? 'rgba(74,138,66,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      background: hasNarration ? 'rgba(74,138,66,0.1)' : 'rgba(255,255,255,0.02)',
                      color: hasNarration ? '#7fb870' : 'rgba(255,255,255,0.18)',
                      fontSize: 13, fontWeight: 600, cursor: hasNarration ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (hasNarration) { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(74,138,66,0.18)'; b.style.borderColor = 'rgba(74,138,66,0.5)'; }}}
                    onMouseLeave={e => { if (hasNarration) { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(74,138,66,0.1)'; b.style.borderColor = 'rgba(74,138,66,0.3)'; }}}
                  >
                    <Mic size={14} />
                    {!hasNarration
                      ? 'Write narration above before generating voice'
                      : showVoice ? 'Hide voice generator' : 'Generate voice for this scene →'}
                  </button>
                )}

                {showVoice && (
                  <div style={{ marginTop: 12 }}>
                    <VoiceGenerator
                      videoId={videoId}
                      sceneIndex={scene.index}
                      prefillText={scene.narration}
                      onVoiceGenerated={(audioUrl, duration) => {
                        onUpdate({ ...scene, voice: { audioUrl, duration, text: scene.narration }, status: 'done' })
                        setShowVoice(false)
                        toast.success(`Scene ${number} voice ready!`)
                      }}
                    />
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}