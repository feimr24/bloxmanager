"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("blox-theme", next);
    } catch {
      // localStorage bisa diblokir; tema tetap berlaku untuk sesi ini.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti antara mode terang dan gelap"
      title="Ganti tema"
      className="rounded-lg border border-transparent p-2 text-muted transition hover:bg-hover-strong hover:text-strong"
    >
      <Sun className="hidden size-[17px] light:block" />
      <Moon className="size-[17px] light:hidden" />
    </button>
  );
}
