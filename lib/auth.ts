// lib/auth.ts
import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";
import { resend } from "@/lib/resend";
import { verifyEmailTemplate } from "@/lib/email-templates/verify-email";
import { emailExists } from "@/app/actions/user";

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url = "/login" }) => {
      try {
        await resend.emails.send({
          // Change this to your verified domain in Resend
          from: process.env.RESEND_EMAIL!,
          to: user.email,
          subject: "Verify your email address",
          html: verifyEmailTemplate(url),
        });
        console.log(`Verification email sent to ${user.email}`);
      } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
      }
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  // user: {
  //   additionalFields: {
  //     onboardingCompleted: {
  //       type: "boolean",
  //       required: false,
  //       defaultValue: false,
  //       input: false,
  //     },
  //     profession: {
  //       type: "string",
  //       required: false,
  //       input: false,
  //     },
  //     referralSource: {
  //       type: "string",
  //       required: false,
  //       input: false,
  //     },
  //   },
  // },
  // ...(process.env.NODE_ENV === "development"
  //   ? {
  //       advanced: {
  //         defaultCookieAttributes: {
  //           sameSite: "none" as const,
  //           secure: true,
  //         },
  //       },
  //     }
  //   : {}),
});
