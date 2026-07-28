"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function registerUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  const existing = await db.query.user.findFirst({
    where: eq(user.email, cleanEmail),
    columns: {
      id: true,
      emailVerified: true,
    },
  });

  // User already exists
  if (existing) {
    if (existing.emailVerified) {
      return {
        success: false,
        message: "An account with this email already exists.",
      };
    }

    // Existing but not verified
    await auth.api.sendVerificationEmail({
      body: {
        email: cleanEmail,
        callbackURL: "/login?verified=true",
      },
    });

    return {
      success: false,
      message:
        "Your account already exists but hasn't been verified. We've sent you a new verification email.",
      redirect: "/verify-email",
    };
  }

  // Create account
  const result = await auth.api.signUpEmail({
    body: {
      name: cleanName,
      email: cleanEmail,
      password,
      callbackURL: "/login?verified=true",
    },
  });

  if (!result.user) {
    return {
      success: false,
      message: "Unable to create account.",
    };
  }

  return {
    success: true,
    redirect: "/verify-email",
  };
}