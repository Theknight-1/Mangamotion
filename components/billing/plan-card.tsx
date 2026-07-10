"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Crown, Star, Zap, ArrowUpRight, Loader2 } from "lucide-react";

interface PlanData {
  subscription: {
    tier: string;
    status: string;
    provider: string | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  };
  tierData: { name: string; price: number };
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  free: <Zap size={14} />,
  creator: <Star size={14} />,
  pro: <Crown size={14} />,
};

export function PlanCard() {
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  function refresh() {
    setLoading(true);
    fetch("/api/subscriptions")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("[plan-card] fetch failed:", err))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  // Single cancel action: stops future billing with whichever provider is
  // actually charging the user (Razorpay or PayPal) AND updates our DB in
  // the same request — there's no window where one side thinks the sub is
  // cancelled and the other keeps charging. Access/quota stays untouched
  // until the period they already paid for ends.
  async function handleCancel() {
    const confirmed = confirm(
      "Cancel your subscription? You'll keep your current plan and render minutes until the end of this billing period — you just won't be charged again.",
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "PATCH" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to cancel");
      toast.success(result.note || "Subscription cancelled — billing stopped");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#2d5a27]/20 bg-[#1a2d1a] p-6 animate-pulse h-[180px]" />
    );
  }
  if (!data) return null;

  const { subscription, tierData } = data;
  const isPaid = subscription.tier !== "free";
  const periodEndLabel = new Date(
    subscription.currentPeriodEnd,
  ).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border border-[#2d5a27]/20 bg-[#1a2d1a] p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold tracking-wide uppercase text-[#e8d5a3]/40">
          Current Plan
        </span>
        <a
          href="/pricing"
          className="flex items-center gap-1 text-xs font-semibold text-[#1a0e00] bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] rounded-lg px-3 py-1.5 hover:shadow-[0_4px_16px_rgba(201,168,76,0.35)] transition-shadow"
        >
          {isPaid ? "Change plan" : "Upgrade"} <ArrowUpRight size={13} />
        </a>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="w-7 h-7 rounded-lg bg-[#c9a84c]/15 border border-[#c9a84c]/25 text-[#c9a84c] flex items-center justify-center">
          {TIER_ICONS[subscription.tier]}
        </span>
        <span className="text-xl font-extrabold text-[#e8d5a3] capitalize">
          {tierData.name} Plan
        </span>
      </div>

      <p className="text-2xl font-extrabold text-[#e8d5a3] mb-4">
        {tierData.price === 0 ? "Free" : `$${tierData.price}`}
        {tierData.price > 0 && (
          <span className="text-sm font-medium text-[#e8d5a3]/35"> /month</span>
        )}
      </p>

      <div className="mt-auto pt-4 border-t border-[#2d5a27]/15">
        {!isPaid ? (
          <p className="text-xs text-[#e8d5a3]/35">
            Upgrade any time — no commitment, cancel whenever.
          </p>
        ) : subscription.cancelAtPeriodEnd ? (
          <p className="text-xs text-[#e8d5a3]/50">
            Billing stopped. Access continues until{" "}
            <b className="text-[#e8d5a3]/70">{periodEndLabel}</b>.
          </p>
        ) : (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#e8d5a3]/50 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {cancelling && <Loader2 size={12} className="animate-spin" />}
            {cancelling ? "Cancelling…" : "Cancel subscription"}
          </button>
        )}
      </div>
    </div>
  );
}
