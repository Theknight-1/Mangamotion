"use client";

import { useState, useEffect, use, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Sparkles,
  ArrowRight,
  Flame,
  Tv,
  Video,
  HeartHandshake,
  GraduationCap,
  Wand2,
  Ghost,
  Music,
  Search,
  Heart,
  Cpu,
  Zap,
  Smile,
  Loader2,
  Check,
  Clapperboard,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi, swrKeys } from "@/lib/api";
import { GENRE_LIST } from "@/lib/storyboard/tier-limits";
import type { Genre } from "@/types/storyboard";
import { Button } from "@/components/loader-button";

const ICONS_MAP: Record<string, any> = {
  Flame,
  Sparkles,
  Smile,
  Tv,
  Video,
  HeartHandshake,
  GraduationCap,
  Wand2,
  Ghost,
  Music,
  Search,
  Heart,
  Cpu,
  Zap,
};

interface Props {
  params: Promise<{ id: string }>;
}

// Extracted into a memoized component to prevent re-rendering the entire grid
// when the selected genre changes.
const GenreCard = memo(function GenreCard({
  g,
  isSelected,
  onSelect,
}: {
  g: (typeof GENRE_LIST)[number];
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const Icon = ICONS_MAP[g.icon] || Flame;

  return (
    <div
      onClick={() => onSelect(g.id)}
      className={`group relative cursor-pointer overflow-hidden rounded-md border transition-all duration-300 ease-out ${
        isSelected
          ? "border-[#c9a84c]/30 bg-[#0c140c] shadow-[0_0_40px_-12px_rgba(201,168,76,0.15)]"
          : "border-white/[0.08] bg-[#22331F]/50 hover:border-white/[0.08] hover:bg-[#0a0f0a] hover:shadow-md hover:shadow-black/40"
      }`}
    >
      {/* Selection ring glow */}
      {isSelected && (
        <div className="absolute inset-0 rounded-md ring-1 ring-[#c9a84c]/20 ring-offset-1 ring-offset-[#060e06]" />
      )}

      {/* Image Header */}
      <div className="relative aspect-[16/8] w-full overflow-hidden">
        <img
          src={g.imageUrl}
          alt={g.label}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-black/5" />

        {/* Top-right selection indicator */}
        <div className="absolute top-3 right-3">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
              isSelected
                ? "border-[#c9a84c] bg-[#c9a84c] text-[#060e06] shadow-lg shadow-[#c9a84c]/30 scale-100"
                : "border-white/20 bg-black/40 text-transparent scale-90 backdrop-blur-md"
            }`}
          >
            <Check size={12} strokeWidth={3} />
          </div>
        </div>

        {/* Top-left icon badge */}
        <div className="absolute top-3 left-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-md transition-all duration-300 ${
              isSelected
                ? "bg-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/20"
                : "bg-black/50 text-[#e8d5a3]/70 group-hover:bg-black/60 group-hover:text-[#e8d5a3]"
            }`}
          >
            <Icon size={15} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1.5 p-2.5">
        <div className="flex items-center justify-between">
          <h3
            className={`text-base font-semibold transition-colors duration-200 ${
              isSelected
                ? "text-[#e8d5a3]"
                : "text-white/80 group-hover:text-white"
            }`}
          >
            {g.label}
          </h3>
        </div>
        <p className="text-[13px] text-white/50 line-clamp-2 group-hover:text-white/40 transition-colors duration-200">
          {g.desc}
        </p>
      </div>

      {/* Bottom accent line for selected */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />
      )}
    </div>
  );
});

export default function StoryboardGenrePage({ params }: Props) {
  const router = useRouter();
  const { id: projectId } = use(params);
  const [selectedGenre, setSelectedGenre] = useState<Genre>("Action");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: projectData, isLoading } = useSWR(
    swrKeys.storyboardProject(projectId),
    () => storyboardApi.getProject(projectId),
    { revalidateOnFocus: false },
  );

  const project = projectData?.project;

  // Fix: Pre-select the genre if the project already has one assigned
  useEffect(() => {
    if (project?.genre) {
      setSelectedGenre(project.genre as Genre);
    }
  }, [project]);

  // Stabilized callback to prevent passing new function references to memoized children
  const handleSelectGenre = useCallback((id: string) => {
    setSelectedGenre(id as Genre);
  }, []);

  const handleGenerateBreakdown = async () => {
    if (!project) return;
    setIsGenerating(true);

    try {
      await storyboardApi.updateGenre(projectId, selectedGenre);

      toast.loading("AI is generating scene breakdown...", {
        id: "breakdown-toast",
      });
      await storyboardApi.generateBreakdown(projectId, {
        genre: selectedGenre,
        scriptText: project.scriptText || undefined,
      });

      toast.success("Scene breakdown generated!", { id: "breakdown-toast" });

      // Optimization: Use Next.js router for client-side navigation instead of hard refresh
      router.push(`/dashboard/storyboard/${projectId}/breakdown`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate breakdown", {
        id: "breakdown-toast",
      });
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060e06] text-white/40">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 rounded-full border-2 border-[#c9a84c]/20 border-t-[#c9a84c] animate-spin" />
          </div>
          <span className="text-sm tracking-wide text-white/30">
            Loading project details...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060e06] text-[#e8d5a3] selection:bg-[#c9a84c]/30 selection:text-[#e8d5a3]">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[#c9a84c]/[0.02] blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[400px] w-[500px] rounded-full bg-[#c9a84c]/[0.015] blur-[100px]" />
      </div>

      {/* Main Content */}
      <main className="relative mx-auto max-w-7xl px-6 py-8 md:py-10">
        {/* Hero Section */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/10 bg-[#c9a84c]/[0.03] px-4 py-1.5">
            <Clapperboard size={12} className="text-[#c9a84c]/60" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#c9a84c]/60">
              Story Genre & Scene Structure
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white md:text-3xl">
            Select Your{" "}
            <span className="bg-gradient-to-r from-[#c9a84c] via-[#e8d5a3] to-[#c9a84c] bg-clip-text text-transparent">
              Cinematic Genre
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/50">
            Genre dictates dramatic beats, framing dynamics, color palette, and
            kinetic camera pacing. Choose the tone that matches your vision.
          </p>
        </div>

        {/* Genre Grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GENRE_LIST.map((g) => (
            <GenreCard
              key={g.id}
              g={g}
              isSelected={selectedGenre === g.id}
              onSelect={handleSelectGenre}
            />
          ))}
        </div>

        {/* Action Button */}
        <div className="sticky bottom-6 z-20 mt-16 flex justify-center">
          <div className="flex items-center gap-4 rounded-md border border-[#c9a84c]/10 bg-[#080e08]/95 p-2 pl-6 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <span className="hidden items-center gap-2 text-[13px] text-white/40 md:flex">
              Selected
              <span className="h-px w-4 bg-white/10" />
              <strong className="font-semibold text-[#e8d5a3]">
                {selectedGenre}
              </strong>
            </span>
            <Button onClick={handleGenerateBreakdown} disabled={isGenerating}>
              <span className="relative z-10 flex items-center gap-2.5">
                {isGenerating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    AI Analyzing Scenes...
                  </>
                ) : (
                  <>
                    <Sparkles
                      size={15}
                      className="transition-transform duration-300 group-hover:rotate-12"
                    />
                    Generate Scene Breakdown
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}
              </span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Button>
          </div>
        </div>

        {/* Bottom spacer for scroll breathing room */}
        <div className="h-12" />
      </main>
    </div>
  );
}
