'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  Volume2,
  Search,
  Play,
  Pause,
  Loader2,
  X,
  Check,
} from "lucide-react";
import toast from 'react-hot-toast'
import { requestQueue, createQueueKey } from "@/lib/request-queue";

interface VoiceGeneratorProps {
  videoId: string
  sceneIndex: number
  prefillText?: string
  onVoiceGenerated: (audioUrl: string, duration: number) => void
}

interface FlatVoice {
  voice_id: string;
  label: string;
  character: string;
  image_url: string;
  preview_url: string;
  uniqueKey: string;
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

  useEffect(() => { setText(prefillText) }, [prefillText])

  const fetchVoices = useCallback(async (q: string) => {
    setLoadingVoices(true)
    try {
      const res = await fetch(`/api/voice-profiles?q=${encodeURIComponent(q)}&limit=20`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const profiles = data.profiles ?? []
      
      const flat: FlatVoice[] = profiles.map((p: any, index: number) => ({
        voice_id: p.voice_id,
        label: p.name,
        character: p.character,
        image_url: p.image_url,
        preview_url: p.preview_url || "",
        uniqueKey: `${p.voice_id}-${p.character}-${index}`,
      }));

      setFlatVoices(flat);
      
      if (!hasAutoSelected.current && flat.length > 0) {
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
    
    setGenerating(true);

    const queueKey = createQueueKey("voice-gen", {
      videoId,
      sceneIndex,
      voiceId: selectedVoice,
      textHash: text.trim().length,
    });

    try {
      const data = await requestQueue.enqueue(queueKey, async () => {
        const res = await fetch("/api/generate-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            text: text.trim(),
            voiceId: selectedVoice,
            sceneIndex,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(
            err.error || err.detail || "Failed to generate voice",
          );
        }

        return await res.json();
      });

      onVoiceGenerated(data.voice.audioUrl, data.voice.duration);
      toast.success("Voice generated successfully!");
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate voice')
      console.error('Voice generation error:', e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-3 space-y-5 shadow-2xl shadow-black/40">
      {/* Premium Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Mic
              size={14}
              className="animate-pulse"
              style={{ animationDuration: "3s" }}
            />
          </div>
          <div>
            <h3 className=" font-semibold text-zinc-100 tracking-tight">
              Voice Over Studio
            </h3>
          </div>
        </div>
      </div>

      {/* Step 1: Voice Character Grid Selector */}
      <div className="space-y-2.5">
        {/* Refined Search Bar */}
        <div className="relative ">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter characters..."
            className="w-full pl-7 pr-6 py-2 bg-zinc-900/60 border border-zinc-800 rounded-sm text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition focus:ring-1 focus:ring-violet-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Visual Avatar Grid instead of flat table row list */}
        <div className="max-h-66 overflow-y-auto pr-1 hide-scrollbar">
          {loadingVoices ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-500">
              <Loader2 size={16} className="animate-spin text-violet-400" />
              <span className="text-xs font-medium">
                Sourcing voice templates...
              </span>
            </div>
          ) : flatVoices.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500">
                {search
                  ? `No character matching "${search}"`
                  : "No voice models configured"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {flatVoices.map((voice) => {
                const isSelected = selectedVoice === voice.voice_id;
                const isPreviewing = previewingId === voice.voice_id;

                return (
                  <div
                    key={voice.uniqueKey}
                    onClick={() => setSelectedVoice(voice.voice_id)}
                    className={`group relative flex items-center gap-2.5 p-2 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-violet-950/20 border-violet-500/40 ring-1 ring-violet-500/30"
                        : "bg-zinc-900/40 border-zinc-800/70 hover:border-zinc-700 hover:bg-zinc-900/80"
                    }`}
                  >
                    {/* Character Face Thumbnail */}
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700/50">
                      <img
                        src={voice.image_url}
                        alt={voice.character}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center backdrop-blur-[0.5px]">
                          <div className="p-0.5 bg-violet-500 rounded-full text-white shadow-md">
                            <Check size={8} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 leading-tight">
                      <p
                        className={`text-xs font-medium truncate ${isSelected ? "text-violet-300" : "text-zinc-200"}`}
                      >
                        {voice.label}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {voice.character || "Voice Model"}
                      </p>
                    </div>

                    {/* Integrated Micro-Audio Preview Button */}
                    {voice.preview_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePreview(voice);
                        }}
                        className={`absolute right-2 shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                          isPreviewing
                            ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                            : "opacity-0 group-hover:opacity-100 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                        }`}
                        title="Listen preview sample"
                      >
                        {isPreviewing ? (
                          <Pause size={10} fill="currentColor" />
                        ) : (
                          <Play
                            size={10}
                            fill="currentColor"
                            className="ml-0.5"
                          />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Content Input Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-400">
            2. Narration Script
          </label>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              textTooShort || textTooLong
                ? "bg-red-500/10 text-red-400"
                : "bg-zinc-900 text-zinc-500"
            }`}
          >
            {text.length}/500 {textTooShort && " (min 50)"}
          </span>
        </div>

        <div className="relative group rounded-xl border border-zinc-800 bg-zinc-900/30 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={generating}
            rows={4}
            placeholder="Type or paste the speech dialogue script here (minimum 50 characters required for natural inflection processing)..."
            className="w-full px-3.5 py-3 bg-transparent rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed disabled:opacity-40 hide-scrollbar"
          />

          {/* Elegant Context-Aware Active Banner */}
          {selectedMeta && (
            <div className="flex items-center justify-between border-t border-zinc-800/60 px-3 py-1.5 bg-zinc-950/40 rounded-b-xl text-[10px]">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Configured Actor:</span>
                <span className="text-zinc-200 font-medium">
                  {selectedMeta.label}
                </span>
              </div>
              <span className="text-zinc-500 italic">TTS Engine v2</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={generateVoice}
        disabled={generating || textTooShort || textTooLong || !selectedVoice}
        className="w-full relative overflow-hidden group flex items-center justify-center gap-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-2.5 rounded-lg transition shadow-lg shadow-violet-950/20 active:scale-[0.99]"
      >
        {generating ? (
          <>
            <Loader2 size={13} className="animate-spin text-zinc-200" />
            <span className="tracking-wide">Synthesizing audio nodes...</span>
          </>
        ) : (
          <>
            <Volume2
              size={13}
              className="group-hover:scale-110 transition-transform"
            />
            <span>Generate Spatial Audio</span>
          </>
        )}
      </button>
    </div>
  );
}