"use client";

import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, checked, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className={cn("relative inline-flex size-4 shrink-0 items-center justify-center", className)}>
      <input
        type="checkbox"
        checked={checked}
        {...props}
        className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none flex size-4 items-center justify-center rounded-[5px] border transition-colors duration-150",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-brand/45 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          checked ? "border-brand bg-brand text-white" : "border-faint/60 bg-field hover:border-faint",
        )}
      >
        <Check
          className={cn("size-3 transition-opacity duration-150", checked ? "opacity-100" : "opacity-0")}
          strokeWidth={3}
        />
      </span>
    </span>
  );
}
