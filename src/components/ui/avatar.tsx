import { cn, initials } from "@/lib/utils";

const palettes = [
  "from-[#3b6cf6] to-[#7b5cff]",
  "from-[#12a594] to-[#3ddc97]",
  "from-[#d97706] to-[#f5b544]",
  "from-[#c026d3] to-[#7c3aed]",
  "from-[#0284c7] to-[#22d3ee]",
  "from-[#e11d48] to-[#fb7185]",
];

function hash(input: string) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) value = (value * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(value);
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const palette = palettes[hash(name) % palettes.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white/95 ring-1 ring-white/10",
        palette,
        size === "xs" && "size-6 text-[9px]",
        size === "sm" && "size-8 text-[10.5px]",
        size === "md" && "size-9 text-[11px]",
        size === "lg" && "size-11 text-[13px]",
        className,
      )}
    >
      {initials(name) || name.slice(0, 2).toUpperCase()}
    </span>
  );
}
