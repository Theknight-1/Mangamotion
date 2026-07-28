export function EditorMockup() {
  return (
    <div className="relative mt-24">
      {/* === AMBIENT GLOW LAYERS (behind the card) === */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-[28px] opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34, 197, 94, 0.15), transparent), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(22, 163, 74, 0.25), transparent)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -inset-14 rounded-[22px] opacity-60 blur-xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(34, 197, 94, 0.30) 0%, rgba(22, 163, 74, 0.08) 50%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* === BORDER / SHEEN OVERLAY === */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[18px] ring-2 ring-inset ring-emerald-400/15 z-20"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 rounded-[18px] z-20"
        style={{
          background:
            "linear-gradient(180deg, rgba(134, 239, 172, 0.08) 0%, rgba(134, 239, 172, 0.02) 1px, transparent 30%)",
        }}
        aria-hidden="true"
      />

      {/* === MAIN CARD === */}
      <div className="relative overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#0e0e0e] shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#111] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(201,168,76,0.35)] bg-[#1a2e1a]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#c9a84c">
                <path d="M2 1.5l8 4.5-8 4.5z" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-[#e8d5a3]">
              Chapter 1: The Journey Begins
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-[7px] border border-white/10 px-2.5 py-1">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="text-white/35"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-[11px] text-white/40">Draft</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-[7px] bg-linear-to-br from-[#c9a84c] to-[#e8d5a3] px-3 py-1">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                className="text-[#1a0e00]"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="text-[11px] font-bold text-[#1a0e00]">
                Export
              </span>
            </div>
          </div>
        </div>

        {/* 3-column body */}
        <div className="grid grid-cols-[200px_1fr_240px] min-h-85">
          {/* LEFT: Scene list */}
          <div className="flex flex-col border-r border-white/[0.07] bg-[#0d0d0d]">
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <div>
                <p className="text-[11.5px] font-semibold text-white/85">
                  Scene list
                </p>
                <p className="text-[9.5px] text-white/30 mt-0.5">
                  5 scenes · 0s
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-[6px] border border-white/10 bg-white/4 px-2 py-1">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white/40"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-[9.5px] text-white/40">Bulk</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 px-2.5 pb-2.5 flex-1">
              {/* Scene 1 – active */}
              <div className="flex items-center gap-2 rounded-[9px] border border-[rgba(201,168,76,0.5)] bg-[rgba(201,168,76,0.08)] px-2.5 py-2">
                <div className="h-8 w-8 shrink-0 rounded-[5px] border border-white/10 bg-white/4 flex items-center justify-center">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-white/20"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 text-start">
                  <p className="text-[11px] font-medium text-[#e8d5a3] truncate">
                    Scene 1
                  </p>
                  <p className="text-[9.5px] text-red-400 mt-0.5">
                    No voice generated
                  </p>
                </div>
              </div>

              {/* Scenes 2–5 */}
              {[2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="flex items-center gap-2 rounded-[9px] border border-white/6 bg-white/2 px-2.5 py-2"
                >
                  <div className="h-8 w-8 shrink-0 rounded-[5px] border border-white/6 bg-white/3 flex items-center justify-center">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-white/15"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 text-start">
                    <p className="text-[11px] font-medium text-white/40 truncate">
                      Scene {n}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add scene */}
            <div className="border-t border-white/[0.07] p-2.5 mt-auto">
              <div className="flex items-center justify-center gap-1.5 rounded-[8px] border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.08)] py-2">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="text-[#c9a84c]"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[11px] font-semibold text-[#c9a84c]">
                  Add scene
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: Preview + scene detail */}
          <div className="flex flex-col bg-[#0a0a0a]">
            {/* Preview */}
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="relative w-full max-w-110 aspect-video rounded-[10px] border border-white/8 bg-[#111] flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.1)]">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="rgba(201,168,76,0.6)"
                    >
                      <path d="M5 3l14 9-14 9z" />
                    </svg>
                  </div>
                  <p className="text-[10px] text-white/25">Scene 1 preview</p>
                </div>
                <span className="absolute bottom-2 left-2.5 text-[9px] text-white/40 bg-black/50 rounded px-1.5 py-0.5">
                  16:9
                </span>
                <span className="absolute bottom-2 right-2.5 text-[9px] text-white/40 bg-black/50 rounded px-1.5 py-0.5">
                  5 scenes
                </span>
              </div>
            </div>

            {/* Scene detail */}
            <div className="border-t border-white/[0.07] p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-white/[0.07] text-[10px] font-bold text-white/50">
                    1
                  </div>
                  <span className="text-[12.5px] font-medium text-white/80">
                    Scene 1
                  </span>
                </div>
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] bg-red-500/10">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#e84040"
                    strokeWidth="1.8"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-3 items-start">
                <div className="aspect-[3/4] w-full rounded-[7px] border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-white/20"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                      Narration
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-white/20">77/500</span>
                      <div className="flex items-center gap-1 rounded-[5px] border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.08)] px-1.5 py-0.5">
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#c9a84c"
                          strokeWidth="2.2"
                        >
                          <polyline points="1 4 1 10 7 10" />
                          <path d="M3.51 15a9 9 0 1 0 .49-3.2" />
                        </svg>
                        <span className="text-[9px] text-[#c9a84c]">
                          Re-analyze
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full rounded-[7px] border border-white/8 bg-white/3 p-2 text-[11px] leading-relaxed text-white/60 h-[68px] overflow-hidden text-start">
                    A powerful moment unfolds in this manga panel — the story
                    continues to build.
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[9px] text-white/25">
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    3 zoom keyframes detected by AI
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Voices & Settings */}
          <div className="flex flex-col border-l border-white/[0.07] bg-[#0d0d0d]">
            <div className="flex border-b border-white/[0.07]">
              <button className="flex-1 border-b-2 border-[#c9a84c] bg-transparent py-2.5 text-[10.5px] font-semibold text-[#c9a84c]">
                Voices &amp; Settings
              </button>
              <button className="flex-1 border-b-2 border-transparent bg-transparent py-2.5 text-[10.5px] font-medium text-white/30">
                Export
              </button>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border border-green-500/30 bg-green-500/15">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="1.8"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>
                <span className="text-[11.5px] font-semibold text-white/80">
                  Voice Over Studio
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <div className="w-full rounded-[7px] border border-white/[0.08] bg-white/[0.04] py-1.5 pl-7 pr-3 text-[10.5px] text-white/25">
                  Filter characters...
                </div>
              </div>

              {/* Voice grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { n: "Jungkook", s: "Jungkook", a: true },
                  { n: "Yuri — 729e...", s: "Yuri", a: false },
                  { n: "Harry Styles", s: "Harry Styles", a: false },
                  { n: "Markiplier", s: "Markiplier", a: false },
                  { n: "Estelle", s: "Estelle", a: false },
                  { n: "Omarion", s: "Omarion", a: false },
                ].map((v, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 rounded-[7px] border p-1.5 ${v.a ? "border-green-500/40 bg-green-500/10" : "border-white/[0.07] bg-white/[0.02]"}`}
                  >
                    <div className="h-7 w-7 shrink-0 rounded-[5px] bg-gradient-to-br from-green-700/40 to-blue-700/40 flex items-center justify-center">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1.8"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-[9.5px] font-medium truncate ${v.a ? "text-white/85" : "text-white/40"}`}
                      >
                        {v.n}
                      </p>
                      <p
                        className={`text-[8.5px] truncate ${v.a ? "text-green-400" : "text-white/20"}`}
                      >
                        {v.s}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Narration script */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[9.5px] font-semibold text-white/45">
                    2. Narration Script
                  </span>
                  <span className="text-[9px] text-white/20">77/500</span>
                </div>
                <div className="w-full rounded-[7px] border border-white/[0.08] bg-white/[0.03] p-2 text-[10.5px] leading-relaxed text-white/60 h-[56px] overflow-hidden">
                  A powerful moment unfolds in this manga panel — the story
                  continues to build.
                </div>
              </div>

              {/* Configured actor */}
              <div className="flex items-center justify-between rounded-[6px] bg-white/[0.02] px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-[9px] text-white/35">
                    Configured Actor:
                  </span>
                  <span className="text-[9px] font-medium text-white/55">
                    Jungkook — jungkook
                  </span>
                </div>
                <span className="text-[8.5px] text-white/20">
                  TTS Engine v2
                </span>
              </div>

              {/* Generate button */}
              <button className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-gradient-to-br from-green-600 to-green-700 py-2.5 text-[13px] font-bold text-white">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
                Generate Spatial Audio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
