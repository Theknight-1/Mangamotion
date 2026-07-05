// app/verify-email/page.tsx
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#0c170c] px-5 py-10 sm:px-6">
      <div className="relative z-10 w-full max-w-md text-center">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-60 w-60 -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.08)_0%,transparent_70%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 rounded-2xl border border-[rgba(232,213,163,0.10)] bg-white/2.5 p-8 sm:p-10">
          {/* Mail Icon */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.05)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c9a84c"
              strokeWidth="1.5"
              className="h-7 w-7"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#e8d5a3]">
            Check your email
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-[#e8d5a3]/55">
            We sent a verification link to your email address. Please check your
            inbox (and spam folder) and click the link to activate your account.
          </p>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-xl bg-linear-to-br from-[#c9a84c] to-[#e8d5a3] py-3 text-sm font-bold tracking-wide text-[#060e06] shadow-[0_4px_20px_rgba(201,168,76,0.30)] transition-all hover:-translate-y-px hover:shadow-[0_8px_26px_rgba(201,168,76,0.40)]"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
