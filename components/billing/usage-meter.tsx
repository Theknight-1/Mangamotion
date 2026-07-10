"use client";

import { useEffect, useState } from "react";
import { Video, AlertTriangle } from "lucide-react";

interface UsageData {
  usage: {
    limitMinutes: number;
    usedMinutes: number;
    remainingMinutes: number;
  };
}

export function UsageCard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("[usage-card] fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#2d5a27]/20 bg-[#0a180a] p-6 animate-pulse h-[180px]" />
    );
  }
  if (!data) return null;

  const { usage } = data;
  const pct = Math.min(
    100,
    Math.round((usage.usedMinutes / usage.limitMinutes) * 100),
  );
  const nearLimit = pct >= 85;

  return (
    <div className="rounded-2xl border border-[#2d5a27]/20 bg-[#1a2d1a] p-6 flex flex-col">
      <span className="text-xs font-semibold tracking-wide uppercase text-[#e8d5a3]/40 mb-4">
        Usage Summary
      </span>

      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-[#2d5a27]/15 border border-[#2d5a27]/25 text-[#6b9e62] flex items-center justify-center">
          <Video size={14} />
        </span>
        <div>
          <p className="text-lg font-extrabold text-[#e8d5a3] leading-tight">
            {usage.usedMinutes.toFixed(1)}{" "}
            <span className="text-sm font-medium text-[#e8d5a3]/35">
              / {usage.limitMinutes} min
            </span>
          </p>
          <p className="text-[11px] text-[#e8d5a3]/35">Render minutes used</p>
        </div>
      </div>

      <div className="h-2 rounded-full bg-[#2d5a27]/80 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            nearLimit ? "bg-red-400" : "bg-[#c9a84c]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-[#e8d5a3]/40">{pct}% used</p>

      <div className="mt-auto pt-4">
        {nearLimit && (
          <div className="flex items-center gap-1.5 text-xs text-red-300">
            <AlertTriangle size={12} />
            Close to your limit —{" "}
            <a href="/pricing" className="underline font-semibold">
              upgrade
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
