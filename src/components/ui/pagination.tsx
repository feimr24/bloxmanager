"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    let value = index + 1;
    if (totalPages > 5) {
      if (page <= 3) value = index + 1;
      else if (page >= totalPages - 2) value = totalPages - 4 + index;
      else value = page - 2 + index;
    }
    return value;
  });

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-[11px] text-faint">
        Menampilkan <span className="tabular text-body">{start}</span>–
        <span className="tabular text-body">{end}</span> dari{" "}
        <span className="tabular text-body">{total.toLocaleString("id-ID")}</span> akun
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
          className="flex size-8 items-center justify-center rounded-lg border border-line text-faint transition hover:border-line-strong hover:text-strong disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        {pages.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPage(value)}
            aria-current={value === page ? "page" : undefined}
            className={cn(
              "tabular flex size-8 items-center justify-center rounded-lg border text-[11.5px] font-medium transition",
              value === page
                ? "border-brand/40 bg-brand/15 text-strong"
                : "border-line text-muted hover:border-line-strong hover:text-strong",
            )}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
          className="flex size-8 items-center justify-center rounded-lg border border-line text-faint transition hover:border-line-strong hover:text-strong disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
