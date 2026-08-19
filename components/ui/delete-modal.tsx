"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertTriangle, Loader2, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeleteModalProps {
  /** Controls visibility of the modal */
  isOpen: boolean;
  /** Callback when the modal is requested to close */
  onClose: () => void;
  /** Async or sync callback executed when deletion is confirmed */
  onConfirm: () => Promise<void> | void;
  /** Custom modal title (defaults to "Delete [itemType]" or "Delete Item") */
  title?: React.ReactNode;
  /** Custom description text */
  description?: React.ReactNode;
  /** Name of the item to be deleted (e.g. project title, file name), highlighted in UI */
  itemName?: string;
  /** Type of the item (e.g. "project", "character", "storyboard", "video") */
  itemType?: string;
  /** Confirm button label (defaults to "Delete" or "Delete [itemType]") */
  confirmText?: string;
  /** Cancel button label (defaults to "Cancel") */
  cancelText?: string;
  /** Explicit loading state if managed externally */
  isLoading?: boolean;
  /**
   * If provided (e.g. "DELETE" or item name), the user must type this exact text to enable deletion.
   * Passing `true` requires typing "DELETE".
   */
  requireKeyword?: string | boolean;
  /** Visual style variant */
  variant?: "danger" | "warning";
  /** Custom icon to override the default trash/warning icon */
  icon?: React.ReactNode;
  /** Additional custom content to render inside the modal */
  children?: React.ReactNode;
  /** Whether clicking outside the modal closes it (default: true) */
  closeOnBackdropClick?: boolean;
  /** Additional container classes */
  className?: string;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType = "item",
  confirmText,
  cancelText = "Cancel",
  isLoading: externalLoading,
  requireKeyword,
  variant = "danger",
  icon,
  children,
  closeOnBackdropClick = true,
  className,
}: DeleteModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [mounted, setMounted] = useState(false);

  const isSubmitting =
    externalLoading !== undefined ? externalLoading : internalLoading;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset confirmation input when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationInput("");
      setInternalLoading(false);
    }
  }, [isOpen]);

  // Handle keyboard Escape to close and Enter to submit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Keyword check
  const requiredKeywordText =
    typeof requireKeyword === "string"
      ? requireKeyword
      : requireKeyword === true
        ? "DELETE"
        : null;

  const isKeywordValid =
    !requiredKeywordText ||
    confirmationInput.trim().toLowerCase() ===
      requiredKeywordText.trim().toLowerCase();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKeywordValid || isSubmitting) return;

    try {
      setInternalLoading(true);
      await onConfirm();
      onClose();
    } catch {
      // Keep modal open on error so caller can display toast notifications
    } finally {
      setInternalLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const defaultTitle = title || (
    <span>
      Delete{" "}
      {itemType ? itemType.charAt(0).toUpperCase() + itemType.slice(1) : "Item"}
      ?
    </span>
  );

  const defaultDescription = description || (
    <span>
      Are you sure you want to permanently delete this {itemType.toLowerCase()}?
      This action cannot be undone and all associated data will be removed.
    </span>
  );

  const isDanger = variant === "danger";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[6px] transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (closeOnBackdropClick && !isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className={cn(
          "relative w-full max-w-[520px] overflow-hidden rounded-md border bg-[#0e140f] p-0 shadow-[0_25px_70px_rgba(0,0,0,0.85)] animate-in zoom-in-[0.96] fade-in duration-200",
          isDanger
            ? "border-red-500/20 shadow-red-950/20"
            : "border-amber-500/20 shadow-amber-950/20",
          className,
        )}
      >
        {/* Top accent hairline */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent",
            isDanger ? "text-red-500/70" : "text-amber-500/70",
          )}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute z-20 right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleConfirm} className="relative z-10 p-6 sm:p-7">
          {/* Header section with Icon */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-inner transition-transform",
                isDanger
                  ? "border-red-500/30 bg-red-500/10 text-red-400 shadow-red-500/10"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-amber-500/10",
              )}
            >
              {icon ? (
                icon
              ) : isDanger ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>

            <div className="flex-1 pt-0.5">
              <h3
                id="delete-modal-title"
                className="text-xl font-semibold tracking-tight text-white/95"
              >
                {defaultTitle}
              </h3>
              <div className="mt-1 text-sm leading-relaxed text-white/60">
                {defaultDescription}
              </div>
            </div>
          </div>

          {/* Item Name Highlight Pill */}
          {itemName && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/40 px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-white/35" />
              <span className="truncate text-xs font-medium text-white/80">
                {itemName}
              </span>
            </div>
          )}

          {/* Extra Custom Children */}
          {children && <div className="mt-4">{children}</div>}

          {/* Keyword Confirmation Field if required */}
          {requiredKeywordText && (
            <div className="mt-4 space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-white/50">
                Type{" "}
                <span className="font-bold text-white/90">
                  "{requiredKeywordText}"
                </span>{" "}
                to confirm
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Type "${requiredKeywordText}"`}
                disabled={isSubmitting}
                className="h-10 w-full rounded-lg border border-white/[0.1] bg-black/50 px-3 text-xs text-white placeholder:text-white/20 outline-none transition focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                autoFocus
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] px-4 text-[15px] font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              {cancelText}
            </button>

            <button
              type="submit"
              disabled={!isKeywordValid || isSubmitting}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-[15px] font-semibold text-white shadow-lg transition duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-40",
                isDanger
                  ? "bg-red-600 hover:bg-red-500 shadow-red-950/40 active:bg-red-700"
                  : "bg-amber-600 hover:bg-amber-500 shadow-amber-950/40 active:bg-amber-700",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  {isDanger ? (
                    <Trash2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  <span>{confirmText || `Delete ${itemType}`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default DeleteModal;
