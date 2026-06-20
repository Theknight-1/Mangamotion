"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";

export default function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "sign-up";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Something went wrong");
        toast.error(result.error.message ?? "Authentication failed");
        return;
      }

      toast.success(isSignUp ? "Account created!" : "Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSignUp && (
        <div>
          <label className="mb-[7px] block text-[12.5px] font-medium text-[rgba(232,213,163,0.55)]">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Your name"
            className="w-full rounded-[11px] border border-[rgba(232,213,163,0.10)] bg-white/[0.025] px-3.5 py-3 text-sm text-[#e8d5a3] placeholder-[rgba(232,213,163,0.25)] outline-none transition-all focus:border-[#c9a84c] focus:bg-[rgba(201,168,76,0.04)] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.10)]"
          />
        </div>
      )}

      <div>
        <label className="mb-[7px] block text-[12.5px] font-medium text-[rgba(232,213,163,0.55)]">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-[11px] border border-[rgba(232,213,163,0.10)] bg-white/[0.025] px-3.5 py-3 text-sm text-[#e8d5a3] placeholder-[rgba(232,213,163,0.25)] outline-none transition-all focus:border-[#c9a84c] focus:bg-[rgba(201,168,76,0.04)] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.10)]"
        />
      </div>

      <div>
        <label className="mb-[7px] block text-[12.5px] font-medium text-[rgba(232,213,163,0.55)]">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder={isSignUp ? "Create a password" : "••••••••"}
            className="w-full rounded-[11px] border border-[rgba(232,213,163,0.10)] bg-white/[0.025] px-3.5 py-3 pr-11 text-sm text-[#e8d5a3] placeholder-[rgba(232,213,163,0.25)] outline-none transition-all focus:border-[#c9a84c] focus:bg-[rgba(201,168,76,0.04)] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.10)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(232,213,163,0.30)] hover:text-[rgba(232,213,163,0.55)]"
          >
            {showPassword ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.6 18.6 0 0 1 4.06-4.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
              >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {isSignUp && (
          <p className="mt-1.5 text-[11.5px] text-[rgba(232,213,163,0.30)]">
            Must be at least 8 characters
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] py-3 text-sm font-bold tracking-wide text-[#060e06] shadow-[0_4px_20px_rgba(201,168,76,0.30)] transition-all hover:-translate-y-px hover:shadow-[0_8px_26px_rgba(201,168,76,0.40)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-sm text-[rgba(232,213,163,0.55)]">
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <Link
          href={isSignUp ? "/login" : "/signup"}
          className="font-semibold text-[#e8d5a3] hover:underline"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}
