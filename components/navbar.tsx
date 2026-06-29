import { useEffect, useState } from "react";
import { IconLogo } from "./icon-logo";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  const NAV_LINKS = [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Pricing", href: "/coming-soon" },
  ];
  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,

          width: "calc(100% - 32px)",
          maxWidth: 1100,

          background: scrolled ? "rgba(8,16,8,0.82)" : "rgba(8,16,8,0.58)",

          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",

          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: 18,

          boxShadow: scrolled
            ? "0 12px 40px rgba(0,0,0,0.35)"
            : "0 8px 30px rgba(0,0,0,0.25)",

          transition: "all 0.35s ease",
          overflow: "hidden",
        }}
      >
        {/* Glow Effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            background:
              "radial-gradient(circle at top center, rgba(201,168,76,0.12), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            height: 68,
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 2,
          }}
          className="px-4 md:px-6"
        >
          {/* Logo */}
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <IconLogo />

            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#e8d5a3",
                letterSpacing: "-0.02em",
              }}
            >
              MotionRecap
            </span>
          </a>

          {/* Desktop Nav */}
          <div
            className="hide-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 14,
                  color: "rgba(232,213,163,0.65)",
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: 10,
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                  e.currentTarget.style.color = "#e8d5a3";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(232,213,163,0.65)";
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <a
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(232,213,163,0.65)",
                textDecoration: "none",
                borderRadius: 10,
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#e8d5a3";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(232,213,163,0.65)";
                e.currentTarget.style.background = "transparent";
              }}
              className="px-1.5 md:px-4 py-2"
            >
              Sign In
            </a>

            <a
              href="/signup"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#060e06",
                background: "linear-gradient(135deg,#c9a84c 0%,#e8d5a3 100%)",
                borderRadius: 12,
                textDecoration: "none",
                letterSpacing: "0.01em",
                boxShadow: "0 4px 20px rgba(201,168,76,0.35)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(201,168,76,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(201,168,76,0.35)";
              }}
              className="px-1.5 md:px-4 py-2"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>
    </>
  );
};
