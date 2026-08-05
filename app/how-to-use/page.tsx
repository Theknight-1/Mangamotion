"use client";

import { useState } from "react";
import Link from "next/link";
import { IconLogo } from "@/components/icon-logo";
import {
  Upload,
  FolderOpen,
  Clapperboard,
  Layers,
  Mic2,
  Film,
  Download,
  ChevronDown,
  Lightbulb,
  Check,
  ArrowRight,
  Search,
  MoreVertical,
  Play,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Step {
  n: number;
  icon: React.ReactNode;
  title: string;
  sub: string;
  detail: string;
  tip: string;
  visual: React.ReactNode;
}

// ── Visual mockups per step ───────────────────────────────────────────────────
function MockProject() {
  return (
    <div className="p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[rgba(232,213,163,0.4)]">
        Projects
      </p>
      <div className="mb-2 flex items-center justify-center gap-2 rounded-xl border border-[rgba(201,168,76,0.45)] bg-[rgba(201,168,76,0.1)] py-2.5">
        <span className="text-sm font-semibold text-[#c9a84c]">+</span>
        <span className="text-sm font-semibold text-[#c9a84c]">
          New project
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-[rgba(45,90,39,0.4)] bg-[rgba(45,90,39,0.15)] px-3 py-2">
        <FolderOpen
          size={13}
          className="shrink-0 text-[rgba(232,213,163,0.5)]"
        />
        <span className="text-[12px] text-[rgba(232,213,163,0.7)]">
          The Reincarnate Prince
        </span>
      </div>
    </div>
  );
}

function MockUpload() {
  return (
    <div className="p-4 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[12px] border-2 border-[#4a8a42] bg-[rgba(74,138,66,0.1)]">
        <Upload size={20} className="text-[#4a8a42]" />
      </div>
      <p className="mb-1 text-[13px] font-semibold text-[rgba(232,213,163,0.85)]">
        Upload Cover Panel
      </p>
      <p className="mb-4 text-[11px] text-[rgba(232,213,163,0.45)]">
        Drag & drop or{" "}
        <span className="text-[#4a8a42]">click anywhere to browse</span>
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {["Fight scene", "Romance recap", "Bulk upload"].map((l) => (
          <span
            key={l}
            className="rounded-full border border-[rgba(232,213,163,0.15)] px-3 py-1 text-[10px] text-[rgba(232,213,163,0.45)]"
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function MockEditorOpens() {
  return (
    <div className="overflow-hidden rounded-lg border border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] bg-[#111] px-3 py-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-[4px] border border-[rgba(201,168,76,0.35)] bg-[#1a2e1a]">
          <Play size={8} className="text-[#c9a84c]" fill="#c9a84c" />
        </div>
        <span className="text-[11px] text-[rgba(232,213,163,0.6)]">
          Chapter 1: The Journey Begins
        </span>
      </div>
      <div className="grid grid-cols-[80px_1fr] min-h-[80px]">
        <div className="border-r border-[rgba(255,255,255,0.06)] bg-[#0d0d0d] p-2">
          <p className="mb-2 text-[8px] font-semibold text-[rgba(255,255,255,0.4)]">
            Scene list
          </p>
          <div className="flex items-center gap-1.5 rounded-[6px] border border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.08)] p-1.5">
            <div className="h-5 w-5 shrink-0 rounded-[3px] bg-[rgba(255,255,255,0.06)]" />
            <div>
              <p className="text-[8px] text-[rgba(232,213,163,0.8)]">Scene 1</p>
              <p className="text-[7px] text-red-400">No voice</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center bg-[#0a0a0a]">
          <div className="text-center">
            <Play
              size={16}
              className="mx-auto mb-1 text-[rgba(201,168,76,0.4)]"
            />
            <p className="text-[8px] text-[rgba(255,255,255,0.2)]">Preview</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockSceneList() {
  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[rgba(232,213,163,0.85)]">
            Scene list
          </p>
          <p className="text-[9px] text-[rgba(232,213,163,0.35)]">
            3 scenes · ~50s
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-[6px] border border-[rgba(74,138,66,0.4)] bg-[rgba(74,138,66,0.12)] px-2 py-1">
          <Upload size={10} className="text-[#4a8a42]" />
          <span className="text-[9px] font-medium text-[#4a8a42]">
            Bulk Upload
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {[
          { n: 1, active: true, dur: "~15s" },
          { n: 2, active: false, dur: "~19s" },
          { n: 3, active: false, dur: "~16s" },
        ].map((s) => (
          <div
            key={s.n}
            className={`flex items-center gap-2 rounded-[8px] border px-2.5 py-2 ${
              s.active
                ? "border-[rgba(201,168,76,0.5)] bg-[rgba(201,168,76,0.08)]"
                : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
            }`}
          >
            <div className="h-7 w-7 shrink-0 rounded-[4px] bg-[rgba(255,255,255,0.06)]" />
            <div className="flex-1">
              <p
                className={`text-[10px] font-medium ${s.active ? "text-[#e8d5a3]" : "text-[rgba(255,255,255,0.4)]"}`}
              >
                Scene {s.n}
              </p>
              <p className="text-[8.5px] text-red-400">No voice generated</p>
            </div>
            <MoreVertical size={11} className="text-[rgba(255,255,255,0.2)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MockVoiceStudio() {
  return (
    <div className="p-3">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(232,213,163,0.45)]">
        Voice Over Studio
      </p>
      <div className="mb-2.5 flex items-center gap-1.5 rounded-[7px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1.5">
        <Search size={10} className="text-[rgba(255,255,255,0.25)]" />
        <span className="text-[10px] text-[rgba(255,255,255,0.25)]">
          Filter characters...
        </span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {[
          { n: "Jungkook", s: "Jungkook", a: true },
          { n: "Yuri — 729e...", s: "Yuri", a: false },
          { n: "Harry Styles", s: "Harry Styles", a: false },
          { n: "Markiplier", s: "Markiplier", a: false },
        ].map((v, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 rounded-[6px] border p-1.5 ${
              v.a
                ? "border-purple-500/40 bg-purple-500/10"
                : "border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]"
            }`}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-gradient-to-br from-purple-700/40 to-blue-700/40">
              <span className="text-[7px] text-white/40">AI</span>
            </div>
            <div className="min-w-0">
              <p
                className={`truncate text-[8.5px] font-medium ${v.a ? "text-white/85" : "text-white/40"}`}
              >
                {v.n}
              </p>
              <p
                className={`text-[7.5px] ${v.a ? "text-purple-400" : "text-white/20"}`}
              >
                {v.s}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button className="flex w-full items-center justify-center gap-1.5 rounded-[7px] bg-gradient-to-br from-purple-600 to-violet-700 py-2 text-[10px] font-bold text-white">
        <Mic2 size={11} />
        Generate Spatial Audio
      </button>
    </div>
  );
}

function MockExport() {
  return (
    <div className="p-3">
      <div className="mb-3 flex border-b border-[rgba(255,255,255,0.07)]">
        <div className="flex-1 pb-2 text-center text-[9.5px] text-[rgba(255,255,255,0.3)]">
          Voices & Settings
        </div>
        <div className="flex-1 border-b-[1.5px] border-[#c9a84c] pb-2 text-center text-[9.5px] font-semibold text-[#c9a84c]">
          Export
        </div>
      </div>
      <div className="mb-2.5 rounded-[7px] bg-[rgba(255,255,255,0.03)] p-2.5">
        <div className="mb-1.5 flex justify-between text-[10px]">
          <span className="text-[rgba(232,213,163,0.45)]">Format:</span>
          <span className="font-medium text-[rgba(232,213,163,0.8)]">16:9</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[rgba(232,213,163,0.45)]">Subtitles:</span>
          <span className="font-medium text-[#4a8a42]">Enabled</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 rounded-[8px] border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.1)] py-2.5">
        <Play size={11} className="text-[#c9a84c]" fill="#c9a84c" />
        <span className="text-[10.5px] font-semibold text-[#c9a84c]">
          Render Video (3 scenes)
        </span>
      </div>
    </div>
  );
}

function MockDownload() {
  return (
    <div className="p-3">
      <div className="mb-2 rounded-[7px] border border-[rgba(74,138,66,0.35)] bg-[rgba(74,138,66,0.08)] p-2.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-medium text-[rgba(232,213,163,0.6)]">
            Status
          </span>
          <span className="rounded-full bg-[rgba(74,138,66,0.2)] px-2 py-0.5 text-[8px] font-semibold text-[#4a8a42]">
            Complete
          </span>
        </div>
        <p className="text-[13px] font-bold text-[#4a8a42]">Completed</p>
      </div>
      <div className="mb-2 rounded-[7px] bg-[rgba(74,138,66,0.06)] p-2.5">
        <p className="text-[10px] text-[#4a8a42]">Your video is ready!</p>
        <p className="text-[9px] text-[rgba(232,213,163,0.35)]">
          Duration: 39s
        </p>
      </div>
      <div className="mb-1.5 flex items-center justify-center gap-1.5 rounded-[8px] border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.1)] py-2.5">
        <Download size={12} className="text-[#c9a84c]" />
        <span className="text-[10.5px] font-semibold text-[#c9a84c]">
          Download Video
        </span>
      </div>
      <div className="flex items-center justify-center rounded-[8px] border border-[rgba(255,255,255,0.08)] py-2">
        <span className="text-[10px] text-[rgba(255,255,255,0.35)]">
          Render New Scenes
        </span>
      </div>
    </div>
  );
}

// ── Steps data ────────────────────────────────────────────────────────────────
const STEPS: Step[] = [
  {
    n: 1,
    icon: <FolderOpen size={18} />,
    title: "Create a project",
    sub: "Projects organise your manga chapters and videos.",
    detail:
      "Click the gold '+ New project' button in the left sidebar. Give it a name — usually the manga title works best, like 'The Reincarnate Prince'. One project per series keeps things clean, and you can have multiple videos inside one project.",
    tip: "Name your project after the manga series so it's easy to find later.",
    visual: <MockProject />,
  },
  {
    n: 2,
    icon: <Upload size={18} />,
    title: "Upload a cover panel",
    sub: "Drop any manga panel — this becomes the first scene.",
    detail:
      "With your project selected, drag and drop a manga panel image into the upload zone, or click 'click anywhere to browse'. Use quick-start pills like 'Fight scene' or 'Bulk upload' to jumpstart common workflows faster.",
    tip: "JPG, PNG and WebP all work. Max 10MB per image. The AI reads speech bubbles embedded in the panel too.",
    visual: <MockUpload />,
  },
  {
    n: 3,
    icon: <Clapperboard size={18} />,
    title: "Editor opens automatically",
    sub: "No navigation needed — you're taken straight in.",
    detail:
      "As soon as the cover panel uploads, the editor opens. AI analyses your panel immediately and generates narration within seconds. You'll see the scene list on the left, the panel preview in the centre, and Voice & Settings on the right.",
    tip: "The AI reads the scene's mood and composition to write contextual narration — not just a generic description.",
    visual: <MockEditorOpens />,
  },
  {
    n: 4,
    icon: <Layers size={18} />,
    title: "Bulk upload panels and edit narration",
    sub: "Add all your chapters at once, then refine the AI output.",
    detail:
      "Click 'Bulk Upload' to add all your manga panels in one go. AI analyses each image and generates narration for every scene. Click any scene in the left panel to select it — the narration text appears in the centre where you can edit it freely before generating voice.",
    tip: "You can re-analyse any scene by clicking 'Re-analyze' — useful if the AI misread a panel or speech bubble.",
    visual: <MockSceneList />,
  },
  {
    n: 5,
    icon: <Mic2 size={18} />,
    title: "Pick a voice and generate",
    sub: "Choose from 20,000+ character voices in Voice Over Studio.",
    detail:
      "Go to the 'Voices & Settings' tab on the right panel. Search for a character by name or browse the grid. Select a voice — click the preview play button to audition it first — then click 'Generate Spatial Audio'. Repeat for each scene in turn.",
    tip: "You don't have to use the same voice for every scene. Mix voices to match different characters across your manga.",
    visual: <MockVoiceStudio />,
  },
  {
    n: 6,
    icon: <Film size={18} />,
    title: "Render all scenes",
    sub: "One click compiles everything into a final video.",
    detail:
      "Switch to the 'Export' tab in the right panel. Choose your format (16:9, 9:16 or 1:1) and toggle subtitles on or off. Click 'Render Video' — MotionRecap compiles all scenes, voiceovers, Ken Burns zoom animations and subtitles into a single MP4.",
    tip: "Rendering happens in the cloud. You don't need to keep the tab open — come back and your download link will be waiting.",
    visual: <MockExport />,
  },
  {
    n: 7,
    icon: <Download size={18} />,
    title: "Download and share",
    sub: "Your video is ready — export MP4 and post it.",
    detail:
      "When rendering completes, the Export panel shows 'Completed' with a green badge. Click 'Download Video' to save your MP4. The video includes all panels, Ken Burns zooms, voiceover and optional subtitles — ready to upload directly to YouTube Shorts or TikTok.",
    tip: "Added new panels after rendering? Use 'Render New Scenes' to only re-render the changed scenes and save render minutes.",
    visual: <MockDownload />,
  },
];

// ── Step card ─────────────────────────────────────────────────────────────────
function StepCard({
  step,
  isActive,
  onToggle,
  onNext,
  isLast,
}: {
  step: Step;
  isActive: boolean;
  onToggle: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isActive
          ? "border-[rgba(201,168,76,0.35)] bg-[rgba(95,163,50,0.05)] shadow-[0_0_0_1px_rgba(201,168,76,0.08),0_8px_32px_rgba(0,0,0,0.4)]"
          : "border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.12)]"
      }`}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left"
        aria-expanded={isActive}
      >
        {/* Step number / check */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
            isActive
              ? "border-[rgba(201,168,76,0.5)] bg-[rgba(201,168,76,0.12)] text-[#c9a84c]"
              : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.35)]"
          }`}
        >
          {isActive ? (
            <span className="text-[16px] font-bold text-[#c9a84c]">
              {step.n}
            </span>
          ) : (
            <span className="text-[16px] font-semibold">{step.n}</span>
          )}
        </div>

        {/* Icon */}
        <div
          className={`hidden shrink-0 sm:flex h-9 w-9 items-center justify-center rounded-[10px]  transition-all duration-200 ${
            isActive
              ? " bg-[rgba(74,138,66,0.15)] border border-[#63cf54] text-[#63cf54]"
              : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.3)]"
          }`}
        >
          {step.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-lg font-semibold transition-colors ${
              isActive ? "text-[#e8d5a3]" : "text-[rgba(232,213,163,0.65)]"
            }`}
          >
            {step.title}
          </p>
          <p className="mt-0.5 text-lg text-[rgba(232,213,163,0.4)]">
            {step.sub}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={18}
          className={`shrink-0 text-[rgba(232,213,163,0.35)] transition-transform duration-200 ${
            isActive ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded content */}
      {isActive && (
        <div className="border-t border-[rgba(255,255,255,0.06)] px-5 pb-5 pt-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Visual mockup */}
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[#0d0d0d] overflow-hidden">
              {step.visual}
            </div>

            {/* Detail + tip */}
            <div className="flex flex-col justify-between gap-4">
              <p className="text-[14px] leading-[1.7] text-[rgba(232,213,163,0.7)]">
                {step.detail}
              </p>

              {/* Tip box */}
              <div className="flex items-start gap-3 rounded-xl border border-[rgba(74,138,66,0.25)] bg-[rgba(74,138,66,0.08)] p-3.5">
                <Lightbulb
                  size={15}
                  className="mt-0.5 shrink-0 text-[#4a8a42]"
                />
                <p className="text-[12.5px] leading-relaxed text-[rgba(232,213,163,0.6)]">
                  {step.tip}
                </p>
              </div>

              {/* Next / CTA */}
              {isLast ? (
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] py-3 text-[13px] font-bold text-[#060e06] shadow-[0_4px_20px_rgba(201,168,76,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_8px_26px_rgba(201,168,76,0.4)]"
                >
                  Start creating free
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <button
                  onClick={onNext}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(74,138,66,0.35)] bg-[rgba(74,138,66,0.1)] py-3 text-sm font-semibold text-[#5bca4c] transition-all hover:bg-[rgba(74,138,66,0.18)]"
                >
                  Next: {STEPS[step.n].title}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ active, total }: { active: number; total: number }) {
  const pct = Math.round(((active - 1) / (total - 1)) * 100);
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-[12px] text-[rgba(232,213,163,0.4)]">
        <span>
          Step {active} of {total}
        </span>
        <span>{pct}% complete</span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4a8a42] to-[#c9a84c] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GuidePage() {
  const [activeStep, setActiveStep] = useState(1);

  function toggleStep(n: number) {
    setActiveStep((prev) => (prev === n ? 0 : n));
  }

  function goNext(n: number) {
    setActiveStep(n + 1);
    // Scroll to next step
    setTimeout(() => {
      document
        .getElementById(`step-${n + 1}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <main className="min-h-screen bg-[#112011] text-[#e8d5a3]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(45,90,39,0.18)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.06)_0%,transparent_70%)]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-[rgba(45,90,39,0.18)] px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <IconLogo />
            <span className="text-[15px] font-bold tracking-tight text-[#e8d5a3]">
              MangaMotion
            </span>
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] px-4 py-2 text-[13px] font-bold text-[#060e06] shadow-[0_4px_16px_rgba(201,168,76,0.3)] transition-all hover:-translate-y-px"
          >
            Get Started
            <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(74,138,66,0.3)] bg-[rgba(74,138,66,0.08)] px-4 py-1.5">
            <Check size={12} className="text-[#4a8a42]" />
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#4a8a42]">
              How it works
            </span>
          </div>

          <h1 className="mb-5 text-[clamp(28px,5vw,48px)] font-bold leading-[1.1] tracking-tight text-[#e8d5a3]">
            From manga panels to
            <br />
            <span className="text-[#4a8a42]">video in 7 steps</span>
          </h1>

          <p className="mx-auto max-w-lg text-[16px] leading-relaxed text-[rgba(232,213,163,0.5)]">
            Upload your panels, let AI generate narration and voice, then export
            a cinematic MP4 ready for YouTube Shorts or TikTok.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="relative z-10 px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <ProgressBar active={activeStep || 1} total={STEPS.length} />

          <div className="flex flex-col gap-3">
            {STEPS.map((step) => (
              <div key={step.n} id={`step-${step.n}`}>
                <StepCard
                  step={step}
                  isActive={activeStep === step.n}
                  onToggle={() => toggleStep(step.n)}
                  onNext={() => goNext(step.n)}
                  isLast={step.n === STEPS.length}
                />
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 rounded-2xl border border-[rgba(45,90,39,0.25)] bg-[rgba(45,90,39,0.08)] p-8 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4a8a42]">
              Ready to start?
            </p>
            <h2 className="mb-3 text-[24px] font-bold text-[#e8d5a3]">
              Create your first recap video
            </h2>
            <p className="mx-auto mb-6 max-w-md text-[14px] text-[rgba(232,213,163,0.5)]">
              Free to start. 1 video, up to 10 minutes. No credit card.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] px-8 py-3.5 text-[14px] font-bold text-[#060e06] shadow-[0_4px_20px_rgba(201,168,76,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_8px_26px_rgba(201,168,76,0.4)]"
            >
              Start creating free
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
