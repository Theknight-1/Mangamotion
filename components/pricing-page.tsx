"use client";

import { useState, useEffect, useRef } from "react";
import {
  Check,
  Minus,
  Zap,
  Star,
  Shield,
  Sparkles,
  Crown,
  Video,
} from "lucide-react";
import toast from "react-hot-toast";
import { TIERS, type TierKey, type LimitKey } from "@/lib/payment";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// ── Config ──────────────────────────────────────────────────────
const TIER_ORDER: TierKey[] = ["free", "creator", "pro"];
const POPULAR_TIER: TierKey = "creator";

const TIER_ICONS: Record<TierKey, React.ReactNode> = {
  free: <Zap size={16} />,
  creator: <Star size={16} />,
  pro: <Crown size={16} />,
};

const COMPARISON_ROWS: { label: string; key: LimitKey; suffix?: string }[] = [
  { label: "Render minutes / month", key: "renderMinutes", suffix: " min" },
  { label: "Max resolution", key: "maxResolution" },
  { label: "AI voice characters", key: "voiceCharacters" },
  { label: "Background music", key: "bgmTracks" },
  { label: "SFX library", key: "sfxLibrary" },
  { label: "Priority rendering", key: "priorityRendering" },
  { label: "Custom branding", key: "customBranding" },
  { label: "Watermark free", key: "watermark" },
];

const STATS = [
  { value: 1200, suffix: "+", label: "Creators", sub: "using MangaMotion" },
  { value: 18500, suffix: "+", label: "Videos", sub: "rendered to date" },
  { value: 24, suffix: "+", label: "AI Voices", sub: "available now" },
  { value: 49, suffix: "/5", label: "Rating", sub: "average score" },
];

// ── Animation Helpers ───────────────────────────────────────────
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
      className={`transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
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
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── PayPal JS SDK loader ─────────────────────────────────────────
// Using the Smart Buttons SDK instead of a server-side redirect lets buyers
// pay with a card directly (guest checkout) alongside "Log in with PayPal" —
// a plain redirect to the v1 approve link only reliably supports the PayPal
// login path.
function loadPayPalSdk(clientId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).paypal) return resolve((window as any).paypal);
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&currency=USD`;
    script.onload = () => resolve((window as any).paypal);
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(script);
  });
}

// ── Razorpay Checkout.js loader ───────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Main Component ──────────────────────────────────────────────
interface PricingPageProps {
  currentTier?: TierKey;
  userEmail?: string;
  userName?: string;
}

