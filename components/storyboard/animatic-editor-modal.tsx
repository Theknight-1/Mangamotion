"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Film,
  Video,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Scissors,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  Mic,
  X,
  Trash2,
  Users,
  AudioLines,
  Zap,
  Plus,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Sliders,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi } from "@/lib/api";
import {
  STORYBOARD_VOICES,
  DEFAULT_STORYBOARD_VOICE_ID,
} from "@/lib/storyboard/ai/voice";
import type {
  StoryboardShot,
  StoryboardScene,
  StoryboardCharacter,
} from "@/types/storyboard";
import { Button } from "../loader-button";

/* ------------------------------------------------------------------ */
/*  Types & Interfaces                                                 */
/* ------------------------------------------------------------------ */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  shots: StoryboardShot[];
  scenes: StoryboardScene[];
  projectId: string;
  onSceneUpdated?: () => void;
  onShotUpdated?: () => void;
}

interface TimelineShot extends StoryboardShot {
  sceneOrderIndex: number;
  sceneTitle: string;
  flatIndex: number;
  calculatedDuration: number;
  startTime: number;
  endTime: number;
  sceneId: string;
}

interface TimelineScene extends StoryboardScene {
  calculatedDuration: number;
  startTime: number;
  endTime: number;
  shots: TimelineShot[];
}

type VoiceAssignment = Record<string, string>; // characterId -> voiceId

interface BatchProgress {
  current: number;
  total: number;
  shotName: string;
}

/* ------------------------------------------------------------------ */
/*  Helper: Auto-assign voices to characters by gender/archetype      */
/* ------------------------------------------------------------------ */
function autoAssignCharacterVoices(
  characters: StoryboardCharacter[],
): VoiceAssignment {
  const assignments: VoiceAssignment = {};
  const maleVoices = STORYBOARD_VOICES.filter((v) => v.gender === "male");
  const femaleVoices = STORYBOARD_VOICES.filter((v) => v.gender === "female");
  let maleIdx = 0;
  let femaleIdx = 0;
  let fallbackIdx = 0;

  for (const char of characters) {
    const desc =
      `${char.name} ${char.description || ""} ${char.clothing || ""}`.toLowerCase();
    const isFemale =
      /\b(female|woman|girl|lady|queen|princess|she|her|mother|sister|daughter|heroine|actress|witch)\b/i.test(
        desc,
      );
    const isMale =
      /\b(male|man|boy|king|prince|he|him|father|brother|son|warrior|guy|hero|actor|knight|wizard)\b/i.test(
        desc,
      );

    if (isFemale && femaleVoices.length > 0) {
      assignments[char.id] = femaleVoices[femaleIdx % femaleVoices.length].id;
      femaleIdx++;
    } else if (isMale && maleVoices.length > 0) {
      assignments[char.id] = maleVoices[maleIdx % maleVoices.length].id;
      maleIdx++;
    } else {
      assignments[char.id] =
        STORYBOARD_VOICES[fallbackIdx % STORYBOARD_VOICES.length].id;
      fallbackIdx++;
    }
  }

  return assignments;
}

