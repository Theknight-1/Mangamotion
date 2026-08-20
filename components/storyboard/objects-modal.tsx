"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import {
  Box,
  Plus,
  Trash2,
  Upload,
  Loader2,
  X,
  Sparkles,
  Tag,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi, swrKeys } from "@/lib/api";
import type { StoryboardObject, ObjectImportance } from "@/types/storyboard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function ObjectsModal({ isOpen, onClose, projectId }: Props) {
  const { data, mutate, isLoading } = useSWR(
    swrKeys.storyboardObjects(projectId),
    () => storyboardApi.getObjects(projectId),
    { revalidateOnFocus: false },
  );

  const objects = data?.objects || [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState<ObjectImportance>("recurring");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach((f) => formData.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (json.files && json.files.length > 0) {
        setReferenceImageUrl(json.files[0].url);
        toast.success("Object reference uploaded");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Object name is required");
      return;
    }

    setIsSaving(true);
    try {
      await storyboardApi.createObject(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        importance,
        referenceImageUrl: referenceImageUrl || undefined,
      });

      mutate();
      setShowAddForm(false);
      setName("");
      setDescription("");
      setImportance("recurring");
      setReferenceImageUrl("");
      toast.success("Object saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save object");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this object / prop?")) return;
    try {
      await storyboardApi.deleteObject(id);
      mutate();
      toast.success("Object removed");
    } catch {
      toast.error("Failed to delete object");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex flex-col w-full max-w-2xl max-h-[85vh] rounded-md border border-[#c9a84c]/25 bg-[#090f09] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#080d08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3]">
              <Box size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Key Story Props &amp; Objects ({objects.length})
              </h3>
              <p className="text-[11px] text-white/50">
                Visual consistency anchors for key items, tools, vehicles &amp; weapons
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-white/40 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Top action bar */}
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-[11px]">
              Key props are injected into generation prompts across scenes
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-3 py-1 text-xs font-bold text-[#e8d5a3] hover:bg-[#c9a84c]/20 transition"
            >
              <Plus size={12} /> {showAddForm ? "Cancel" : "Add Prop"}
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form
              onSubmit={handleCreate}
              className="rounded-md border border-white/15 bg-black/40 p-4 space-y-3"
            >
              <div>
                <label className="block font-semibold text-white/70">
                  Prop / Object Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SuperBond Ultra Glue Tube"
                  className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-white/70">
                    Story Importance
                  </label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value as ObjectImportance)}
                    className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                  >
                    <option value="key_prop">Key Prop (Story Central)</option>
                    <option value="recurring">Recurring (Multiple scenes)</option>
                    <option value="background">Background Set Dressing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-white/70">
                    Reference Photo
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 flex cursor-pointer items-center justify-center rounded border border-dashed border-white/15 bg-black/30 p-1.5 text-center hover:border-[#c9a84c]/40"
                  >
                    {isUploading ? (
                      <Loader2 size={12} className="animate-spin text-[#c9a84c]" />
                    ) : referenceImageUrl ? (
                      <span className="text-[#87da70] font-semibold text-[11px]">
                        Attached ✓
                      </span>
                    ) : (
                      <span className="text-white/40 text-[11px] flex items-center gap-1">
                        <Upload size={11} /> Upload
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-white/70">
                  Visual Appearance &amp; Details
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Shape, colors, material, branding, distinctive markings..."
                  className="mt-1 w-full rounded border border-white/10 bg-black/50 p-2 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded px-3 py-1 text-white/50 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] px-4 py-1 font-bold text-black disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Prop"}
                </button>
              </div>
            </form>
          )}

          {/* Objects list */}
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-white/40">
              <Loader2 size={16} className="animate-spin text-[#c9a84c] mr-2" />
              Loading props...
            </div>
          ) : objects.length === 0 ? (
            <div className="rounded border border-dashed border-white/10 bg-black/20 p-8 text-center text-white/40">
              <Box size={24} className="mx-auto text-white/20 mb-2" />
              <p className="font-semibold text-white/60">No props or key objects tracked</p>
              <p className="text-[10px] text-white/30 mt-1">
                Important story objects will appear here from breakdown or manual entry.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  className="flex flex-col justify-between rounded-md border border-white/10 bg-black/40 p-3.5 hover:border-[#c9a84c]/30 transition"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">
                          {obj.name}
                        </h4>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            obj.importance === "key_prop"
                              ? "bg-[#c9a84c]/20 text-[#e8d5a3] border border-[#c9a84c]/40"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          {obj.importance === "key_prop" ? "Key Prop" : obj.importance}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(obj.id)}
                        className="text-white/30 hover:text-red-400 p-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {obj.description && (
                      <p className="mt-1.5 text-white/70 line-clamp-2 text-[11px] leading-relaxed">
                        {obj.description}
                      </p>
                    )}
                  </div>

                  {obj.referenceImageUrl && (
                    <div className="mt-2.5 h-16 w-full overflow-hidden rounded border border-white/10">
                      <img
                        src={obj.referenceImageUrl}
                        alt={obj.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
