"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { useStore } from "@nanostores/react";
import { IconLogo } from "./icon-logo";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: session, isPending } = useStore(useSession);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change / resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-20px)] max-w-287.5">
      <nav
        className={`
          relative
          w-full
          backdrop-blur-[20px] backdrop-saturate-180
          border border-[#c9a84c]/15 rounded-2xl 
          transition-all duration-300 ease-in-out
          overflow-hidden
          ${
            scrolled
              ? "bg-[#080e06]/95 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              : "bg-[#080e06]/60 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
          }
        `}
      >
        {/* Subtle Top Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_center,rgba(201,168,76,0.1),transparent_70%)] pointer-events-none z-0" />

        <div className="relative z-10 h-17 max-w-270 mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <IconLogo />
            <span className="text-[15px] font-bold text-[#e8d5a3] tracking-tight">
              MotionRecap
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-[#e8d5a3]/65 no-underline px-3.5 py-2 rounded-[10px] 
                           transition-all duration-200 ease-in-out
                           hover:bg-[#c9a84c]/8 hover:text-[#e8d5a3]"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isPending ? (
              <div className="w-20 h-9 rounded-xl bg-white/5 animate-pulse" />
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-bold text-[#060e06] no-underline px-5 py-2 rounded-xl
                             bg-linear-to-br from-[#c9a84c] to-[#e8d5a3] 
                             shadow-[0_4px_20px_rgba(201,168,76,0.35)]
                             transition-all duration-200 ease-in-out
                             hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,168,76,0.45)]"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() =>
                    signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          window.location.href = "/login";
                        },
                      },
                    })
                  }
                  className="text-[13px] font-medium text-[#e8d5a3]/50 bg-transparent border-none cursor-pointer px-3 py-2 rounded-[10px]
                             transition-all duration-200 ease-in-out
                             hover:text-[#e8d5a3] hover:bg-white/5"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[13px] font-medium text-[#e8d5a3]/65 no-underline px-3.5 py-2 rounded-[10px]
                             transition-all duration-200 ease-in-out
                             hover:text-[#e8d5a3] hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-[13px] font-bold text-[#060e06] no-underline px-5 py-2 rounded-xl
                             bg-linear-to-br from-[#c9a84c] to-[#e8d5a3] 
                             shadow-[0_4px_20px_rgba(201,168,76,0.35)]
                             transition-all duration-200 ease-in-out
                             hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,168,76,0.45)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="md:hidden text-[#e8d5a3]/70 bg-transparent border-none cursor-pointer p-2"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown — OUTSIDE the nav so overflow-hidden doesn't clip it */}
      <div
        className={`
          md:hidden absolute top-[calc(100%+8px)] left-0 right-0 z-20
          bg-[#080e06]/98 backdrop-blur-xl
          border border-[#c9a84c]/15 rounded-2xl
          shadow-[0_12px_40px_rgba(0,0,0,0.35)]
          transition-all duration-300 ease-in-out overflow-hidden
          ${
            mobileOpen
              ? "max-h-125 opacity-100 py-2 px-4 pointer-events-auto"
              : "max-h-0 opacity-0 py-0 px-4 pointer-events-none"
          }
        `}
      >
        <div className="flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm text-[#e8d5a3]/65 no-underline px-3 py-3 rounded-lg
                         transition-colors duration-200
                         hover:bg-[#c9a84c]/8 hover:text-[#e8d5a3]"
            >
              {l.label}
            </Link>
          ))}

          <div className="h-px bg-[#c9a84c]/15 my-2" />

          {!isPending &&
            (session ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-bold text-[#060e06] no-underline text-center px-5 py-3 rounded-xl
                             bg-linear-to-br from-[#c9a84c] to-[#e8d5a3]"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() =>
                    signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          window.location.href = "/login";
                        },
                      },
                    })
                  }
                  className="text-sm font-medium text-[#e8d5a3]/50 bg-transparent border-none cursor-pointer px-3 py-3 rounded-lg text-left
                             hover:bg-white/5 hover:text-[#e8d5a3]"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-[#e8d5a3]/65 no-underline text-center px-5 py-3 rounded-xl border border-[#c9a84c]/25
                             hover:bg-white/5 hover:text-[#e8d5a3]"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-bold text-[#060e06] no-underline text-center px-5 py-3 rounded-xl
                             bg-linear-to-br from-[#c9a84c] to-[#e8d5a3]"
                >
                  Get Started
                </Link>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};