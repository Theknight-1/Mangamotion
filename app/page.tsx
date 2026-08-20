"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo, memo, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { EditorMockup } from "@/components/landing/editor-mockup";
import {
  Sparkles,
  Clapperboard,
  Film,
  Camera,
  Palette,
  Users,
  FileText,
  Volume2,
  Share2,
} from "lucide-react";

/* ══════════════════════════════════════════════ TYPES ══════════════════════════════════════════ */

interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: string;
}

interface Step {
  n: string;
  title: string;
  desc: string;
}

interface Testimonial {
  text: string;
  name: string;
  role: string;
  avatar: string;
  color: keyof typeof AVATAR_COLORS;
  toolUsed?: string;
}

interface Faq {
  q: string;
  a: string;
}

/* ══════════════════════════════════════════════ CONSTANTS ══════════════════════════════════════════ */

const AVATAR_COLORS = {
  coral: { bg: "#F5C4B3", text: "#712B13" },
  amber: { bg: "#FAC775", text: "#633806" },
  teal: { bg: "#9FE1CB", text: "#085041" },
  purple: { bg: "#CECBF6", text: "#3C3489" },
  pink: { bg: "#F4C0D1", text: "#72243E" },
} as const;

const SOCIAL_PROOF_ITEMS = [
  "No credit card required",
  "Free tier available",
  "AI Storyboard & Script Breakdown",
  "Character consistency model sheets",
  "100+ AI character voices",
  "Instant 4K MP4 & PDF export",
] as const;

const VOICE_OPTIONS = [
  "Naruto Uzumaki",
  "Light Yagami",
  "Levi Ackerman",
  "Goku",
  "Spike Spiegel",
  "Edward Elric",
] as const;

const TIMELINE_SCENES = [
  { label: "Scene 1", dur: 3, voice: true },
  { label: "Scene 2", dur: 5, voice: true },
  { label: "Scene 3", dur: 4, voice: false },
  { label: "Scene 4", dur: 6, voice: true },
] as const;

const STORYBOARD_STEPS: Step[] = [
  {
    n: "01",
    title: "Upload Script or Idea",
    desc: "Paste your screenplay, book excerpt, or prompt. AI breaks down narrative beats and pacing.",
  },
  {
    n: "02",
    title: "Pick Visual Style & Framing",
    desc: "Choose from 15+ cinematic styles (Manga, Dark Anime, Cyberpunk Noir, Watercolor) & 16:9/9:16 aspect ratios.",
  },
  {
    n: "03",
    title: "Generate Consistent Characters",
    desc: "Create multi-angle character model sheets that lock faces and outfits across every single shot.",
  },
  {
    n: "04",
    title: "Direct Shots & Export Animatic",
    desc: "Fine-tune camera angles, re-roll frames, assign AI voices, and render a cinematic animatic or export PDF.",
  },
];

const PANEL_STEPS: Step[] = [
  {
    n: "01",
    title: "Upload your manga panels",
    desc: "Drop in scanned manga images — JPG or PNG. Automatic panel segmentation and optimization.",
  },
  {
    n: "02",
    title: "Build your visual timeline",
    desc: "Add scenes, adjust pan/zoom durations, and sequence shots until the pacing feels cinematic.",
  },
  {
    n: "03",
    title: "Assign AI voices & SFX",
    desc: "Pick from 100+ anime & manga character voices. Preview lines directly on the timeline.",
  },
  {
    n: "04",
    title: "Export 9:16 / 16:9 Video",
    desc: "One-click FFmpeg render. Download high-resolution MP4s ready for YouTube Shorts and TikTok.",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    text: "The new Storyboard Studio is mind-blowing. I typed a 3-paragraph cyberpunk scene and had a full 6-shot visual board with consistent character faces and voice narration in under 4 minutes.",
    name: "Alex Rivera",
    role: "Anime Director & Storyboard Artist, LA",
    avatar: "AR",
    color: "purple",
    toolUsed: "Storyboard Studio",
  },
  {
    text: "I went from a folder of scanned chapters to a finished short in one afternoon. The voice matching alone saved me a full day of editing.",
    name: "Haruto Sasaki",
    role: "Manga creator, Osaka",
    avatar: "HS",
    color: "coral",
    toolUsed: "Panel Animator",
  },
  {
    text: "Character consistency was always the bottleneck with AI tools. MotionRecap's model sheet generator locked my protagonist's face across wide and close-up camera angles effortlessly.",
    name: "Elena Rostova",
    role: "Webcomic Illustrator, Berlin",
    avatar: "ER",
    color: "teal",
    toolUsed: "Storyboard Studio",
  },
  {
    text: "My readers always asked what my characters sounded like. Now they just watch the clip with full voice acting.",
    name: "Amara Okafor",
    role: "Webcomic artist, Lagos",
    avatar: "AO",
    color: "amber",
    toolUsed: "Panel Animator",
  },
  {
    text: "Pitching animated pilots to producers used to take weeks of hand-drawing storyboards. Exporting a printable PDF with shot directions and dialogue is a game-changer.",
    name: "Mateusz Wójcik",
    role: "Animation Studio Lead, Kraków",
    avatar: "MW",
    color: "pink",
    toolUsed: "Storyboard Studio",
  },
  {
    text: "The panel-to-pan timing is the part nobody else gets right. MotionRecap nails the pacing without me touching a single keyframe.",
    name: "Diego Fonseca",
    role: "YouTube Editor, São Paulo",
    avatar: "DF",
    color: "teal",
    toolUsed: "Panel Animator",
  },
];

