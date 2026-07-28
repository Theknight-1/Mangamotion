export function MangaBg() {
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