import { useEffect, useState } from "react";
import {
  Camera,
  Loader2,
  Sparkles,
  RefreshCw,
  Pencil,
  Volume2,
} from "lucide-react";
import { getAspectRatioClass } from "@/lib/utils";

/* ————————————————————————————————————————————
   Design tokens
   base #121210 · surface #1b1a16 · line #2c2a22
   amber (tally/practical light) #e08a3e
   slate (day-for-night) #7c8f96
   text #efece2 / #948f80
   ———————————————————————————————————————————— */

function useEditorialFonts() {
  useEffect(() => {
    if (document.getElementById("shotcard-fonts")) return;
    const link = document.createElement("link");
    link.id = "shotcard-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

// Small placeholder "frame" so the demo doesn't depend on external images.
function PlaceholderFrame({ seed }: { seed: number | string }) {
  const seedNum = typeof seed === "number" ? seed : seed.charCodeAt(0) || 0;
  const gradients = [
    "linear-gradient(135deg,#3a2f22,#171410 60%)",
    "linear-gradient(135deg,#2b3430,#12130f 65%)",
    "linear-gradient(135deg,#33261a,#141210 60%)",
  ];
  return (
    <div
      className="absolute inset-0"
      style={{ background: gradients[seedNum % gradients.length] }}
    >
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(239,236,226,0.4) 0px, transparent 1px, transparent 3px)",
        }}
      />
    </div>
  );
}

