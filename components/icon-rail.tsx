"use client";

import { Home, FolderOpen, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { IconLogo } from "@/components/icon-logo";

export type RailKey = "home" | "projects" | "apps";

interface IconRailProps {
  active: RailKey;
  onSelect: (key: RailKey) => void;
  children?: React.ReactNode;
}

const ITEMS: { key: RailKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "projects", label: "Projects", icon: FolderOpen },
  { key: "apps", label: "Apps", icon: LayoutGrid },
];

export function IconRail({ active, onSelect, children }: IconRailProps) {
  return (
    <nav className="flex h-full w-19 shrink-0 flex-col  items-center justify-between border-r border-white/6 bg-[#0a0f0a] py-4">
      <div className="flex flex-col items-center gap-1 ">
        <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/10">
          <IconLogo />
        </div>

        {ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`relative group flex w-14 cursor-pointer flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors duration-200 outline-none group ${
                isActive
                  ? "text-[#87da70]"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              {/* Active Background Pill Animation */}
              {isActive && (
                <motion.div
                  layoutId="activeRailIndicator"
                  className="absolute inset-0 bg-[#4a8a42]/10 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Hover Background Pill Animation (Subtle fade) */}
              {!isActive && (
                <div className="absolute inset-0 bg-white/0 rounded-xl transition-colors duration-200 group-hover:bg-white/5 -z-10" />
              )}

              {/* Icon Micro-interaction */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="group-hover:scale-125  group-hover:-translate-y-0.5 font-bold transition-all duration-200"
              >
                <Icon size={18} />
              </motion.div>

              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2">{children}</div>

    </nav>
  );
}


