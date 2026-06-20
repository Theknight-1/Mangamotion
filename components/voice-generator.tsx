'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Volume2, Search, Play, Pause, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface VoiceGeneratorProps {
  videoId: string
  sceneIndex: number
  prefillText?: string
  onVoiceGenerated: (audioUrl: string, duration: number) => void
}

interface FlatVoice {
  voice_id: string
  label: string
  character: string
  image_url: string
  preview_url: string
  // Add a unique key since voice_id might not be unique across characters
  uniqueKey: string
}

export function VoiceGenerator({ videoId, sceneIndex, prefillText = '', onVoiceGenerated }: VoiceGeneratorProps) {
  const [text, setText] = useState(prefillText)
  const [search, setSearch] = useState('')
  const [flatVoices, setFlatVoices] = useState<FlatVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingVoices, setLoadingVoices] = useState(true)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAutoSelected = useRef(false)

  // Sync prefill text when it changes from parent
  useEffect(() => { setText(prefillText) }, [prefillText])

  const fetchVoices = useCallback(async (q: string) => {
    setLoadingVoices(true)
    try {
      const res = await fetch(`/api/voice-profiles?q=${encodeURIComponent(q)}&limit=20`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const profiles = data.profiles ?? []
      
      // Map to FlatVoice format with unique keys
      const flat: FlatVoice[] = profiles.map((p: any, index: number) => ({
        voice_id: p.voice_id,
        label: p.name,
        character: p.character,
        image_url: p.image_url,
        preview_url: p.preview_url || '',
        uniqueKey: `${p.voice_id}-${p.character}-${index}`, // Ensure uniqueness
      }))
      
      console.log('Loaded voices:', flat.map(v => ({ id: v.voice_id, key: v.uniqueKey, label: v.label })))
      
      setFlatVoices(flat)
      
      // Only auto-select first voice on initial load
      if (!hasAutoSelected.current && flat.length > 0) {
        console.log('Auto-selecting first voice:', flat[0].voice_id)
        setSelectedVoice(flat[0].voice_id)
        hasAutoSelected.current = true
      }
    } catch {
      toast.error('Failed to load voices')
    } finally {
      setLoadingVoices(false)
    }
  }, [])

  useEffect(() => { 
    fetchVoices('')
  }, [fetchVoices])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchVoices(search), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, fetchVoices])

  function togglePreview(voice: FlatVoice) {
    if (!voice.preview_url) return
    
    if (previewingId === voice.voice_id) {
      audioRef.current?.pause()
      setPreviewingId(null)
      return
    }
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(voice.preview_url)
    audio.onended = () => setPreviewingId(null)
    audio.onerror = () => {
      setPreviewingId(null)
      toast.error('Failed to play preview')
    }
    audio.play()
    audioRef.current = audio
    setPreviewingId(voice.voice_id)
  }

  useEffect(() => () => { audioRef.current?.pause() }, [])

  const selectedMeta = flatVoices.find(v => v.voice_id === selectedVoice)
  const textTooShort = text.trim().length < 50
  const textTooLong = text.trim().length > 500

  async function generateVoice() {
    if (textTooShort) { toast.error('Text must be at least 50 characters'); return }
    if (textTooLong) { toast.error('Text must be 500 characters or less'); return }
    if (!selectedVoice) { toast.error('Select a voice'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId, 
          text: text.trim(), 
          voiceId: selectedVoice, 
          sceneIndex 
        }),
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || err.detail || 'Failed to generate voice')
      }
      
      const data = await res.json()
      onVoiceGenerated(data.voice.audioUrl, data.voice.duration)
      toast.success('Voice generated successfully!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate voice')
      console.error('Voice generation error:', e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-[#0d0d16] border border-white/[0.06] rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Mic size={11} className="text-violet-400" />
        </div>
        <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Voice Generator</span>
      </div>

      {/* Narration text */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/40">Narration text</label>
          <span className={`text-xs ${textTooShort || textTooLong ? 'text-red-400' : 'text-white/20'}`}>
            {text.length}/500 {textTooShort && '(min 50)'}
          </span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={generating}
          rows={3}
          placeholder="Narration for this scene…"
          className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 resize-none transition disabled:opacity-50"
        />
      </div>

      {/* Voice search + list */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search character voices…"
            className="w-full pl-8 pr-7 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
              <X size={11} />
            </button>
          )}
        </div>

        <div className="max-h-44 overflow-y-auto space-y-1">
          {loadingVoices ? (
            <div className="flex items-center justify-center gap-2 py-6 text-white/30">
              <Loader2 size={13} className="animate-spin" />
              <span className="text-xs">Loading voices…</span>
            </div>
          ) : flatVoices.length === 0 ? (
            <p className="text-center py-6 text-xs text-white/25">
              {search ? `No characters found for "${search}"` : 'No characters found'}
            </p>
          ) : (
            flatVoices.map(voice => {
              const isSelected = selectedVoice === voice.voice_id
              const isPreviewing = previewingId === voice.voice_id
              return (
                <div
                  key={voice.uniqueKey} // Use uniqueKey instead of voice_id
                  onClick={() => {
                    console.log('Clicked voice:', voice.voice_id, 'Currently selected:', selectedVoice)
                    setSelectedVoice(voice.voice_id)
                  }}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition group ${
                    isSelected 
                      ? 'bg-violet-600/15 border border-violet-500/30' 
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <img 
                    src={voice.image_url} 
                    alt={voice.character}
                    className="w-7 h-7 rounded-md object-cover shrink-0 bg-white/5" 
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} 
                  />
                  <span className="flex-1 text-xs text-white/70 truncate">{voice.label}</span>
                  
                  {voice.preview_url && (
                    <button
                      onClick={e => { e.stopPropagation(); togglePreview(voice) }}
                      className={`shrink-0 w-5 h-5 rounded flex items-center justify-center transition ${
                        isPreviewing 
                          ? 'bg-violet-500/30 text-violet-300' 
                          : 'opacity-0 group-hover:opacity-100 bg-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {isPreviewing ? <Pause size={9} /> : <Play size={9} />}
                    </button>
                  )}
                  
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                </div>
              )
            })
          )}
        </div>

        {selectedMeta && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-violet-600/10 border border-violet-500/20 rounded-lg">
            <img 
              src={selectedMeta.image_url} 
              alt="" 
              className="w-4 h-4 rounded object-cover" 
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-xs text-violet-300 truncate">{selectedMeta.label}</span>
          </div>
        )}
      </div>

      <button
        onClick={generateVoice}
        disabled={generating || textTooShort || textTooLong || !selectedVoice}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded-lg transition"
      >
        {generating ? (
          <><Loader2 size={12} className="animate-spin" /> Generating…</>
        ) : (
          <><Volume2 size={12} /> Generate Voice</>
        )}
      </button>
    </div>
  )
}