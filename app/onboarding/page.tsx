"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions/user";
import toast from "react-hot-toast";
import { IconLogo } from "@/components/icon-logo";

const PROFESSIONS = [
  { label: "Content Creator", icon: "🎬" },
  { label: "Marketer", icon: "📣" },
  { label: "Educator", icon: "📚" },
  { label: "Developer", icon: "💻" },
  { label: "Student", icon: "🎓" },
  { label: "Other", icon: "✦" },
];

const SOURCES = [
  { label: "Twitter / X", icon: "𝕏" },
  { label: "YouTube", icon: "▶" },
  { label: "Reddit", icon: "👾" },
  { label: "LinkedIn", icon: "in" },
  { label: "Friend / Colleague", icon: "👋" },
  { label: "Google Search", icon: "🔍" },
  { label: "AI", icon: "✦" },
  { label: "Other", icon: "•" },
];

function MangaBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="og1" cx="75%" cy="18%" r="40%">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="og2" cx="18%" cy="82%" r="38%">
          <stop offset="0%" stopColor="#2d5a27" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2d5a27" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="900" fill="url(#og1)" />
      <rect width="1200" height="900" fill="url(#og2)" />

      {/* top-right panel cluster */}
      <g opacity="0.09" stroke="#e8d5a3" strokeWidth="1" fill="none">
        <rect x="820" y="40" width="220" height="160" rx="4" />
        {Array.from({ length: 14 }).map((_, i) => {
          const cx = 930,
            cy = 120;
          const angle = (Math.PI * 2 * i) / 14;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(angle) * 110}
              y2={cy + Math.sin(angle) * 80}
              strokeWidth="0.7"
            />
          );
        })}
        <circle cx="930" cy="120" r="22" />
        <polygon
          points="924,110 924,130 944,120"
          fill="#e8d5a3"
          stroke="none"
          opacity="0.6"
        />
        <rect x="1054" y="40" width="130" height="76" rx="4" />
        <rect x="1054" y="128" width="130" height="72" rx="4" />
        <rect x="820" y="214" width="100" height="180" rx="4" />
        <rect x="932" y="214" width="252" height="86" rx="4" />
        <rect x="932" y="312" width="252" height="82" rx="4" />
        {Array.from({ length: 3 }).flatMap((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={1062 + col * 10}
              cy={50 + row * 10}
              r="2"
              opacity="0.5"
            />
          )),
        )}
      </g>

      {/* bottom-left panel cluster */}
      <g opacity="0.07" stroke="#e8d5a3" strokeWidth="1" fill="none">
        <rect x="0" y="640" width="180" height="260" rx="4" />
        <rect x="190" y="720" width="240" height="180" rx="4" />
        <rect x="190" y="640" width="240" height="70" rx="4" />
        <rect x="440" y="640" width="120" height="180" rx="4" />
        <rect x="440" y="830" width="120" height="70" rx="4" />
        {Array.from({ length: 12 }).map((_, i) => {
          const cx = 90,
            cy = 760;
          const angle = (Math.PI * 2 * i) / 12;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(angle) * 80}
              y2={cy + Math.sin(angle) * 110}
              strokeWidth="0.6"
            />
          );
        })}
      </g>

      {/* top-left speed burst */}
      <g opacity="0.035" stroke="#c9a84c" strokeWidth="1">
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / 16;
          return (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={Math.cos(angle) * 340}
              y2={Math.sin(angle) * 260}
            />
          );
        })}
      </g>

      {/* bottom-right speed burst */}
      <g opacity="0.035" stroke="#c9a84c" strokeWidth="1">
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / 16;
          return (
            <line
              key={i}
              x1={1200}
              y1={900}
              x2={1200 + Math.cos(angle) * 340}
              y2={900 + Math.sin(angle) * 260}
            />
          );
        })}
      </g>

      {/* mid-left floating panels */}
      <g opacity="0.05" stroke="#c9a84c" strokeWidth="1" fill="none">
        <rect x="30" y="340" width="130" height="94" rx="3" />
        <rect x="172" y="360" width="80" height="74" rx="3" />
        <rect x="30" y="444" width="222" height="60" rx="3" />
      </g>

      {/* horizontal speed strips */}
      <g opacity="0.02" stroke="#e8d5a3" strokeWidth="1">
        {[178, 188, 198, 208, 218].map((y, i) => (
          <line key={i} x1="0" y1={y} x2="1200" y2={y} />
        ))}
      </g>
    </svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profession, setProfession] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!profession || !source) {
      toast.error("Please select an option.");
      return;
    }
    setLoading(true);
    try {
      const result = await completeOnboarding(profession, source);
      if (!result.success) {
        toast.error("Unable to complete onboarding.");
        return;
      }
      toast.success("Welcome aboard!");
      window.location.href = "/dashboard";
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#060e06] px-5 py-10 overflow-hidden">
      <MangaBg />

      <div className="relative z-10 w-full max-w-120">
        {/* logo */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <IconLogo />
          <span className="text-lg font-bold tracking-tight text-[#e8d5a3]">
            MotionRecap
          </span>
        </div>

        {/* progress */}
        <div className="mb-5 flex items-center gap-2">
          <div className="flex flex-1 gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="relative h-0.75 flex-1 overflow-hidden rounded-full bg-[rgba(232,213,163,0.1)]"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#c9a84c] transition-all duration-500 ease-out"
                  style={{ width: step >= s ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>
          <span className="text-[11px] tabular-nums text-[rgba(232,213,163,0.3)]">
            {step}/2
          </span>
        </div>

        {/* card */}
        <div className=" relative overflow-hidden rounded-2xl border border-[rgba(232,213,163,0.10)] bg-[rgba(255,255,255,0.025)] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          {/* glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#c9a84c] opacity-[0.07] blur-3xl" />
          {/* grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          <div className="relative px-6 py-7 sm:px-8 sm:py-8">
            {/* step 1 */}
            <div
              className="transition-all duration-300 ease-out"
              style={{
                opacity: step === 1 ? 1 : 0,
                pointerEvents: step === 1 ? "auto" : "none",
                position: step === 2 ? "absolute" : "relative",
              }}
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b9e62]">
                Step 1 of 2
              </p>
              <h2 className="mb-1 text-xl font-bold text-[#e8d5a3]">
                What's your profession?
              </h2>
              <p className="mb-5 text-sm text-[rgba(232,213,163,0.5)]">
                Helps us tailor MotionRecap to your workflow.
              </p>

              <div className="mb-5 grid grid-cols-2 gap-2.5">
                {PROFESSIONS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setProfession(p.label)}
                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all duration-200 ${
                      profession === p.label
                        ? "border-[#c9a84c] bg-[rgba(201,168,76,0.1)] text-[#e8d5a3]"
                        : "border-[rgba(232,213,163,0.10)] text-[rgba(232,213,163,0.6)] hover:border-[rgba(232,213,163,0.25)] hover:text-[#e8d5a3]"
                    }`}
                  >
                    <span className="text-base leading-none">{p.icon}</span>
                    <span className="leading-tight">{p.label}</span>
                    {profession === p.label && (
                      <span className="ml-auto h-4 w-4 rounded-full bg-[#c9a84c] flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path
                            d="M1.5 4l2 2L6.5 2"
                            stroke="#060e06"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!profession}
                className="w-full rounded-xl bg-linear-to-br from-[#c9a84c] to-[#e8d5a3] py-3 text-sm font-bold tracking-wide text-[#060e06] shadow-[0_4px_20px_rgba(201,168,76,0.30)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_26px_rgba(201,168,76,0.40)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Continue →
              </button>
            </div>

            {/* step 2 */}
            <div
              className="transition-all duration-300 ease-out"
              style={{
                opacity: step === 2 ? 1 : 0,
                pointerEvents: step === 2 ? "auto" : "none",
                position: step === 1 ? "absolute" : "relative",
              }}
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b9e62]">
                Step 2 of 2
              </p>
              <h2 className="mb-1 text-xl font-bold text-[#e8d5a3]">
                How did you find us?
              </h2>
              <p className="mb-5 text-sm text-[rgba(232,213,163,0.5)]">
                Genuinely curious — helps us know what's working.
              </p>

              <div className="mb-5 grid grid-cols-2 gap-2.5">
                {SOURCES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setSource(s.label)}
                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all duration-200 ${
                      source === s.label
                        ? "border-[#c9a84c] bg-[rgba(201,168,76,0.1)] text-[#e8d5a3]"
                        : "border-[rgba(232,213,163,0.10)] text-[rgba(232,213,163,0.6)] hover:border-[rgba(232,213,163,0.25)] hover:text-[#e8d5a3]"
                    }`}
                  >
                    <span className="text-base leading-none">{s.icon}</span>
                    <span className="leading-tight">{s.label}</span>
                    {source === s.label && (
                      <span className="ml-auto h-4 w-4 rounded-full bg-[#c9a84c] flex items-center justify-center shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path
                            d="M1.5 4l2 2L6.5 2"
                            stroke="#060e06"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-[0.45] rounded-xl border border-[rgba(232,213,163,0.10)] px-4 py-3 text-sm font-medium text-[rgba(232,213,163,0.5)] transition-all duration-200 hover:border-[rgba(232,213,163,0.25)] hover:text-[#e8d5a3]"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!source || loading}
                  className="flex-1 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] py-3 text-sm font-bold tracking-wide text-[#060e06] shadow-[0_4px_20px_rgba(201,168,76,0.30)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_26px_rgba(201,168,76,0.40)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="#060e06"
                          strokeWidth="3"
                        />
                        <path
                          className="opacity-75"
                          fill="#060e06"
                          d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
                        />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Finish Setup ✦"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
