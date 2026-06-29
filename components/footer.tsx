import { IconLogo } from "./icon-logo";

export const Footer = () => {
  return (
    <>
      {/* ── footer ── */}
      <footer className="border-t border-[rgba(45,90,39,0.18)] px-6 py-9">
        <div className="mx-auto flex max-w-270 flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <IconLogo />
            <span className="text-sm font-medium text-[rgba(232,213,163,0.4)]">
              MangaMotion AI
            </span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-[rgba(232,213,163,0.75)]">
            © 2026 MangaMotion AI. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {["Terms", "Privacy", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[13px] text-[rgba(232,213,163,0.25)] transition-colors duration-200 hover:text-[#e8d5a3]"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        @media (max-width: 640px) { .hide-mobile { display: none !important; } }
      `}</style>
    </>
  );
};
