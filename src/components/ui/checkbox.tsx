"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      {...props}
      className={cn(
        "size-4 shrink-0 cursor-pointer appearance-none rounded-[5px] border border-line-strong bg-[#0a1322] transition checked:border-brand checked:bg-brand checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22><path d=%22M3.5 8.5l3 3 6-7%22 stroke=%22white%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] checked:bg-center checked:bg-no-repeat focus-visible:outline-offset-2 disabled:opacity-40",
        className,
      )}
    />
  );
}
