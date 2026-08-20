"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import {
  MapPin,
  Plus,
  Trash2,
  Upload,
  Loader2,
  X,
  Sparkles,
  Sun,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import { storyboardApi, swrKeys } from "@/lib/api";
import type { StoryboardLocation } from "@/types/storyboard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function LocationsModal({ isOpen, onClose, projectId }: Props) {
  const { data, mutate, isLoading } = useSWR(
    swrKeys.storyboardLocations(projectId),
    () => storyboardApi.getLocations(projectId),
    { revalidateOnFocus: false },
  );

  const locations = data?.locations || [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lightingNotes, setLightingNotes] = useState("");
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
        toast.success("Location reference uploaded");
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
      toast.error("Location name is required");
      return;
    }

    setIsSaving(true);
    try {
      await storyboardApi.createLocation(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        lightingNotes: lightingNotes.trim() || undefined,
        referenceImageUrl: referenceImageUrl || undefined,
      });

      mutate();
      setShowAddForm(false);
      setName("");
      setDescription("");
      setLightingNotes("");
      setReferenceImageUrl("");
      toast.success("Location saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save location");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this location anchor?")) return;
    try {
      await storyboardApi.deleteLocation(id);
      mutate();
      toast.success("Location removed");
    } catch {
      toast.error("Failed to delete location");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex flex-col w-full max-w-2xl max-h-[85vh] rounded-md border border-[#c9a84c]/25 bg-[#090f09] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#080d08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8d5a3]">
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Established Scene Locations ({locations.length})
              </h3>
              <p className="text-[11px] text-white/50">
                Environmental &amp; architectural anchors conditioning shot backgrounds
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
              AI automatically extracts locations during screenplay breakdown
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-3 py-1 text-xs font-bold text-[#e8d5a3] hover:bg-[#c9a84c]/20 transition"
            >
              <Plus size={12} /> {showAddForm ? "Cancel" : "Add Location"}
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
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dave's Apartment - Living Room"
                  className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/70">
                  Layout &amp; Architecture Details
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Furniture arrangement, wallpaper, windows, messy bookshelf, rug..."
                  className="mt-1 w-full rounded border border-white/10 bg-black/50 p-2 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/70">
                  Lighting &amp; Atmosphere
                </label>
                <input
                  type="text"
                  value={lightingNotes}
                  onChange={(e) => setLightingNotes(e.target.value)}
                  placeholder="e.g. Warm leaning floor lamp, blue evening window light"
                  className="mt-1 w-full rounded border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-white focus:border-[#c9a84c]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/70">
                  Reference Image
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
                  className="mt-1 flex cursor-pointer items-center justify-center rounded border border-dashed border-white/15 bg-black/30 p-2.5 text-center hover:border-[#c9a84c]/40"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Loader2 size={12} className="animate-spin text-[#c9a84c]" />
                      Uploading image...
                    </div>
                  ) : referenceImageUrl ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={referenceImageUrl}
                        alt="Ref preview"
                        className="h-8 w-12 rounded object-cover border border-white/20"
                      />
                      <span className="text-[#87da70] font-semibold">
                        Image Attached (Click to change)
                      </span>
                    </div>
                  ) : (
                    <span className="text-white/40 flex items-center gap-1.5">
                      <Upload size={12} /> Click to upload reference photo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  {isSaving ? "Saving..." : "Save Location"}
                </button>
              </div>
            </form>
          )}

          {/* Locations list */}
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-white/40">
              <Loader2 size={16} className="animate-spin text-[#c9a84c] mr-2" />
              Loading locations...
            </div>
          ) : locations.length === 0 ? (
            <div className="rounded border border-dashed border-white/10 bg-black/20 p-8 text-center text-white/40">
              <MapPin size={24} className="mx-auto text-white/20 mb-2" />
              <p className="font-semibold text-white/60">No locations tracked yet</p>
              <p className="text-[10px] text-white/30 mt-1">
                Breakdown your script or add locations manually to lock room layouts across shots.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex flex-col justify-between rounded-md border border-white/10 bg-black/40 p-3.5 hover:border-[#c9a84c]/30 transition"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-white text-sm">
                        {loc.name}
                      </h4>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="text-white/30 hover:text-red-400 p-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {loc.description && (
                      <p className="mt-1.5 text-white/70 line-clamp-2 text-[11px] leading-relaxed">
                        {loc.description}
                      </p>
                    )}

                    {loc.lightingNotes && (
                      <div className="mt-2 flex items-center gap-1.5 rounded bg-[#c9a84c]/10 px-2 py-1 text-[10px] text-[#e8d5a3] border border-[#c9a84c]/20">
                        <Sun size={11} className="shrink-0 text-[#c9a84c]" />
                        <span className="line-clamp-1">{loc.lightingNotes}</span>
                      </div>
                    )}
                  </div>

                  {loc.referenceImageUrl && (
                    <div className="mt-2.5 h-20 w-full overflow-hidden rounded border border-white/10">
                      <img
                        src={loc.referenceImageUrl}
                        alt={loc.name}
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
