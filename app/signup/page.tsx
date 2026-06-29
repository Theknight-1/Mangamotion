import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AuthForm from "@/components/auth-form";
import MangaShowcase from "@/components/auth/manga-showcase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr] bg-[#060e06]">
      <MangaShowcase />

      <div className="relative flex flex-col items-center justify-center px-8 py-14">
        <div className="pointer-events-none absolute left-1/2 top-[10%] h-120 w-120 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.05)_0%,transparent_70%)]" />

        <div className="relative z-10 w-full max-w-95">
          {/* Mobile logo */}
          <a href="/" className="mb-8 flex items-center gap-2.5 md:hidden">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <rect
                x="1"
                y="1"
                width="34"
                height="34"
                rx="6"
                fill="none"
                stroke="#c9a84c"
                strokeWidth="1.5"
              />
              <circle cx="18" cy="18" r="9" fill="#c9a84c" />
              <polygon points="15,13.5 15,22.5 23,18" fill="#060e06" />
            </svg>
            <span className="font-bold text-[15px] text-[#e8d5a3]">
              MotionRecap
            </span>
          </a>

          <div className="mb-7.5">
            <h1 className="mb-2 text-[28px] font-bold tracking-tight text-[#e8d5a3]">
              Create your account
            </h1>
            <p className="text-sm text-[rgba(232,213,163,0.55)]">
              Start turning manga panels into animated videos.
            </p>
          </div>

          <div className="my-5.5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[rgba(232,213,163,0.10)]" />
            <span className="text-[11.5px] uppercase tracking-[0.08em] text-[rgba(232,213,163,0.30)]">
              Or continue with email
            </span>
            <span className="h-px flex-1 bg-[rgba(232,213,163,0.10)]" />
          </div>

          <AuthForm mode="sign-up" />

          <p className="mt-6 text-center text-[11.5px] leading-relaxed text-[rgba(232,213,163,0.30)]">
            By signing up, you agree to our{" "}
            <a
              href="/terms"
              className="text-[rgba(232,213,163,0.55)] underline"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-[rgba(232,213,163,0.55)] underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
