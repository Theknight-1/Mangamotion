"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { Clapperboard, FolderOpen, Settings } from "lucide-react";

import { IconLogo } from "@/components/icon-logo";
import { ProfileMenu } from "@/components/user/profile-menu";

const ITEMS = [
  {
    href: "/dashboard",
    label: "Recap",
    icon: Clapperboard,
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/dashboard/storyboard",
    label: "Storyboard",
    icon: FolderOpen,
    match: (pathname: string) => pathname.startsWith("/dashboard/storyboard"),
  },
];

interface Props {
  name?: string | null;
  email?: string | null;
}

export function IconRail({ name, email }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-20 flex-col border-r border-white/10 bg-gradient-to-b from-[#0d120d] via-[#090d09] to-[#050505]">
      {/* Top */}
      <div className="flex flex-col items-center pt-5">
        <motion.div
          whileHover={{
            rotate: 8,
            scale: 1.05,
          }}
          className="mb-6 flex  items-center justify-center rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 shadow-lg shadow-[#c9a84c]/10"
        >
          <IconLogo />
        </motion.div>
        <div className="space-y-2">
          {ITEMS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);

            return (
              <Link key={href} href={href} className="group relative block">
                {active && (
                  <motion.div
                    layoutId="activeRail"
                    className="absolute inset-0 rounded-md bg-[#6ed85d]/10 border border-[#6ed85d]/20"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}

                <div
                  className={`relative flex h-13 w-16 flex-col items-center justify-center rounded-md transition-all duration-200 ${
                    active ? "text-[#88e66e]" : "text-white/40 hover:text-white"
                  }`}
                >
                  <Icon
                    size={19}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:scale-110"
                  />

                  <span className="mt-1 text-[10px] font-medium">{label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-auto flex flex-col items-center pb-5">
        <div className="mb-5 h-px w-10 bg-white/10" />

        <Link
          href="/settings"
          className={`mb-3 rounded-xl p-3 transition ${
            pathname.startsWith("/settings")
              ? "bg-white/8 text-white"
              : "text-white/40 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings size={18} />
        </Link>

        <ProfileMenu variant="rail" name={name} email={email} />
      </div>
    </aside>
  );
}