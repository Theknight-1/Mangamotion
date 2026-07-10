import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PlanCard } from "@/components/billing/plan-card";
import { BillingHistory } from "@/components/billing/billing-history-table";
import { UsageCard } from "@/components/billing/usage-meter";
import { PaymentMethodCard } from "@/components/billing/payment-method";

export const metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default async function BillingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#060e06] text-[#e8d5a3]">
      {/* Gradient header banner */}
      <div className="relative overflow-hidden border-b border-[#2d5a27]/20 bg-linear-to-br from-[#2d5a27]/25 via-[#1a2d1a] to-[#c9a84c]/10 px-6 py-12">
        <div className="absolute -top-15 -right-15 w-75 h-75 bg-[radial-gradient(circle,rgba(201,168,76,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Billing
          </h1>
          <p className="text-sm text-[#e8d5a3]/50 max-w-md">
            Manage your subscription, view payment history, and update your
            billing details — all in one place.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
        <section>
          <h2 className="text-xs font-semibold tracking-wide uppercase text-[#e8d5a3]/35 mb-3">
            Subscription Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PlanCard />
            <UsageCard />
          </div>
        </section>

        <section>
          <BillingHistory />
        </section>

        <section>
          <PaymentMethodCard />
        </section>
      </div>
    </main>
  );
}