/* ------------------------------------------------------------------ */
/*  Helper: Render dynamic speech SVG Waveform                         */
/* ------------------------------------------------------------------ */
function SpeechWaveform({
  active,
  duration,
}: {
  active: boolean;
  duration: number;
}) {
  const pointsCount = Math.max(20, Math.min(100, Math.floor(duration * 10)));
  const pathD = useMemo(() => {
    let d = "M 0 16";
    for (let i = 0; i <= pointsCount; i++) {
      const x = (i / pointsCount) * 100;
      const envelope = Math.sin((i / pointsCount) * Math.PI);
      const wave1 = Math.sin(i * 0.8) * 8 * envelope;
      const wave2 = Math.cos(i * 1.7) * 5 * envelope;
      const wave3 = Math.sin(i * 3.1) * 3 * envelope;
      const y = 16 + wave1 + wave2 + wave3;
      d += ` L ${x.toFixed(1)} ${Math.max(4, Math.min(28, y)).toFixed(1)}`;
    }
    return d;
  }, [pointsCount]);

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="h-6 w-full pointer-events-none"
    >
      <path
        d={pathD}
        fill="none"
        stroke={active ? "#7dd3fc" : "#38bdf8"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-opacity duration-300 ${
          active ? "opacity-95" : "opacity-60"
        }`}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function AnimaticEditorModal({
  isOpen,
  onClose,
  shots,
  scenes,
  projectId,
  onSceneUpdated,
  onShotUpdated,
}: Props) {
  /* ---- Scale & Layout ---- */
  const [pxPerSec, setPxPerSec] = useState<number>(24);

  /* ---- Playback State ---- */
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);

  /* ---- Voice Studio State ---- */
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    DEFAULT_STORYBOARD_VOICE_ID,
  );
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatingShotId, setGeneratingShotId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null,
  );

  /* ---- Characters & Auto Voice Mapping ---- */
  const [characters, setCharacters] = useState<StoryboardCharacter[]>([]);
  const [voiceAssignments, setVoiceAssignments] = useState<VoiceAssignment>({});
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  /* ---- Audio & Timeline DOM References ---- */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  /* ---- Drag-to-Scroll Refs for Mouse Scrolling ---- */
  const isDraggingTimelineRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollLeftRef = useRef<number>(0);

  /* ---- 1. Build Timeline Model with Per-Shot Audio & Synchronized Durations ---- */
  const { timelineScenes, timelineShots, totalDuration } = useMemo(() => {
    const sceneMap = new Map(scenes.map((s) => [s.id, s]));

    // Group shots by scene
    const shotsByScene = new Map<string, StoryboardShot[]>();
    for (const shot of shots) {
      const sId = shot.sceneId || "__unassigned__";
      if (!shotsByScene.has(sId)) shotsByScene.set(sId, []);
      shotsByScene.get(sId)!.push(shot);
    }

    // Sort shots in each scene by orderIndex
    for (const [, list] of shotsByScene) {
      list.sort(
        (a, b) =>
          (a.orderIndex ?? a.order ?? 0) - (b.orderIndex ?? b.order ?? 0),
      );
    }

    // Sort scenes by orderIndex
    const sortedScenes = [...scenes].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    );

    let cumulativeTime = 0;
    let flatIdx = 0;
    const computedScenes: TimelineScene[] = [];
    const computedShots: TimelineShot[] = [];

    for (const scene of sortedScenes) {
      const sceneShots = shotsByScene.get(scene.id) || [];
      const sceneStart = cumulativeTime;
      const sceneTimelineShots: TimelineShot[] = [];
      let shotTimeCursor = sceneStart;

      for (let i = 0; i < sceneShots.length; i++) {
        const s = sceneShots[i];
        // Per-shot duration: if shot has generated audio, use exact audio duration; else fallback
        const shotDur = Math.max(1.5, s.duration || s.estDuration || 3);
        const sStart = shotTimeCursor;
        const sEnd = sStart + shotDur;
        shotTimeCursor = sEnd;

        const timelineShot: TimelineShot = {
          ...s,
          sceneOrderIndex: scene.orderIndex ?? 0,
          sceneTitle: scene.title || `Scene ${(scene.orderIndex ?? 0) + 1}`,
          flatIndex: flatIdx++,
          calculatedDuration: shotDur,
          startTime: sStart,
          endTime: sEnd,
          sceneId: scene.id,
        };

        sceneTimelineShots.push(timelineShot);
        computedShots.push(timelineShot);
      }

      const sceneEnd = shotTimeCursor;
      const sceneDur = Math.max(2, sceneEnd - sceneStart);

      computedScenes.push({
        ...scene,
        calculatedDuration: sceneDur,
        startTime: sceneStart,
        endTime: sceneEnd,
        shots: sceneTimelineShots,
      });

      cumulativeTime = sceneEnd;
    }

    // Handle any shots not assigned to a scene
    const unassignedShots = shotsByScene.get("__unassigned__") || [];
    if (unassignedShots.length > 0) {
      for (const s of unassignedShots) {
        const shotDur = Math.max(1.5, s.duration || s.estDuration || 3);
        const sStart = cumulativeTime;
        const sEnd = sStart + shotDur;
        cumulativeTime = sEnd;

        computedShots.push({
          ...s,
          sceneOrderIndex: 999,
          sceneTitle: "Unassigned",
          flatIndex: flatIdx++,
          calculatedDuration: shotDur,
          startTime: sStart,
          endTime: sEnd,
          sceneId: "__unassigned__",
        });
      }
    }

    return {
      timelineScenes: computedScenes,
      timelineShots: computedShots,
      totalDuration: Math.max(8, cumulativeTime),
    };
  }, [shots, scenes]);

  /* ---- 2. Find Current Active Shot & Scene from Playhead ---- */
  const activeShot = useMemo(() => {
    if (timelineShots.length === 0) return null;
    const found = timelineShots.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime,
    );
    return found || timelineShots[timelineShots.length - 1];
  }, [currentTime, timelineShots]);

  const activeScene = useMemo(() => {
    if (timelineScenes.length === 0) return null;
    const found = timelineScenes.find(
      (sc) => currentTime >= sc.startTime && currentTime < sc.endTime,
    );
    return found || timelineScenes[timelineScenes.length - 1];
  }, [currentTime, timelineScenes]);

  /* ---- 3. Load Characters & Automatic Voice Assignment ---- */
  useEffect(() => {
    if (!isOpen || !projectId) return;
    storyboardApi
      .getCharacters(projectId)
      .then((res) => {
        const chars = res.characters || [];
        setCharacters(chars);
        const autoAssigned = autoAssignCharacterVoices(chars);
        setVoiceAssignments(autoAssigned);
      })
      .catch(() => {});
  }, [isOpen, projectId]);

  /* ---- 4. Reset on Open / Cleanup on Close (NO AUTOPLAY) ---- */
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }
      return;
    }

    // Modal opened: guarantee paused state
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isOpen]);

  /* ---- 5. Synchronize Audio Player with Active Shot Audio ---- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Use shot-level audio if present; fallback to scene audio
    const targetAudioUrl =
      activeShot?.voiceAudioUrl ||
      (activeScene?.voiceAudioUrl && !activeShot?.voiceAudioUrl
        ? activeScene.voiceAudioUrl
        : null);

    if (!targetAudioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      return;
    }

    const shotOffset = activeShot?.voiceAudioUrl
      ? Math.max(0, currentTime - activeShot.startTime)
      : Math.max(0, currentTime - (activeScene?.startTime || 0));

    if (audio.src !== targetAudioUrl) {
      audio.src = targetAudioUrl;
      audio.currentTime = shotOffset;
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    } else {
      if (Math.abs(audio.currentTime - shotOffset) > 0.35) {
        audio.currentTime = shotOffset;
      }
    }
  }, [
    activeShot?.id,
    activeShot?.voiceAudioUrl,
    activeScene?.id,
    activeScene?.voiceAudioUrl,
  ]);

  /* ---- 6. Playhead Animation Loop ---- */
  useEffect(() => {
    let animationFrameId: number;

    if (isPlaying) {
      lastTickTimeRef.current = performance.now();

      const tick = (now: number) => {
        const deltaSec =
          ((now - lastTickTimeRef.current) / 1000) * playbackSpeed;
        lastTickTimeRef.current = now;

        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          if (next >= totalDuration) {
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
            return 0;
          }
          return next;
        });

        animationFrameId = requestAnimationFrame(tick);
      };

      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, playbackSpeed, totalDuration]);

  /* ---- 7. Audio Play/Pause Sync Handler ---- */
  const togglePlay = useCallback(() => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    const audio = audioRef.current;
    if (!audio) return;

    if (nextState) {
      const targetAudioUrl =
        activeShot?.voiceAudioUrl || activeScene?.voiceAudioUrl;
      if (targetAudioUrl) {
        const offset = activeShot?.voiceAudioUrl
          ? Math.max(0, currentTime - activeShot.startTime)
          : Math.max(0, currentTime - (activeScene?.startTime || 0));
        audio.currentTime = offset;
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, activeShot, activeScene, currentTime]);

  /* ---- 8. Timeline Scrubbing / Seeking ---- */
  const handleSeekToTime = useCallback(
    (targetTime: number) => {
      const clamped = Math.max(0, Math.min(totalDuration, targetTime));
      setCurrentTime(clamped);

      const targetShot = timelineShots.find(
        (s) => clamped >= s.startTime && clamped < s.endTime,
      );
      const targetScene = timelineScenes.find(
        (sc) => clamped >= sc.startTime && clamped < sc.endTime,
      );

      const audio = audioRef.current;
      if (audio) {
        const targetAudioUrl =
          targetShot?.voiceAudioUrl || targetScene?.voiceAudioUrl;
        if (targetAudioUrl) {
          const offset = targetShot?.voiceAudioUrl
            ? Math.max(0, clamped - targetShot.startTime)
            : Math.max(0, clamped - (targetScene?.startTime || 0));
          if (audio.src !== targetAudioUrl) {
            audio.src = targetAudioUrl;
          }
          audio.currentTime = offset;
          if (isPlaying) audio.play().catch(() => {});
        } else {
          audio.pause();
          audio.removeAttribute("src");
        }
      }
    },
    [totalDuration, timelineShots, timelineScenes, isPlaying],
  );

  /* ---- 9. Mouse Wheel & Mouse Drag Horizontal Scrolling ---- */
  const handleTimelineWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (timelineScrollRef.current) {
      // Horizontal scroll via vertical mouse wheel or trackpad
      timelineScrollRef.current.scrollLeft += e.deltaY * 1.2 + e.deltaX;
    }
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore interactive element clicks
    if ((e.target as HTMLElement).closest("button, select, input, a")) return;
    isDraggingTimelineRef.current = true;
    dragStartXRef.current =
      e.pageX - (timelineScrollRef.current?.offsetLeft || 0);
    dragStartScrollLeftRef.current = timelineScrollRef.current?.scrollLeft || 0;
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingTimelineRef.current || !timelineScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (timelineScrollRef.current.offsetLeft || 0);
    const walk = (x - dragStartXRef.current) * 1.5;
    timelineScrollRef.current.scrollLeft =
      dragStartScrollLeftRef.current - walk;
  };

  const handleTimelineMouseUp = () => {
    isDraggingTimelineRef.current = false;
  };

  /* ---- 10. Keyboard Shortcuts ---- */
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      )
        return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeekToTime(currentTime - 2);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeekToTime(currentTime + 2);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, togglePlay, handleSeekToTime, currentTime, onClose]);

  /* ---- 11. Per-Shot Voice Generation Handlers ---- */
  const handleGenerateShotVoice = async (shot: TimelineShot) => {
    const textToSpeak =
      shot.dialogue?.trim() ||
      shot.draftNarration?.trim() ||
      shot.description?.trim();

    if (!textToSpeak) {
      toast.error(`Shot ${shot.orderIndex + 1} has no dialogue or narration`);
      return;
    }

    // Determine voice: check character mapping first
    let voiceIdToUse = selectedVoiceId;
    if (shot.characterIds && shot.characterIds.length > 0) {
      const charId = shot.characterIds[0];
      if (voiceAssignments[charId]) {
        voiceIdToUse = voiceAssignments[charId];
      }
    }

    setGeneratingShotId(shot.id);
    try {
      toast.loading(
        `Synthesizing voice for Shot ${shot.sceneOrderIndex + 1}.${
          shot.orderIndex + 1
        }...`,
        { id: `voice-${shot.id}` },
      );

      await storyboardApi.generateShotVoice(shot.id, {
        text: textToSpeak,
        voiceId: voiceIdToUse,
      });

      onShotUpdated?.();
      toast.success(
        `Voice synthesized for Shot ${shot.sceneOrderIndex + 1}.${
          shot.orderIndex + 1
        }!`,
        { id: `voice-${shot.id}` },
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to generate shot voice", {
        id: `voice-${shot.id}`,
      });
    } finally {
      setGeneratingShotId(null);
    }
  };

  const handleDeleteShotVoice = async (shot: TimelineShot) => {
    try {
      await storyboardApi.updateShot(shot.id, {
        voiceAudioUrl: null,
      } as any);
      if (audioRef.current && activeShot?.id === shot.id) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }
      onShotUpdated?.();
      toast.success(
        `Removed voice track from Shot ${shot.sceneOrderIndex + 1}.${
          shot.orderIndex + 1
        }`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to remove voice");
    }
  };

  /* ---- 12. Batch Generate Audio for ALL SHOTS ---- */
  const handleGenerateAllAudio = async () => {
    if (timelineShots.length === 0) {
      toast.error("No shots available in storyboard");
      return;
    }

    setIsGeneratingVoice(true);
    let successCount = 0;

    for (let i = 0; i < timelineShots.length; i++) {
      const shot = timelineShots[i];
      const textToSpeak =
        shot.dialogue?.trim() ||
        shot.draftNarration?.trim() ||
        shot.description?.trim();

      if (!textToSpeak) continue;

      setBatchProgress({
        current: i + 1,
        total: timelineShots.length,
        shotName: `Shot ${shot.sceneOrderIndex + 1}.${shot.orderIndex + 1}`,
      });

      let voiceIdToUse = selectedVoiceId;
      if (shot.characterIds && shot.characterIds.length > 0) {
        const charId = shot.characterIds[0];
        if (voiceAssignments[charId]) {
          voiceIdToUse = voiceAssignments[charId];
        }
      }

      try {
        await storyboardApi.generateShotVoice(shot.id, {
          text: textToSpeak,
          voiceId: voiceIdToUse,
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to generate voice for Shot ${shot.id}:`, err);
        toast.error(
          `Shot ${shot.sceneOrderIndex + 1}.${shot.orderIndex + 1}: ${
            err.message
          }`,
        );
      }

      // Small delay between calls to respect CVoice rate limits
      if (i < timelineShots.length - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    setBatchProgress(null);
    setIsGeneratingVoice(false);
    onShotUpdated?.();
    onSceneUpdated?.();

    if (successCount === timelineShots.length) {
      toast.success(`Generated audio for all ${successCount} shots!`);
    } else {
      toast.success(
        `Generated audio for ${successCount}/${timelineShots.length} shots`,
      );
    }
  };

  if (!isOpen) return null;

  /* ---- Time Ruler Tick Array ---- */
  const rulerTicks = [];
  const maxRulerSec = Math.ceil(totalDuration) + 15;
  for (let s = 0; s <= maxRulerSec; s += 5) {
    rulerTicks.push(s);
  }

  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}.${ms}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0e11] text-white backdrop-blur-2xl select-none font-sans overflow-hidden">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => {
          if (currentTime >= totalDuration - 0.5) {
            setIsPlaying(false);
          }
        }}
      />

      {/* ================================================================ */}
      {/*  TOP APP HEADER BAR                                              */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5 bg-[#0e1215]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#7dd3fc]/20 to-[#38bdf8]/10 border border-[#7dd3fc]/30 text-[#7dd3fc]">
            <Film size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Animatic Timeline Studio
              <span className="rounded bg-[#7dd3fc]/15 px-1.5 py-0.2 text-[9px] font-mono text-[#7dd3fc] border border-[#7dd3fc]/30">
                PRO TIMELINE
              </span>
            </h2>
            <p className="text-[10px] text-white/50">
              {timelineShots.length} Shots · {timelineScenes.length} Scenes ·
              Total:{" "}
              <span className="font-mono text-[#7dd3fc]">
                {formatTimecode(totalDuration)}
              </span>
            </p>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Batch Generate All Audio (Per-Shot) */}
          <button
            onClick={handleGenerateAllAudio}
            disabled={isGeneratingVoice}
            className="flex items-center gap-1.5 rounded-md border border-[#7dd3fc]/40 bg-[#7dd3fc]/10 px-3 py-1.5 text-xs font-bold text-[#7dd3fc] hover:bg-[#7dd3fc]/20 transition disabled:opacity-50 shadow-sm shadow-[#7dd3fc]/10"
          >
            {isGeneratingVoice ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                {batchProgress
                  ? `Generating ${batchProgress.current}/${batchProgress.total}...`
                  : "Synthesizing Audio..."}
              </>
            ) : (
              <>
                <Zap size={13} />
                Generate All Audio ({timelineShots.length} Shots)
              </>
            )}
          </button>

          {/* Character Voices Drawer Toggle */}
          <button
            onClick={() => setShowVoicePanel(!showVoicePanel)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              showVoicePanel
                ? "border-[#7dd3fc] bg-[#7dd3fc]/15 text-[#7dd3fc]"
                : "border-white/10 text-white/70 hover:border-white/20 hover:text-white bg-white/5"
            }`}
          >
            <Users size={13} />
            Voices &amp; Actors
            {characters.length > 0 && (
              <span className="rounded-full bg-[#7dd3fc]/20 text-[#7dd3fc] text-[10px] px-1.5 py-0.2 font-mono">
                {characters.length}
              </span>
            )}
          </button>

          {/* Close Studio */}
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-1.5 border border-white text-white"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  MAIN WORKSPACE: CINEMA PREVIEW CANVAS & CONTROLS               */}
      {/* ================================================================ */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Cinema Screen Preview Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#07090b] p-4 relative overflow-hidden">
          {/* Main Visual Frame */}
          <div className="relative flex aspect-video h-[55vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/90">
            {activeShot?.generatedImageUrl ? (
              <img
                src={activeShot.generatedImageUrl}
                alt={activeShot.description}
                className="h-full w-full object-contain transition-all duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-white/30">
                <Film size={36} className="text-white/20 mb-2" />
                <p className="text-xs font-semibold text-white/60">
                  {activeShot
                    ? `Scene ${activeShot.sceneOrderIndex + 1} · Shot ${
                        activeShot.orderIndex + 1
                      }`
                    : "No Shot Selected"}
                </p>
                <p className="text-[10px] text-white/40 mt-1 max-w-xs">
                  {activeShot?.description ||
                    "Generate keyframes on the Storyboard to view illustrated animatic"}
                </p>
              </div>
            )}

            {/* Subtitle / Dialogue Banner Overlay */}
            {(activeShot?.dialogue || activeShot?.description) && (
              <div className="absolute bottom-4 inset-x-8 mx-auto max-w-2xl rounded-xl bg-black/85 p-3 text-center backdrop-blur-md border border-white/15 shadow-2xl">
                {activeShot.dialogue ? (
                  <p className="text-xs font-semibold text-[#7dd3fc] italic tracking-wide">
                    &ldquo;{activeShot.dialogue}&rdquo;
                  </p>
                ) : (
                  <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed">
                    {activeShot.description}
                  </p>
                )}
              </div>
            )}

            {/* Top Shot Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-bold text-[#7dd3fc] border border-white/15 backdrop-blur-md">
                S{(activeShot?.sceneOrderIndex ?? 0) + 1}.
                {(activeShot?.orderIndex ?? 0) + 1}
              </span>
              <span className="rounded-md bg-black/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/70 border border-white/10 backdrop-blur-md">
                {activeShot?.shotType || "Medium"}
              </span>
              <span className="rounded-md bg-black/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/70 border border-white/10 backdrop-blur-md">
                {activeShot?.cameraAngle || "Eye-level"}
              </span>
            </div>

            {/* Top Right Scene Title Badge */}
            {activeScene && (
              <div className="absolute top-3 right-3 rounded-md bg-black/80 px-2.5 py-1 font-mono text-[10px] text-white/80 border border-white/15 backdrop-blur-md">
                {activeScene.title}
              </div>
            )}
          </div>
        </div>

        {/* Character Voices Drawer Slide-over */}
        {showVoicePanel && (
          <div className="w-80 border-l border-white/10 bg-[#0d1114] flex flex-col z-20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0f1418]">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-[#7dd3fc]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Multi-User Voice Cast
                </h3>
              </div>
              <button
                onClick={() => setShowVoicePanel(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <p className="text-[11px] text-white/50 leading-snug">
                Each character is automatically assigned a unique voice actor
                profile based on their archetype.
              </p>

              {/* Default Narrator Voice */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic size={13} className="text-[#7dd3fc]" />
                    <span className="text-[11px] font-bold text-white">
                      Narrator (Default)
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-white/40">
                    Master
                  </span>
                </div>
                <select
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:border-[#7dd3fc] focus:outline-none"
                >
                  {STORYBOARD_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.tag})
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Character Voices */}
              {characters.length > 0 ? (
                characters.map((char) => (
                  <div
                    key={char.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-[#7dd3fc]/20 border border-[#7dd3fc]/40 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-[#7dd3fc]">
                          {char.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">
                          {char.name}
                        </p>
                        <p className="text-[9px] text-white/40 truncate">
                          {char.description || "Character"}
                        </p>
                      </div>
                    </div>

                    <select
                      value={voiceAssignments[char.id] || selectedVoiceId}
                      onChange={(e) =>
                        setVoiceAssignments((prev) => ({
                          ...prev,
                          [char.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs text-white focus:border-[#7dd3fc] focus:outline-none"
                    >
                      <option value="">Use Narrator Voice</option>
                      {STORYBOARD_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.tag})
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/30 space-y-2">
                  <Users size={24} className="mx-auto text-white/20" />
                  <p className="text-xs">No characters added yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/*  TIMELINE TOP CONTROLS BAR (Matches User Reference Image)        */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between border-t border-white/10 px-6 py-2 bg-[#12161a]">
        {/* Left Action Icons: Reset / Redo / Split */}
        <div className="flex items-center gap-3 text-white/60">
          <button
            onClick={() => handleSeekToTime(0)}
            className="p-1.5 rounded-md hover:bg-white/10 hover:text-white transition"
            title="Reset Playhead (0s)"
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-white/10 hover:text-white transition opacity-40 cursor-not-allowed"
            title="Redo"
          >
            <RotateCw size={16} />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-white/10 hover:text-white transition opacity-40 cursor-not-allowed"
            title="Split Clip"
          >
            <Scissors size={16} />
          </button>
        </div>

        {/* Center Main Transport Controls */}
        <div className="flex items-center gap-4">
          {/* Back 5s */}
          <button
            onClick={() => handleSeekToTime(currentTime - 5)}
            className="flex items-center justify-center h-8 w-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
            title="Back 5s"
          >
            <div className="relative flex items-center justify-center">
              <RotateCcw size={16} />
              <span className="absolute -bottom-2 text-[8px] font-bold font-mono">
                5
              </span>
            </div>
          </button>

          {/* Previous Shot */}
          <button
            onClick={() => {
              if (activeShot && activeShot.flatIndex > 0) {
                const prev = timelineShots[activeShot.flatIndex - 1];
                handleSeekToTime(prev.startTime);
              }
            }}
            className="flex items-center justify-center h-8 w-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
            title="Previous Keyframe (←)"
          >
            <SkipBack size={16} />
          </button>

          {/* BIG CIRCULAR SKY BLUE PLAY/PAUSE BUTTON */}
          <button
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7dd3fc] text-[#07121b] shadow-lg shadow-[#7dd3fc]/30 hover:scale-105 active:scale-95 transition-all"
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <Pause size={20} className="fill-[#07121b]" />
            ) : (
              <Play size={20} className="fill-[#07121b] ml-0.5" />
            )}
          </button>

          {/* Next Shot */}
          <button
            onClick={() => {
              if (
                activeShot &&
                activeShot.flatIndex < timelineShots.length - 1
              ) {
                const next = timelineShots[activeShot.flatIndex + 1];
                handleSeekToTime(next.startTime);
              }
            }}
            className="flex items-center justify-center h-8 w-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
            title="Next Keyframe (→)"
          >
            <SkipForward size={16} />
          </button>

          {/* Forward 5s */}
          <button
            onClick={() => handleSeekToTime(currentTime + 5)}
            className="flex items-center justify-center h-8 w-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
            title="Forward 5s"
          >
            <div className="relative flex items-center justify-center">
              <RotateCw size={16} />
              <span className="absolute -bottom-2 text-[8px] font-bold font-mono">
                5
              </span>
            </div>
          </button>
        </div>

        {/* Right Controls: Delete, Volume & Zoom */}
        <div className="flex items-center gap-3 text-white/60">
          {/* Zoom Slider */}
          <div className="hidden md:flex items-center gap-1.5 text-xs mr-2">
            <span className="text-[10px] text-white/40">Zoom</span>
            <input
              type="range"
              min={14}
              max={44}
              step={2}
              value={pxPerSec}
              onChange={(e) => setPxPerSec(parseInt(e.target.value))}
              className="h-1 w-16 accent-[#7dd3fc] cursor-pointer"
            />
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const m = !isMuted;
                setIsMuted(m);
                if (audioRef.current) audioRef.current.muted = m;
              }}
              className="p-1 rounded hover:text-white"
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
              className="h-1 w-14 accent-[#7dd3fc] cursor-pointer"
            />
          </div>

          {/* Delete active shot audio */}
          {activeShot?.voiceAudioUrl && (
            <button
              onClick={() => handleDeleteShotVoice(activeShot)}
              className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 transition"
              title="Delete audio for current shot"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/*  MULTI-TRACK TIMELINE WITH MOUSE WHEEL & DRAG SCROLLING          */}
      {/* ================================================================ */}
      <div className="relative border-t border-white/15 bg-[#0a0d10] flex flex-col overflow-hidden pb-4">
        {/* Scrollable Timeline Area with fixed left track headers */}
        <div
          ref={timelineScrollRef}
          onWheel={handleTimelineWheel}
          onMouseDown={handleTimelineMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={handleTimelineMouseUp}
          onMouseLeave={handleTimelineMouseUp}
          className="overflow-x-auto overflow-y-hidden select-none cursor-grab active:cursor-grabbing scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40"
          style={{ height: "190px" }}
        >
          <div
            className="relative min-w-full"
            style={{
              width: `${Math.max(
                typeof window !== "undefined" ? window.innerWidth : 1200,
                totalDuration * pxPerSec + 240,
              )}px`,
            }}
          >
            {/* ------------------------------------------------------------ */}
            {/*  TIME RULER (Top Ruler with seconds & dot ticks)             */}
            {/* ------------------------------------------------------------ */}
            <div
              className="relative h-8 border-b border-white/10 bg-[#0c1014] cursor-pointer flex items-center pl-16"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left - 64;
                if (clickX >= 0) {
                  handleSeekToTime(clickX / pxPerSec);
                }
              }}
            >
              {rulerTicks.map((sec) => {
                const leftPos = 64 + sec * pxPerSec;
                return (
                  <div
                    key={sec}
                    className="absolute flex flex-col items-start pointer-events-none"
                    style={{ left: `${leftPos}px` }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono font-medium text-white/50">
                        {sec}s
                      </span>
                      <span className="text-white/20 tracking-widest text-[8px]">
                        ····
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ------------------------------------------------------------ */}
            {/*  VERTICAL CYAN NEEDLE PLAYHEAD                               */}
            {/* ------------------------------------------------------------ */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-30 transition-none"
              style={{
                left: `${64 + currentTime * pxPerSec}px`,
              }}
            >
              {/* Top Diamond Indicator Badge */}
              <div className="relative -left-1/2 flex flex-col items-center">
                <div className="flex items-center gap-1 rounded bg-[#7dd3fc] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#07121b] shadow-md shadow-[#7dd3fc]/40">
                  <span>◆</span>
                  <span>{formatTimecode(currentTime)}</span>
                </div>
                {/* Vertical Cyan Needle Line running down all tracks */}
                <div className="w-[2px] h-[160px] bg-[#7dd3fc] shadow-[0_0_8px_#38bdf8]" />
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/*  TRACK 1: VIDEO TRACK (Visual Clips Proportional to Audio)   */}
            {/* ------------------------------------------------------------ */}
            <div className="flex items-center h-16 border-b border-white/5 py-1 relative">
              {/* Left Track Header Icon */}
              <div className="sticky left-0 z-20 flex h-full w-16 shrink-0 items-center justify-center bg-[#0e1317] border-r border-white/10 text-white/50">
                <Video size={18} />
              </div>

              {/* Video Clips Container */}
              <div className="flex items-center gap-1.5 pl-2 h-full">
                {timelineShots.map((shot) => {
                  const isSelected = activeShot?.id === shot.id;
                  const clipWidth = Math.max(
                    54,
                    shot.calculatedDuration * pxPerSec,
                  );

                  return (
                    <div
                      key={shot.id}
                      onClick={() => handleSeekToTime(shot.startTime)}
                      style={{ width: `${clipWidth}px` }}
                      className={`group relative h-12 shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border ${
                        isSelected
                          ? "border-[#7dd3fc] ring-2 ring-[#7dd3fc]/50 shadow-lg shadow-[#7dd3fc]/20"
                          : "border-white/15 bg-[#141a20] hover:border-white/40"
                      }`}
                    >
                      {/* Shot Thumbnail Background */}
                      {shot.generatedImageUrl ? (
                        <img
                          src={shot.generatedImageUrl}
                          alt={shot.description}
                          className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-white/5 to-white/10 text-[9px] text-white/40 font-mono">
                          Shot {shot.orderIndex + 1}
                        </div>
                      )}

                      {/* Top Left Shot Badge */}
                      <div className="absolute top-1 left-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-mono font-bold text-white/90 backdrop-blur-sm">
                        S{shot.sceneOrderIndex + 1}.{shot.orderIndex + 1}
                      </div>

                      {/* Bottom Right Duration Badge */}
                      <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-mono text-[#7dd3fc] backdrop-blur-sm">
                        {shot.calculatedDuration.toFixed(1)}s
                      </div>
                    </div>
                  );
                })}

                {/* Add Shot Button at end */}
                <button
                  onClick={() =>
                    toast("Add shot from storyboard board workspace")
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white transition"
                  title="Add Keyframe"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/*  TRACK 2: AUDIO TRACK (Per-Shot Voiceover & Sound Clips)     */}
            {/* ------------------------------------------------------------ */}
            <div className="flex items-center h-16 py-1 relative">
              {/* Left Track Header Icon */}
              <div className="sticky left-0 z-20 flex h-full w-16 shrink-0 items-center justify-center bg-[#0e1317] border-r border-white/10 text-white/50">
                <Volume2 size={18} />
              </div>

              {/* Per-Shot Audio Clips Container */}
              <div className="flex items-center gap-1.5 pl-2 h-full">
                {timelineShots.map((shot) => {
                  const isSelected = activeShot?.id === shot.id;
                  const hasAudio = !!shot.voiceAudioUrl;
                  const isGenerating = generatingShotId === shot.id;
                  const clipWidth = Math.max(
                    54,
                    shot.calculatedDuration * pxPerSec,
                  );

                  return (
                    <div
                      key={shot.id}
                      onClick={() => handleSeekToTime(shot.startTime)}
                      style={{ width: `${clipWidth}px` }}
                      className={`group relative h-12 shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border flex flex-col justify-between p-1.5 ${
                        hasAudio
                          ? isSelected
                            ? "border-[#7dd3fc] bg-[#0c1620] ring-2 ring-[#7dd3fc]/40 shadow-lg shadow-[#7dd3fc]/15"
                            : "border-white/15 bg-[#0d1318] hover:border-white/30"
                          : "border-dashed border-white/20 bg-white/[0.02] hover:border-white/40"
                      }`}
                    >
                      {hasAudio ? (
                        <>
                          {/* Shot Title & Duration */}
                          <div className="flex items-center justify-between text-[9px] z-10">
                            <span className="font-bold text-white/90 truncate max-w-[65%]">
                              S{shot.sceneOrderIndex + 1}.{shot.orderIndex + 1}
                            </span>
                            <span className="font-mono text-[#7dd3fc]">
                              {shot.calculatedDuration.toFixed(1)}s
                            </span>
                          </div>

                          {/* Rendered Speech Waveform Curve */}
                          <div className="w-full">
                            <SpeechWaveform
                              active={isSelected}
                              duration={shot.calculatedDuration}
                            />
                          </div>

                          {/* Quick Audio Controls on Hover */}
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateShotVoice(shot);
                              }}
                              disabled={isGenerating}
                              className="p-1 rounded-md bg-[#7dd3fc]/20 text-[#7dd3fc] hover:bg-[#7dd3fc]/30 transition"
                              title="Regenerate Voice"
                            >
                              {isGenerating ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <RotateCcw size={12} />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteShotVoice(shot);
                              }}
                              className="p-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                              title="Remove Audio"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between h-full px-1">
                          <span className="text-[8px] text-white/40 truncate">
                            S{shot.sceneOrderIndex + 1}.{shot.orderIndex + 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateShotVoice(shot);
                            }}
                            disabled={isGenerating}
                            className="flex items-center gap-0.5 rounded bg-[#7dd3fc]/20 px-1.5 py-0.5 text-[8px] font-bold text-[#7dd3fc] hover:bg-[#7dd3fc]/30 transition disabled:opacity-30 shrink-0"
                            title="Generate voice for this shot"
                          >
                            {isGenerating ? (
                              <Loader2 size={9} className="animate-spin" />
                            ) : (
                              <Zap size={9} />
                            )}
                            Voice
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Audio Track Button */}
                <button
                  onClick={handleGenerateAllAudio}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white transition"
                  title="Generate All Audio"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
