"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import { Plus, Trash2, Sparkles, Check, Loader2, Upload } from "lucide-react";
import { storyboardApi, swrKeys } from "@/lib/api";
import type { StoryboardCharacter, ConditioningMode } from "@/types/storyboard";

interface Props {
  projectId: string;
  maxCharacters: number;
}

const MODE_OPTIONS: { value: ConditioningMode; label: string }[] = [
  { value: "description", label: "Based on description reference" },
  { value: "image", label: "Based on image reference" },
  { value: "both", label: "Based on image and description reference" },
];

export function CharacterPanel({ projectId, maxCharacters }: Props) {
  const { data, mutate } = useSWR(
    swrKeys.storyboardCharacters(projectId),
    () => storyboardApi.listCharacters(projectId),
    { revalidateOnFocus: false },
  );
  const characters = data?.characters ?? [];

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [genBusyIds, setGenBusyIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const addGenBusyId = (id: string) => {
    setGenBusyIds((prev) => new Set(prev).add(id));
  };
  const removeGenBusyId = (id: string) => {
    setGenBusyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (json.files) {
        setReferenceUrls((prev) => [...prev, ...json.files.map((f: any) => f.url)]);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await storyboardApi.createCharacter(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        referenceImageUrls: referenceUrls,
      });
      setName("");
      setDescription("");
      setReferenceUrls([]);
      setShowForm(false);
      mutate();
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateSheet(character: StoryboardCharacter) {
    addGenBusyId(character.id);
    try {
      await storyboardApi.generateCharacterSheet(character.id);
      mutate();
    } catch (err: any) {
      alert(err.message ?? "Failed to generate character sheet");
    } finally {
      removeGenBusyId(character.id);
    }
  }

  async function handleApprove(character: StoryboardCharacter) {
    const sheetToApprove = character.pendingSheetUrl || character.approvedSheetUrl;
    if (!sheetToApprove) return;
    await storyboardApi.approveCharacterSheet(character.id, sheetToApprove);
    mutate();
  }

  async function handleModeChange(character: StoryboardCharacter, mode: ConditioningMode) {
    await storyboardApi.updateCharacter(character.id, { conditioningMode: mode });
    mutate();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this character?")) return;
    await storyboardApi.deleteCharacter(id);
    mutate();
  }

  const atLimit = characters.length >= maxCharacters;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">
          {characters.length}/{maxCharacters} characters on this project
          {characters.length > 0 && (
            <span className="ml-1 text-white/25">
              — auto-detected characters from a parsed script appear here too
            </span>
          )}
        </p>
        {!showForm && (
          <button
            disabled={atLimit}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md cursor-pointer border border-white/15 px-3 py-1.5 text-xs text-white/70 transition hover:border-[#87da70]/40 hover:text-white disabled:opacity-30"
          >
            <Plus size={13} />
            {atLimit ? "Character limit reached" : "Add character"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/10 bg-gradient-to-b from-[#101510] to-[#0a0d0a] p-4">
          <input
            autoFocus
            placeholder="Character name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md cursor-pointer border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#87da70]/40 focus:outline-none"
          />
          <textarea
            placeholder="Description (appearance, outfit, personality cues)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-2 w-full resize-none rounded-md cursor-pointer border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#87da70]/40 focus:outline-none"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {referenceUrls.map((url) => (
              <img key={url} src={url} className="h-20 w-20 rounded-md cursor-pointer object-cover" alt="" />
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-12 w-12 items-center justify-center rounded-md cursor-pointer border border-dashed border-white/15 text-white/30 hover:border-white/30 hover:text-white/50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md cursor-pointer px-3 py-1.5 text-xs text-white/50 hover:text-white"
            >
              Cancel
            </button>
            <button
              disabled={!name.trim() || saving}
              onClick={handleCreate}
              className="flex items-center gap-1.5 rounded-md cursor-pointer bg-[#87da70] px-4 py-1.5 text-xs font-semibold text-black transition hover:scale-[1.02] disabled:opacity-40"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              Save character
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {characters.map((c) => (
          <div
            key={c.id}
            className="flex flex-col rounded-xl border border-white/10 bg-gradient-to-b from-[#101510] to-[#0a0d0a] p-3 shadow-lg"
          >
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md cursor-pointer bg-black/25">
              {c.approvedSheetUrl || c.pendingSheetUrl ? (
                <img
                  src={c.approvedSheetUrl ?? c.pendingSheetUrl ?? ""}
                  className="h-full w-full object-cover"
                  alt={c.name}
                />
              ) : (
                <span className="text-xs text-white/20">No sheet yet</span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm font-medium text-white">{c.name}</p>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-white/20 hover:text-red-400"
              >
                <Trash2 size={13} />
              </button>
            </div>
            {c.description && (
              <p className="mt-0.5 line-clamp-2 text-[11px] text-white/40">{c.description}</p>
            )}

            {c.approvedSheetUrl && (
              <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full border border-[#87da70]/25 bg-[#87da70]/10 px-2 py-0.5 text-[10px] text-[#c9f2b8]">
                <Check size={10} /> Approved reference
              </span>
            )}

            <select
              value={c.conditioningMode}
              onChange={(e) => handleModeChange(c, e.target.value as ConditioningMode)}
              className="mt-2 w-full rounded-md cursor-pointer border border-white/10 bg-black/20 px-2 py-1.5 text-[10.5px] text-white/55 focus:outline-none"
            >
              {MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="mt-2 flex gap-2">
              <button
                disabled={genBusyIds.has(c.id)}
                onClick={() => handleGenerateSheet(c)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md cursor-pointer border border-white/15 py-1.5 text-[11px] text-white/70 transition hover:border-[#87da70]/40 hover:text-white disabled:opacity-40"
              >
                {genBusyIds.has(c.id) ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                {c.pendingSheetUrl || c.approvedSheetUrl ? "Regenerate" : "Generate"}
              </button>
              {c.pendingSheetUrl && c.pendingSheetUrl !== c.approvedSheetUrl ? (
                <button
                  onClick={() => handleApprove(c)}
                  className="flex-1 rounded-md cursor-pointer bg-[#87da70] py-2 text-[11px] font-semibold text-black transition hover:scale-[1.02]"
                >
                  Approve
                </button>
              ) : c.approvedSheetUrl ? (
                <button
                  disabled
                  className="flex-1 rounded-md cursor-not-allowed bg-[#87da70]/15 text-[#87da70] border border-[#87da70]/30 py-2 text-[11px] font-semibold opacity-80 inline-flex items-center justify-center gap-1"
                >
                  <Check size={11} /> Approved
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
