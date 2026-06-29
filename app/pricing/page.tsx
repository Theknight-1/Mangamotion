"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Minus, Zap, Star, Shield, Sparkles } from "lucide-react";
import {
  SUBSCRIPTION_LIMITS,
  type SubscriptionTier,
} from "@/lib/subscription/limits";
import toast from "react-hot-toast";
import { TIERS } from "@/lib/payment";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useRouter } from "next/navigation";

/* ── helpers ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

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
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedStat({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const { ref, visible } = useInView(0.3);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const duration = 1400;
    const startTime = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [visible, value]);
  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const TIER_ORDER: SubscriptionTier[] = ["free", "starter", "pro", "premium"];
const POPULAR_TIER: SubscriptionTier = "pro";

const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  free: <Zap size={15} />,
  starter: <Star size={15} />,
  pro: <Sparkles size={15} />,
  premium: <Shield size={15} />,
};

const COMPARISON_ROWS = [
  { label: "Videos per month", key: "videosPerMonth" as const },
  {
    label: "Render minutes",
    key: "videoMinutesPerMonth" as const,
    suffix: " min",
  },
  { label: "Max scenes per video", key: "maxScenes" as const },
  { label: "Max resolution", key: "maxResolution" as const },
  { label: "AI voice characters", key: "voiceCharacters" as const },
  { label: "Background music", key: "bgmTracks" as const },
  { label: "SFX library", key: "sfxLibrary" as const },
  { label: "Priority rendering", key: "priorityRendering" as const },
  { label: "Custom branding", key: "customBranding" as const },
  { label: "API access", key: "api" as const },
];

const STATS = [
  { value: 300, suffix: "+", label: "Creators", sub: "using MotionRecap" },
  { value: 6500, suffix: "+", label: "Videos", sub: "rendered" },
  { value: 100, suffix: "+", label: "AI voices", sub: "available" },
  { value: 5, suffix: "/5", label: "Rating", sub: "average score" },
];

interface PricingPageProps {
  currentTier?: SubscriptionTier;
}

export default function PricingPage({
  currentTier = "free",
}: PricingPageProps) {
  const router = useRouter();
  useEffect(() => {
    router.push("/coming-soon");
  }, []);

  const [processingTier, setProcessingTier] = useState<string | null>(null);

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  async function handleSubscribe(tier: string) {
    if (tier === "free") {
      toast.success("Already on the free plan");
      return;
    }
    setProcessingTier(tier);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, provider: "razorpay" }),
      });
      if (!response.ok) throw new Error("Subscription failed");
      toast.success(`Upgraded to ${tier}!`);
    } catch (error) {
      console.error("[pricing] Subscription error:", error);
      toast.error("Failed to update subscription");
    } finally {
      setProcessingTier(null);
    }
  }

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: translateX(-50%) scale(0.95); opacity: 0.4; }
          50% { transform: translateX(-50%) scale(1.05); opacity: 0.15; }
          100% { transform: translateX(-50%) scale(0.95); opacity: 0.4; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .pricing-card {
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.2s ease;
        }
        .pricing-card:hover {
          transform: translateY(-4px);
        }
        .cta-btn {
          transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
        }
        .cta-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(201,168,76,0.25);
        }
        .cta-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .plan-btn {
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .plan-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .faq-item {
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .faq-item:hover {
          border-color: rgba(74,138,66,0.35) !important;
        }
        .stat-card {
          transition: transform 0.25s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
        }
        .table-row {
          transition: background 0.15s ease;
        }
        .table-row:hover {
          background: rgba(45,90,39,0.07);
        }
        .nav-link {
          transition: opacity 0.15s ease;
        }
        .nav-link:hover {
          opacity: 0.8;
        }
        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid rgba(107,158,98,0.3);
          background: rgba(107,158,98,0.08);
          color: #6b9e62;
        }
        .popular-glow {
          box-shadow: 0 0 40px rgba(45,90,39,0.2), 0 4px 32px rgba(0,0,0,0.4);
        }
        .current-glow {
          box-shadow: 0 0 24px rgba(201,168,76,0.12);
        }
      `}</style>

      <main
        style={{
          background: "#060e06",
          color: "#e8d5a3",
          overflowX: "hidden",
          minHeight: "100vh",
        }}
      >
        <Navbar />

        {/* ── hero ── */}
        <section
          style={{
            padding: "96px 24px 72px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* background orbs */}
          <div
            style={{
              position: "absolute",
              top: -80,
              left: "50%",
              transform: "translateX(-50%)",
              width: 700,
              height: 500,
              background:
                "radial-gradient(ellipse, rgba(45,90,39,0.20) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 40,
              left: "20%",
              width: 300,
              height: 300,
              background:
                "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 60,
              right: "15%",
              width: 200,
              height: 200,
              background:
                "radial-gradient(circle, rgba(74,138,66,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <FadeIn>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 20,
                  marginTop: 30,
                }}
              >
                <span className="badge-pill">
                  <Sparkles size={10} />
                  Pricing
                </span>
              </div>
              <h1
                style={{
                  fontSize: "clamp(36px,5.5vw,64px)",
                  fontWeight: 800,
                  color: "#e8d5a3",
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  margin: "0 0 20px",
                }}
              >
                Simple, honest pricing
              </h1>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                {[
                  "No credit card required",
                  "Cancel anytime",
                  "Instant access",
                ].map((item) => (
                  <span
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      color: "rgba(232,213,163,0.45)",
                    }}
                  >
                    <Check size={13} style={{ color: "#4a8a42" }} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── pricing cards ── */}
        <section style={{ padding: "0 24px 112px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(256px, 1fr))",
                gap: 16,
                alignItems: "stretch",
              }}
            >
              {TIER_ORDER.map((key, i) => {
                const tier = TIERS[key];
                const limits = SUBSCRIPTION_LIMITS[key];
                const isCurrent = currentTier === key;
                const isPopular = key === POPULAR_TIER;
                const isProcessing = processingTier === key;
                const isHovered = hoveredCard === key;

                return (
                  <FadeIn key={key} delay={i * 90}>
                    <div
                      className={`  pricing-card ${isPopular ? "popular-glow" : ""} ${isCurrent ? "current-glow" : ""}`}
                      onMouseEnter={() => setHoveredCard(key)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        background: isPopular
                          ? "linear-gradient(160deg, rgba(45,90,39,0.18) 0%, rgba(30,60,26,0.12) 100%)"
                          : isCurrent
                            ? "rgba(201,168,76,0.04)"
                            : "#0a180a",
                        border: isPopular
                          ? "1.5px solid rgba(74,138,66,0.55)"
                          : isCurrent
                            ? "1.5px solid rgba(201,168,76,0.5)"
                            : "1px solid rgba(45,90,39,0.2)",
                        borderRadius: 20,
                        padding: isPopular
                          ? "36px 28px 28px"
                          : "28px 24px 24px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        marginTop: isPopular ? 0 : 0,
                        height: "100%",
                      }}
                    >
                      {isPopular && (
                        <div
                          style={{
                            position: "absolute",
                            top: -13,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background:
                              "linear-gradient(90deg, #c9a84c, #e8d5a3, #c9a84c)",
                            backgroundSize: "200% auto",
                            animation: "shimmer 3s linear infinite",
                            color: "#1a0e00",
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            padding: "5px 16px",
                            borderRadius: 100,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Most popular
                        </div>
                      )}

                      {isCurrent && !isPopular && (
                        <div
                          style={{
                            position: "absolute",
                            top: -11,
                            right: 16,
                            background: "rgba(201,168,76,0.12)",
                            border: "1px solid rgba(201,168,76,0.4)",
                            color: "#c9a84c",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            padding: "4px 12px",
                            borderRadius: 100,
                          }}
                        >
                          Current
                        </div>
                      )}

                      {/* tier header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: isPopular
                              ? "rgba(74,138,66,0.2)"
                              : "rgba(45,90,39,0.15)",
                            border: `1px solid ${isPopular ? "rgba(74,138,66,0.35)" : "rgba(45,90,39,0.2)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isPopular
                              ? "#4a8a42"
                              : "rgba(74,138,66,0.6)",
                            flexShrink: 0,
                          }}
                        >
                          {TIER_ICONS[key]}
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: isPopular
                              ? "#e8d5a3"
                              : "rgba(232,213,163,0.7)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {tier.name}
                        </span>
                      </div>

                      {/* price */}
                      <div style={{ marginBottom: 4 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 4,
                          }}
                        >
                          {tier.price > 0 && (
                            <span
                              style={{
                                fontSize: 15,
                                color: "rgba(232,213,163,0.4)",
                                fontWeight: 500,
                                alignSelf: "flex-start",
                                paddingTop: 8,
                              }}
                            >
                              $
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: tier.price === 0 ? 42 : 44,
                              fontWeight: 800,
                              color: "#e8d5a3",
                              letterSpacing: "-0.04em",
                              lineHeight: 1,
                            }}
                          >
                            {tier.price === 0 ? "Free" : tier.price}
                          </span>
                          {tier.price > 0 && (
                            <span
                              style={{
                                fontSize: 13,
                                color: "rgba(232,213,163,0.3)",
                                marginBottom: 2,
                              }}
                            >
                              /mo
                            </span>
                          )}
                        </div>
                      </div>

                      {/* usage summary */}
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          marginBottom: 24,
                          marginTop: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11.5,
                            color: "rgba(232,213,163,0.45)",
                            background: "rgba(45,90,39,0.12)",
                            border: "1px solid rgba(45,90,39,0.2)",
                            borderRadius: 6,
                            padding: "3px 8px",
                          }}
                        >
                          {limits.videosPerMonth} videos
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11.5,
                            color: "rgba(232,213,163,0.45)",
                            background: "rgba(45,90,39,0.12)",
                            border: "1px solid rgba(45,90,39,0.2)",
                            borderRadius: 6,
                            padding: "3px 8px",
                          }}
                        >
                          {limits.videoMinutesPerMonth} min
                        </span>
                      </div>

                      {/* divider */}
                      <div
                        style={{
                          height: 1,
                          background: "rgba(45,90,39,0.18)",
                          marginBottom: 20,
                        }}
                      />

                      {/* features */}
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: "0 0 28px",
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 11,
                        }}
                      >
                        {tier.features.map((f: string) => (
                          <li
                            key={f}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                              fontSize: 13.5,
                              color: "rgba(232,213,163,0.65)",
                              lineHeight: 1.4,
                            }}
                          >
                            <div
                              style={{
                                width: 17,
                                height: 17,
                                borderRadius: 5,
                                background: "rgba(74,138,66,0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              <Check size={11} style={{ color: "#4a8a42" }} />
                            </div>
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* CTA button */}
                      <button
                        className="plan-btn"
                        onClick={() => handleSubscribe(key)}
                        disabled={isProcessing || isCurrent}
                        style={{
                          width: "100%",
                          textAlign: "center",
                          fontSize: 13.5,
                          fontWeight: 700,
                          padding: "13px 0",
                          borderRadius: 11,
                          border: "none",
                          cursor:
                            isCurrent || isProcessing
                              ? "not-allowed"
                              : "pointer",
                          letterSpacing: "0.01em",
                          ...(isCurrent
                            ? {
                                background: "rgba(201,168,76,0.06)",
                                border: "1px solid rgba(201,168,76,0.2)",
                                color: "rgba(232,213,163,0.3)",
                              }
                            : isPopular
                              ? {
                                  background:
                                    "linear-gradient(135deg, #2d5a27 0%, #3d7535 100%)",
                                  color: "#e8d5a3",
                                  boxShadow: "0 4px 16px rgba(45,90,39,0.35)",
                                }
                              : key === "free"
                                ? {
                                    background: "rgba(45,90,39,0.12)",
                                    border: "1px solid rgba(45,90,39,0.3)",
                                    color: "rgba(232,213,163,0.6)",
                                  }
                                : {
                                    background: "rgba(45,90,39,0.1)",
                                    border: "1px solid rgba(45,90,39,0.28)",
                                    color: "rgba(232,213,163,0.55)",
                                  }),
                          opacity: isProcessing ? 0.6 : 1,
                        }}
                      >
                        {isCurrent
                          ? "Current plan"
                          : isProcessing
                            ? "Processing…"
                            : key === "free"
                              ? "Get started free"
                              : `Start ${tier.name}`}
                      </button>
                    </div>
                  </FadeIn>
                );
              })}
            </div>

            {/* security note */}
            <FadeIn delay={400}>
              <p
                style={{
                  textAlign: "center",
                  marginTop: 28,
                  fontSize: 12.5,
                  color: "rgba(232,213,163,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Shield size={12} style={{ color: "rgba(74,138,66,0.5)" }} />
                Secured by Razorpay &amp; PayPal · 256-bit SSL encryption ·
                Cancel anytime
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ── trust stats ── */}
        <section
          style={{
            borderTop: "1px solid rgba(45,90,39,0.15)",
            borderBottom: "1px solid rgba(45,90,39,0.15)",
            padding: "72px 24px",
            background: "rgba(45,90,39,0.03)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(45,90,39,0.07) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}
          >
            <FadeIn>
              <p
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "#6b9e62",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 48,
                }}
              >
                Trusted by creators worldwide
              </p>
            </FadeIn>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 2,
              }}
            >
              {STATS.map((s, i) => (
                <FadeIn key={i} delay={i * 80}>
                  <div
                    className="stat-card"
                    style={{
                      textAlign: "center",
                      padding: "24px 16px",
                      borderRadius: 16,
                      background: "rgba(45,90,39,0.05)",
                      border: "1px solid rgba(45,90,39,0.12)",
                      margin: "0 4px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "clamp(30px,4vw,42px)",
                        fontWeight: 800,
                        color: "#e8d5a3",
                        marginBottom: 2,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      <AnimatedStat value={s.value} suffix={s.suffix} />
                    </div>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "rgba(232,213,163,0.65)",
                        marginBottom: 2,
                      }}
                    >
                      {s.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(232,213,163,0.3)",
                        margin: 0,
                      }}
                    >
                      {s.sub}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── comparison table ── */}
        <section style={{ padding: "112px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <span
                  className="badge-pill"
                  style={{ marginBottom: 16, display: "inline-flex" }}
                >
                  Compare plans
                </span>
                <h2
                  style={{
                    fontSize: "clamp(26px,3.5vw,42px)",
                    fontWeight: 700,
                    color: "#e8d5a3",
                    lineHeight: 1.1,
                    letterSpacing: "-0.025em",
                    margin: 0,
                  }}
                >
                  Every feature, side by side
                </h2>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <div
                style={{
                  overflowX: "auto",
                  borderRadius: 16,
                  border: "1px solid rgba(45,90,39,0.2)",
                  background: "#080f08",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 640,
                  }}
                >
                  <thead>
                    <tr
                      style={{ borderBottom: "1px solid rgba(45,90,39,0.2)" }}
                    >
                      <th
                        style={{
                          textAlign: "left",
                          padding: "18px 20px",
                          fontSize: 12,
                          color: "rgba(232,213,163,0.35)",
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          width: "32%",
                        }}
                      >
                        Feature
                      </th>
                      {TIER_ORDER.map((key) => (
                        <th
                          key={key}
                          style={{
                            textAlign: "center",
                            padding: "18px 12px",
                            fontSize: 13,
                            fontWeight: 700,
                            color:
                              key === POPULAR_TIER
                                ? "#e8d5a3"
                                : "rgba(232,213,163,0.5)",
                            position: "relative",
                            background:
                              key === POPULAR_TIER
                                ? "rgba(45,90,39,0.08)"
                                : "transparent",
                            borderLeft:
                              key === POPULAR_TIER
                                ? "1px solid rgba(74,138,66,0.15)"
                                : "none",
                            borderRight:
                              key === POPULAR_TIER
                                ? "1px solid rgba(74,138,66,0.15)"
                                : "none",
                          }}
                        >
                          {TIERS[key].name}
                          {key === POPULAR_TIER && (
                            <span
                              style={{
                                display: "block",
                                fontSize: 9,
                                fontWeight: 600,
                                color: "#4a8a42",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                marginTop: 2,
                              }}
                            >
                              Popular
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, rowIdx) => (
                      <tr
                        key={row.key}
                        className="table-row"
                        style={{
                          borderBottom:
                            rowIdx < COMPARISON_ROWS.length - 1
                              ? "1px solid rgba(45,90,39,0.1)"
                              : "none",
                        }}
                      >
                        <td
                          style={{
                            padding: "15px 20px",
                            fontSize: 13.5,
                            color: "rgba(232,213,163,0.65)",
                            fontWeight: 500,
                          }}
                        >
                          {row.label}
                        </td>
                        {TIER_ORDER.map((tierKey) => {
                          const val = SUBSCRIPTION_LIMITS[tierKey][row.key];
                          const isPopCol = tierKey === POPULAR_TIER;
                          return (
                            <td
                              key={tierKey}
                              style={{
                                textAlign: "center",
                                padding: "15px 12px",
                                background: isPopCol
                                  ? "rgba(45,90,39,0.06)"
                                  : "transparent",
                                borderLeft: isPopCol
                                  ? "1px solid rgba(74,138,66,0.1)"
                                  : "none",
                                borderRight: isPopCol
                                  ? "1px solid rgba(74,138,66,0.1)"
                                  : "none",
                              }}
                            >
                              {typeof val === "boolean" ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 22,
                                    height: 22,
                                    borderRadius: 6,
                                    background: val
                                      ? "rgba(74,138,66,0.12)"
                                      : "transparent",
                                    color: val
                                      ? "#4a8a42"
                                      : "rgba(232,213,163,0.15)",
                                  }}
                                >
                                  {val ? (
                                    <Check size={13} />
                                  ) : (
                                    <Minus size={13} />
                                  )}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 13.5,
                                    color: isPopCol
                                      ? "#e8d5a3"
                                      : "rgba(232,213,163,0.55)",
                                    fontWeight: isPopCol ? 600 : 400,
                                  }}
                                >
                                  {val}
                                  {row.suffix ?? ""}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeIn>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
