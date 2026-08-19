"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Film,
  Smartphone,
  Square,
  RectangleVertical,
  Tv,
  CheckCircle2,
  Check,
  Upload,
  Loader2,
  Layers,
  Users2,
  Sun,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi, swrKeys } from "@/lib/api";
import { StoryboardUsageIndicator } from "@/components/storyboard/usage-indicator";
import {
  ART_STYLES,
  ASPECT_RATIOS,
  LIGHTING_PRESETS,
  LENS_PRESETS,
} from "@/lib/storyboard/tier-limits";
import type { ArtStyle, AspectRatio } from "@/types/storyboard";

const ASPECT_ICONS: Record<string, any> = {
  Film,
  Smartphone,
  Square,
  RectangleVertical,
  Tv,
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function StoryboardStylePage({ params }: Props) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>("16:9");
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>("comic");
  const [selectedLighting, setSelectedLighting] =
    useState<string>("golden_hour");
  const [selectedLens, setSelectedLens] = useState<string>("35mm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressStep, setProgressStep] = useState<number | null>(null);

  const { data: projectData } = useSWR(
    swrKeys.storyboardProject(projectId),
    () => storyboardApi.getProject(projectId),
    { revalidateOnFocus: false },
  );

  const project = projectData?.project;

  const handleProceed = async () => {
    setIsSubmitting(true);
    try {
      await storyboardApi.updateProject(projectId, {
        artStyle: selectedStyle,
        aspectRatio: selectedAspect,
        status: "style_selected",
      });

      setProgressStep(1);
      await new Promise((r) => setTimeout(r, 500));

      setProgressStep(2);
      await new Promise((r) => setTimeout(r, 500));

      setProgressStep(3);
      await new Promise((r) => setTimeout(r, 500));

      window.location.href = `/dashboard/storyboard/${projectId}/characters`;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save style selection");
      setIsSubmitting(false);
      setProgressStep(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e06] text-[#e8d5a3] selection:bg-[#c9a84c] selection:text-black">
      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-white md:text-4xl">
            Choose Your Visual{" "}
            <span className="bg-gradient-to-r from-[#c9a84c] to-[#e8d5a3] bg-clip-text text-transparent">
              Aesthetic
            </span>
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs text-white/50">
            Define camera aspect ratio, illustration style, lighting
            temperature, and lens characteristics.
          </p>
        </div>

        {/* Section 1: Aspect Ratio */}
        <div className="mt-10">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#c9a84c]">
            1. Frame Aspect Ratio
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {ASPECT_RATIOS.map((item) => {
              const Icon = ASPECT_ICONS[item.icon] || Film;
              const isSelected = selectedAspect === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedAspect(item.id as AspectRatio)}
                  className={`cursor-pointer rounded-md border p-3.5 text-center transition-all ${
                    isSelected
                      ? "border-[#c9a84c] bg-[#0f1b0f] shadow-lg shadow-[#c9a84c]/10 scale-[1.02]"
                      : "border-white/10 bg-[#080d08] hover:border-[#c9a84c]/40 hover:bg-[#0b130b]"
                  }`}
                >
                  <div
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md transition ${
                      isSelected
                        ? "bg-[#c9a84c] text-black shadow-md"
                        : "bg-white/5 text-white/50"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <h4
                    className={`mt-2.5 font-bold ${
                      isSelected ? "text-[#e8d5a3]" : "text-white"
                    }`}
                  >
                    {item.label}
                  </h4>
                  <p className="mt-0.5 text-xs font-medium text-white/40">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: 13 Visual Art Styles Grid (With Imagery) */}
        <div className="mt-12">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#c9a84c]">
            2. Illustration &amp; Art Style Preset
          </label>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {ART_STYLES.map((style) => {
              const isSelected = selectedStyle === style.id;

              return (
                <div
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id as ArtStyle)}
                  className={`group relative cursor-pointer overflow-hidden rounded-md border transition-all duration-300 ease-out ${
                    isSelected
                      ? "border-[#c9a84c]/30 bg-[#0c140c] shadow-[0_0_40px_-12px_rgba(201,168,76,0.15)]"
                      : "border-white/[0.08] bg-[#22331F]/50 hover:border-white/[0.08] hover:bg-[#0a0f0a] hover:shadow-md hover:shadow-black/40"
                  }`}
                >
                  {/* Visual Artwork Thumbnail */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/50">
                    <img
                      src={style.imageUrl}
                      alt={style.label}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080d08] via-transparent to-black/40" />

                    {isSelected && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#c9a84c] text-[#060e06] shadow-md">
                        <Check size={12} className="font-extrabold" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 p-2.5">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-base font-semibold transition-colors duration-200 ${
                          isSelected
                            ? "text-[#e8d5a3]"
                            : "text-white/80 group-hover:text-white"
                        }`}
                      >
                        {style.label}
                      </h3>
                    </div>
                    <p className="text-[13px] text-white/50 line-clamp-2 group-hover:text-white/40 transition-colors duration-200">
                      {style.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Extra Pro Director Controls (Lighting & Lens Presets) */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Lighting Mood Presets */}
          <div className="rounded-md border border-[#c9a84c]/20 bg-[#080d08] p-5 shadow-lg">
            <div className="flex items-center gap-2">
              <Sun size={15} className="text-[#c9a84c]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Director&apos;s Lighting Mood (Pro Feature)
              </h3>
            </div>
            <p className="mt-1 text-[11px] text-white/40">
              Applies global color grading and volumetric illumination to shot
              prompts.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {LIGHTING_PRESETS.map((lp) => (
                <button
                  key={lp.id}
                  type="button"
                  onClick={() => setSelectedLighting(lp.id)}
                  className={`rounded-md border p-2.5 text-left transition ${
                    selectedLighting === lp.id
                      ? "border-[#c9a84c] bg-[#c9a84c]/10 text-[#e8d5a3]"
                      : "border-white/5 bg-black/40 text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <div className="text-[11px] font-bold">{lp.label}</div>
                  <div className="mt-0.5 text-[9px] text-white/35 line-clamp-1">
                    {lp.cue}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lens & Focal Length Presets */}
          <div className="rounded-md border border-[#c9a84c]/20 bg-[#080d08] p-5 shadow-lg">
            <div className="flex items-center gap-2">
              <Camera size={15} className="text-[#c9a84c]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Cinematography Lens &amp; Optics (Pro Feature)
              </h3>
            </div>
            <p className="mt-1 text-[11px] text-white/40">
              Calibrates field-of-view, perspective compression, and background
              bokeh.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {LENS_PRESETS.map((lens) => (
                <button
                  key={lens.id}
                  type="button"
                  onClick={() => setSelectedLens(lens.id)}
                  className={`rounded-md border p-2.5 text-left transition ${
                    selectedLens === lens.id
                      ? "border-[#c9a84c] bg-[#c9a84c]/10 text-[#e8d5a3]"
                      : "border-white/5 bg-black/40 text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <div className="text-[11px] font-bold">{lens.label}</div>
                  <div className="mt-0.5 text-[9px] text-white/35 line-clamp-1">
                    {lens.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="sticky bottom-6 mt-12 flex justify-center">
          <div className="flex items-center gap-4 rounded-md border border-[#c9a84c]/20 bg-[#080e08]/95 p-3 shadow-2xl backdrop-blur-xl">
            <span className="hidden text-xs text-white/60 md:inline-block px-2">
              Style: <strong className="text-[#e8d5a3]">{selectedStyle}</strong>{" "}
              &middot; Framing:{" "}
              <strong className="text-[#e8d5a3]">{selectedAspect}</strong>
            </span>
            <button
              onClick={handleProceed}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] px-7 py-2.5 text-xs font-bold text-[#060e06] shadow-lg shadow-[#c9a84c]/20 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Preparing
                  Character Hub...
                </>
              ) : (
                <>
                  <Users2 size={14} /> Next: Character Consistency Hub{" "}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Progressive Stage Disclosure Modal */}
      {progressStep !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-md border border-[#c9a84c]/25 bg-[#090f09] p-8 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3]">
              <Sparkles size={22} className="animate-spin text-[#c9a84c]" />
            </div>

            <h3 className="mt-4 text-base font-bold text-white">
              Initializing Storyboard Engine
            </h3>
            <p className="mt-1 text-xs text-white/50">
              Locking in camera blocking &amp; lighting parameters
            </p>

            <div className="mt-5 space-y-2.5 text-left">
              <div className="flex items-center gap-3 rounded-md border border-white/5 bg-black/40 p-2.5 text-xs">
                {progressStep >= 1 ? (
                  <Check size={14} className="text-[#87da70]" />
                ) : (
                  <Loader2 size={14} className="animate-spin text-white/30" />
                )}
                <span
                  className={
                    progressStep >= 1 ? "font-bold text-white" : "text-white/40"
                  }
                >
                  1. Converting scenes to screenplay cues
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-md border border-white/5 bg-black/40 p-2.5 text-xs">
                {progressStep >= 2 ? (
                  <Check size={14} className="text-[#87da70]" />
                ) : (
                  <Loader2 size={14} className="animate-spin text-white/30" />
                )}
                <span
                  className={
                    progressStep >= 2 ? "font-bold text-white" : "text-white/40"
                  }
                >
                  2. Calibrating lens optics &amp; lighting mood
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-md border border-white/5 bg-black/40 p-2.5 text-xs">
                {progressStep >= 3 ? (
                  <Check size={14} className="text-[#87da70]" />
                ) : (
                  <Loader2 size={14} className="animate-spin text-white/30" />
                )}
                <span
                  className={
                    progressStep >= 3 ? "font-bold text-white" : "text-white/40"
                  }
                >
                  3. Creating Character Consistency Hub
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
