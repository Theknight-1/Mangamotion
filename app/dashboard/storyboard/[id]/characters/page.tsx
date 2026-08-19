"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Users2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Eye,
  Camera,
  Shirt,
  UserCheck,
  Rotate3D,
  RotateCcw,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi, swrKeys } from "@/lib/api";
import { StoryboardUsageIndicator } from "@/components/storyboard/usage-indicator";
import type { StoryboardCharacter } from "@/types/storyboard";
import { Button } from "@/components/loader-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default function StoryboardCharactersPage({ params }: Props) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [generatingSheetIds, setGeneratingSheetIds] = useState<Set<string>>(
    new Set(),
  );
  const [approvingSheetIds, setApprovingSheetIds] = useState<Set<string>>(
    new Set(),
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [newCharDesc, setNewCharDesc] = useState("");
  const [newCharClothing, setNewCharClothing] = useState("");
  const [newCharNotes, setNewCharNotes] = useState("");
  const [previewSheetUrl, setPreviewSheetUrl] = useState<string | null>(null);

  const addGeneratingSheetId = (id: string) => {
    setGeneratingSheetIds((prev) => new Set(prev).add(id));
  };
  const removeGeneratingSheetId = (id: string) => {
    setGeneratingSheetIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addApprovingSheetId = (id: string) => {
    setApprovingSheetIds((prev) => new Set(prev).add(id));
  };
  const removeApprovingSheetId = (id: string) => {
    setApprovingSheetIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const { data: projectData } = useSWR(
    swrKeys.storyboardProject(projectId),
    () => storyboardApi.getProject(projectId),
    { revalidateOnFocus: false },
  );

  const {
    data: charactersData,
    mutate: mutateCharacters,
    isLoading,
  } = useSWR(
    swrKeys.storyboardCharacters(projectId),
    () => storyboardApi.getCharacters(projectId),
    { revalidateOnFocus: false },
  );

  const project = projectData?.project;
  const characters = charactersData?.characters || [];

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) {
      toast.error("Character name is required");
      return;
    }

    try {
      await storyboardApi.createCharacter(projectId, {
        name: newCharName.trim(),
        description: newCharDesc.trim(),
        clothing: newCharClothing.trim(),
        consistencyNotes: newCharNotes.trim(),
        conditioningMode: "both",
      });

      mutateCharacters();
      setShowAddModal(false);
      setNewCharName("");
      setNewCharDesc("");
      setNewCharClothing("");
      setNewCharNotes("");
      toast.success("Character created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create character");
    }
  };

  const handleGenerateSheet = async (char: StoryboardCharacter) => {
    addGeneratingSheetId(char.id);
    try {
      toast.loading(
        `Generating turnaround reference sheet for ${char.name}...`,
        {
          id: `sheet-toast-${char.id}`,
        },
      );
      await storyboardApi.generateCharacterSheet(char.id);
      mutateCharacters();
      toast.success(`Turnaround sheet ready for review!`, {
        id: `sheet-toast-${char.id}`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate character sheet", {
        id: `sheet-toast-${char.id}`,
      });
    } finally {
      removeGeneratingSheetId(char.id);
    }
  };

  const handleApproveSheet = async (char: StoryboardCharacter) => {
    if (!char.pendingSheetUrl) return;
    addApprovingSheetId(char.id);
    try {
      await storyboardApi.approveCharacterSheet(char.id, char.pendingSheetUrl);
      mutateCharacters();
      toast.success(
        `Locked "${char.name}" reference sheet for identity conditioning!`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to approve sheet");
    } finally {
      removeApprovingSheetId(char.id);
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm("Are you sure you want to delete this character?")) return;
    try {
      await storyboardApi.deleteCharacter(id);
      mutateCharacters();
      toast.success("Character removed");
    } catch {
      toast.error("Failed to delete character");
    }
  };

  return (
    <div className="min-h-screen bg-[#060e06] text-[#e8d5a3] selection:bg-[#c9a84c] selection:text-black">
      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c9a84c]/15 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-[#87da70]/30 bg-[#87da70]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#87da70]">
              <ShieldCheck size={13} />
              Identity-Locked Conditioning
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-white md:text-3xl">
              Approved Character Model Sheets
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Each approved model sheet conditions subsequent shots to preserve
              facial likeness, hair, and attire.
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#c9a84c]/30 cursor-pointer px-4 py-2 text-xs font-bold text-[#e8d5a3] hover:bg-[#c9a84c]/20 transition"
          >
            <Plus size={13} /> Add Character
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-60 items-center justify-center text-white/40">
            <Loader2 size={20} className="animate-spin mr-2 text-[#c9a84c]" />{" "}
            Loading character roster...
          </div>
        ) : characters.length === 0 ? (
          <div className="mt-8 rounded-md border border-dashed border-white/10 bg-[#080d08] p-12 text-center">
            <Users2 size={28} className="mx-auto text-white/20" />
            <h3 className="mt-3 text-sm font-bold text-white">
              No characters added yet
            </h3>
            <p className="mt-1 text-xs text-white/40">
              Add your protagonist and generate turnaround model sheets for
              identity-consistent shot generation.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#87da70] px-4 py-2 text-xs font-bold text-black hover:bg-[#6ed85d]"
            >
              <Plus size={13} /> Add Character
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">
            {characters.map((char) => {
              const hasApproved = Boolean(char.approvedSheetUrl);
              const hasPending = Boolean(char.pendingSheetUrl);
              const activeSheetUrl =
                char.approvedSheetUrl || char.pendingSheetUrl;

              return (
                <div
                  key={char.id}
                  className="flex flex-col justify-between overflow-hidden rounded-md border border-white/10 bg-[#080d08] p-3 shadow-xl transition hover:border-[#c9a84c]/40"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {char.name}
                          </h3>
                          {hasApproved ? (
                            <span className="flex items-center gap-1 rounded-md bg-[#87da70]/10 px-2 py-0.5 text-[10px] font-bold text-[#87da70] border border-[#87da70]/30">
                              <ShieldCheck size={11} /> Locked Reference
                            </span>
                          ) : (
                            <span className="rounded-md bg-[#c9a84c]/10 px-2 py-0.5 text-[11px] tracking-wide font-bold text-[#e8d5a3] border border-[#c9a84c]/30">
                              Pending Approval
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleDeleteCharacter(char.id)}
                        variant="ghost"
                        className="cursor-pinter py-1 px-2 text-red-400"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    {/* Turnaround Sheet Preview */}
                    <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-md border border-white/10 bg-black/60">
                      {generatingSheetIds.has(char.id) ? (
                        <>
                          {activeSheetUrl && (
                            <img
                              src={activeSheetUrl}
                              alt={char.name}
                              className="h-full w-full object-cover opacity-30"
                            />
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                            <Loader2
                              size={22}
                              className="animate-spin text-[#c9a84c]"
                            />
                            <span className="mt-2 text-xs font-semibold text-[#e8d5a3]">
                              Generating turnaround sheet...
                            </span>
                            <span className="text-[10px] text-white/30">
                              Creating multi-angle turnaround
                            </span>
                          </div>
                        </>
                      ) : activeSheetUrl ? (
                        <>
                          <img
                            src={activeSheetUrl}
                            alt={char.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => setPreviewSheetUrl(activeSheetUrl)}
                            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/80 text-white backdrop-blur-sm hover:bg-black"
                          >
                            <Eye size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-white/30">
                          <ImageIcon size={24} className="text-white/20" />
                          <span className="mt-1.5 text-xs font-semibold text-white/50">
                            No Reference Sheet Generated
                          </span>
                          <span className="text-[10px] text-white/30">
                            Click below to generate multi-angle model sheet
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Visual Anchor Fields */}
                    <div className="mt-4 space-y-2 text-[13px]">
                      <div>
                        <span className="font-bold text-[#c9a84c] text-[11px] uppercase">
                          Appearance:{" "}
                        </span>
                        <span className="text-white/80">
                          {char.description || "Default style traits"}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-[#c9a84c] text-[11px] uppercase">
                          Signature Attire:{" "}
                        </span>
                        <span className="text-white/80">
                          {char.clothing || "Default character clothing"}
                        </span>
                      </div>
                      {char.consistencyNotes && (
                        <div className="rounded-md border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-2 text-[11px] text-[#e8d5a3]">
                          <strong>Consistency Anchor:</strong>{" "}
                          {char.consistencyNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Character Action Buttons */}
                  <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-2 border-t border-white/5 pt-4">
                    <button
                      onClick={() => handleGenerateSheet(char)}
                      disabled={generatingSheetIds.has(char.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm font-bold text-white hover:border-[#c9a84c]/40 hover:text-[#e8d5a3] transition disabled:opacity-50"
                    >
                      {generatingSheetIds.has(char.id) ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />{" "}
                          Generating Sheet...
                        </>
                      ) : (
                        <>
                          <RotateCcw size={12} className="text-[#c9a84c]" />{" "}
                          {activeSheetUrl
                            ? "Regenerate Sheet"
                            : "Generate Model Sheet"}
                        </>
                      )}
                    </button>

                    {hasPending && (
                      <button
                        onClick={() => handleApproveSheet(char)}
                        disabled={approvingSheetIds.has(char.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-[#87da70] px-2 py-1.5 text-sm font-bold text-black hover:bg-[#6ed85d] shadow-md shadow-[#87da70]/20 disabled:opacity-50"
                      >
                        {approvingSheetIds.has(char.id) ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Approve &amp; Lock
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Bottom Next CTA */}
        <div className="sticky bottom-6 mt-12 flex justify-end">
          <Button
            onClick={() =>
              router.push(`/dashboard/storyboard/${projectId}/board`)
            }
          >
            Launch Storyboard Studio Board <ArrowRight size={14} />
          </Button>
        </div>
      </main>

      {/* Add Character Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-md border border-[#c9a84c]/25 bg-[#090f09] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white">
                Add Character to Roster
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-md p-1 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateCharacter}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-white/70">
                  Character Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="e.g. Ren Kurosawa"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/70">
                  Physical Appearance
                </label>
                <textarea
                  rows={2}
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  placeholder="Age, hair color/style, eye color, facial features, build..."
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/70">
                  Signature Attire / Uniform
                </label>
                <input
                  type="text"
                  value={newCharClothing}
                  onChange={(e) => setNewCharClothing(e.target.value)}
                  placeholder="e.g. Black leather coat with neon orange accents"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/70">
                  Consistency Anchors (Unchangeable Details)
                </label>
                <input
                  type="text"
                  value={newCharNotes}
                  onChange={(e) => setNewCharNotes(e.target.value)}
                  placeholder="e.g. Distinct eyebrow scar, silver cybernetic eye"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-white/50 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] px-5 py-1.5 text-xs font-bold text-[#060e06] shadow-md shadow-[#c9a84c]/20"
                >
                  Add Character
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sheet Full Preview Modal */}
      {previewSheetUrl && (
        <div
          onClick={() => setPreviewSheetUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-4xl overflow-hidden rounded-md border border-white/20">
            <img
              src={previewSheetUrl}
              alt="Sheet preview"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
