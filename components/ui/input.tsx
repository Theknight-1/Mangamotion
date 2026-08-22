import React, {
  forwardRef,
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type MouseEventHandler,
  type SelectHTMLAttributes,
} from "react";
import { Upload, Loader2 } from "lucide-react";

/* ─── Field ─── */
interface FieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div>
    <label className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wider text-white/70">
      {label} {required && <span className="text-[#c9a84c]">*</span>}
    </label>
    {children}
  </div>
);

/* ─── Shared input classes ─── */
const inputClasses =
  "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 transition-all focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/30";

/* ─── TextInput ─── */
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`${inputClasses} ${className}`} {...props} />
  ),
);
TextInput.displayName = "TextInput";

/* ─── TextArea ─── */
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  className = "",
  ...props
}) => (
  <textarea className={`${inputClasses} resize-none ${className}`} {...props} />
);

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = "", children, ...props }, ref) => (
  <select
    ref={ref}
    className={`${inputClasses} cursor-pointer ${className}`}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

/* ─── Dropzone ─── */
interface DropzoneProps {
  isUploading: boolean;
  imageUrl?: string | null;
  onClick: MouseEventHandler<HTMLDivElement>;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  isUploading,
  imageUrl,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="mt-1 flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-black/30 text-center transition-all hover:border-[#c9a84c]/50 hover:bg-black/40"
  >
    {isUploading ? (
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Loader2 size={16} className="animate-spin text-[#c9a84c]" />
        Uploading image...
      </div>
    ) : imageUrl ? (
      <div className="flex items-center gap-3">
        <img
          src={imageUrl}
          alt="Ref preview"
          className="h-12 w-16 rounded-md object-cover border border-white/20 shadow-md"
        />
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold text-[#87da70]">
            Image Attached
          </span>
          <span className="text-[10px] text-white/40">Click to change</span>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-1 text-white/40">
        <Upload size={20} className="mb-1 text-white/50" />
        <span className="text-xs font-medium">
          Click to upload reference photo
        </span>
      </div>
    )}
  </div>
);
