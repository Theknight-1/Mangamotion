"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useStore } from "@nanostores/react";
import { useSession } from "@/lib/auth-client";
import { IconLogo } from "@/components/icon-logo";

/* ── tiny helpers ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── custom svg icons ── */
const IconUpload = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="14" width="18" height="6" rx="2" />
    <path d="M11 2v10M7 6l4-4 4 4" />
    <circle cx="17" cy="17" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconVoice = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="8" y="1" width="6" height="11" rx="3" />
    <path d="M4 10a7 7 0 0 0 14 0" />
    <line x1="11" y1="17" x2="11" y2="21" />
    <line x1="7" y1="21" x2="15" y2="21" />
    <path d="M6 7h2M14 7h2M6 10h2M14 10h2" strokeWidth="1" />
  </svg>
);
const IconTimeline = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="2" y1="11" x2="20" y2="11" />
    <rect x="3" y="7" width="5" height="8" rx="1.5" />
    <rect x="10" y="5" width="5" height="12" rx="1.5" />
    <rect x="17" y="8" width="3" height="6" rx="1" />
    <circle cx="5.5" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="11" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconRender = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="4,3 18,11 4,19" />
    <path d="M18 3v16" strokeDasharray="2 2" />
    <circle cx="18" cy="3" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="18" cy="19" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
const IconExport = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    <path d="M11 2v12M7 10l4 4 4-4" />
    <path d="M2 8h3M17 8h3" strokeDasharray="1.5 1.5" />
  </svg>
);
const IconProfiles = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="7" r="3" />
    <circle cx="15" cy="9" r="2.5" strokeDasharray="2 1.5" />
    <path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M15 14c1.7.5 3 2.1 3 4" />
  </svg>
);
const IconArrow = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.5 7.5h10M9 4l3.5 3.5L9 11" />
  </svg>
);
const IconCheck = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 13 13"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 7l3.5 3.5L11 3" />
  </svg>
);

const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="#c9a84c" stroke="none">
    <path d="M7 1l1.5 4h4l-3.3 2.4 1.3 4L7 9l-3.5 2.4 1.3-4L1.5 5h4z" />
  </svg>
);
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M3 2.5l9 4.5-9 4.5z" />
  </svg>
);

