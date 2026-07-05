// app/actions/user.ts
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function completeOnboarding(
  profession: string,
  referralSource: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await db
    .update(user)
    .set({
      profession,
      referralSource,
      onboardingCompleted: true,
    })
    .where(eq(user.id, session.user.id));

  return {
    success: true,
  };
}

export async function emailExists(email: string) {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
    columns: {
      id: true,
      emailVerified: true,
    },
  });

  return existing;
}
