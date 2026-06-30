import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AuthForm from "@/components/auth-form";
import MangaShowcase from "@/components/auth/manga-showcase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr] bg-[#0c170c]">
      <MangaShowcase />

      <div className="relative flex min-h-svh flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-14 md:min-h-0 md:px-8 md:py-14">
        {/* Ambient glow — smaller on mobile */}
        <div
          className="pointer-events-none absolute left-1/2 top-[8%] h-60 w-60 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.05)_0%,transparent_70%)] sm:h-80 sm:w-80 md:h-120 md:w-120"
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-88 sm:max-w-95">
          {/* Mobile logo */}
          <a
            href="/"
            className="mb-6 flex items-center gap-2.5 sm:mb-8 md:hidden"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 36 36"
              fill="none"
              aria-hidden="true"
            >
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
              <polygon points="15,13.5 15,22.5 23,18" fill="#0c170c" />
            </svg>
            <span className="text-[15px] font-bold text-[#e8d5a3]">
              MotionRecap
            </span>
          </a>

          <div className="mb-6 sm:mb-7.5">
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-[#e8d5a3] sm:mb-2 sm:text-[28px]">
              Welcome back
            </h1>
            <p className="text-sm leading-relaxed text-[#e8d5a3]/55">
              Transform manga images into animated videos.
            </p>
          </div>

          <div className="my-4 flex items-center gap-3 sm:my-5.5">
            <span className="h-px flex-1 bg-[#e8d5a3]/10" />
            <span className="text-[11px] uppercase tracking-[0.08em] text-[#e8d5a3]/30 sm:text-[11.5px]">
              Or continue with email
            </span>
            <span className="h-px flex-1 bg-[#e8d5a3]/10" />
          </div>

          <AuthForm mode="sign-in" />
        </div>
      </div>
    </div>
  );
}