/* ── feature data ── */
const FEATURES = [
  {
    icon: <IconUpload />,
    title: "Drag & drop upload",
    desc: "Upload any manga panel as JPG or PNG. Auto-optimised and stored securely.",
  },
  {
    icon: <IconVoice />,
    title: "20,000+ AI voices",
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

const STEPS = [
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

const TESTIMONIALS = [
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
    text: "The panel-to-pan timing is the part nobody else gets right. MangaMotion nails the pacing without me touching a single keyframe.",
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

const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  coral: { bg: "#F5C4B3", text: "#712B13" },
  amber: { bg: "#FAC775", text: "#633806" },
  teal: { bg: "#9FE1CB", text: "#085041" },
  purple: { bg: "#CECBF6", text: "#3C3489" },
  pink: { bg: "#F4C0D1", text: "#72243E" },
};

/* ── fade-in wrapper ── */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── interactive timeline demo ── */
function TimelineDemo() {
  const [active, setActive] = useState(0);
  const scenes = [
    { label: "Scene 1", dur: 3, voice: true, color: "#2d5a27" },
    { label: "Scene 2", dur: 5, voice: true, color: "#3a7033" },
    { label: "Scene 3", dur: 4, voice: false, color: "#2d5a27" },
    { label: "Scene 4", dur: 6, voice: true, color: "#3a7033" },
  ];
  const total = scenes.reduce((a, s) => a + s.dur, 0);

  return (
    <div
      style={{
        background: "#0d1f0b",
        border: "1px solid rgba(45,90,39,0.4)",
        borderRadius: 16,
        padding: "20px 24px",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "#6b9e62",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Timeline editor
        </span>
        <span style={{ fontSize: 11, color: "#4a7a42" }}>Total: {total}s</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {scenes.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              flex: s.dur,
              background: active === i ? "#2d5a27" : "rgba(45,90,39,0.15)",
              border: `1px solid ${active === i ? "#4a8a42" : "rgba(45,90,39,0.25)"}`,
              borderRadius: 8,
              padding: "8px 6px",
              cursor: "pointer",
              transition: "all 0.2s",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: active === i ? "#c8e6b8" : "#4a7a42",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 10,
                color: active === i ? "#7fba6e" : "#3a6032",
                marginTop: 2,
              }}
            >
              {s.dur}s{s.voice ? " 🎙" : ""}
            </div>
          </button>
        ))}
      </div>
      <div
        style={{
          background: "rgba(45,90,39,0.12)",
          borderRadius: 10,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#7fb870", fontWeight: 500 }}>
            {scenes[active].label}
          </span>
          <span style={{ fontSize: 11, color: "#4a7a42" }}>
            Duration: {scenes[active].dur}s
          </span>
        </div>
        <div
          style={{
            height: 4,
            background: "rgba(45,90,39,0.2)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(scenes[active].dur / 6) * 100}%`,
              background: "#4a8a42",
              borderRadius: 2,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: scenes[active].voice ? "#7fb870" : "#4a5a44",
          }}
        >
          {scenes[active].voice
            ? "✓ Voice assigned"
            : "No voice — click 'Add Voice' to assign"}
        </div>
      </div>
    </div>
  );
}

/* ── interactive voice picker demo ── */
function VoiceDemo() {
  const voices = [
    "Naruto Uzumaki",
    "Light Yagami",
    "Levi Ackerman",
    "Goku",
    "Spike Spiegel",
    "Edward Elric",
  ];
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);

  function togglePlay(i: number) {
    setPlaying((p) => (p === i ? null : i));
    if (playing !== i) setTimeout(() => setPlaying(null), 2000);
  }

  return (
    <div
      style={{
        background: "#0d1f0b",
        border: "1px solid rgba(45,90,39,0.4)",
        borderRadius: 16,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          color: "#6b9e62",
          textTransform: "uppercase",
          fontWeight: 500,
          marginBottom: 14,
        }}
      >
        Voice picker — 20,000+ available
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {voices.map((v, i) => (
          <div
            key={i}
            onClick={() => setSelected(i)}
            style={{
              background:
                selected === i ? "rgba(45,90,39,0.35)" : "rgba(45,90,39,0.1)",
              border: `1px solid ${selected === i ? "#4a8a42" : "rgba(45,90,39,0.2)"}`,
              borderRadius: 8,
              padding: "9px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.18s",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: selected === i ? "#c8e6b8" : "#6b9a60",
              }}
            >
              {v}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelected(i);
                togglePlay(i);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: playing === i ? "#c9a84c" : "#4a7a42",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <IconPlay />
            </button>
          </div>
        ))}
      </div>
      {selected !== null && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "rgba(45,90,39,0.18)",
            borderRadius: 8,
            fontSize: 12,
            color: "#7fb870",
          }}
        >
          {playing === selected ? (
            <span style={{ color: "#c9a84c" }}>
              Playing preview for {voices[selected]}…
            </span>
          ) : (
            <span>
              Selected:{" "}
              <strong style={{ color: "#c8e6b8" }}>{voices[selected]}</strong> —
              click ▶ to preview
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── pricing toggle ── */
function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const plans = [
    {
      name: "Free",
      mo: 0,
      yr: 0,
      desc: "Try it out, no card needed.",
      features: [
        "5 videos / month",
        "30 min total",
        "All 20k+ voices",
        "MP4 export",
      ],
      cta: "Get started free",
      highlight: false,
    },
    {
      name: "Pro",
      mo: 99,
      yr: 79,
      desc: "For regular manga creators.",
      features: [
        "50 videos / month",
        "300 min total",
        "All 20k+ voices",
        "Priority rendering",
        "Voice profile library",
      ],
      cta: "Start Pro",
      highlight: true,
    },
    {
      name: "Premium",
      mo: 299,
      yr: 239,
      desc: "Unlimited creative power.",
      features: [
        "Unlimited videos",
        "Unlimited minutes",
        "All 20k+ voices",
        "Fastest rendering",
        "Early feature access",
        "Dedicated support",
      ],
      cta: "Start Premium",
      highlight: false,
    },
  ];

  return (
    <section
      id="pricing"
      style={{
        padding: "120px 24px",
        borderTop: "1px solid rgba(45,90,39,0.18)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <FadeIn>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "#6b9e62",
              textTransform: "uppercase",
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            Pricing
          </p>
          <h2
            style={{
              fontSize: "clamp(28px,4vw,46px)",
              fontWeight: 600,
              color: "#e8d5a3",
              lineHeight: 1.15,
              margin: "0 0 16px",
            }}
          >
            Simple, honest pricing
          </h2>
          <p
            style={{
              color: "rgba(232,213,163,0.45)",
              fontSize: 17,
              marginBottom: 36,
            }}
          >
            Start free. Pay only when your projects grow.
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(45,90,39,0.15)",
              border: "1px solid rgba(45,90,39,0.3)",
              borderRadius: 10,
              padding: "8px 14px",
              marginBottom: 40,
            }}
          >
            <button
              onClick={() => setAnnual(false)}
              style={{
                fontSize: 13,
                fontWeight: annual ? 400 : 600,
                color: annual ? "rgba(232,213,163,0.4)" : "#e8d5a3",
                border: "none",
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: 6,
                background: annual ? "none" : "rgba(45,90,39,0.3)",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                fontSize: 13,
                fontWeight: annual ? 600 : 400,
                color: annual ? "#e8d5a3" : "rgba(232,213,163,0.4)",
                background: annual ? "rgba(45,90,39,0.3)" : "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: 6,
              }}
            >
              Annual{" "}
              <span style={{ fontSize: 11, color: "#c9a84c", marginLeft: 4 }}>
                save 20%
              </span>
            </button>
          </div>
        </FadeIn>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 16,
          }}
        >
          {plans.map((p, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div
                style={{
                  background: p.highlight ? "rgba(45,90,39,0.1)" : "#0a180a",
                  border: p.highlight
                    ? "1.5px solid rgba(74,138,66,0.6)"
                    : "1px solid rgba(45,90,39,0.22)",
                  borderRadius: 18,
                  padding: "32px 28px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "border-color 0.2s",
                  position: "relative",
                }}
              >
                {p.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#c9a84c",
                      color: "#1a0e00",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "4px 14px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Most popular
                  </div>
                )}
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(232,213,163,0.5)",
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  {p.name}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 42,
                      fontWeight: 700,
                      color: "#e8d5a3",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {p.mo === 0 ? "₹0" : `₹${annual ? p.yr : p.mo}`}
                  </span>
                  {p.mo > 0 && (
                    <span
                      style={{ fontSize: 13, color: "rgba(232,213,163,0.35)" }}
                    >
                      /mo
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(232,213,163,0.4)",
                    marginBottom: 24,
                  }}
                >
                  {p.desc}
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 28px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {p.features.map((f, j) => (
                    <li
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13.5,
                        color: "rgba(232,213,163,0.6)",
                      }}
                    >
                      <span style={{ color: "#4a8a42", flexShrink: 0 }}>
                        <IconCheck />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  style={{
                    display: "block",
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "13px 0",
                    borderRadius: 10,
                    textDecoration: "none",
                    transition: "all 0.2s",
                    background: p.highlight ? "#2d5a27" : "transparent",
                    color: p.highlight ? "#e8d5a3" : "rgba(232,213,163,0.5)",
                    border: p.highlight
                      ? "none"
                      : "1px solid rgba(45,90,39,0.35)",
                  }}
                >
                  {p.cta}
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════ MAIN PAGE ══════════════════════════════════════════ */
export default function Page() {
  const router = useRouter();
  const session = useStore(useSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (session.data) router.push("/dashboard");
  }, [session, router]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const NAV_LINKS = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <main
      style={{
        background: "#060e06",
        color: "#e8d5a3",
        fontFamily: "inherit",
        overflowX: "hidden",
      }}
    >
      {/* Premium Floating Navbar */}
      <nav
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,

          width: "calc(100% - 32px)",
          maxWidth: 1100,

          background: scrolled ? "rgba(8,16,8,0.82)" : "rgba(8,16,8,0.58)",

          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",

          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: 18,

          boxShadow: scrolled
            ? "0 12px 40px rgba(0,0,0,0.35)"
            : "0 8px 30px rgba(0,0,0,0.25)",

          transition: "all 0.35s ease",
          overflow: "hidden",
        }}
      >
        {/* Glow Effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            background:
              "radial-gradient(circle at top center, rgba(201,168,76,0.12), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            height: 68,
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Logo */}
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <IconLogo />

            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#e8d5a3",
                letterSpacing: "-0.02em",
              }}
            >
              MangaMotion
            </span>
          </a>

          {/* Desktop Nav */}
          <div
            className="hide-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 14,
                  color: "rgba(232,213,163,0.65)",
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: 10,
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                  e.currentTarget.style.color = "#e8d5a3";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(232,213,163,0.65)";
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <a
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(232,213,163,0.65)",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 10,
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#e8d5a3";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(232,213,163,0.65)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Sign In
            </a>

            <a
              href="/signup"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#060e06",
                background: "linear-gradient(135deg,#c9a84c 0%,#e8d5a3 100%)",
                padding: "10px 20px",
                borderRadius: 12,
                textDecoration: "none",
                letterSpacing: "0.01em",
                boxShadow: "0 4px 20px rgba(201,168,76,0.35)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(201,168,76,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(201,168,76,0.35)";
              }}
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ── hero ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px 80px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(45,90,39,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "15%",
            width: 300,
            height: 300,
            background:
              "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }} className="w-4xl">
          <FadeIn delay={80}>
            <h1
              style={{
                fontSize: "clamp(36px,6.5vw,76px)",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                margin: "60px 0 40px 0",
                color: "#e8d5a3",
              }}
            >
              Bring your manga
              <br />
              <span style={{ color: "#4a8a42" }}>panels to life</span>
            </h1>
          </FadeIn>

          <FadeIn delay={160}>
            <p
              style={{
                fontSize: "clamp(16px,2vw,20px)",
                color: "rgba(232,213,163,0.45)",
                lineHeight: 1.4,
                maxWidth: 560,
                margin: "0 auto 40px",
              }}
            >
              Upload manga images, assign 20,000+ AI character voices, compose a
              multi-scene timeline, and export a cinematic MP4 — in minutes.
            </p>
          </FadeIn>

          <FadeIn delay={240}>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <a
                href="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#2d5a27",
                  color: "#e8d5a3",
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "14px 28px",
                  borderRadius: 12,
                  textDecoration: "none",
                  border: "1px solid rgba(74,138,66,0.5)",
                  transition: "all 0.2s",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#3a7033";
                  e.currentTarget.style.borderColor = "rgba(74,138,66,0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#2d5a27";
                  e.currentTarget.style.borderColor = "rgba(74,138,66,0.5)";
                }}
              >
                Start creating free <IconArrow />
              </a>
              <a
                href="#how-it-works"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "rgba(232,213,163,0.5)",
                  fontSize: 15,
                  fontWeight: 500,
                  padding: "14px 28px",
                  borderRadius: 12,
                  textDecoration: "none",
                  border: "1px solid rgba(45,90,39,0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#e8d5a3";
                  e.currentTarget.style.borderColor = "rgba(45,90,39,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(232,213,163,0.5)";
                  e.currentTarget.style.borderColor = "rgba(45,90,39,0.3)";
                }}
              >
                See how it works
              </a>
            </div>
          </FadeIn>

          {/* stars */}
          <FadeIn delay={320}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: 40,
                color: "rgba(232,213,163,0.3)",
                fontSize: 13,
              }}
            >
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <IconStar key={i} />
                ))}
              <span style={{ marginLeft: 4 }}>
                Loved by 2,400+ manga creators
              </span>
            </div>
          </FadeIn>

          {/* editor mockup */}
          <FadeIn delay={400}>
            <div className="" style={{ marginTop: 64, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  inset: -1,
                  borderRadius: 20,
                  background:
                    "linear-gradient(to bottom, rgba(45,90,39,0.4), transparent)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  background: "#0a180a",
                  border: "1px solid rgba(45,90,39,0.35)",
                  borderRadius: 18,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 18px",
                    borderBottom: "1px solid rgba(45,90,39,0.2)",
                  }}
                >
                  {[
                    "rgba(232,100,100,0.75)",
                    "rgba(232,180,60,0.75)",
                    "rgba(60,180,60,0.75)",
                  ].map((c, i) => (
                    <div
                      key={i}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: c,
                      }}
                    />
                  ))}
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(232,213,163,0.75)",
                        background: "rgba(45,90,39,0.15)",
                        padding: "3px 16px",
                        borderRadius: 6,
                      }}
                    >
                      Fight Scene — Editor
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    minHeight: 220,
                  }}
                >
                  <div
                    style={{
                      padding: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRight: "1px solid rgba(45,90,39,0.15)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                        background: "#060e06",
                        borderRadius: 10,
                        border: "1px solid rgba(45,90,39,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(45,90,39,0.08), transparent)",
                        }}
                      />
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: "rgba(45,90,39,0.25)",
                            border: "1px solid rgba(74,138,66,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 8px",
                            color: "#4a8a42",
                          }}
                        >
                          <IconPlay />
                        </div>
                        <p
                          style={{
                            fontSize: 11,
                            color: "rgba(232,213,163,0.2)",
                          }}
                        >
                          Preview panel
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <p
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.15em",
                        color: "rgba(232,213,163,0.2)",
                        textTransform: "uppercase",
                        marginBottom: 10,
                      }}
                    >
                      Timeline
                    </p>
                    {[
                      ["Scene 1", "3s", true],
                      ["Scene 2", "5s", true],
                      ["Scene 3", "4s", false],
                    ].map(([l, d, v], i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 7,
                          border: `1px solid ${i === 0 ? "rgba(74,138,66,0.4)" : "rgba(45,90,39,0.15)"}`,
                          background:
                            i === 0
                              ? "rgba(45,90,39,0.22)"
                              : "rgba(45,90,39,0.06)",
                          marginBottom: 5,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11,
                            color:
                              i === 0 ? "#c8e6b8" : "rgba(232,213,163,0.3)",
                            fontWeight: 500,
                            margin: 0,
                          }}
                        >
                          {l} — {d}
                        </p>
                        {v && (
                          <p
                            style={{
                              fontSize: 9,
                              color: "#4a7a42",
                              margin: "3px 0 0",
                            }}
                          >
                            Voice active
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── social proof strip ── */}
      <div
        style={{
          borderTop: "1px solid rgba(45,90,39,0.18)",
          borderBottom: "1px solid rgba(45,90,39,0.18)",
          padding: "18px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            fontSize: 13,
            color: "rgba(232,213,163,0.3)",
          }}
        >
          {[
            "No credit card required",
            "5 free videos on signup",
            "20,000+ AI voices",
            "Export MP4 instantly",
            "FFmpeg-powered rendering",
          ].map((t, i) => (
            <span
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ color: "#3a6032" }}>
                <IconCheck />
              </span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── features ── */}
      <section
        className="bg-[#fceeca]"
        id="features"
        style={{ padding: "120px 24px" }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <FadeIn>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "#6b9e62",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Features
            </p>
            <h2
              style={{
                fontSize: "clamp(28px,4vw,46px)",
                fontWeight: 600,
                color: "#4a8a42",
                lineHeight: 1.15,
                margin: "0 0 14px",
                maxWidth: 520,
              }}
            >
              Everything you need to animate manga
            </h2>
            <p
              style={{
                color: "#4a8a42",
                fontSize: 17,
                maxWidth: 480,
                marginBottom: 64,
                lineHeight: 1.4,
              }}
            >
              A complete end-to-end pipeline — from static panels to polished
              video.
            </p>
          </FadeIn>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 1,
              background: "rgba(45,90,39,0.15)",
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(45,90,39,0.18)",
            }}
          >
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div
                  style={{
                    background: "#060e06",
                    padding: "32px 28px",
                    cursor: "default",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#0a180a")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#060e06")
                  }
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      background: "rgba(45,90,39,0.18)",
                      border: "1px solid rgba(45,90,39,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#4a8a42",
                      marginBottom: 18,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#e8d5a3",
                      margin: "0 0 8px",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "rgba(232,213,163,0.38)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── interactive demos ── */}
      <section
        style={{
          padding: "0 24px 120px",
          borderTop: "1px solid rgba(45,90,39,0.12)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto", paddingTop: 80 }}>
          <FadeIn>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "#6b9e62",
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              Try it live
            </p>
            <h2
              style={{
                fontSize: "clamp(26px,3.5vw,42px)",
                fontWeight: 600,
                color: "#e8d5a3",
                lineHeight: 1.15,
                margin: "0 0 56px",
                maxWidth: 500,
              }}
            >
              See the editor in action
            </h2>
          </FadeIn>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 20,
            }}
          >
            <FadeIn>
              <div>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(232,213,163,0.35)",
                    marginBottom: 14,
                    letterSpacing: "0.03em",
                  }}
                >
                  Click scenes to explore the timeline →
                </p>
                <TimelineDemo />
              </div>
            </FadeIn>
            <FadeIn delay={120}>
              <div>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(232,213,163,0.35)",
                    marginBottom: 14,
                    letterSpacing: "0.03em",
                  }}
                >
                  Click ▶ to preview any voice →
                </p>
                <VoiceDemo />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── how it works ── */}
      <section
        id="how-it-works"
        style={{
          padding: "120px 24px",
          borderTop: "1px solid rgba(45,90,39,0.18)",
          background: "#060e06",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <FadeIn>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "#6b9e62",
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              How it works
            </p>
            <h2
              style={{
                fontSize: "clamp(28px,4vw,46px)",
                fontWeight: 600,
                color: "#e8d5a3",
                lineHeight: 1.15,
                margin: "0 0 64px",
                maxWidth: 440,
              }}
            >
              From panel to video in four steps
            </h2>
          </FadeIn>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
              gap: 0,
              position: "relative",
            }}
          >
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div style={{ padding: "0 28px 0 0", position: "relative" }}>
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 22,
                        left: "calc(100% - 14px)",
                        width: 28,
                        height: 1,
                        background: "rgba(45,90,39,0.3)",
                        zIndex: 1,
                        display: "none",
                      }}
                      className="step-connector"
                    />
                  )}
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: "rgba(45,90,39,0.25)",
                      lineHeight: 1,
                      marginBottom: 20,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      width: 2,
                      height: 32,
                      background: "rgba(45,90,39,0.35)",
                      marginBottom: 20,
                      borderRadius: 1,
                    }}
                  />
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#e8d5a3",
                      margin: "0 0 10px",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "rgba(232,213,163,0.38)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── testimonials ── */}
      <section
        style={{
          padding: "120px 24px",
          borderTop: "1px solid rgba(45,90,39,0.18)",
        }}
        className="bg-[#fceeca]"
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <FadeIn>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "#4a8a42",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Creators love it
            </p>
            <h2
              style={{
                fontSize: "clamp(26px,3.5vw,42px)",
                fontWeight: 600,
                color: "#1f2e1a",
                lineHeight: 1.15,
                margin: "0 0 16px",
                maxWidth: 480,
              }}
            >
              Trusted by manga creators
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "rgba(31,46,26,0.6)",
                maxWidth: 460,
                margin: "0 0 56px",
                lineHeight: 1.6,
              }}
            >
              From solo webcomic artists to studio teams, here's who's already
              turning panels into video.
            </p>
          </FadeIn>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              gridAutoRows: "min-content",
            }}
            className="testimonial-grid"
          >
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 90}>
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e6dcc0",
                    borderRadius: 16,
                    padding: "26px 24px",
                    gridRow: i % 3 === 1 ? "span 1" : "auto",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    cursor: "default",
                  }}
                  className="testimonial-card"
                >
                  <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                    {Array(5)
                      .fill(0)
                      .map((_, j) => (
                        <IconStar key={j} />
                      ))}
                  </div>
                  <p
                    style={{
                      fontSize: 14.5,
                      color: "#3a3325",
                      lineHeight: 1.65,
                      margin: "0 0 22px",
                    }}
                  >
                    {t.text}
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: AVATAR_COLORS[t.color].bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: AVATAR_COLORS[t.color].text,
                        flexShrink: 0,
                      }}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "#1f2e1a",
                          margin: 0,
                        }}
                      >
                        {t.name}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "rgba(31,46,26,0.5)",
                          margin: 0,
                        }}
                      >
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        <style jsx>{`
          .testimonial-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 28px rgba(45, 90, 39, 0.12);
          }
          @media (max-width: 880px) {
            .testimonial-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 600px) {
            .testimonial-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* ── pricing ── */}
      <PricingSection />

      {/* ── final cta ── */}
      <section
        style={{
          padding: "120px 24px",
          borderTop: "1px solid rgba(45,90,39,0.18)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <FadeIn>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(45,90,39,0.3)",
                border: "1px solid rgba(74,138,66,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 28px",
              }}
            >
              <IconLogo />
            </div>
            <h2
              style={{
                fontSize: "clamp(30px,5vw,58px)",
                fontWeight: 700,
                color: "#e8d5a3",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: "0 0 20px",
              }}
            >
              Ready to animate your manga?
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "rgba(232,213,163,0.4)",
                lineHeight: 1.65,
                marginBottom: 40,
              }}
            >
              Free to start. No credit card. Your first 5 videos are on us.
            </p>
            <a
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#c9a84c",
                color: "#1a0e00",
                fontSize: 16,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: 12,
                textDecoration: "none",
                transition: "background 0.2s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#d4b55c")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#c9a84c")
              }
            >
              Create your first video <IconArrow />
            </a>
            <p
              style={{
                fontSize: 12,
                color: "rgba(232,213,163,0.2)",
                marginTop: 18,
              }}
            >
              No signup friction. Cancel anytime.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── footer ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(45,90,39,0.18)",
          padding: "36px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconLogo />
            <span
              style={{
                fontSize: 14,
                color: "rgba(232,213,163,0.4)",
                fontWeight: 500,
              }}
            >
              MangaMotion AI
            </span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(232,213,163,0.2)" }}>
            © 2026 MangaMotion AI. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            {["Terms", "Privacy", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                style={{
                  fontSize: 13,
                  color: "rgba(232,213,163,0.25)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e8d5a3")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(232,213,163,0.25)")
                }
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        @media (max-width: 640px) { .hide-mobile { display: none !important; } }
      `}</style>
    </main>
  );
}