export default function PricingPage({
  currentTier = "free",
  userEmail,
  userName,
}: PricingPageProps) {
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  // Which tier's PayPal button panel is currently expanded (null = none open)
  const [paypalPanelTier, setPaypalPanelTier] = useState<TierKey | null>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  async function startRazorpayCheckout(tier: TierKey) {
    if (tier === "free") {
      toast("You're already on the free plan");
      return;
    }
    setProcessingTier(tier);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, provider: "razorpay" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Couldn't load Razorpay checkout");

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "MangaMotion",
        description: `${TIERS[tier].name} plan`,
        prefill: { email: userEmail, name: userName },
        theme: { color: "#c9a84c" },
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/subscriptions/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              tier,
            }),
          });
          if (verifyRes.ok) {
            toast.success(`Welcome to ${TIERS[tier].name}!`);
            window.location.href = "/dashboard";
          } else {
            toast.error(
              "Payment succeeded but verification failed — contact support.",
            );
          }
        },
        modal: {
          ondismiss: () => setProcessingTier(null),
        },
      });
      rzp.open();
    } catch (error) {
      console.error("[pricing] razorpay checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setProcessingTier(null);
    }
  }

  // Toggles the inline PayPal panel open/closed for a given tier, and mounts
  // PayPal's Smart Buttons into it. Smart Buttons render BOTH a "PayPal"
  // button and a "Debit or Credit Card" button in the same widget — this is
  // what actually lets someone check out with a card, unlike a plain
  // redirect to the v1 subscription approval link, which only reliably
  // supports logging into an existing PayPal account.
  async function togglePaypalPanel(tier: TierKey) {
    if (paypalPanelTier === tier) {
      setPaypalPanelTier(null);
      return;
    }
    setPaypalPanelTier(tier);

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      toast.error("PayPal isn't configured yet.");
      return;
    }

    try {
      const paypal = await loadPayPalSdk(clientId);
      // Give React a tick to render the container div before mounting into it.
      requestAnimationFrame(() => {
        if (!paypalContainerRef.current) return;
        paypalContainerRef.current.innerHTML = "";
        paypal
          .Buttons({
            style: { layout: "vertical", color: "gold", shape: "rect" },
            createSubscription: (_data: any, actions: any) => {
              const planId =
                tier === "creator"
                  ? process.env.NEXT_PUBLIC_PAYPAL_PLAN_CREATOR
                  : process.env.NEXT_PUBLIC_PAYPAL_PLAN_PRO;
              return actions.subscription.create({ plan_id: planId });
            },
            onApprove: async (data: any) => {
              setProcessingTier(tier);
              try {
                const res = await fetch("/api/subscriptions/paypal/activate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    subscriptionId: data.subscriptionID,
                    tier,
                  }),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error);
                toast.success(`Welcome to ${TIERS[tier].name}!`);
                window.location.href = "/dashboard";
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Payment succeeded but activation failed — contact support.",
                );
                setProcessingTier(null);
              }
            },
            onError: (err: any) => {
              console.error("[pricing] paypal buttons error:", err);
              toast.error("PayPal checkout failed. Please try again.");
              setProcessingTier(null);
            },
            onCancel: () => setProcessingTier(null),
          })
          .render(paypalContainerRef.current);
      });
    } catch (error) {
      console.error("[pricing] paypal sdk load error:", error);
      toast.error("Couldn't load PayPal checkout");
    }
  }

  function handleSubscribe(tier: TierKey) {
    if (tier === "free") {
      toast("You're on the free plan");
      return;
    }
    startRazorpayCheckout(tier);
  }

  return (
    <main className="bg-[#0a1d0a] text-[#e8d5a3] min-h-screen overflow-x-hidden">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <Navbar />

      {/* ── Hero ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-175 h-125 bg-[radial-gradient(ellipse,rgba(201,168,76,0.08)_0%,transparent_65%)] pointer-events-none" />

        <FadeIn>
          <div className="relative">
            <div className="flex justify-center mb-5 mt-8">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase border border-[#6b9e62]/30 bg-[#6b9e62]/10 text-[#6b9e62]">
                <Sparkles size={10} /> Simple Pricing
              </span>
            </div>
            <h1 className="text-[clamp(36px,5.5vw,64px)] font-extrabold leading-tight tracking-tighter mb-5">
              Make manga recaps,
              <br />
              <span className="text-[#c9a84c]">not slideshows</span>
            </h1>
            <div className="flex justify-center gap-6 flex-wrap">
              {[
                "No credit card required",
                "Cancel anytime",
                "Instant access",
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 text-[13px] text-[#e8d5a3]/45"
                >
                  <Check size={13} className="text-[#4a8a42]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="px-6 pb-28">
        <div className="max-w-275 mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
  {TIER_ORDER.map((key, i) => {
    const tier = TIERS[key];
    const isCurrent = currentTier === key;
    const isPopular = key === POPULAR_TIER;
    const isProcessing = processingTier === key;
    const glow =
      key === "free"
        ? "rgba(120,140,120,0.35)"
        : isPopular
          ? "rgba(201,168,76,0.5)"
          : "rgba(74,138,66,0.5)";

    return (
      <FadeIn key={key} delay={i * 100}>
        <div
          className={`
            relative h-full flex flex-col p-5 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5
            bg-[#121a1293]
            ${
              isPopular
                ? "border border-[#c9a84c]/50 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
                : "border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
            }
          `}
        >
          {/* Directional corner glow */}
          <div
            className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full blur-3xl"
            style={{ background: glow, opacity: 0.5 }}
            aria-hidden="true"
          />
          {/* Decorative outline circle, top-right */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/[0.06]"
            aria-hidden="true"
          />

          {isPopular && (
            <div className="relative z-10 flex justify-end">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] border border-[#c9a84c]/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">
                <Star size={10} className="fill-[#c9a84c]" /> Popular
              </span>
            </div>
          )}
          {isCurrent && !isPopular && (
            <div className="relative z-10 flex justify-end">
              <span className="inline-flex items-center rounded-full bg-white/[0.06] border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e8d5a3]/70">
                Current
              </span>
            </div>
          )}

          {/* Icon */}
          <div
            className={`relative z-10 w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 border mt-1
              ${isPopular ? "bg-[#c9a84c]/20 border-[#c9a84c]/40 text-[#c9a84c]" : key === "free" ? "bg-white/[0.06] border-white/15 text-[#e8d5a3]/70" : "bg-[#4a8a42]/20 border-[#4a8a42]/45 text-[#5fa856]"}`}
          >
            {TIER_ICONS[key]}
          </div>

          {/* Name */}
          <span className="relative z-10 mt-4 text-base font-bold tracking-tight text-[#e8d5a3]">
            {tier.name}
          </span>

          {/* Price */}
          <div className="relative z-10 mt-3 mb-2">
            <div className="flex items-baseline gap-1">
              {tier.price > 0 && (
                <span className="text-xl text-[#e8d5a3]/50 font-medium">$</span>
              )}
              <span
                className={`font-extrabold tracking-tighter leading-none text-[#e8d5a3] ${tier.price === 0 ? "text-[40px]" : "text-5xl"}`}
              >
                {tier.price === 0 ? "Free" : tier.price}
              </span>
              {tier.price > 0 && (
                <span className="text-sm text-[#e8d5a3]/50 mb-0.5">/mo</span>
              )}
            </div>
            <p className="text-[13px] text-[#e8d5a3]/45 mt-2 leading-relaxed">
              {tier.description}
            </p>
          </div>

          {/* Usage pill */}
          <div className="relative z-10 inline-flex items-center gap-1.5 mt-2 mb-6 text-xs text-[#e8d5a3]/75 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 w-fit">
            <Video size={13} className="opacity-80" />
            {tier.limits.renderMinutes} render minutes
          </div>

          {/* Primary CTA — Razorpay, disabled for now */}
          {/* <button
            disabled
            title="Card payments via Razorpay are coming soon — use PayPal below"
            className="relative z-10 w-full text-center text-sm font-bold py-3.5 rounded-[14px] border border-white/10 bg-white/[0.03] text-[#e8d5a3]/30 cursor-not-allowed"
          >
            {isCurrent ? "Current plan" : "Razorpay — coming soon"}
          </button> */}

          {/* Real working CTA */}
          {key === "free" ? (
            <button
              onClick={() => handleSubscribe(key)}
              disabled={isProcessing || isCurrent}
              className="relative z-10 mt-2 w-full text-center text-sm font-bold py-3.5 rounded-[14px] border-none bg-white text-[#0c110c] transition-all duration-200 hover:not-disabled:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? "Processing…" : tier.cta}
            </button>
          ) : (
            !isCurrent && (
              <button
                onClick={() => togglePaypalPanel(key)}
                className={`relative z-10 mt-2 w-full text-center text-sm font-bold py-3.5 rounded-[14px] border-none transition-all duration-200 hover:not-disabled:-translate-y-0.5 cursor-pointer
                  ${isPopular ? "bg-linear-to-br from-[#c9a84c] to-[#e8d5a3] text-[#1a0e00] shadow-[0_4px_20px_rgba(201,168,76,0.4)]" : "bg-white text-[#0c110c]"}`}
              >
                {paypalPanelTier === key ? isPopular ? "PayPal panel open" : "PayPal panel open" : isPopular ? "Remove watermark" : "Grab it now"}
              </button>
            )
          )}

          {paypalPanelTier === key && (
            <div className="relative z-10 mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <div ref={paypalContainerRef} />
              <p className="text-[10px] text-[#e8d5a3]/35 mt-2 text-center">
                PayPal also shows a "Debit or Credit Card" option here — no PayPal account required.
              </p>
            </div>
          )}

          <div className="relative z-10 h-px bg-white/10 my-6" />

          {/* "Stand out features" divider */}
          <div className="relative z-10 flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#e8d5a3]/35 whitespace-nowrap">
              Stand out features
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Features */}
          <ul className="relative z-10 list-none p-0 m-0 flex-1 flex flex-col gap-3">
            {tier.features.map((f: string) => (
              <li
                key={f}
                className={`flex items-start gap-2.5 text-sm leading-relaxed ${f.includes("✨") ? "text-[#e8d5a3]/50" : "text-[#e8d5a3]/80"}`}
              >
                <Check
                  size={14}
                  className={`shrink-0 mt-0.5 ${f.includes("NO Watermark") ? "text-[#c9a84c]" : "text-[#5fa856]"}`}
                />
                {f.replace("✨ ", "")}
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>
    );
  })}
