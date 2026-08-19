"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, Users2, FileText, ListChecks, LayoutGrid, Loader2 } from "lucide-react";
import { storyboardApi, swrKeys } from "@/lib/api";
import { StoryboardUsageIndicator } from "@/components/storyboard/usage-indicator";
import { CharacterPanel } from "@/components/storyboard/character-panel";
import { ScriptPanel } from "@/components/storyboard/script-panel";
import { ShotListPanel } from "@/components/storyboard/shot-list-panel";
import { BoardPanel } from "@/components/storyboard/board-panel";
import { STORYBOARD_LIMITS, type StoryboardTierKey } from "@/lib/storyboard/tier-limits";

type Tab = "characters" | "script" | "shots" | "board";

const TABS: { key: Tab; label: string; icon: typeof Users2 }[] = [
  { key: "characters", label: "Characters", icon: Users2 },
  { key: "script", label: "Script", icon: FileText },
  { key: "shots", label: "Shot List", icon: ListChecks },
  { key: "board", label: "Board", icon: LayoutGrid },
];

interface Props {
  projectId: string;
}

export function StoryboardWorkspace({ projectId }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("characters");
  const [newCharacterBanner, setNewCharacterBanner] = useState<number | null>(null);

  const { data: projectData, isLoading: loadingProject } = useSWR(
    swrKeys.storyboardProject(projectId),
    () => storyboardApi.getProject(projectId),
    { revalidateOnFocus: false },
  );

  const { data: usageData } = useSWR(
    swrKeys.storyboardUsage(),
    () => storyboardApi.getUsage(),
    { revalidateOnFocus: false },
  );

  const project = projectData?.project;
  const tier: StoryboardTierKey = usageData?.tier ?? "free";
  const maxCharacters = STORYBOARD_LIMITS[tier].maxCharactersPerProject;

  if (loadingProject) {
    return (
      <div className="flex h-full items-center justify-center text-white/25">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-white/40">
        <p>Storyboard project not found.</p>
        <button
          onClick={() => router.push("/dashboard/storyboard")}
          className="text-sm text-[#87da70] hover:underline"
        >
          Back to Storyboard Studio
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#0a0f0a] to-[#070907]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/storyboard")}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-semibold text-white">{project.title}</h1>
            <p className="text-[11px] capitalize text-white/40">
              {project.artStyle} · {project.status.replace("_", " ")}
            </p>
          </div>
        </div>
        <StoryboardUsageIndicator />
      </div>

      {newCharacterBanner !== null && (
        <div className="flex items-center justify-between border-b border-[#c9a84c]/15 bg-[#c9a84c]/[0.05] px-5 py-2 text-xs text-[#e8d5a3] md:px-8">
          <span>
            {newCharacterBanner} new character{newCharacterBanner === 1 ? "" : "s"} detected
            from your script — review them before generating shots.
          </span>
          <button
            onClick={() => {
              setTab("characters");
              setNewCharacterBanner(null);
            }}
            className="font-semibold underline underline-offset-2"
          >
            Review now
          </button>
        </div>
      )}

      <div className="flex gap-1 border-b border-white/10 px-5 md:px-8">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-colors ${
              tab === key
                ? "border-[#87da70] text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8">
        {tab === "characters" && (
          <CharacterPanel projectId={projectId} maxCharacters={maxCharacters} />
        )}
        {tab === "script" && (
          <ScriptPanel
            projectId={projectId}
            initialScript={project.scriptText}
            onParsed={(shotCount, newCharacterCount) => {
              if (newCharacterCount > 0) {
                setNewCharacterBanner(newCharacterCount);
              } else {
                setTab("shots");
              }
            }}
          />
        )}
        {tab === "shots" && <ShotListPanel projectId={projectId} />}
        {tab === "board" && <BoardPanel projectId={projectId} tier={tier} />}
      </div>
    </div>
  );
}
