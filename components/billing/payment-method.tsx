"use client";

import { useEffect, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";

interface Data {
  subscription: { provider: string | null; tier: string };
}

export function PaymentMethodCard() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const provider = data?.subscription.provider;
  const isPaid = data?.subscription.tier !== "free";

  return (
    <div className="rounded-2xl border border-[#2d5a27]/20 bg-[#1a2d1a] p-6">
      <div className="flex items-center gap-2 mb-4 text-[#e8d5a3]/70 font-semibold text-sm">
        <CreditCard size={15} className="opacity-60" />
        Payment Method
      </div>

      {!isPaid || !provider ? (
        <p className="text-sm text-[#e8d5a3]/35">
          No payment method on file — you're on the Free plan.
        </p>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-[#2d5a27]/20 bg-[#2d5a27]/5 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-[#e8d5a3] capitalize">
              {provider}
            </p>
            <p className="text-[11px] text-[#e8d5a3]/35 mt-0.5">
              Managing card/bank details directly with {provider}
            </p>
          </div>
          <a
            href={
              provider === "paypal"
                ? "https://www.paypal.com/myaccount/autopay/"
                : "https://dashboard.razorpay.com/"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#c9a84c] underline"
          >
            Manage
          </a>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-[#e8d5a3]/25 mt-4">
        <ShieldCheck size={12} />
        Card details are handled directly by{" "}
        {provider ?? "our payment providers"} — MotionRecap never sees or stores
        your card number.
      </p>
    </div>
  );
}