</div>

        <FadeIn delay={400}>
          <p className="text-center mt-8 text-xs text-[#e8d5a3]/30 flex items-center justify-center gap-1.5">
            <Shield size={12} className="text-[#4a8a42]/50" />
            Secured by Razorpay & PayPal · 256-bit SSL encryption · Cancel
            anytime
          </p>
        </FadeIn>
      </section>

      {/* ── Trust Stats ── */}
      <section className="border-y border-[#2d5a27]/15 py-18 px-6 bg-[#080f08]">
        <div className="max-w-240 mx-auto">
          <FadeIn>
            <p className="text-center text-xl tracking-[0.14em] text-[#6b9e62] uppercase font-bold mb-12">
              Trusted by creators worldwide
            </p>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="text-center py-7 px-4 rounded-2xl bg-[#2d5a27]/30 border border-[#2d5a27]/12 transition-all duration-300 hover:-translate-y-1 hover:bg-[#2d5a27]/10">
                  <div className="text-[clamp(30px,4vw,42px)] font-extrabold text-[#e8d5a3] tracking-tighter mb-1">
                    <AnimatedStat value={s.value} suffix={s.suffix} />
                  </div>
                  <p className="text-sm font-semibold text-[#e8d5a3]/65 mb-0.5">
                    {s.label}
                  </p>
                  <p className="text-xs text-[#e8d5a3]/30 m-0">{s.sub}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="py-28 px-6">
        <div className="max-w-[960px] mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase border border-[#6b9e62]/30 bg-[#6b9e62]/10 text-[#6b9e62] mb-4">
                Compare plans
              </span>
              <h2 className="text-[clamp(26px,3.5vw,42px)] font-bold leading-tight tracking-tight m-0">
                Every feature, side by side
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="overflow-x-auto rounded-2xl border border-[#2d5a27]/20 bg-[#080f08]">
              <table className="w-full border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#2d5a27]/20">
                    <th className="text-left p-5 text-xs text-[#e8d5a3]/35 font-semibold tracking-wider uppercase w-[35%]">
                      Feature
                    </th>
                    {TIER_ORDER.map((key) => (
                      <th
                        key={key}
                        className={`text-center p-5 text-sm font-bold ${key === POPULAR_TIER ? "text-[#e8d5a3] bg-[#c9a84c]/5" : "text-[#e8d5a3]/50"}`}
                      >
                        {TIERS[key].name}
                        {key === POPULAR_TIER && (
                          <span className="block text-[9px] font-semibold text-[#c9a84c] tracking-wider uppercase mt-0.5">
                            Popular
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-[#2d5a27]/10 last:border-b-0 hover:bg-[#2d5a27]/5 transition-colors"
                    >
                      <td className="p-4 text-sm text-[#e8d5a3]/65 font-medium">
                        {row.label}
                      </td>
                      {TIER_ORDER.map((tierKey) => {
                        const val = TIERS[tierKey].limits[row.key];
                        const isPopCol = tierKey === POPULAR_TIER;
                        const isGood = row.key === "watermark" ? !val : val;

                        return (
                          <td
                            key={tierKey}
                            className={`text-center p-4 ${isPopCol ? "bg-[#c9a84c]/3" : ""}`}
                          >
                            {typeof val === "boolean" ? (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-md
                                ${isGood ? "bg-[#4a8a42]/12 text-[#4a8a42]" : "text-[#e8d5a3]/15"}`}
                              >
                                {isGood ? (
                                  <Check size={14} />
                                ) : (
                                  <Minus size={14} />
                                )}
                              </span>
                            ) : (
                              <span
                                className={`text-sm ${isPopCol ? "text-[#e8d5a3] font-semibold" : "text-[#e8d5a3]/55"}`}
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
  );
}
