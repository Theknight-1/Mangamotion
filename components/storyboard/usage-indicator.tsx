"use client";

import useSWR from "swr";
import { Sparkles } from "lucide-react";
import { storyboardApi, swrKeys } from "@/lib/api";

export function StoryboardUsageIndicator() {
  const { data, isLoading } = useSWR(
    swrKeys.storyboardUsage(),
    () => storyboardApi.getUsage(),
    { revalidateOnFocus: false },
  );

  if (isLoading || !data) {
    return (
      <div className="h-7 w-32 animate-pulse rounded-full bg-white/[0.05]" />
    );
  }

  const pct = data.limit > 0 ? Math.min(100, (data.used / data.limit) * 100) : 0;
  const isLow = data.remaining <= Math.max(2, data.limit * 0.15);

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md ${
        isLow
          ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
          : "border-white/10 bg-white/[0.03] text-slate-300"
      }`}
      title={`${data.used} of ${data.limit} generations used this month · Plan: ${data.tier.toUpperCase()}`}
    >
      <Sparkles size={12} className={isLow ? "text-amber-400" : "text-amber-300"} />
      <span className="font-semibold text-[11px]">
        {data.used}/{data.limit} <span className="text-slate-400 font-normal">gens</span>
      </span>
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            isLow ? "bg-amber-400" : "bg-gradient-to-r from-amber-400 to-yellow-300"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
