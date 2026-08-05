import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

import { IconRail } from "@/components/icon-rail";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      onboardingCompleted: true,
      emailVerified: true,
    },
  });

  if (!dbUser) redirect("/login");

  if (!dbUser.emailVerified) {
    redirect("/verify-email");
  }

  if (!dbUser.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#080b08]">
      <IconRail
        name={session.user.name}
        email={session.user.email}
      />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}