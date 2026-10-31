"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-line-strong bg-field px-3.5 text-sm text-body placeholder:text-faint transition focus:border-brand/70 focus:bg-field focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50";

export function Input({
  className,
  leading,
  trailing,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; trailing?: ReactNode }) {
  if (!leading && !trailing) {
    return <input {...props} className={cn(base, "h-10", className)} />;
  }
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
          {leading}
        </span>
      )}
      <input
        {...props}
        className={cn(base, "h-10", leading && "pl-9", trailing && "pr-10", className)}
      />
      {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(base, "min-h-[88px] resize-none py-2.5", className)} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(base, "h-10 cursor-pointer appearance-none pr-9", className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center justify-between text-[12.5px] font-medium text-body">
        <span>{label}</span>
        {hint && <span className="font-normal text-faint">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-[11.5px] text-danger">{error}</p>}
    </div>
  );
}
