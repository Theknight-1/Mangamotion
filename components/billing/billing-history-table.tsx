"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {  Loader2, BadgeDollarSign } from "lucide-react";

interface Subscription {
  tier: string;
  status: string;
  provider: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
}

export function BillingHistory() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "cancel" | "cancel-now" | null
  >(null);

  function refresh() {
    setLoading(true);
    fetch("/api/subscriptions")
      .then((res) => res.json())
      .then((data) => setSubscription(data.subscription))
      .catch((err) => console.error("[billing] fetch failed:", err))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCancelAtPeriodEnd() {
    setActionLoading("cancel");
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.note || "Cancellation scheduled");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelNow() {
    if (!confirm("Cancel immediately and downgrade to Free right now?")) return;
    setActionLoading("cancel-now");
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Subscription cancelled — you're back on Free");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#e8d5a3]/50 text-sm p-6">
        <Loader2 size={16} className="animate-spin" /> Loading billing info…
      </div>
    );
  }
  if (!subscription) return null;

  const isPaid = subscription.tier !== "free";

  return (
    <div className="rounded-2xl border border-[#2d5a27]/20 bg-[#1a2d1a] p-6">
      <div className="flex items-center gap-2 mb-5 text-[#e8d5a3]/70 font-semibold text-sm">
        <BadgeDollarSign size={15} className="opacity-60" />
        Plan & billing
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-bold text-[#e8d5a3] capitalize">
            {subscription.tier} plan
          </p>
          <p className="text-xs text-[#e8d5a3]/40 mt-0.5">
            Status: <span className="capitalize">{subscription.status}</span>
            {subscription.provider && ` · billed via ${subscription.provider}`}
          </p>
        </div>
        <a
          href="/pricing"
          className="text-xs font-semibold text-[#c9a84c] underline"
        >
          {isPaid ? "Change plan" : "Upgrade"}
        </a>
      </div>

      {isPaid && (
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#2d5a27]/15">
          {subscription.cancelAtPeriodEnd ? (
            <p className="text-xs text-[#e8d5a3]/50">
              Scheduled to switch to Free on{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
            </p>
          ) : (
            <button
              onClick={handleCancelAtPeriodEnd}
              disabled={actionLoading !== null}
              className="text-xs font-semibold text-[#e8d5a3]/60 hover:text-[#e8d5a3] underline text-left disabled:opacity-50"
            >
              {actionLoading === "cancel"
                ? "Scheduling…"
                : "Cancel at end of billing period"}
            </button>
          )}
          <button
            onClick={handleCancelNow}
            disabled={actionLoading !== null}
            className="text-xs font-semibold text-red-400/80 hover:text-red-400 underline text-left disabled:opacity-50"
          >
            {actionLoading === "cancel-now"
              ? "Cancelling…"
              : "Cancel immediately"}
          </button>
        </div>
      )}
    </div>
  );
}
