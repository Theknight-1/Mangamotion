import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] text-[#060e06] shadow-[0_4px_20px_rgba(201,168,76,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(201,168,76,0.4)]",

  secondary:
    "border border-[#5a9a52]/30 bg-[#183218] text-[#d4edb8] hover:bg-[#214021]",

  ghost: "text-[#d4edb8] hover:bg-[#5a9a52]/10",

  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  children,
  className,
  loading,
  disabled,
  leftIcon,
  rightIcon,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : leftIcon}

      {children}

      {!loading && rightIcon}
    </button>
  );
}
