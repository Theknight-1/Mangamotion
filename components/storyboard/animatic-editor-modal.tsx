"use client";

import { useState, useEffect, useRef } from "react";
import {
  Film,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Loader2,
  Mic,
  Music,
  Download,
  X,
  Sliders,
  Maximize2,
  Layers,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi } from "@/lib/api";
import { STORYBOARD_VOICES, DEFAULT_STORYBOARD_VOICE_ID } from "@/lib/storyboard/ai/voice";
import type { StoryboardShot, StoryboardScene } from "@/types/storyboard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shots: StoryboardShot[];
  scenes: StoryboardScene[];
  projectId: string;
  onSceneUpdated?: () => void;
}

export function AnimaticEditorModal({
  isOpen,
  onClose,
  shots,
  scenes,
  projectId,
  onSceneUpdated,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Voiceover Generation Controls
  const [voiceMode, setVoiceMode] = useState<"scene" | "shot">("scene");
  const [selectedVoiceId, setSelectedVoiceId] = useState(DEFAULT_STORYBOARD_VOICE_ID);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [editableNarration, setEditableNarration] = useState("");
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  // Audio Playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const currentShot = shots[currentIndex] || shots[0];
  const currentScene = scenes.find((s) => s.id === currentShot?.sceneId) || scenes[0];

  // Sync narration text with current scene/shot
  useEffect(() => {
    if (voiceMode === "scene") {
      setEditableNarration(currentScene?.narrationText || "");
    } else {
      setEditableNarration(currentShot?.dialogue || currentShot?.description || "");
    }
  }, [currentIndex, currentScene?.id, voiceMode]);

  // Audio sync with scene voice
  useEffect(() => {
    if (audioRef.current && currentScene?.voiceAudioUrl) {
      audioRef.current.src = currentScene.voiceAudioUrl;
      audioRef.current.load();
    }
  }, [currentScene?.voiceAudioUrl]);

  // Timer loop for animatic auto-play when audio is not playing
  useEffect(() => {
    if (!isPlaying) return;

    const currentDurationSec = currentShot?.duration || currentShot?.estDuration || 3;
    const intervalMs = (currentDurationSec * 1000) / playbackSpeed;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => {
        if (prev >= shots.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, shots.length, currentShot, playbackSpeed]);

  if (!isOpen || shots.length === 0) return null;

  const handleGenerateVoice = async () => {
    if (!editableNarration.trim()) {
      toast.error("Please enter narration or dialogue text first");
      return;
    }

    if (!currentScene) {
      toast.error("No scene associated with this shot");
      return;
    }

    setIsGeneratingVoice(true);
    try {
      toast.loading("Synthesizing studio voiceover...", { id: "voice-toast" });
      const res = await storyboardApi.generateSceneVoice(currentScene.id, {
        narrationText: editableNarration.trim(),
        voiceId: selectedVoiceId,
        speed: voiceSpeed,
      });

      if (res.audioUrl && audioRef.current) {
        audioRef.current.src = res.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }

      onSceneUpdated?.();
      toast.success("Voiceover generated and synced!", { id: "voice-toast" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate voiceover", { id: "voice-toast" });
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleTogglePlay = () => {
    const nextPlayState = !isPlaying;
    setIsPlaying(nextPlayState);

    if (audioRef.current && currentScene?.voiceAudioUrl) {
      if (nextPlayState) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-xl">
      {/* Hidden Audio Player Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime);
            setAudioDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
        }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3.5 bg-[#080d08]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3]">
            <Film size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">
              Animatic Timeline Studio
            </h2>
            <p className="text-[10px] text-white/50">
              Shot {currentIndex + 1} of {shots.length} · Scene:{" "}
              <span className="text-[#e8d5a3]">
                {currentScene?.title || "Scene 1"}
              </span>
            </p>
          </div>
        </div>

        {/* Center timecode display */}
        <div className="hidden md:flex items-center gap-2 rounded-md border border-white/10 bg-black/50 px-3 py-1 font-mono text-xs text-[#c9a84c]">
          <span>00:0{currentIndex + 1}:00</span>
          <span className="text-white/30">/</span>
          <span className="text-white/60">00:0{shots.length}:00</span>
        </div>

        {/* Right close & export */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Workspace (Preview + Voice Panel) */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* Left / Center Preview Canvas (8 cols) */}
        <div className="relative flex flex-col items-center justify-center bg-black/90 p-6 lg:col-span-8 overflow-hidden">
          {/* Main Visual Display */}
          <div className="relative flex aspect-video max-h-[58vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-md border border-white/15 bg-[#050905] shadow-2xl shadow-black/80">
            {currentShot?.generatedImageUrl ? (
              <img
                src={currentShot.generatedImageUrl}
                alt={currentShot.description}
                className="h-full w-full object-contain transition duration-500"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-white/30">
                <Film size={32} className="text-white/20 mb-2" />
                <p className="text-xs font-semibold text-white/50">
                  No illustration generated for this shot
                </p>
                <p className="text-[10px] text-white/30 mt-1">
                  Generate keyframe in the studio board to preview visual animatic
                </p>
              </div>
            )}

            {/* Subtitle / Dialogue Overlay */}
            {(currentShot?.dialogue || currentShot?.description) && (
              <div className="absolute bottom-4 inset-x-6 mx-auto max-w-2xl rounded-md bg-black/80 p-3 text-center backdrop-blur-md border border-white/15 shadow-xl">
                {currentShot.dialogue ? (
                  <p className="text-xs font-bold text-[#e8d5a3] italic">
                    &ldquo;{currentShot.dialogue}&rdquo;
                  </p>
                ) : (
                  <p className="text-[11px] text-white/80 line-clamp-2">
                    {currentShot.description}
                  </p>
                )}
              </div>
            )}

            {/* Shot Framing Overlay Badges */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              <span className="rounded bg-black/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#c9a84c] backdrop-blur-sm border border-white/10">
                {currentShot?.shotType || "Medium"}
              </span>
              <span className="rounded bg-black/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/70 backdrop-blur-sm border border-white/10">
                {currentShot?.cameraAngle || "Eye-level"}
              </span>
            </div>
          </div>

          {/* Playback Controls Toolbar */}
          <div className="mt-4 flex w-full max-w-2xl items-center justify-between rounded-md border border-white/10 bg-[#080d08] px-4 py-2 text-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex h-8 w-8 items-center justify-center rounded text-white/50 transition hover:bg-white/5 hover:text-white disabled:opacity-20"
                title="Previous Shot"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={handleTogglePlay}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] text-black shadow-md shadow-[#c9a84c]/20 hover:scale-105 transition"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(shots.length - 1, prev + 1))
                }
                disabled={currentIndex === shots.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded text-white/50 transition hover:bg-white/5 hover:text-white disabled:opacity-20"
                title="Next Shot"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Playback Speed selector */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[10px] text-white/40 uppercase mr-1">Speed:</span>
              {[0.75, 1, 1.25, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                    playbackSpeed === spd
                      ? "bg-[#c9a84c] text-black"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Volume toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const muted = !isMuted;
                  setIsMuted(muted);
                  if (audioRef.current) audioRef.current.muted = muted;
                }}
                className="text-white/50 hover:text-white"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  setIsMuted(v === 0);
                  if (audioRef.current) {
                    audioRef.current.volume = v;
                    audioRef.current.muted = v === 0;
                  }
                }}
                className="h-1 w-16 accent-[#c9a84c] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Studio Voiceover & Sound Panel (4 cols) */}
        <div className="flex flex-col border-t border-white/10 bg-[#090f09] p-5 lg:col-span-4 lg:border-t-0 lg:border-l overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Mic size={15} className="text-[#c9a84c]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Voiceover &amp; Audio Studio
              </h3>
            </div>
            <span className="rounded bg-[#87da70]/10 px-2 py-0.5 text-[10px] font-bold text-[#87da70] border border-[#87da70]/30">
              AI Speech
            </span>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            {/* Mode Toggle: Scene Narration vs Shot Dialogue */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                Voiceover Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVoiceMode("scene")}
                  className={`rounded-md border p-2 text-left transition ${
                    voiceMode === "scene"
                      ? "border-[#c9a84c] bg-[#c9a84c]/10 text-white"
                      : "border-white/10 bg-black/40 text-white/40 hover:border-white/20"
                  }`}
                >
                  <p className="font-bold text-[11px]">Scene Narration</p>
                  <p className="text-[9px] text-white/40">Plays across all scene shots</p>
                </button>

                <button
                  type="button"
                  onClick={() => setVoiceMode("shot")}
                  className={`rounded-md border p-2 text-left transition ${
                    voiceMode === "shot"
                      ? "border-[#c9a84c] bg-[#c9a84c]/10 text-white"
                      : "border-white/10 bg-black/40 text-white/40 hover:border-white/20"
                  }`}
                >
                  <p className="font-bold text-[11px]">Shot Dialogue</p>
                  <p className="text-[9px] text-white/40">Lines for current shot</p>
                </button>
              </div>
            </div>

            {/* Narrator Voice Actor Picker */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                Narrator Voice Profile
              </label>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 px-2.5 py-2 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
              >
                {STORYBOARD_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>

            {/* Narration Script Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  {voiceMode === "scene" ? "Scene Narration Script" : "Shot Dialogue"}
                </label>
                <span className="text-[10px] text-white/30">
                  {editableNarration.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                value={editableNarration}
                onChange={(e) => setEditableNarration(e.target.value)}
                placeholder="Enter narration text to generate spoken voiceover..."
                className="w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder:text-white/20 focus:border-[#c9a84c]/50 focus:outline-none"
              />
            </div>

            {/* Voice Speed Slider */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                <span className="font-bold uppercase tracking-wider">Voice Pacing</span>
                <span>{voiceSpeed}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-full h-1 accent-[#c9a84c] cursor-pointer"
              />
            </div>

            {/* Generate Voice Button */}
            <button
              type="button"
              onClick={handleGenerateVoice}
              disabled={isGeneratingVoice}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] py-2.5 text-xs font-bold text-[#060e06] shadow-md shadow-[#c9a84c]/20 hover:scale-[1.01] transition disabled:opacity-50"
            >
              {isGeneratingVoice ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generating Voiceover...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Synthesize &amp; Sync Voice
                </>
              )}
            </button>

            {/* Audio Track Status */}
            {currentScene?.voiceAudioUrl && (
              <div className="rounded-md border border-[#87da70]/20 bg-[#87da70]/5 p-3">
                <div className="flex items-center justify-between text-[11px] text-[#87da70] font-semibold mb-1">
                  <span>Synced Scene Audio Track</span>
                  <span>{Math.round(audioDuration)}s</span>
                </div>
                <div className="h-1 w-full rounded bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#87da70] transition-all"
                    style={{
                      width: `${audioDuration ? (audioProgress / audioDuration) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Filmstrip Timeline */}
      <div className="border-t border-white/10 bg-[#060a06] p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            Filmstrip Timeline · {shots.length} Keyframes
          </span>
          <span className="text-[10px] text-white/30">
            Click shot to jump playhead
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {shots.map((shot, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={shot.id}
                onClick={() => setCurrentIndex(idx)}
                className={`group relative flex h-20 w-32 shrink-0 flex-col overflow-hidden rounded border transition-all ${
                  isSelected
                    ? "border-[#c9a84c] ring-2 ring-[#c9a84c]/50 shadow-lg"
                    : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                }`}
              >
                {shot.generatedImageUrl ? (
                  <img
                    src={shot.generatedImageUrl}
                    alt={`Shot ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black/40 text-[9px] text-white/30">
                    Shot {idx + 1}
                  </div>
                )}

                <div className="absolute top-1 left-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-mono font-bold text-white">
                  #{idx + 1}
                </div>

                <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-mono text-white/70">
                  {shot.duration || 3}s
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
