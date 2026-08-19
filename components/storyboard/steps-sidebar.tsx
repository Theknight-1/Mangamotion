"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import {
  ArrowLeft,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Clapperboard,
  FileText,
  Palette,
  Users,
  Film,
  Lock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { storyboardApi, swrKeys } from "@/lib/api";
import { StoryboardUsageIndicator } from "@/components/storyboard/usage-indicator";
import { getStoryboardStepsProgress } from "@/lib/storyboard/steps";

const STEP_ICONS = {
  genre: Clapperboard,
  breakdown: FileText,
  style: Palette,
  characters: Users,
  board: Film,
};

interface StepsSidebarProps {
  projectId: string;
}

export function StoryboardStepsSidebar({ projectId }: StepsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data, isLoading } = useSWR(
    swrKeys.storyboardProject(projectId),
    () => storyboardApi.getProject(projectId),
    { revalidateOnFocus: false },
  );

  const project = data?.project;
  const { steps, completedCount, totalSteps, progressPercent } =
    getStoryboardStepsProgress(project, pathname);

  if (isCollapsed) {
    return (
      <aside className="sticky top-0 z-40 flex h-screen w-[64px] shrink-0 flex-col items-center justify-between border-r border-white/[0.07] bg-[#070c07] py-4 transition-all duration-300">
        {/* Top actions */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/dashboard/storyboard"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/10 hover:text-[#e8d5a3]"
            title="Back to All Storyboards"
          >
            <ArrowLeft size={16} />
          </Link>

          <button
            onClick={() => setIsCollapsed(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/40 transition hover:bg-white/5 hover:text-white"
            title="Expand Steps Sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>

          <div className="my-1 h-[1px] w-8 bg-white/10" />

          {/* Stepper icons */}
          <div className="flex flex-col items-center gap-3">
            {steps.map((step) => {
              const Icon = STEP_ICONS[step.id] || Sparkles;
              return (
                <button
                  key={step.id}
                  disabled={!step.isUnlocked}
                  onClick={() =>
                    step.isUnlocked && router.push(step.path(projectId))
                  }
                  className={`group relative flex h-10 w-10 items-center justify-center rounded-md transition-all ${
                    step.isActive
                      ? "border border-[#c9a84c]/40 bg-[#c9a84c]/15 text-[#e8d5a3] shadow-[0_0_15px_rgba(201,168,76,0.2)]"
                      : step.isCompleted
                        ? "border border-white/10 bg-white/[0.04] text-[#88e66e] hover:border-[#88e66e]/30 hover:bg-[#88e66e]/10"
                        : step.isUnlocked
                          ? "border border-transparent text-white/40 hover:bg-white/5 hover:text-white"
                          : "cursor-not-allowed border-transparent text-white/15 opacity-40"
                  }`}
                  title={`${step.stepNumber}. ${step.label} (${
                    step.isActive
                      ? "Current"
                      : step.isCompleted
                        ? "Completed"
                        : "Pending"
                  })`}
                >
                  <Icon size={16} />
                  {step.isCompleted && !step.isActive && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#88e66e] text-[9px] font-black text-black">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom progress indicator */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[10px] font-bold text-[#e8d5a3]"
            title={`${completedCount} of ${totalSteps} steps completed (${progressPercent}%)`}
          >
            {completedCount}/{totalSteps}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-[280px] shrink-0 flex-col border-r border-white/[0.07] bg-[#070c07] text-[#e8d5a3] transition-all duration-300">
      {/* Sidebar Header */}
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/storyboard"
            className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-[#e8d5a3]"
          >
            <ArrowLeft
              size={13}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            <span>All Storyboards</span>
          </Link>

          <button
            onClick={() => setIsCollapsed(true)}
            className="rounded-md p-1.5 text-white/30 transition hover:bg-white/5 hover:text-white"
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

        {/* Project Title & Status */}
        <div className="mt-3">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {project?.coverImage && (
                <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/40 shadow-sm">
                  <Image
                    src={project.coverImage}
                    alt={project.title || "Storyboard cover"}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2
                  className="truncate text-base font-bold text-white/90"
                  title={project?.title || "Storyboard Project"}
                >
                  {project?.title || "Untitled Project"}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#e8d5a3]">
                    {project?.genre || "Drama"}
                  </span>
                  <span className="text-[10px] capitalize text-white/50">
                    {project?.status?.replace("_", " ") || "Draft"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 rounded-md border border-white/[0.05] bg-white/[0.02] p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-white/60">Creation Flow</span>
            <span className="font-semibold text-[#e8d5a3]">
              {completedCount}/{totalSteps} Steps
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#88e66e] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stepper Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-white/40">
          Storyboard Workflow
        </p>

        <div className="relative space-y-1">
          {/* Connecting Vertical Line */}
          <div className="pointer-events-none absolute bottom-4 left-[21px] top-4 w-[2px] bg-white/[0.07]" />

          {steps.map((step, idx) => {
            const Icon = STEP_ICONS[step.id] || Sparkles;
            const isClickable = step.isUnlocked;

            return (
              <div key={step.id} className="relative">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() =>
                    isClickable && router.push(step.path(projectId))
                  }
                  className={`group relative flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-all duration-200 ${
                    step.isActive
                      ? "border border-[#c9a84c]/30 bg-[linear-gradient(135deg,rgba(201,168,76,0.12),rgba(255,255,255,0.02))] shadow-[0_0_15px_rgba(201,168,76,0.08)]"
                      : step.isCompleted
                        ? "border border-transparent hover:border-white/[0.08] hover:bg-white/[0.035] cursor-pointer"
                        : isClickable
                          ? "border border-transparent hover:border-white/[0.06] hover:bg-white/[0.025] cursor-pointer"
                          : "cursor-not-allowed border-transparent opacity-40"
                  }`}
                >
                  {/* Step Status Indicator Circle */}
                  <div
                    className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                      step.isActive
                        ? "border-2 border-[#e8d5a3] bg-[#c9a84c] text-[#060e06] shadow-[0_0_12px_rgba(232,213,163,0.5)]"
                        : step.isCompleted
                          ? "border border-[#88e66e]/40 bg-[#88e66e] text-black shadow-[0_0_8px_rgba(136,230,110,0.3)]"
                          : isClickable
                            ? "border border-white/20 bg-[#0d140d] text-white/50 group-hover:border-white/40 group-hover:text-white"
                            : "border border-white/10 bg-[#0a0f0a] text-white/20"
                    }`}
                  >
                    {step.isCompleted ? (
                      <Check size={13} className="stroke-[3]" />
                    ) : (
                      <span>{step.stepNumber}</span>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`truncate text-sm font-semibold transition-colors ${
                          step.isActive
                            ? "text-[#e8d5a3]"
                            : step.isCompleted
                              ? "text-white/90 group-hover:text-white"
                              : "text-white/50 group-hover:text-white/70"
                        }`}
                      >
                        {step.label}
                      </p>

                      {step.isActive ? (
                        <span className="rounded bg-[#c9a84c]/20 px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-wider text-[#e8d5a3]">
                          Active
                        </span>
                      ) : step.isCompleted ? (
                        <span className="text-[9px] font-semibold text-[#88e66e]">
                          Done
                        </span>
                      ) : !isClickable ? (
                        <Lock size={10} className="text-white/20" />
                      ) : null}
                    </div>

                    <p
                      className={`truncate text-[11px] transition-colors ${
                        step.isActive
                          ? "text-white/60"
                          : "text-white/30 group-hover:text-white/45"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                  {isClickable && (
                    <ChevronRight
                      size={12}
                      className={`shrink-0 transition-transform duration-200 ${
                        step.isActive
                          ? "text-[#c9a84c] translate-x-0.5"
                          : "text-white/15 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                      }`}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="rounded-md border border-white/[0.06] bg-[#0a100a] p-2.5">
          <div className="mb-2 flex items-center justify-between text-[10px] text-white/40">
            <span>AI Credits</span>
            <span className="capitalize text-[#e8d5a3]">
              {project?.artStyle || "Cinematic"}
            </span>
          </div>
          <StoryboardUsageIndicator />
        </div>
      </div>
    </aside>
  );
}
