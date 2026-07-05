import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("Dashboard layout start");

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

  if (!dbUser) {
    redirect("/login");
  }

  if (!dbUser.emailVerified) {
    redirect("/verify-email");
  }

  if (!dbUser.onboardingCompleted) {
    redirect("/onboarding");
  }

  return children;
}
