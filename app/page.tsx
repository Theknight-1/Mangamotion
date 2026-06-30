"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo, memo, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

/* ══════════════════════════════════════════════ TYPES ══════════════════════════════════════════ */

interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
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
  "5 free videos on signup",
  "100+ AI voices",
  "Export MP4 instantly",
  "FFmpeg-powered rendering",
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

const STEPS: Step[] = [
  {
    n: "01",
    title: "Upload your panel",
    desc: "Drop in a manga image — JPG or PNG, up to 10 MB. We handle the rest.",
  },
  {
    n: "02",
    title: "Build a timeline",
    desc: "Add scenes, set durations, reorder until the pacing feels right.",
  },
  {
    n: "03",
    title: "Assign AI voices",
    desc: "Pick from 20k+ character voices. Preview before committing.",
  },
  {
    n: "04",
    title: "Export your video",
    desc: "Hit render. Download an MP4 in minutes, ready to share.",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    text: "I went from a folder of scanned chapters to a finished short in one afternoon. The voice matching alone saved me a full day of editing.",
    name: "Haruto Sasaki",
    role: "Manga creator, Osaka",
    avatar: "HS",
    color: "coral",
  },
  {
    text: "My readers always asked what my characters sounded like. Now they just watch the clip.",
    name: "Amara Okafor",
    role: "Webcomic artist, Lagos",
    avatar: "AO",
    color: "amber",
  },
  {
    text: "The panel-to-pan timing is the part nobody else gets right. MotionRecap nails the pacing without me touching a single keyframe.",
    name: "Diego Fonseca",
    role: "YouTube editor, São Paulo",
    avatar: "DF",
    color: "teal",
  },
  {
    text: "20,000 voices sounded like a gimmick until I actually needed a gravelly old swordsman at 11pm before a deadline.",
    name: "Priya Nair",
    role: "Indie animator, Bengaluru",
    avatar: "PN",
    color: "purple",
  },
  {
    text: "Switched three channels over from manual After Effects work. Render quality holds up even at 4K.",
    name: "Mateusz Wójcik",
    role: "Studio lead, Kraków",
    avatar: "MW",
    color: "pink",
  },
  {
    text: "It understands speech bubbles, not just panels. That's the difference between a slideshow and an actual scene.",
    name: "Soo-ah Lim",
    role: "Content creator, Seoul",
    avatar: "SL",
    color: "coral",
  },
];

