"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[#6b98ff] to-[#3b6cf6] text-white shadow-[0_8px_22px_-10px_rgba(59,108,246,0.9)] hover:from-[#7ea6ff] hover:to-[#4a78f8] border border-[#6d99ff]/40",
  secondary:
    "bg-elevated text-body border border-line-strong hover:border-line-strong hover:bg-hover-strong",
  ghost: "text-muted hover:text-strong hover:bg-hover-strong border border-transparent",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 hover:text-danger",
  subtle: "bg-hover text-body border border-line hover:bg-hover-strong",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  icon: "size-9 rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-all duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading && (
        <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
}