const FAQS: Faq[] = [
  {
    q: "What is the new Storyboard Studio tool?",
    a: "Storyboard Studio is an end-to-end AI visual director. You can input any script, screenplay, or story idea, and AI will automatically break it down into scenes and shots, generate consistent character model sheets, compose multi-angle camera shots in 15+ art styles, sync AI voice narration, and export both animatic videos (MP4) and director pitch PDFs.",
  },
  {
    q: "How does character consistency work in Storyboard Studio?",
    a: "When you build a project, Storyboard Studio extracts key characters and generates multi-angle model sheets (front view, profile, 3/4 angle). These visual embeddings and description conditioning are automatically injected into every subsequent camera shot prompt, ensuring the same face, hairstyle, clothing, and anatomy across all scenes.",
  },
  {
    q: "Can I use MotionRecap for both existing manga panels and new scripts?",
    a: "Yes! MotionRecap gives you two distinct workflows: 1) Panel Animator: Upload your existing manga/comic pages to animate pan/zooms and dub voices for TikTok and YouTube Shorts; 2) Storyboard Studio: Generate visual storyboards and animatics from scratch starting with just written text or screenplays.",
  },
  {
    q: "What export formats are supported?",
    a: "You can export full high-definition (1080p & 4K) MP4 animatic videos with synchronized voice narration, audio panning, and subtitles, as well as printable multi-page Storyboard PDF pitch decks containing shot descriptions, dialogue, and camera directives.",
  },
  {
    q: "How does billing work?",
    a: "Paid plans are billed monthly in USD via Razorpay or PayPal. You can upgrade, downgrade, or cancel from your account settings at any time with zero lock-in.",
  },
  {
    q: "Can I use generated videos and storyboards commercially?",
    a: "Yes! All videos, storyboards, animatics, and audio tracks generated on MotionRecap are 100% yours to monetize across YouTube, TikTok, commercial animation pitches, webcomic marketing, and client presentations.",
  },
];

/* ══════════════════════════════════════════════ MEMOIZED ICONS ══════════════════════════════════════════ */

const IconUpload = memo(() => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="14" width="18" height="6" rx="2" />
    <path d="M11 2v10M7 6l4-4 4 4" />
    <circle cx="17" cy="17" r="1" fill="currentColor" stroke="none" />
  </svg>
));
IconUpload.displayName = "IconUpload";

const IconVoice = memo(() => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="8" y="1" width="6" height="11" rx="3" />
    <path d="M4 10a7 7 0 0 0 14 0" />
    <line x1="11" y1="17" x2="11" y2="21" />
    <line x1="7" y1="21" x2="15" y2="21" />
    <path d="M6 7h2M14 7h2M6 10h2M14 10h2" strokeWidth="1" />
  </svg>
));
IconVoice.displayName = "IconVoice";

const IconTimeline = memo(() => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="2" y1="11" x2="20" y2="11" />
    <rect x="3" y="7" width="5" height="8" rx="1.5" />
    <rect x="10" y="5" width="5" height="12" rx="1.5" />
    <rect x="17" y="8" width="3" height="6" rx="1" />
    <circle cx="5.5" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="11" r="1" fill="currentColor" stroke="none" />
  </svg>
));
IconTimeline.displayName = "IconTimeline";

const IconRender = memo(() => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="4,3 18,11 4,19" />
    <path d="M18 3v16" strokeDasharray="2 2" />
    <circle cx="18" cy="3" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="18" cy="19" r="1.5" fill="currentColor" stroke="none" />
  </svg>
));
IconRender.displayName = "IconRender";

