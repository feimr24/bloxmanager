import type { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="card-surface panel-glow animate-in-up p-6 sm:p-7">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-strong">{title}</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{description}</p>
      </div>
      {children}
      {footer && <div className="mt-6 border-t border-line pt-4 text-center text-[12px] text-muted">{footer}</div>}
    </div>
  );
}

export function AuthAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-danger/25 bg-danger/[0.07] text-danger",
    success: "border-success/30 bg-success/[0.07] text-success",
    info: "border-brand/25 bg-brand/[0.07] text-accent",
  } as const;

  return (
    <div role="alert" className={`rounded-xl border px-3 py-2.5 text-[11.5px] leading-relaxed ${styles[tone]}`}>
      {children}
    </div>
  );
}
