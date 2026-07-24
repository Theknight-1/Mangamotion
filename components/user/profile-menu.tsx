"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { LogOut, Settings, Sparkles, ChevronsUpDown } from "lucide-react";

interface ProfileMenuProps {
  email?: string | null;
  name?: string | null;
  planLabel?: string; // e.g. "Free plan", "Pro plan" — pass in once billing data is wired here
  variant?: "sidebar" | "rail";
}

function initialsFrom(nameOrEmail: string) {
  const cleaned = nameOrEmail.split("@")[0];
  const parts = cleaned.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

export function ProfileMenu({
  email,
  name,
  planLabel = "Free plan",
  variant = "sidebar",
}: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const label = name || email || "Account";
  const initials = initialsFrom(label);

  const menu = (
    <div
      className={`absolute z-50 w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#0d1a0d] py-1 shadow-2xl ${
        variant === "rail"
          ? "bottom-0 left-full ml-2"
          : "bottom-full left-0 mb-2 w-full"
      }`}
    >
      <div className="border-b border-white/[0.06] px-3 py-2.5">
        <p className="truncate text-xs font-medium text-[#e8d5a3]/90">
          {label}
        </p>
        {email && name && (
          <p className="truncate text-[10px] text-[#e8d5a3]/35">{email}</p>
        )}
      </div>
      <button
        onClick={() => {
          setOpen(false);
          router.push("/pricing");
        }}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-xs text-[#e8d5a3]/70 transition-colors hover:bg-white/[0.05] hover:text-[#e8d5a3]"
      >
        <Sparkles size={13} className="text-[#c9a84c]" /> Manage plan
      </button>
      <button
        onClick={() => {
          setOpen(false);
          router.push("/settings");
        }}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-xs text-[#e8d5a3]/70 transition-colors hover:bg-white/[0.05] hover:text-[#e8d5a3]"
      >
        <Settings size={13} /> Settings
      </button>
      <div className="my-1 h-px bg-white/[0.06]" />
      <button
        onClick={() => signOut().then(() => router.push("/"))}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-xs text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <LogOut size={13} /> Sign out
      </button>
    </div>
  );

  if (variant === "rail") {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          title={label}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#c9a84c]/35 bg-[#c9a84c]/15 text-[11px] font-bold text-[#c9a84c] transition-colors hover:bg-[#c9a84c]/25"
        >
          {initials}
        </button>
        {open && menu}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5 text-left transition-colors hover:border-white/15 hover:bg-white/[0.05]"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#c9a84c]/35 bg-[#c9a84c]/15 text-[11px] font-bold text-[#c9a84c]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-[#e8d5a3]/85">
            {label}
          </p>
          <p className="truncate text-[10px] text-[#e8d5a3]/35">{planLabel}</p>
        </div>
        <ChevronsUpDown size={13} className="shrink-0 text-white/20" />
      </button>
      {open && menu}
    </div>
  );
}
