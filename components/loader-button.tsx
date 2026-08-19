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
    "bg-gradient-to-br from-[#c9a84c] to-[#e8d5a3] text-[#060e06] ",

  secondary:
    "border border-[#5a9a52]/30 bg-[#183218] text-[#d4edb8] hover:bg-[#214021]",

  ghost: " hover:bg-[#5a9a52]/10",

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
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all",
        " disabled:opacity-50 group relative  overflow-hidden rounded-md text-sm font-semibold text-[#0a0f0a] cursor-pointer duration-200 hover:shadow-xl  active:translate-y-0 disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : leftIcon}

      {children}

      {!loading && rightIcon}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
    </button>
  );
}
