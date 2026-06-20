export default function MangaShowcase() {
  return (
    <div className="relative hidden md:flex flex-col justify-between overflow-hidden border-r border-[#e2dcc9] bg-gradient-to-br from-[#f9f6ef] via-[#f7f3ea] to-[#f2ecdc] p-14">
      {/* Grain texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="pointer-events-none absolute -right-40 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(31,46,26,0.05)_0%,transparent_70%)]" />

      <a href="/" className="relative z-10 flex items-center gap-2.5">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect
            x="1"
            y="1"
            width="34"
            height="34"
            rx="6"
            fill="none"
            stroke="#1f2e1a"
            strokeWidth="1.5"
          />
          <g stroke="#1f2e1a" strokeWidth="0.7" opacity="0.4">
            <line x1="18" y1="18" x2="1" y2="1" />
            <line x1="18" y1="18" x2="10" y2="1" />
            <line x1="18" y1="18" x2="18" y2="1" />
            <line x1="18" y1="18" x2="26" y2="1" />
            <line x1="18" y1="18" x2="35" y2="1" />
            <line x1="18" y1="18" x2="35" y2="10" />
            <line x1="18" y1="18" x2="35" y2="18" />
            <line x1="18" y1="18" x2="35" y2="26" />
            <line x1="18" y1="18" x2="35" y2="35" />
            <line x1="18" y1="18" x2="26" y2="35" />
            <line x1="18" y1="18" x2="18" y2="35" />
            <line x1="18" y1="18" x2="10" y2="35" />
            <line x1="18" y1="18" x2="1" y2="35" />
            <line x1="18" y1="18" x2="1" y2="26" />
            <line x1="18" y1="18" x2="1" y2="18" />
            <line x1="18" y1="18" x2="1" y2="10" />
          </g>
          <circle cx="18" cy="18" r="9" fill="#1f2e1a" />
          <polygon points="15,13.5 15,22.5 23,18" fill="#f7f3ea" />
        </svg>
        <span className="font-bold text-[15px] tracking-tight text-[#1f2e1a]">
          MangaMotion
        </span>
      </a>

      <div className="relative z-10 flex flex-1 items-center justify-center my-6">
        <div className="relative h-[340px] w-[340px]">
          {/* Panel 1 — active, top-left, large */}
          <div className="absolute left-0 top-0 h-[140px] w-[200px] overflow-hidden rounded-[4px] border-[1.5px] border-[#1f2e1a] bg-white shadow-[0_0_0_1px_rgba(31,46,26,0.15),0_8px_24px_rgba(31,46,26,0.08)]">
            <svg
              viewBox="0 0 200 140"
              className="absolute inset-0 opacity-[0.35]"
            >
              <g stroke="#1f2e1a" strokeWidth="0.6">
                <line x1="100" y1="70" x2="0" y2="0" />
                <line x1="100" y1="70" x2="60" y2="0" />
                <line x1="100" y1="70" x2="140" y2="0" />
                <line x1="100" y1="70" x2="200" y2="0" />
                <line x1="100" y1="70" x2="200" y2="70" />
                <line x1="100" y1="70" x2="200" y2="140" />
                <line x1="100" y1="70" x2="140" y2="140" />
                <line x1="100" y1="70" x2="60" y2="140" />
                <line x1="100" y1="70" x2="0" y2="140" />
                <line x1="100" y1="70" x2="0" y2="70" />
              </g>
            </svg>
            <div className="absolute bottom-2 right-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#1f2e1a]">
              <svg viewBox="0 0 10 10" className="h-2 w-2">
                <polygon points="2,1 2,9 9,5" fill="#f7f3ea" />
              </svg>
            </div>
          </div>

          {/* Panel 2 — halftone, top-right */}
          <div className="absolute left-[212px] top-0 h-[90px] w-[128px] overflow-hidden rounded-[4px] border-[1.5px] border-[#e2dcc9] bg-white">
            <div className="absolute left-[10px] top-[10px] grid grid-cols-4 gap-[5px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="h-[3px] w-[3px] rounded-full bg-[#cdc6b0]"
                />
              ))}
            </div>
          </div>

          {/* Panel 3 — small strip */}
          <div className="absolute left-[212px] top-[102px] h-[60px] w-[128px] rounded-[4px] border-[1.5px] border-[#e2dcc9] bg-white" />

          {/* Panel 4 — tall left */}
          <div className="absolute left-0 top-[152px] flex h-[188px] w-[95px] items-center justify-center rounded-[4px] border-[1.5px] border-[#e2dcc9] bg-white">
            <div className="h-2 w-2 rounded-full bg-[#c9a84c]" />
          </div>

          {/* Panel 5 — wide */}
          <div className="absolute left-[107px] top-[152px] h-[90px] w-[233px] overflow-hidden rounded-[4px] border-[1.5px] border-[#e2dcc9] bg-white">
            <svg
              viewBox="0 0 233 90"
              className="absolute inset-0 opacity-[0.18]"
            >
              <g stroke="#1f2e1a" strokeWidth="0.5">
                <line x1="0" y1="0" x2="233" y2="90" />
                <line x1="0" y1="30" x2="233" y2="90" />
                <line x1="0" y1="0" x2="233" y2="30" />
                <line x1="0" y1="60" x2="233" y2="90" />
              </g>
            </svg>
          </div>

          {/* Panel 6 — bottom wide, halftone */}
          <div className="absolute left-[107px] top-[254px] h-[86px] w-[233px] overflow-hidden rounded-[4px] border-[1.5px] border-[#e2dcc9] bg-white">
            <div className="absolute bottom-[10px] right-[10px] grid grid-cols-4 gap-[5px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="h-[3px] w-[3px] rounded-full bg-[#cdc6b0]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <p className="mb-3.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[rgba(31,46,26,0.45)] before:h-px before:w-4 before:bg-[rgba(31,46,26,0.45)]">
          From panel to motion
        </p>
        <h2 className="mb-3.5 max-w-[420px] text-[30px] font-semibold leading-[1.18] text-[#1f2e1a]">
          Every panel has a story waiting to move.
        </h2>
        <p className="mb-7 max-w-[380px] text-sm leading-relaxed text-[rgba(31,46,26,0.6)]">
          Upload your pages, pick a voice for every character, and let
          MangaMotion handle the pacing, the pans, and the performance.
        </p>
        <div className="flex gap-7">
          {[
            { num: "20K+", label: "Character voices" },
            { num: "2,400+", label: "Creators" },
            { num: "4.9★", label: "Average rating" },
          ].map((s) => (
            <div
              key={s.label}
              className="border-l-[1.5px] border-[#1f2e1a]/30 pl-3"
            >
              <span className="block text-xl font-bold text-[#1f2e1a]">
                {s.num}
              </span>
              <span className="text-[11.5px] text-[rgba(31,46,26,0.6)]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
