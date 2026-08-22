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
import { Button } from "../loader-button";
import { Dropzone, Field, TextArea, TextInput } from "../ui/input";

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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
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
              <h3 className="text-lg font-bold text-white">
                Established Scene Locations ({locations.length})
              </h3>
              <p className="text-xs text-white/50 tracking-wide">
                Environmental &amp; architectural anchors conditioning shot
                backgrounds
              </p>
            </div>
          </div>
          <Button onClick={onClose} className="p-1 text-white" variant="ghost">
            <X size={18} />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.08] hover:scrollbar-thumb-[#c9a84c]/50 p-6 space-y-4 text-xs">
          {/* Top action bar */}
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-sm">
              AI automatically extracts locations during screenplay breakdown
            </span>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className=" border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-sm py-1.5 font-bold text-[#e8d5a3] hover:bg-[#c9a84c]/20 transition"
            >
              <Plus
                size={14}
                className={`${showAddForm ? "-rotate-45" : ""}`}
              />{" "}
              {showAddForm ? "Cancel" : "Add Location"}
            </Button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form
              onSubmit={handleCreate}
              className="rounded-md border border-white/10 bg-black/60 p-6 space-y-5 shadow-2xl backdrop-blur-sm"
            >
              {/* Location Name */}
              <Field label="Location Name" required>
                <TextInput
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dave's Apartment - Living Room"
                />
              </Field>

              {/* Layout & Architecture */}
              <Field label="Layout & Architecture">
                <TextArea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Furniture arrangement, wallpaper, windows, messy bookshelf, rug..."
                />
              </Field>

              {/* Lighting & Atmosphere */}
              <Field label="Lighting & Atmosphere">
                <TextInput
                  type="text"
                  value={lightingNotes}
                  onChange={(e) => setLightingNotes(e.target.value)}
                  placeholder="e.g. Warm leaning floor lamp, blue evening window light"
                />
              </Field>

              {/* Reference Image */}
              <Field label="Reference Image">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Dropzone
                  isUploading={isUploading}
                  imageUrl={referenceImageUrl}
                  onClick={() => fileInputRef.current?.click()}
                />
              </Field>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] px-5 py-2 text-sm font-bold text-black shadow-lg shadow-[#c9a84c]/20 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Location"
                  )}
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
              <p className="font-semibold text-white/60">
                No locations tracked yet
              </p>
              <p className="text-[10px] text-white/30 mt-1">
                Breakdown your script or add locations manually to lock room
                layouts across shots.
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
                      <h4 className="font-bold text-white text-base">
                        {loc.name}
                      </h4>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="text-white/30 hover:text-red-400 p-0.5 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {loc.description && (
                      <p className="mt-1.5 text-white/70 line-clamp-6 text-[13px]">
                        {loc.description}
                      </p>
                    )}

                    {loc.lightingNotes && (
                      <div className="mt-2 flex items-center gap-1.5 rounded bg-[#c9a84c]/10 px-2 py-1 text-xs text-[#e8d5a3] border border-[#c9a84c]/20">
                        <Sun size={11} className="shrink-0 text-[#c9a84c]" />
                        <span className="line-clamp-5">
                          {loc.lightingNotes}
                        </span>
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