const IconExport = memo(() => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    <path d="M11 2v12M7 10l4 4 4-4" />
    <path d="M2 8h3M17 8h3" strokeDasharray="1.5 1.5" />
  </svg>
));
IconExport.displayName = "IconExport";

const IconProfiles = memo(() => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="8" cy="7" r="3" />
    <circle cx="15" cy="9" r="2.5" strokeDasharray="2 1.5" />
    <path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M15 14c1.7.5 3 2.1 3 4" />
  </svg>
));
IconProfiles.displayName = "IconProfiles";

const IconArrow = memo(() => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2.5 7.5h10M9 4l3.5 3.5L9 11" />
  </svg>
));
IconArrow.displayName = "IconArrow";

const IconCheck = memo(() => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 13 13"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 7l3.5 3.5L11 3" />
  </svg>
));
IconCheck.displayName = "IconCheck";

const IconStar = memo(() => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 14 14"
    fill="#c9a84c"
    stroke="none"
    aria-hidden="true"
  >
    <path d="M7 1l1.5 4h4l-3.3 2.4 1.3 4L7 9l-3.5 2.4 1.3-4L1.5 5h4z" />
  </svg>
));
IconStar.displayName = "IconStar";

const IconPlay = memo(() => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M3 2.5l9 4.5-9 4.5z" />
  </svg>
));
IconPlay.displayName = "IconPlay";

