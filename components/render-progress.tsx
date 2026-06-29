// components/render-progress.tsx
"use client";

import { motion, AnimatePresence } from "motion/react";
import { Loader2, CheckCircle2, AlertCircle, Film } from "lucide-react";

interface RenderProgressProps {
  progress: {
    currentScene?: number;
    totalScenes?: number;
    status?: string;
    progress?: number;
    message?: string;
    type?: string;
  } | null;
}

export function RenderProgress({ progress }: RenderProgressProps) {
  if (!progress) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="bg-[#0d0d18] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl min-w-[320px]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={
                progress.type === "complete" ? { rotate: 0 } : { rotate: 360 }
              }
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              {progress.type === "complete" ? (
                <CheckCircle2 className="text-[#4a8a42]" size={20} />
              ) : progress.type === "error" ? (
                <AlertCircle className="text-red-400" size={20} />
              ) : (
                <Loader2 className="text-[#bbdf50]" size={20} />
              )}
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-white">
                {progress.type === "complete"
                  ? "Render Complete!"
                  : progress.type === "error"
                    ? "Render Failed"
                    : "Rendering Video"}
              </p>
              <p className="text-xs text-white/40">
                {progress.message || "Processing scenes..."}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {progress.progress !== undefined && (
            <div className="space-y-2">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-linear-to-r from-[#4a8a42] to-[#bbdf50] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/30">
                <span>{progress.progress}%</span>
                {progress.currentScene && progress.totalScenes && (
                  <span>
                    Scene {progress.currentScene}/{progress.totalScenes}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Scene indicator */}
          {progress.currentScene && progress.totalScenes && (
            <div className="flex items-center gap-2 mt-3">
              <Film size={14} className="text-white/20" />
              <div className="flex gap-1.5">
                {Array.from({ length: progress.totalScenes }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < progress.currentScene!
                        ? "bg-[#4a8a42]"
                        : i === progress.currentScene
                          ? "bg-[#bbdf50]"
                          : "bg-white/10"
                    }`}
                    animate={
                      i === progress.currentScene ? { scale: [1, 1.3, 1] } : {}
                    }
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
