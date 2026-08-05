"use client";

import { Clapperboard, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Comingsoon() {
  return (
    <div className="flex h-full items-center justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-2xl"
      >
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#101510] to-[#090c09] p-10 shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#87da70]/20 bg-[#87da70]/10">
            <Clapperboard
              size={38}
              className="text-[#87da70]"
            />
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-4 py-1 text-xs font-semibold text-[#e8d5a3]">
              <Sparkles size={14} />
              Coming Soon
            </span>

            <h1 className="mt-6 text-4xl font-bold text-white">
              Storyboard Studio
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/55">
              Transform your recap into an AI-generated storyboard with
              cinematic scene breakdowns, keyframes, and export-ready boards.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-white/8 bg-black/20 p-6">
            <p className="mb-5 text-sm font-semibold text-white">
              Planned Features
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Automatic Scene Detection",
                "AI Story Frames",
                "Timeline Editing",
                "Figma Export",
                "PDF Storyboards",
                "Prompt Customization",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 text-sm text-white/70"
                >
                  <CheckCircle2
                    size={16}
                    className="text-[#87da70]"
                  />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button className="rounded-xl bg-[#87da70] px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]">
              Notify Me
            </button>

            <span className="text-sm text-white/35">
              Estimated Release • Q4 2026
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}