"use client";
import { useStore } from "@/lib/store";
import { AlertTriangle } from "lucide-react";

export function AlertTicker() {
  const { alerts } = useStore();
  const items = alerts.filter((a) => !a.ack);
  const list = items.length ? items : alerts.slice(0, 3);
  const doubled = [...list, ...list];
  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-panel-line bg-panel px-3 py-2">
      <span className="z-10 inline-flex shrink-0 items-center gap-1.5 rounded-md bg-accent-red/15 px-2 py-1 text-[11px] font-semibold text-accent-red">
        <AlertTriangle size={13} /> LIVE ALERTS
      </span>
      <div className="overflow-hidden">
        <div className="flex w-max gap-8 animate-ticker whitespace-nowrap">
          {doubled.map((a, i) => (
            <span key={i} className="text-[12px]">
              <span className={a.severity === "critical" ? "text-accent-red" : a.severity === "warning" ? "text-accent-amber" : "text-accent"}>●</span>{" "}
              <span className="text-t2">{a.title}</span>
              <span className="text-t3"> — {a.location}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
