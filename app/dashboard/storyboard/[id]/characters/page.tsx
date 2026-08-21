"use client";

import { useState, use, useRef } from "react";
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
  Upload,
  Layers,
  FileImage,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi, swrKeys } from "@/lib/api";
import { StoryboardUsageIndicator } from "@/components/storyboard/usage-indicator";
import type { StoryboardCharacter, ConditioningMode } from "@/types/storyboard";
import { Button } from "@/components/loader-button";
import Image from "next/image";

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
  const [uploadingForCharId, setUploadingForCharId] = useState<string | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [newCharDesc, setNewCharDesc] = useState("");
  const [newCharClothing, setNewCharClothing] = useState("");
  const [newCharNotes, setNewCharNotes] = useState("");
  const [newCharReferences, setNewCharReferences] = useState<string[]>([]);
  const [newCharMode, setNewCharMode] = useState<ConditioningMode>("both");
  const [isUploadingReferences, setIsUploadingReferences] = useState(false);
  const [previewSheetUrl, setPreviewSheetUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const [targetCharForUpload, setTargetCharForUpload] = useState<string | null>(
    null,
  );

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

  const handleUploadFiles = async (
    files: FileList | null,
  ): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (json.files && json.files.length > 0) {
      return json.files.map((f: any) => f.url);
    }
    return [];
  };

  const handleAddModalFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files?.length) return;
    setIsUploadingReferences(true);
    try {
      const urls = await handleUploadFiles(e.target.files);
      if (urls.length > 0) {
        setNewCharReferences((prev) => [...prev, ...urls]);
        toast.success(`Uploaded ${urls.length} reference image(s)`);
      }
    } catch {
      toast.error("Failed to upload reference images");
    } finally {
      setIsUploadingReferences(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCardFileUpload = async (
    charId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files?.length) return;
    setUploadingForCharId(charId);
    try {
      const urls = await handleUploadFiles(e.target.files);
      if (urls.length > 0) {
        const char = characters.find((c) => c.id === charId);
        const existing = (char?.referenceImageUrls as string[]) || [];
        await storyboardApi.updateCharacter(charId, {
          referenceImageUrls: [...existing, ...urls],
        });
        mutateCharacters();
        toast.success("Reference images attached to character");
      }
    } catch {
      toast.error("Failed to upload reference");
    } finally {
      setUploadingForCharId(null);
      if (cardFileInputRef.current) cardFileInputRef.current.value = "";
    }
  };

  const handleUseRefAsApprovedSheet = async (
    char: StoryboardCharacter,
    refUrl: string,
  ) => {
    addApprovingSheetId(char.id);
    try {
      await storyboardApi.updateCharacter(char.id, {
        approvedSheetUrl: refUrl,
        pendingSheetUrl: null,
        conditioningMode: "image",
      });
      mutateCharacters();
      toast.success(
        `Locked reference image as model sheet for "${char.name}"!`,
      );
    } catch {
      toast.error("Failed to lock reference sheet");
    } finally {
      removeApprovingSheetId(char.id);
    }
  };

  const handleToggleMode = async (char: StoryboardCharacter) => {
    const modes: ConditioningMode[] = ["both", "image", "description"];
    const currentIdx = modes.indexOf(char.conditioningMode || "both");
    const nextMode = modes[(currentIdx + 1) % modes.length];
    try {
      await storyboardApi.updateCharacter(char.id, {
        conditioningMode: nextMode,
      });
      mutateCharacters();
      toast.success(`Mode set to: ${nextMode}`);
    } catch {
      toast.error("Failed to update conditioning mode");
    }
  };

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
        referenceImageUrls: newCharReferences,
        conditioningMode: newCharMode,
        approvedSheetUrl:
          newCharMode === "image" && newCharReferences.length > 0
            ? newCharReferences[0]
            : undefined,
      });

      mutateCharacters();
      setShowAddModal(false);
      setNewCharName("");
      setNewCharDesc("");
      setNewCharClothing("");
      setNewCharNotes("");
      setNewCharReferences([]);
      setNewCharMode("both");
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
    const sheetToApprove = char.pendingSheetUrl || char.approvedSheetUrl;
    if (!sheetToApprove) return;
    addApprovingSheetId(char.id);
    try {
      await storyboardApi.approveCharacterSheet(char.id, sheetToApprove);
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
            className="border border-[#c9a84c]/30 px-4 py-2 font-bold text-[#e8d5a3] hover:bg-[#c9a84c]/20 transition"
          >
            <Plus size={13} /> Add Character
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-md border border-white/10 bg-[#080d08] p-3 shadow-xl"
              >
                {/* Skeleton sheet image */}
                <div className="relative aspect-[4/3] w-full rounded bg-[#0d0c0a]">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.02] via-white/[0.05] to-white/[0.02]" />
                </div>
                {/* Skeleton name + status */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-28 animate-pulse rounded-md bg-[#c9a84c]/10" />
                </div>
                {/* Skeleton description */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-white/6" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-white/5" />
                </div>
                {/* Skeleton clothing */}
                <div className="mt-2 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-white/4" />
                </div>
                {/* Skeleton action buttons */}
                <div className="mt-4 flex gap-2">
                  <div className="h-8 flex-1 animate-pulse rounded-md bg-white/5" />
                  <div className="h-8 w-8 animate-pulse rounded-md bg-white/5" />
                </div>
              </div>
            ))}
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
            {/* Hidden file input for card-level uploads */}
            <input
              type="file"
              ref={cardFileInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (targetCharForUpload) {
                  handleCardFileUpload(targetCharForUpload, e);
                }
              }}
            />

            {characters.map((char) => {
              const hasApproved = Boolean(char.approvedSheetUrl);
              const hasPendingNew = Boolean(
                char.pendingSheetUrl && char.pendingSheetUrl !== char.approvedSheetUrl,
              );
              const isApprovedAndLocked = hasApproved && !hasPendingNew;
              const activeSheetUrl =
                char.pendingSheetUrl || char.approvedSheetUrl;
              const refs = (char.referenceImageUrls as string[]) || [];
              const mode = char.conditioningMode || "both";

              return (
                <div
                  key={char.id}
                  className="flex flex-col justify-between overflow-hidden rounded-md border border-white/10 bg-[#080d08] p-3.5 shadow-xl transition hover:border-[#c9a84c]/40"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {char.name}
                          </h3>
                          {isApprovedAndLocked ? (
                            <span className="flex items-center gap-1 rounded-md bg-[#87da70]/10 px-2 py-0.5 text-[10px] font-bold text-[#87da70] border border-[#87da70]/30">
                              <ShieldCheck size={11} /> Locked Reference
                            </span>
                          ) : hasPendingNew ? (
                            <span className="rounded-md bg-[#c9a84c]/10 px-2 py-0.5 text-[11px] tracking-wide font-bold text-[#e8d5a3] border border-[#c9a84c]/30">
                              Pending Approval
                            </span>
                          ) : (
                            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/40 border border-white/10">
                              No Reference Sheet
                            </span>
                          )}
                        </div>
                        {/* Conditioning Mode Selector Tag */}
                        <button
                          type="button"
                          onClick={() => handleToggleMode(char)}
                          title="Click to toggle conditioning mode"
                          className="mt-1 inline-flex items-center gap-1 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-white/60 hover:border-[#c9a84c]/40 hover:text-[#e8d5a3] transition"
                        >
                          <Layers size={10} className="text-[#c9a84c]" />
                          Mode:{" "}
                          <span className="font-semibold text-white/90">
                            {mode === "both"
                              ? "Image + Description"
                              : mode === "image"
                                ? "Image Only"
                                : "Description Only"}
                          </span>
                        </button>
                      </div>

                      <Button
                        onClick={() => handleDeleteCharacter(char.id)}
                        variant="ghost"
                        className="cursor-pointer py-1 px-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    {/* Turnaround Sheet Preview */}
                    <div className="relative mt-3.5 aspect-video w-full overflow-hidden rounded-md border border-white/10 bg-black/60">
                      {generatingSheetIds.has(char.id) ? (
                        <>
                          {activeSheetUrl && (
                            <Image
                              width={400}
                              height={300}
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
                          <Image
                            width={400}
                            height={300}
                            src={activeSheetUrl}
                            alt={char.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => setPreviewSheetUrl(activeSheetUrl)}
                            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/80 text-white backdrop-blur-sm hover:bg-black cursor-pointer"
                          >
                            <Eye size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-white/30 p-4 text-center">
                          <ImageIcon size={24} className="text-white/20" />
                          <span className="mt-1.5 text-xs font-semibold text-white/50">
                            No Reference Sheet Locked
                          </span>
                          <span className="text-[10px] text-white/30">
                            Generate model sheet or lock uploaded reference
                            below
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Uploaded Reference Photos Row */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-white/60">
                          Uploaded References ({refs.length})
                        </span>
                        <button
                          type="button"
                          disabled={uploadingForCharId === char.id}
                          onClick={() => {
                            setTargetCharForUpload(char.id);
                            cardFileInputRef.current?.click();
                          }}
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#c9a84c] hover:underline disabled:opacity-50"
                        >
                          {uploadingForCharId === char.id ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Upload size={10} />
                          )}
                          + Upload Ref
                        </button>
                      </div>

                      {refs.length > 0 ? (
                        <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
                          {refs.map((url, rIdx) => (
                            <div
                              key={rIdx}
                              className="group relative h-12 w-12 shrink-0 overflow-hidden rounded border border-white/15 bg-black"
                            >
                              <img
                                src={url}
                                alt={`Ref ${rIdx + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  type="button"
                                  title="Lock as approved sheet"
                                  onClick={() =>
                                    handleUseRefAsApprovedSheet(char, url)
                                  }
                                  className="p-1 text-[#87da70] hover:scale-110"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-[10px] italic text-white/25">
                          No custom reference uploaded
                        </p>
                      )}
                    </div>

                    {/* Visual Anchor Fields */}
                    <div className="mt-3 space-y-2 text-[13px] leading-4">
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
                  <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-2 border-t border-white/5 pt-3.5">
                    <button
                      onClick={() => handleGenerateSheet(char)}
                      disabled={generatingSheetIds.has(char.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white hover:border-[#c9a84c]/40 hover:text-[#e8d5a3] transition disabled:opacity-50"
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

                    {hasPendingNew ? (
                      <Button
                        onClick={() => handleApproveSheet(char)}
                        disabled={approvingSheetIds.has(char.id)}
                        className="bg-[#87da70] hover:bg-[#6ed85d] text-black py-1.5 font-bold text-xs shadow-md shadow-[#87da70]/20 inline-flex items-center gap-1.5"
                      >
                        {approvingSheetIds.has(char.id) ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Approve &amp; Lock
                      </Button>
                    ) : isApprovedAndLocked ? (
                      <Button
                        disabled
                        className="bg-[#87da70]/15 text-[#87da70] border border-[#87da70]/30 py-1.5 font-semibold text-xs opacity-75 cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        <Check size={12} />
                        Approved
                      </Button>
                    ) : null}
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
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-md border border-[#c9a84c]/25 bg-[#090f09] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white">
                Add Character to Roster
              </h3>
              <Button onClick={() => setShowAddModal(false)} className="text-white py-1 px-1" variant="ghost">
                <X size={20} />
              </Button>
            </div>

            <form
              onSubmit={handleCreateCharacter}
              className="mt-4 space-y-3.5 text-[13px]"
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
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              {/* Conditioning Mode Selector */}
              <div>
                <label className="block font-semibold text-white/70">
                  Conditioning Reference Mode
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    {
                      value: "both" as ConditioningMode,
                      label: "Image + Prompt",
                      desc: "Generates from reference & description",
                    },
                    {
                      value: "image" as ConditioningMode,
                      label: "Reference Only",
                      desc: "Uses uploaded reference directly",
                    },
                    {
                      value: "description" as ConditioningMode,
                      label: "Description Only",
                      desc: "AI creates likeness from text",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewCharMode(opt.value)}
                      className={`flex flex-col rounded-md border p-2 text-left transition text-xs ${
                        newCharMode === opt.value
                          ? "border-[#c9a84c] bg-[#c9a84c]/10 text-white"
                          : "border-white/10 bg-black/30 text-white/50 hover:border-white/20"
                      }`}
                    >
                      <span className="text-sm font-bold">{opt.label}</span>
                      <span className="text-xs leading-tight text-white/40 mt-0.5">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Image Upload Dropzone */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-white/70">
                    Reference Images (Optional)
                  </label>
                  <span className="text-xs text-white/40">
                    Upload face or costume photos
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAddModalFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-white/15 bg-black/30 p-3 hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5 transition"
                >
                  {isUploadingReferences ? (
                    <div className="flex items-center gap-2 text-white/60">
                      <Loader2
                        size={14}
                        className="animate-spin text-[#c9a84c]"
                      />
                      <span>Uploading reference image(s)...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={16} className="text-white/40" />
                      <p className="mt-1 text-sm text-white/60">
                        Click to upload character reference photo(s)
                      </p>
                      <p className="text-xs text-white/30">
                        PNG, JPG or WebP (up to 10MB)
                      </p>
                    </>
                  )}
                </div>

                {/* Uploaded Reference Thumbnails */}
                {newCharReferences.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newCharReferences.map((url, i) => (
                      <div
                        key={i}
                        className="group relative h-14 w-14 overflow-hidden rounded-md border border-white/20 bg-black"
                      >
                        <img
                          src={url}
                          alt={`Uploaded ref ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewCharReferences((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            );
                          }}
                          className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/80 text-white/80 hover:bg-red-500 hover:text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-sm text-white focus:border-[#c9a84c]/50 focus:outline-none"
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
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#c9a84c]/50 focus:outline-none"
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
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" className="py-2">
                  Add Character
                </Button>
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
            <Image
              width={1000}
              height={1000}
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
