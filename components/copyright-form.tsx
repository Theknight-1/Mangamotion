"use client";

import { useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface CopyrightFormProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onSubmit: (data: {
    isOriginal: boolean;
    purpose: string;
    language: string;
  }) => void;
  isSubmitting?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese (Simplified)" },
];

export function CopyrightForm({
  isOpen,
  projectName,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CopyrightFormProps) {
  const [isOriginal, setIsOriginal] = useState<boolean | null>(null);
  const [purpose, setPurpose] = useState("");
  const [language, setLanguage] = useState("en");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = () => {
    if (isOriginal === null) {
      toast.error("Please select whether this is your original work");
      return;
    }
    if (!isOriginal && !purpose.trim()) {
      toast.error("Please explain the purpose of your project");
      return;
    }
    if (!agreeToTerms) {
      toast.error("Please agree to the copyright terms");
      return;
    }

    onSubmit({
      isOriginal: isOriginal as boolean,
      purpose: purpose.trim(),
      language,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-white/[0.07] bg-[#0d0d18] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6 pb-4">
          <h2 className="text-xl font-bold text-white">
            Copyright & Ownership
            <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
              <p className="text-xs text-white/60  tracking-widest">
                Project Name:
              </p>
              <p className="text-sm uppercase font-medium text-white/80">
                {projectName}
              </p>
            </div>
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-white/40 hover:text-white transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
          {/* Language Selection */}
          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-2 block">
              Content Language (Cannot be changed later)
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-white/3 border border-white/6 rounded-lg text-sm text-white focus:outline-none focus:border-[#4a8a42]/40 transition"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  className="bg-[#0d0d18]"
                >
                  {lang.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-white/40 mt-1">
              All AI-generated narration will be created in this language
            </p>
          </div>

          {/* Info box */}
          <div className="flex gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <AlertCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200">
              Please confirm the copyright status of your manga/comic content to
              ensure compliance with our terms of service.
            </p>
          </div>

          {/* Option 1: Original work */}
          <div
            onClick={() => setIsOriginal(true)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              isOriginal === true
                ? "border-[#4a8a42]/50 bg-[#4a8a42]/10"
                : "border-white/[0.07] bg-white/2 hover:border-white/15 hover:bg-white/4"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                  isOriginal === true
                    ? "border-[#4a8a42] bg-[#4a8a42]/20"
                    : "border-white/15 bg-transparent"
                }`}
              >
                {isOriginal === true && (
                  <CheckCircle2 size={12} className="text-[#4a8a42]" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">
                  This is my original work
                </p>
                <p className="text-xs text-white/40 mt-1">
                  I created this manga/comic content and own all rights to it.
                </p>
              </div>
            </div>
          </div>

          {/* Option 2: Not original - for review/educational */}
          <div
            onClick={() => setIsOriginal(false)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              isOriginal === false
                ? "border-amber-500/50 bg-amber-500/10"
                : "border-white/[0.07] bg-white/2 hover:border-white/15 hover:bg-white/4"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                  isOriginal === false
                    ? "border-amber-500 bg-amber-500/20"
                    : "border-white/15 bg-transparent"
                }`}
              >
                {isOriginal === false && (
                  <CheckCircle2 size={12} className="text-amber-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">
                  This is for review/educational purposes only
                </p>
                <p className="text-xs text-white/40 mt-1">
                  I'm creating a video analysis, review, or transformation for
                  fair use.
                </p>
              </div>
            </div>
          </div>

          {/* Purpose field (shown only when not original) */}
          {isOriginal === false && (
            <div className="pt-2">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-2 block">
                Purpose & Justification
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="E.g., 'Educational video review of manga storytelling techniques' or 'Fan-made animated analysis with original commentary'"
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 bg-white/3 border border-white/6 rounded-lg text-xs text-white placeholder-white/25 focus:outline-none focus:border-amber-500/40 resize-none transition"
              />
              <p className="text-[10px] text-white/30 mt-1">
                {purpose.length}/200
              </p>
            </div>
          )}

          {/* Terms agreement */}
          <div className="flex gap-3 pt-2 border-t border-white/5">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#4a8a42] focus:ring-[#4a8a42] cursor-pointer mt-0.5"
            />
            <label
              htmlFor="agree-terms"
              className="flex-1 text-xs  leading-relaxed text-white/60 cursor-pointer"
            >
              I confirm that the content in this project complies with copyright
              laws and I am responsible for any misuse or copyright
              infringement.
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-white/5 p-6 pt-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white/60 hover:text-white/80 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              isOriginal === null ||
              !agreeToTerms ||
              (isOriginal === false && !purpose.trim())
            }
            className="flex-1 px-4 py-2 text-sm font-semibold bg-[#4a8a42] hover:bg-[#3a7a32] text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