function MatchMeter({ score = 0.9, flagged = false }: { score?: number; flagged?: boolean }) {
  const pct = Math.round(score * 100);
  const filled = Math.round(score * 5);
  return (
    <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/60 px-2 py-1 backdrop-blur-sm">
      <div className="flex items-end gap-[2px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-[1px]"
            style={{
              height: `${5 + i * 2}px`,
              background:
                i < filled
                  ? flagged
                    ? "#e08a3e"
                    : "#7c8f96"
                  : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
      <span
        className="font-mono text-[10px] font-semibold tracking-tight"
        style={{ color: flagged ? "#e08a3e" : "#c9d3d6" }}
      >
        {pct}%
      </span>
    </div>
  );
}

function ViewfinderBrackets() {
  const corner =
    "absolute h-3 w-3 border-[#e08a3e]/70 transition-opacity duration-300";
  return (
    <div className="pointer-events-none absolute inset-2.5 opacity-50 transition-opacity duration-300 group-hover:opacity-90">
      <span className={`${corner} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${corner} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${corner} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${corner} bottom-0 right-0 border-b-2 border-r-2`} />
    </div>
  );
}

function ShotCard({ shot }: { shot: any }) {
  const {
    sceneNum,
    shotNum,
    description,
    dialogue,
    characters,
    shotType,
    cameraAngle,
  } = shot;
  const [status, setStatus] = useState(shot.status); // 'ready' | 'empty' | 'generating'

  const isGenerating = status === "generating";
  const hasImage = status === "ready" || (isGenerating && shot.hadImage);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-[#2c2a22] bg-[#1b1a16] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#e08a3e]/40 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
      {/* Frame */}
      <div
        className={`relative w-full overflow-hidden bg-[#0d0c0a] ${getAspectRatioClass(
          shot.aspectRatio,
        )}`}
      >
        {hasImage ? (
          <>
            <PlaceholderFrame seed={shot.id} />
            <ViewfinderBrackets />
            {isGenerating && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
                <Loader2
                  size={18}
                  className="motion-safe:animate-spin text-[#e08a3e]"
                />
                <span className="mt-2 font-mono text-[10px] tracking-wide text-[#e08a3e]">
                  DEVELOPING FRAME…
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ViewfinderBrackets />
            {isGenerating ? (
              <>
                <Loader2
                  size={18}
                  className="motion-safe:animate-spin text-[#e08a3e]"
                />
                <span className="mt-2 font-mono text-[10px] tracking-wide text-[#e08a3e]">
                  DEVELOPING FRAME…
                </span>
              </>
            ) : (
              <>
                <Camera size={18} className="text-[#948f80]/60" />
                <span className="mt-2 text-xs text-[#948f80]">
                  No frame yet
                </span>
                <button
                  onClick={() => setStatus("generating")}
                  className="mt-3 rounded border border-[#e08a3e]/40 bg-[#e08a3e]/10 px-3 py-1.5 text-[11px] font-medium text-[#e08a3e] transition-colors hover:bg-[#e08a3e] hover:text-[#121210] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e08a3e]"
                >
                  Generate frame
                </button>
              </>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

        {/* Timecode-style shot ID */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-[#efece2] backdrop-blur-sm">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isGenerating
                ? "bg-[#e08a3e] motion-safe:animate-pulse"
                : "bg-[#7c8f96]"
            }`}
          />
          SC{String(sceneNum).padStart(2, "0")} · SH
          {String(shotNum).padStart(2, "0")}
        </div>

        {hasImage && !isGenerating && (
          <div className="absolute bottom-3 left-3">
            <MatchMeter score={shot.matchScore} flagged={shot.flagged} />
          </div>
        )}

        {/* Hover actions */}
        {hasImage && !isGenerating && (
          <div className="absolute bottom-3 right-3 flex translate-y-1 gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <button className="flex h-7 items-center gap-1 rounded border border-white/15 bg-black/60 px-2.5 text-[10px] font-medium text-[#efece2]/85 backdrop-blur-sm transition-colors hover:border-[#e08a3e]/50 hover:text-[#e08a3e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e08a3e]">
              <Sparkles size={11} className="text-[#e08a3e]" />
              Iterate
            </button>
            <button
              title="Regenerate frame"
              className="flex h-7 w-7 items-center justify-center rounded border border-white/15 bg-black/60 text-[#efece2]/70 backdrop-blur-sm transition-colors hover:border-[#e08a3e]/50 hover:text-[#e08a3e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e08a3e]"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5">
        {characters?.length > 0 && (
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            {characters.map((c: string) => (
              <span
                key={c}
                className="rounded-[3px] border border-[#7c8f96]/25 bg-[#7c8f96]/[0.08] px-2 py-0.5 text-[11px] font-medium text-[#a9bcc2]"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <p
          className="line-clamp-3 text-[13px] leading-[1.65] text-[#efece2]/85"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {description}
        </p>

        {dialogue && (
          <div className="mt-2.5 border-l-2 border-[#e08a3e]/40 pl-2.5">
            <p className="line-clamp-2 text-[11px] italic leading-relaxed text-[#efece2]/50">
              “{dialogue}”
            </p>
          </div>
        )}

        <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
          <button className="flex items-center gap-1.5 text-[11px] font-medium text-[#948f80] transition-colors hover:text-[#efece2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e08a3e]">
            <Pencil size={11} />
            Edit shot
          </button>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[#948f80]">
            <span>{shotType || "Medium"}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-[#948f80]/40" />
            <span>{cameraAngle || "Eye-level"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoryboardDemo() {
  useEditorialFonts();

  const shots = [
    {
      id: 0,
      sceneNum: 1,
      shotNum: 1,
      status: "ready",
      matchScore: 0.94,
      flagged: false,
      description:
        "A rust-speckled bus comes to a stop at a coastal town bus stop, with the harbor and neon signs visible in the background.",
      characters: [],
      shotType: "Wide",
      cameraAngle: "Eye-level",
    },
    {
      id: 1,
      sceneNum: 1,
      shotNum: 2,
      status: "ready",
      matchScore: 0.6,
      flagged: true,
      description:
        "Detective Marcus Webb steps down from the bus with a duffel on his shoulder, the long coat moving in the breeze.",
      dialogue: "Been a long time since I smelled this air.",
      characters: ["Marcus Webb"],
      shotType: "Medium",
      cameraAngle: "Low angle",
    },
    {
      id: 2,
      sceneNum: 1,
      shotNum: 3,
      status: "generating",
      description:
        "Detective Marcus Webb stands at the curb, his gaze moving slowly over the familiar harbor and the cozy buildings in shadow.",
      characters: ["Marcus Webb"],
      shotType: "Close-up",
      cameraAngle: "Eye-level",
    },
    {
      id: 3,
      sceneNum: 1,
      shotNum: 4,
      status: "empty",
      description:
        "A close view of Detective Marcus Webb's hands unfolding a handwritten letter.",
      characters: ["Marcus Webb"],
      shotType: "Insert",
      cameraAngle: "Overhead",
    },
  ];

  return (
    <div className="min-h-screen bg-[#121210] p-6">
      <div className="mb-5 flex items-center gap-2">
        <Volume2 size={14} className="text-[#948f80]" />
        <h1 className="font-mono text-xs uppercase tracking-[0.15em] text-[#948f80]">
          Scene 01 — Bus Stop, Dusk
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shots.map((shot) => (
          <ShotCard key={shot.id} shot={shot} />
        ))}
      </div>
    </div>
  );
}
