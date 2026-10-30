"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const EVENT = "blox:toast";

export function pushToast(message: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, kind } }));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handle(event: Event) {
      const detail = (event as CustomEvent<{ message: string; kind: ToastKind }>).detail;
      const id = Date.now() + Math.random();
      setItems((current) => [...current, { id, message: detail.message, kind: detail.kind }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 4200);
    }
    window.addEventListener(EVENT, handle);
    return () => window.removeEventListener(EVENT, handle);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "animate-scale pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl",
            item.kind === "success" && "border-success/30 bg-[#0c1c19]/95 text-emerald-100",
            item.kind === "error" && "border-danger/30 bg-[#1f1015]/95 text-rose-100",
            item.kind === "info" && "border-brand/30 bg-[#0e1628]/95 text-slate-100",
          )}
        >
          {item.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          ) : item.kind === "error" ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" />
          ) : (
            <Info className="mt-0.5 size-4 shrink-0 text-brand" />
          )}
          <span className="flex-1 leading-snug">{item.message}</span>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            className="rounded-md p-0.5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
