"use client";
import React from "react";

export function Panel({ title, sub, right, children, className = "", bodyClass = "" }: {
  title?: string; sub?: string; right?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between px-4 py-3 border-b border-panel-line">
          <div>
            {title && <h3 className="text-sm font-semibold text-t1">{title}</h3>}
            {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={bodyClass || "p-4"}>{children}</div>
    </section>
  );
}

const toneMap: Record<string, string> = {
  good: "text-accent-grn", bad: "text-accent-red", neutral: "text-t1",
};

export function Stat({ label, value, sub, tone = "neutral", trend }: {
  label: string; value: string; sub?: string; tone?: "good" | "bad" | "neutral"; trend?: number;
}) {
  return (
    <div className="card card-hover p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold mono ${toneMap[tone]}`}>{value}</div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
        {sub && <span>{sub}</span>}
        {typeof trend === "number" && (
          <span className={trend >= 0 ? "text-accent-grn" : "text-accent-red"}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

const sevBadge: Record<string, string> = {
  critical: "bg-red/10 text-red border-red/25",
  warning: "bg-amber/10 text-amber border-amber/25",
  info: "bg-sky/10 text-sky border-sky/25",
  good: "bg-grn/10 text-grn border-grn/25",
  neutral: "bg-t3/10 text-t2 border-t3/25",
};

export function Badge({ tone = "neutral", children, className = "" }: {
  tone?: keyof typeof sevBadge; children: React.ReactNode; className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-medium ${sevBadge[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Dot({ color, pulse = false }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex" style={{ color }}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {pulse && <span className="absolute inset-0 h-2 w-2 rounded-full animate-ping" style={{ background: color, opacity: 0.7 }} />}
    </span>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-grn/30 bg-grn/10 px-2 py-0.5 text-[10.5px] font-semibold text-grn">
      <span className="h-1.5 w-1.5 rounded-full bg-grn live-dot" /> LIVE
    </span>
  );
}

export function PageHeader({ title, sub, icon, actions }: {
  title: string; sub: string; icon?: React.ReactNode; actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-brand">{icon}</div>}
        <div>
          <h1 className="text-xl font-semibold text-t1">{title}</h1>
          <p className="text-sm text-muted mt-0.5 max-w-2xl">{sub}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}
