import Link from "next/link";
import { MangaBg } from "@/components/ui/manga-bg";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#0c170c] px-4 py-10 sm:px-6">
      <MangaBg />
      <div className="relative z-10 w-full max-w-lg text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-60 w-60 -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.08)_0%,transparent_70%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 rounded-2xl border border-[rgba(232,213,163,0.10)] bg-white/2.5 p-5 sm:p-8">
          {/* Animated mail icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.06)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c9a84c"
              strokeWidth="1.5"
              className="h-8 w-8"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          {/* Fixed: single h1, fixed typo */}
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-[#e8d5a3]">
            Check your inbox
          </h1>

          <p className="mb-1.5 text-sm font-medium text-[#e8d5a3]/80">
            We sent a verification link to your email.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-[#e8d5a3]/50">
            Click the link in the email to activate your account. If you don't
            see it, check your spam folder.
          </p>

          {/* Steps hint */}
          <div className="mb-6 flex items-center justify-center gap-6 text-xs text-[#e8d5a3]/35">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#c9a84c]/60" />
              Check inbox
            </div>
            <div className="h-px w-6 bg-[#e8d5a3]/15" />
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#e8d5a3]/20" />
              Click the link
            </div>
            <div className="h-px w-6 bg-[#e8d5a3]/15" />
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#e8d5a3]/20" />
              Start creating
            </div>
          </div>

          <Link
            href="/login"
            className="block w-full rounded-xl bg-linear-to-br from-[#c9a84c] to-[#e8d5a3] py-3 text-sm font-bold tracking-wide text-[#060e06] shadow-[0_4px_20px_rgba(201,168,76,0.30)] transition-all hover:-translate-y-px hover:shadow-[0_8px_26px_rgba(201,168,76,0.40)]"
          >
            Back to login
          </Link>

          <p className="mt-4 text-xs text-[#e8d5a3]/30">
            Didn't receive it?{" "}
            <span className="cursor-pointer text-[#e8d5a3]/50 underline underline-offset-2 hover:text-[#e8d5a3]/70">
              Resend email
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}