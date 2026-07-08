import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UsageMeter } from "@/components/usage-meter";
import { BillingHistory } from "@/components/billing-history";

export const metadata = {
  title: "Billing — MangaMotion",
  robots: { index: false, follow: false },
};

export default async function BillingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#060e06] text-[#e8d5a3] px-6 py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Billing</h1>
        <UsageMeter />
        <BillingHistory />
      </div>
    </main>
  );
}