const FAQS: Faq[] = [
  {
    q: "How does billing work?",
    a: "Paid plans are billed monthly in USD via Razorpay or PayPal. You can upgrade, downgrade, or cancel from your account settings at any time.",
  },
  {
    q: "What happens if I exceed my plan's limits?",
    a: "We'll notify you as you approach your monthly video or minute cap. You can upgrade instantly to keep rendering, or wait until your limits reset next month.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — cancel whenever you like. You'll keep access until the end of your current billing period, no cancellation fees.",
  },
  {
    q: "Do unused videos roll over?",
    a: "No, monthly video and minute allowances reset at the start of each billing cycle.",
  },
  {
    q: "What's the difference between Starter and Pro?",
    a: "Starter is built for casual creators posting a few times a week — Pro adds 4K export, SFX, custom branding, and priority rendering for channels publishing daily.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Major credit/debit cards and PayPal internationally, plus UPI and net banking via Razorpay for users in India.",
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
    width="14"
    height="14"
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
    icon: <IconUpload />,
    title: "Drag & drop upload",
    desc: "Upload any manga panel as JPG or PNG. Auto-optimised and stored securely.",
  },
  {
    icon: <IconVoice />,
    title: "100+ AI voices",
    desc: "CVoice AI integration. Preview and assign character voices per scene.",
  },
  {
    icon: <IconTimeline />,
    title: "Visual timeline editor",
    desc: "Set duration, reorder scenes, and sync audio with a drag-and-drop timeline.",
  },
  {
    icon: <IconRender />,
    title: "One-click render",
    desc: "FFmpeg pipeline composites scenes and audio into a polished MP4 automatically.",
  },
  {
    icon: <IconExport />,
    title: "Instant MP4 download",
    desc: "Private download link the moment rendering completes. Yours to keep.",
  },
  {
    icon: <IconProfiles />,
    title: "Voice profile library",
    desc: "Save and reuse favourite voices across all your projects with one tap.",
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
              onClick={() => setSelected(index)}
              onKeyDown={(e) => e.key === "Enter" && setSelected(index)}
              tabIndex={0}
              role="button"
              aria-selected={isSelected}
              className={`flex min-h-11 cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-colors ${
                isSelected
                  ? "border-[#5a9a52] bg-[#5a9a52]/30"
                  : "border-[#5a9a52]/20 bg-[#5a9a52]/10 hover:bg-[#5a9a52]/15"
              }`}
            >
              <span
                className={`text-xs ${
                  isSelected ? "text-[#d4edb8]" : "text-[#8fb880]"
                }`}
              >
                {voice}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(index);
                  togglePlay(index);
                }}
                aria-label={`Preview ${voice}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-[#5a9a52]/15"
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
      <article className="bg-[#1a2d1a] p-6 md:p-8 transition-colors hover:bg-[#1e351e]">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[#5a9a52]/30 bg-[#fceeca] text-[#3a7033]">
          {feature.icon}
        </div>
        <h3 className="mb-2 text-[15px] font-semibold text-[#e8d5a3]">
          {feature.title}
        </h3>
        <p className="text-[13.5px] leading-7 text-[#e8d5a3]/65">
          {feature.desc}
        </p>
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
      <article className="rounded-2xl border border-[#e6dcc0] bg-white p-5 md:p-6 transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(45,90,39,0.12)]">
        <div className="mb-4 flex gap-0.5" aria-label="5 out of 5 stars">
          {Array.from({ length: 5 }).map((_, j) => (
            <IconStar key={j} />
          ))}
        </div>
        <blockquote className="mb-5 text-sm md:text-[14.5px] leading-relaxed text-[#3a3325]">
          {testimonial.text}
        </blockquote>
        <div className="flex items-center gap-3">
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
      name: "MangaMotion",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      description:
        "Upload manga panels and let AI generate narration, character voices, and a cinematic 9:16 video in minutes. Built for YouTube Shorts and TikTok manga recap creators.",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "29",
        priceCurrency: "USD",
        offerCount: "3",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "2400",
        bestRating: "5",
        worstRating: "1",
      },
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
    </>
  );
}

/* ══════════════════════════════════════════════ MAIN PAGE ══════════════════════════════════════════ */

export default function Page() {
  const router = useRouter();
  const session = useStore(useSession);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (session.data) router.push("/dashboard");
  }, [session, router]);

  const handleFaqToggle = useCallback((index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  }, []);

  return (
    <>
      <StructuredData />
      {/* 
        NOTE: Lighthouse flags robots.txt with 13 errors.
        Fix: Add a valid /public/robots.txt file:
        
        User-agent: *
        Allow: /
        Sitemap: https://yourdomain.com/sitemap.xml
      */}
      <main
        className="min-h-screen overflow-x-hidden bg-[#0c170c] text-[#e8d5a3]"
        id="main-content"
      >
        <Navbar />

        {/* ── Hero Section ── */}
        <section
          className="relative flex min-h-screen items-center justify-center px-4 pb-20 pt-[120px] text-center"
          aria-labelledby="hero-heading"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-[20%] h-[600px] w-[600px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(74,138,66,0.15)_0%,transparent_70%)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-[10%] left-[15%] h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(201,168,76,0.06)_0%,transparent_70%)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto w-full max-w-4xl">
            <FadeIn delay={80}>
              <h1
                id="hero-heading"
                className="mb-10 font-bold leading-[1.05] tracking-[-0.03em] text-[#e8d5a3] md:mt-15"
                style={{ fontSize: "clamp(40px, 6.5vw, 76px)" }}
              >
                Bring your manga
                <br />
                <span className="text-[#5a9a52]">panels to life</span>
              </h1>
            </FadeIn>

            <FadeIn delay={160}>
              <p
                className="mx-auto mb-10 max-w-[560px] leading-snug text-[#e8d5a3]/70"
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
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#5a9a52]/50 bg-[#2d5a27] px-7 py-3.5 text-[15px] font-semibold text-[#e8d5a3] no-underline transition-all hover:bg-[#3a7033] hover:border-[#5a9a52]/80"
                >
                  Start creating free <IconArrow />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[#5a9a52]/30 px-7 py-3.5 text-[15px] font-medium text-[#e8d5a3]/65 no-underline transition-all hover:border-[#5a9a52]/55 hover:text-[#e8d5a3]"
                >
                  See how it works
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={320}>
              <div className="mt-10 flex items-center justify-center gap-1.5 text-[13px] text-[#e8d5a3]/60">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IconStar key={i} />
                ))}
                <span className="ml-1">Loved by 2,400+ manga creators</span>
              </div>
            </FadeIn>

            {/* Editor mockup */}
            <FadeIn delay={400}>
              <div className="relative mt-16">
                <div
                  className="pointer-events-none absolute -inset-px rounded-[20px] bg-gradient-to-b from-[#5a9a52]/35 to-transparent z-10"
                  aria-hidden="true"
                />
                <div className="overflow-hidden rounded-[18px] border border-[#5a9a52]/30 bg-[#142114]">
                  <div className="flex items-center gap-1.5 border-b border-[#5a9a52]/18 px-[18px] py-3">
                    {[
                      "rgba(232,100,100,0.75)",
                      "rgba(232,180,60,0.75)",
                      "rgba(60,180,60,0.75)",
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: c }}
                        aria-hidden="true"
                      />
                    ))}
                    <div className="flex-1 text-center">
                      <span className="rounded-md bg-[#5a9a52]/12 px-4 py-0.5 text-[11px] text-[#e8d5a3]/75">
                        Fight Scene — Editor
                      </span>
                    </div>
                  </div>

                  <div className="grid min-h-[220px] grid-cols-1 md:grid-cols-2">
                    <div className="flex items-center justify-center border-r border-[#5a9a52]/12 p-4 md:p-5">
                      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[10px] border border-[#5a9a52]/18 bg-[#0c170c]">
                        <div
                          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(74,138,66,0.06),transparent)]"
                          aria-hidden="true"
                        />
                        <div className="text-center">
                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#5a9a52]/25 bg-[#5a9a52]/20 text-[#5a9a52]">
                            <IconPlay />
                          </div>
                          <p className="text-[11px] text-[#e8d5a3]/40">
                            Preview panel
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <p className="mb-2.5 text-[9px] uppercase tracking-[0.15em] text-[#e8d5a3]/40">
                        Timeline
                      </p>
                      {TIMELINE_SCENES.slice(0, 3).map(
                        ({ label, dur, voice }, i) => (
                          <div
                            key={label}
                            className={`mb-1.5 rounded-md border p-2 ${
                              i === 0
                                ? "border-[#5a9a52]/35 bg-[#5a9a52]/18"
                                : "border-[#5a9a52]/15 bg-[#5a9a52]/6"
                            }`}
                          >
                            <p
                              className={`text-[11px] font-medium ${i === 0 ? "text-[#d4edb8]" : "text-[#e8d5a3]/50"}`}
                            >
                              {label} — {dur}s
                            </p>
                            {voice && (
                              <p className="mt-0.5 text-[9px] text-[#7fb870]">
                                Voice active
                              </p>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── Social Proof Strip ── */}
        <div
          className="border-y border-[#5a9a52]/18 px-5 py-4"
          aria-label="Key benefits"
        >
          <ul className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-center gap-6 md:gap-8 text-[13px] text-[#e8d5a3]/60">
            {SOCIAL_PROOF_ITEMS.map((text) => (
              <li key={text} className="flex items-center gap-1.5">
                <span className="text-[#5a9a52]" aria-hidden="true">
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
                Features
              </p>
              <h2
                id="features-heading"
                className="mb-4 max-w-xl text-3xl font-semibold leading-tight text-[#3a7033] md:text-5xl"
              >
                Everything you need to animate manga
              </h2>
              <p className="mb-12 md:mb-16 max-w-md text-lg leading-relaxed text-[#4a7a42]">
                A complete end-to-end pipeline — from static panels to polished
                video.
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

        {/* ── Interactive Demos ── */}
        <section
          className="border-t border-[#5a9a52]/12 px-4 md:px-6 pb-24 md:pb-32"
          aria-labelledby="demo-heading"
        >
          <div className="mx-auto max-w-[1080px] pt-16 md:pt-20">
            <FadeIn>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#7fb870]">
                Try it live
              </p>
              <h2
                id="demo-heading"
                className="mb-14 max-w-[500px] font-semibold leading-tight text-[#e8d5a3]"
                style={{ fontSize: "clamp(26px, 3.5vw, 42px)" }}
              >
                See the editor in action
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

        {/* ── How It Works ── */}
        <section
          id="how-it-works"
          className="border-t border-[#5a9a52]/18 bg-[#0c170c] px-4 md:px-6 py-20 md:py-32"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-[1080px]">
            <FadeIn>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#7fb870]">
                How it works
              </p>
              <h2
                id="how-heading"
                className="mb-16 max-w-[440px] font-semibold leading-tight text-[#e8d5a3]"
                style={{ fontSize: "clamp(28px, 4vw, 46px)" }}
              >
                From panel to video in four steps
              </h2>
            </FadeIn>

            <ol className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <FadeIn key={step.n} delay={i * 100}>
                  <li className="relative pr-7">
                    <div className="mb-5 text-[36px] font-bold leading-none tabular-nums text-[#5a9a52]/30">
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
                  </li>
                </FadeIn>
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
                Creators love it
              </p>
              <h2
                id="testimonials-heading"
                className="mb-4 max-w-[480px] font-semibold leading-tight text-[#1f2e1a]"
                style={{ fontSize: "clamp(26px, 3.5vw, 42px)" }}
              >
                Trusted by manga creators
              </h2>
              <p className="mb-14 max-w-[460px] text-[15px] leading-relaxed text-[#5a6650]">
                From solo webcomic artists to studio teams, here's who's already
                turning panels into video.
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
                  Free to start — no credit card
                </span>
              </div>

              <h2
                id="cta-heading"
                className="mx-auto mb-6 max-w-[500px] font-bold leading-tight text-[#e8d5a3]"
                style={{
                  fontSize: "clamp(28px, 4.5vw, 48px)",
                  letterSpacing: "-0.025em",
                }}
              >
                Ready to animate
                <br />
                your manga?
              </h2>

              <p className="mx-auto mb-10 max-w-[400px] text-[15px] leading-relaxed text-[#e8d5a3]/65">
                Join 2,400+ creators already using MangaMotion to turn panels
                into scroll-stopping videos.
              </p>

              <a
                href="/signup"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-[#5a9a52]/50 bg-[#2d5a27] px-8 py-4 text-base font-semibold text-[#e8d5a3] no-underline transition-all hover:bg-[#3a7033] hover:border-[#5a9a52]/80 hover:shadow-[0_8px_30px_rgba(45,90,39,0.3)]"
              >
                Get started for free <IconArrow />
              </a>
            </div>
          </FadeIn>
        </section>

        <Footer />
      </main>
    </>
  );
}
