"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PasswordInput({
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      id={id}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          className="rounded-md p-1.5 text-faint transition hover:bg-hover-strong hover:text-body"
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      }
    />
  );
}
