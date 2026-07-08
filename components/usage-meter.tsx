"use client";

import { useEffect, useState } from "react";
import { Video, AlertTriangle } from "lucide-react";

interface UsageData {
  subscription: {
    tier: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  };
  usage: {
    limitMinutes: number;
    usedMinutes: number;
    remainingMinutes: number;
  };
}

export function UsageMeter() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("[usage-meter] fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#2d5a27]/20 bg-[#0a180a] p-5 animate-pulse h-24" />
    );
  }
  if (!data) return null;

  const { usage, subscription } = data;
  const pct = Math.min(
    100,
    Math.round((usage.usedMinutes / usage.limitMinutes) * 100),
  );
  const nearLimit = pct >= 85;

  return (
    <div className="rounded-2xl border border-[#2d5a27]/20 bg-[#0a180a] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[#e8d5a3]/70 text-sm font-semibold">
          <Video size={14} className="opacity-60" />
          Render minutes this period
        </div>
        <span className="text-xs text-[#e8d5a3]/40 capitalize">
          {subscription.tier} plan
        </span>
      </div>

      <div className="h-2 rounded-full bg-[#2d5a27]/15 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            nearLimit ? "bg-red-400" : "bg-[#c9a84c]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[#e8d5a3]/50">
        <span>
          {usage.usedMinutes.toFixed(1)} / {usage.limitMinutes} min used
        </span>
        <span>{usage.remainingMinutes.toFixed(1)} min left</span>
      </div>

      {nearLimit && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-red-300">
          <AlertTriangle size={12} />
          You're close to your monthly limit —{" "}
          <a href="/pricing" className="underline font-semibold">
            upgrade your plan
          </a>
        </div>
      )}

      {subscription.cancelAtPeriodEnd && (
        <p className="mt-3 text-xs text-[#e8d5a3]/40">
          Your plan will switch to Free on{" "}
          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
        </p>
      )}
    </div>
  );
}