const IconChevron = memo(({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "rotate-180" : ""}`}
    aria-hidden="true"
  >
    <path d="M4 6l4 4 4-4" />
  </svg>
));
IconChevron.displayName = "IconChevron";

const IconZap = memo(() => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-[#c9a84c]"
    aria-hidden="true"
  >
    <path d="M8 1L2 8h4l-1 5 6-7H7L8 1z" />
  </svg>
));
IconZap.displayName = "IconZap";

const FEATURES: Feature[] = [
  {
    icon: <Clapperboard className="h-5 w-5 text-[#2d5a27]" />,
    title: "AI Script to Storyboard",
    desc: "Paste raw screenplays or prompts. AI extracts scenes, narrative beats, shot durations, and camera angles.",
    badge: "New in Storyboard",
  },
  {
    icon: <Users className="h-5 w-5 text-[#2d5a27]" />,
    title: "Character Consistency Sheets",
    desc: "Generate multi-angle model sheets locking facial geometry, hair, and costume across every camera shot.",
    badge: "New in Storyboard",
  },
  {
    icon: <Camera className="h-5 w-5 text-[#2d5a27]" />,
    title: "Virtual Camera Director",
    desc: "Compose shots with custom camera presets: Wide Establishing, Close-Up, Over-the-Shoulder, and Low-Angle.",
    badge: "New in Storyboard",
  },
  {
    icon: <IconVoice />,
    title: "100+ AI Character Voices",
    desc: "Integrated AI voice synthesis. Assign unique anime character voices per scene with synchronized speech audio.",
  },
  {
    icon: <IconTimeline />,
    title: "Interactive Timeline Editor",
    desc: "Fine-tune scene durations, reorder shots, add camera pans, and sync audio with precision drag-and-drop.",
  },
  {
    icon: <Film className="h-5 w-5 text-[#2d5a27]" />,
    title: "Animatic Video & PDF Export",
    desc: "Export 4K animated video animatics with pan/zoom motion, or generate printable director pitch decks in PDF.",
  },
];

/* ══════════════════════════════════════════════ SHARED INTERSECTION OBSERVER ══════════════════════════════════════════ */

let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
  }
  return observer;
}

/* ══════════════════════════════════════════════ FADE-IN COMPONENT ══════════════════════════════════════════ */

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = getObserver();
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      className={`fade-in-wrapper ${className}`}
      style={{ "--fade-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════ INTERACTIVE DEMOS ══════════════════════════════════════════ */

const TimelineDemo = memo(function TimelineDemo() {
  const [active, setActive] = useState(0);
  const total = TIMELINE_SCENES.reduce((a, s) => a + s.dur, 0);
  const activeScene = TIMELINE_SCENES[active];

  return (
    <div
      className="rounded-2xl border border-[#5a9a52]/40 bg-[#172617] p-5 md:p-6"
      role="region"
      aria-label="Interactive timeline demo"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7fb870]">
          Timeline editor
        </span>
        <span className="text-[11px] text-[#7fb870]">Total: {total}s</span>
      </div>
      <div className="mb-3.5 flex gap-1.5">
        {TIMELINE_SCENES.map((scene, index) => {
          const isActive = active === index;

          return (
            <button
              key={scene.label}
              onClick={() => setActive(index)}
              style={{ flex: scene.dur }}
              aria-pressed={isActive}
              aria-label={`${scene.label}, ${scene.dur} seconds${scene.voice ? ", with voice" : ""}`}
              className={`min-h-11 min-w-0 cursor-pointer rounded-lg border p-2 transition-all duration-200 ${
                isActive
                  ? "border-[#5a9a52] bg-[#2d5a27]"
                  : "border-[#5a9a52]/25 bg-[#5a9a52]/10 hover:bg-[#5a9a52]/20"
              }`}
            >
              <div
                className={`truncate text-[10px] font-medium ${
                  isActive ? "text-[#d4edb8]" : "text-[#7fb870]"
                }`}
              >
                {scene.label}
              </div>

              <div
                className={`mt-0.5 text-[10px] ${
                  isActive ? "text-[#9fd48e]" : "text-[#5a8a4f]"
                }`}
              >
                {scene.dur}s{scene.voice && " 🎙"}
              </div>
            </button>
          );
        })}
      </div>
      <div className="rounded-[10px] bg-[#5a9a52]/10 p-3.5 md:p-4">
        <div className="mb-2 flex justify-between">
          <span className="text-xs font-medium text-[#9fd48e]">
            {activeScene.label}
          </span>
          <span className="text-[11px] text-[#7fb870]">
            Duration: {activeScene.dur}s
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-sm bg-[#5a9a52]/20">
          <div
            className="h-full rounded-sm bg-[#5a9a52] transition-all duration-400"
            style={{ width: `${(activeScene.dur / 6) * 100}%` }}
          />
        </div>
        <p
          className={`mt-2.5 text-[11px] ${activeScene.voice ? "text-[#9fd48e]" : "text-[#7a8a6a]"}`}
        >
          {activeScene.voice
            ? "✓ Voice assigned"
            : 'No voice — click "Add Voice" to assign'}
        </p>
      </div>
    </div>
  );
});

const VoiceDemo = memo(function VoiceDemo() {
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const togglePlay = useCallback((i: number) => {
    setPlaying((prev) => {
      if (prev === i) return null;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setPlaying(null), 2000);
      return i;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className="rounded-2xl border border-[#5a9a52]/40 bg-[#172617] p-5 md:p-6"
      role="region"
      aria-label="Interactive voice picker demo"
    >
      <div className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#7fb870]">
        Voice picker — 20,000+ available
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {VOICE_OPTIONS.map((voice, index) => {
          const isSelected = selected === index;

          return (
            <div
              key={voice}
              className={`flex min-h-11 items-center justify-between rounded-lg border transition-colors ${
                isSelected
                  ? "border-[#5a9a52] bg-[#5a9a52]/30"
                  : "border-[#5a9a52]/20 bg-[#5a9a52]/10"
              }`}
            >
              {/* Select Voice */}
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={isSelected}
                className={`flex flex-1 items-center self-stretch rounded-l-lg pl-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb870] ${
                  !isSelected ? "hover:bg-[#5a9a52]/15" : ""
                }`}
              >
                <span
                  className={`text-xs ${
                    isSelected ? "text-[#d4edb8]" : "text-[#8fb880]"
                  }`}
                >
                  {voice}
                </span>
              </button>

              {/* Preview */}
              <button
                type="button"
                onClick={() => {
                  setSelected(index);
                  togglePlay(index);
                }}
                aria-label={`Preview ${voice}`}
                className="flex h-11 w-11 items-center justify-center rounded-r-lg transition-colors hover:bg-[#5a9a52]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb870]"
              >
                <span
                  className={
                    playing === index ? "text-[#c9a84c]" : "text-[#7fb870]"
                  }
                >
                  <IconPlay />
                </span>
              </button>
            </div>
          );
        })}
      </div>
      {selected !== null && (
        <div className="mt-3 rounded-lg bg-[#5a9a52]/14 p-2.5 text-xs text-[#9fd48e]">
          {playing === selected ? (
            <span className="text-[#c9a84c]">
              Playing preview for {VOICE_OPTIONS[selected]}…
            </span>
          ) : (
            <span>
              Selected:{" "}
              <strong className="text-[#d4edb8]">
                {VOICE_OPTIONS[selected]}
              </strong>{" "}
              — click ▶ to preview
            </span>
          )}
        </div>
      )}
    </div>
  );
});

/* ══════════════════════════════════════════════ FEATURE CARD ══════════════════════════════════════════ */

const FeatureCard = memo(function FeatureCard({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}) {
  return (
    <FadeIn delay={index * 80}>
      <article className="relative bg-[#1a2d1a] p-6 md:p-8 transition-colors hover:bg-[#1e351e] h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#5a9a52]/30 bg-[#fceeca] text-[#3a7033]">
              {feature.icon}
            </div>
            {feature.badge && (
              <span className="rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">
                {feature.badge}
              </span>
            )}
          </div>
          <h3 className="mb-2 text-[15px] font-semibold text-[#e8d5a3]">
            {feature.title}
          </h3>
          <p className="text-[13.5px] leading-7 text-[#e8d5a3]/65">
            {feature.desc}
          </p>
        </div>
      </article>
    </FadeIn>
  );
});

/* ══════════════════════════════════════════════ FAQ ITEM ══════════════════════════════════════════ */

const FaqItem = memo(function FaqItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: Faq;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const btnId = `faq-question-${index}`;
  const answerId = `faq-answer-${index}`;

  return (
    <FadeIn delay={index * 45}>
      <div
        className={`overflow-hidden rounded-[14px] border transition-colors ${
          isOpen
            ? "border-[#5a9a52]/40 bg-[#5a9a52]/8"
            : "border-[#5a9a52]/20 bg-[#151d15]"
        }`}
        itemScope
        itemProp="mainEntity"
        itemType="https://schema.org/Question"
      >
        <button
          id={btnId}
          onClick={onToggle}
          className="flex w-full min-h-[52px] cursor-pointer items-center justify-between gap-4 bg-transparent border-0 px-5 py-4 md:px-6 text-left"
          aria-expanded={isOpen}
          aria-controls={answerId}
        >
          <span
            className={`text-sm md:text-[14.5px] font-semibold leading-snug ${
              isOpen ? "text-[#e8d5a3]" : "text-[#e8d5a3]/90"
            }`}
            itemProp="name"
          >
            {faq.q}
          </span>
          <div
            className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-md border transition-all ${
              isOpen
                ? "border-[#5a9a52]/30 bg-[#5a9a52]/15 text-[#5a9a52]"
                : "border-[#5a9a52]/20 bg-[#5a9a52]/10 text-[#7fb870]"
            }`}
          >
            <IconChevron open={isOpen} />
          </div>
        </button>
        <div
          id={answerId}
          role="region"
          aria-labelledby={btnId}
          className={`grid transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
          itemScope
          itemProp="acceptedAnswer"
          itemType="https://schema.org/Answer"
        >
          <div className="overflow-hidden">
            <p
              className="px-5 pb-5 md:px-6 text-sm md:text-[14px] leading-relaxed text-[#e8d5a3]/70"
              itemProp="text"
            >
              {faq.a}
            </p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
});

/* ══════════════════════════════════════════════ TESTIMONIAL CARD ══════════════════════════════════════════ */

const TestimonialCard = memo(function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  const colors = AVATAR_COLORS[testimonial.color];
  return (
    <FadeIn delay={index * 90}>
      <article className="rounded-2xl border border-[#e6dcc0] bg-white p-5 md:p-6 transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(45,90,39,0.12)] h-full flex flex-col justify-between">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div
              className="flex gap-0.5"
              role="img"
              aria-label="5 out of 5 stars"
            >
              {Array.from({ length: 5 }).map((_, j) => (
                <IconStar key={j} />
              ))}
            </div>
            {testimonial.toolUsed && (
              <span className="rounded-md bg-[#2d5a27]/10 px-2 py-0.5 text-[10px] font-bold text-[#2d5a27] border border-[#2d5a27]/20">
                {testimonial.toolUsed}
              </span>
            )}
          </div>
          <blockquote className="mb-5 text-sm md:text-[14.5px] leading-relaxed text-[#3a3325]">
            "{testimonial.text}"
          </blockquote>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: colors.bg, color: colors.text }}
            aria-hidden="true"
          >
            {testimonial.avatar}
          </div>
          <div>
            <p className="text-[13.5px] font-semibold text-[#1f2e1a]">
              {testimonial.name}
            </p>
            <p className="text-xs text-[#5a6650]">{testimonial.role}</p>
          </div>
        </div>
      </article>
    </FadeIn>
  );
});

/* ══════════════════════════════════════════════ JSON-LD SCHEMAS ══════════════════════════════════════════ */

function StructuredData() {
  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    }),
    [],
  );

  const softwareSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "MotionRecap",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      description:
        "AI Manga Storyboard Studio and Animated Video Generator. Turn screenplays, scripts, and manga panels into cinematic storyboards, character model sheets, and narrated animatic videos in minutes.",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "29",
        priceCurrency: "USD",
        offerCount: "3",
      },
      featureList: [
        "AI Screenplay Breakdown & Shot Listing",
        "Character Consistency & Multi-Angle Model Sheets",
        "15+ Cinematic & Anime Art Styles",
        "Virtual Camera Director Controls",
        "100+ AI Character Voices & Speech Sync",
        "One-Click Animatic MP4 & Pitch PDF Export",
        "Manga Panel Animation & Timeline Editor",
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "2840",
        bestRating: "5",
        worstRating: "1",
      },
    }),
    [],
  );

  const howToSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to Generate an AI Manga Storyboard and Animatic",
      description:
        "A step-by-step guide to generating cinematic storyboards with consistent characters and voice acting.",
      step: STORYBOARD_STEPS.map((s, idx) => ({
        "@type": "HowToStep",
        position: idx + 1,
        name: s.title,
        text: s.desc,
      })),
    }),
    [],
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
    </>
  );
}

/* ══════════════════════════════════════════════ MAIN PAGE ══════════════════════════════════════════ */

export default function Page() {
  const router = useRouter();
  const session = useStore(useSession);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [howItWorksTab, setHowItWorksTab] = useState<"storyboard" | "panels">(
    "storyboard",
  );

  useEffect(() => {
    if (session.data) router.push("/dashboard");
  }, [session, router]);

  const handleFaqToggle = useCallback((index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  }, []);

  return (
    <>
      <StructuredData />
      <main
        className="min-h-screen overflow-x-hidden bg-[#0c170c] text-[#e8d5a3]"
        id="main-content"
      >
        <Navbar />

        {/* ── Hero Section ── */}
        <section
          className="relative overflow-hidden bg-[#040704] px-4 pb-20 pt-[120px] text-center"
          aria-labelledby="hero-heading"
        >
          {/* Halftone screentone background */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(232,213,163,0.9) 1px, transparent 1px)",
              backgroundSize: "7px 7px",
              maskImage:
                "radial-gradient(ellipse 40% 45% at 50% 40%, transparent 0%, transparent 60%, black 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 40% 45% at 50% 40%, transparent 0%, transparent 60%, black 100%)",
              opacity: 0.35,
            }}
            aria-hidden="true"
          />

          {/* Glowing wash */}
          <div
            className="pointer-events-none absolute -bottom-[20%] -left-[10%] h-[500px] w-[500px]"
            style={{
              background:
                "radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 55%)",
            }}
            aria-hidden="true"
          />

          {/* Corner brackets */}
          <svg
            className="pointer-events-none absolute left-6 top-6 h-20 w-20 opacity-40"
            aria-hidden="true"
          >
            <path d="M0 40 L40 0" stroke="#e8d5a3" strokeWidth="1.5" />
            <path d="M14 56 L56 14" stroke="#e8d5a3" strokeWidth="1.5" />
          </svg>
          <svg
            className="pointer-events-none absolute right-6 top-6 h-20 w-20 scale-x-[-1] opacity-40"
            aria-hidden="true"
          >
            <path d="M0 40 L40 0" stroke="#e8d5a3" strokeWidth="1.5" />
            <path d="M14 56 L56 14" stroke="#e8d5a3" strokeWidth="1.5" />
          </svg>

          {/* Hero Content */}
          <div className="relative z-10 mx-auto w-full max-w-4xl">
            <FadeIn delay={80}>
              <h1
                id="hero-heading"
                className="mb-6 md:mb-10 font-bold leading-[1.05] tracking-[-0.03em] text-[#e8d5a3] md:mt-15"
                style={{ fontSize: "clamp(40px, 6.5vw, 76px)" }}
              >
                Bring your manga
                <br />
                <span className="text-[#5a9a52]">panels to life</span>
              </h1>
            </FadeIn>

            <FadeIn delay={160}>
              <p
                className="mx-auto mb-6 md:mb-10 max-w-[640px] leading-relaxed text-[#e8d5a3]/75"
                style={{ fontSize: "clamp(16px, 2vw, 20px)" }}
              >
                Upload manga images, assign 100+ AI character voices, compose a
                multi-scene timeline, and export a cinematic MP4 — in minutes.
              </p>
            </FadeIn>

            <FadeIn delay={240}>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="/signup"
                  className="inline-flex min-h-12 w-full md:w-max mx-5 md:mx-0 justify-center items-center gap-2 rounded-xl border border-[#5a9a52]/50 bg-[#2d5a27] px-7 py-3.5 text-[15px] font-semibold text-[#e8d5a3] no-underline transition-all hover:bg-[#3a7033] hover:border-[#5a9a52]/80 hover:shadow-[0_8px_30px_rgba(45,90,39,0.35)]"
                >
                  Start creating free <IconArrow />
                </a>
                <a
                  href="#storyboard"
                  className="inline-flex min-h-12 w-full md:w-max mx-5 md:mx-0 justify-center items-center gap-2 rounded-xl border border-[#c9a84c]/50 bg-[#c9a84c]/10 px-7 py-3.5 text-[15px] font-semibold text-[#e8d5a3] no-underline transition-all hover:bg-[#c9a84c]/20 hover:border-[#c9a84c]/80"
                >
                  Explore Storyboard Studio ✨
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={320}>
              <div className="mt-10 flex items-center justify-center gap-1.5 text-[15px] text-[#e8d5a3]/60">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IconStar key={i} />
                ))}
                <span className="ml-1">
                  Loved by 2,800+ manga artists & animation directors
                </span>
              </div>
            </FadeIn>
          </div>

          {/* Panel Editor mockup */}
          <div className="relative z-10 mx-auto w-full max-w-5xl mt-12">
            <FadeIn delay={400}>
              <EditorMockup />
            </FadeIn>
          </div>
        </section>

        {/* ── Social Proof Strip ── */}
        <div
          className="border-y border-[#5a9a52]/18 bg-[#081208]/60 px-5 py-4"
          aria-label="Key benefits"
        >
          <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6 md:gap-8 text-[13px] text-[#e8d5a3]/70">
            {SOCIAL_PROOF_ITEMS.map((text) => (
              <li key={text} className="flex items-center gap-1.5">
                <span className="text-[#6cec5b]" aria-hidden="true">
                  <IconCheck />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Features Section ── */}
        <section
          id="features"
          className="bg-[#fceeca] px-4 py-16 md:px-6 md:py-32"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-6xl">
            <FadeIn>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5a8a4f]">
                Feature Suite
              </p>
              <h2
                id="features-heading"
                className="mb-4 max-w-xl text-3xl font-semibold leading-tight text-[#3a7033] md:text-5xl"
              >
                Everything you need to direct & animate manga
              </h2>
              <p className="mb-12 md:mb-16 max-w-xl text-lg leading-relaxed text-[#4a7a42]">
                A complete studio suite — whether you start with finished manga
                scans or an unwritten screenplay.
              </p>
            </FadeIn>

            <div className="grid overflow-hidden rounded-2xl border border-[#2d5a27]/20 bg-[#2d5a27]/15 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  feature={feature}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Interactive Demos (Panel Timeline & Voice) ── */}
        <section
          className="border-t border-[#5a9a52]/12 px-4 md:px-6 pb-24 md:pb-32"
          aria-labelledby="demo-heading"
        >
          <div className="mx-auto max-w-[1080px] pt-16 md:pt-20">
            <FadeIn>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#7fb870]">
                Interactive Playground
              </p>
              <h2
                id="demo-heading"
                className="mb-14 max-w-[540px] font-semibold leading-tight text-[#e8d5a3]"
                style={{ fontSize: "clamp(26px, 3.5vw, 42px)" }}
              >
                Experience the Panel Editor & Voice Engine
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FadeIn>
                <div>
                  <p className="mb-3.5 text-xs tracking-wide text-[#e8d5a3]/55">
                    Click scenes to explore the timeline →
                  </p>
                  <TimelineDemo />
                </div>
              </FadeIn>
              <FadeIn delay={120}>
                <div>
                  <p className="mb-3.5 text-xs tracking-wide text-[#e8d5a3]/55">
                    Click ▶ to preview any voice →
                  </p>
                  <VoiceDemo />
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── How It Works (Tabs for Storyboard vs Panel Animator) ── */}
        <section
          id="how-it-works"
          className="border-t border-[#5a9a52]/18 bg-[#0c170c] px-4 md:px-6 py-20 md:py-32"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-[1080px]">
            <FadeIn>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#7fb870]">
                    Creation Workflows
                  </p>
                  <h2
                    id="how-heading"
                    className="font-semibold leading-tight text-[#e8d5a3]"
                    style={{ fontSize: "clamp(28px, 4vw, 46px)" }}
                  >
                    Simple 4-Step Production
                  </h2>
                </div>

                {/* Workflow switcher buttons */}
                <div className="flex items-center gap-2 rounded-xl bg-[#060c06] p-1.5 border border-[#5a9a52]/30">
                  <button
                    onClick={() => setHowItWorksTab("storyboard")}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                      howItWorksTab === "storyboard"
                        ? "bg-[#2d5a27] text-[#d4edb8] shadow-sm border border-[#5a9a52]/60"
                        : "text-[#7fb870] hover:text-[#e8d5a3]"
                    }`}
                  >
                    ✨ Path A: Script to Storyboard
                  </button>
                  <button
                    onClick={() => setHowItWorksTab("panels")}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                      howItWorksTab === "panels"
                        ? "bg-[#2d5a27] text-[#d4edb8] shadow-sm border border-[#5a9a52]/60"
                        : "text-[#7fb870] hover:text-[#e8d5a3]"
                    }`}
                  >
                    🎬 Path B: Manga Panels to Video
                  </button>
                </div>
              </div>
            </FadeIn>

            <ol className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
              {(howItWorksTab === "storyboard"
                ? STORYBOARD_STEPS
                : PANEL_STEPS
              ).map((step, i) => (
                <li key={step.n} className="relative pr-7">
                  <FadeIn delay={i * 100}>
                    <div className="mb-5 text-[36px] font-bold leading-none tabular-nums text-[#5a9a52]/80">
                      {step.n}
                    </div>

                    <div
                      className="mb-5 h-8 w-0.5 rounded-full bg-[#5a9a52]/30"
                      aria-hidden="true"
                    />

                    <h3 className="mb-2.5 text-base font-semibold text-[#e8d5a3]">
                      {step.title}
                    </h3>

                    <p className="m-0 text-sm leading-relaxed text-[#e8d5a3]/65">
                      {step.desc}
                    </p>
                  </FadeIn>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section
          className="border-t border-[#5a9a52]/18 bg-[#fceeca] px-4 md:px-6 py-20 md:py-32"
          aria-labelledby="testimonials-heading"
        >
          <div className="mx-auto max-w-[1080px]">
            <FadeIn>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#4a7a42]">
                Creator Testimonials
              </p>
              <h2
                id="testimonials-heading"
                className="mb-4 max-w-[500px] font-semibold leading-tight text-[#1f2e1a]"
                style={{ fontSize: "clamp(26px, 3.5vw, 42px)" }}
              >
                Trusted by storytellers & manga creators
              </h2>
              <p className="mb-14 max-w-[480px] text-[15px] leading-relaxed text-[#5a6650]">
                From indie webcomic writers to studio animators, here is how
                creators are speeding up their workflow.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.name}
                  testimonial={testimonial}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section
          className="border-t border-[#5a9a52]/15 px-4 md:px-6 pb-28 md:pb-32"
          aria-labelledby="faq-heading"
        >
          <div className="mx-auto max-w-[680px] pt-24 md:pt-28">
            <FadeIn>
              <div className="mb-12 text-center">
                <span className="badge-pill mb-4 inline-flex">FAQ</span>
                <h2
                  id="faq-heading"
                  className="m-0 font-bold leading-tight tracking-tight text-[#e8d5a3]"
                  style={{
                    fontSize: "clamp(26px, 3.5vw, 42px)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Frequently asked questions
                </h2>
              </div>
            </FadeIn>

            <div className="flex flex-col gap-2">
              {FAQS.map((faq, i) => (
                <FaqItem
                  key={faq.q}
                  faq={faq}
                  index={i}
                  isOpen={openFaq === i}
                  onToggle={() => handleFaqToggle(i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section
          className="relative overflow-hidden border-t border-[#5a9a52]/15 px-4 md:px-6 pb-20 md:pb-32 text-center"
          aria-labelledby="cta-heading"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(74,138,66,0.08)_0%,transparent_65%)]"
            aria-hidden="true"
          />

          <FadeIn>
            <div className="relative pt-24 md:pt-28">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#5a9a52]/25 bg-[#5a9a52]/10 px-5 py-2">
                <IconZap />
                <span className="text-xs font-medium text-[#9fd48e]">
                  Free to start — no credit card needed
                </span>
              </div>

              <h2
                id="cta-heading"
                className="mx-auto mb-6 max-w-[550px] font-bold leading-tight text-[#e8d5a3]"
                style={{
                  fontSize: "clamp(28px, 4.5vw, 48px)",
                  letterSpacing: "-0.025em",
                }}
              >
                Ready to visualize & animate
                <br />
                your stories?
              </h2>

              <p className="mx-auto mb-10 max-w-[440px] text-[15px] leading-relaxed text-[#e8d5a3]/65">
                Join 2,800+ creators using MotionRecap to turn scripts into
                storyboards and manga panels into viral videos.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="/signup"
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-[#5a9a52]/50 bg-[#2d5a27] px-8 py-4 text-base font-semibold text-[#e8d5a3] no-underline transition-all hover:bg-[#3a7033] hover:border-[#5a9a52]/80 hover:shadow-[0_8px_30px_rgba(45,90,39,0.3)]"
                >
                  Get started for free <IconArrow />
                </a>
              </div>
            </div>
          </FadeIn>
        </section>

        <Footer />
      </main>
    </>
  );
}
