"use client";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { fmtDateTime } from "@/lib/format";
import { LiveBadge } from "./ui";
import { Bell, Radio, Search, Sun, Moon } from "lucide-react";

export function Topbar() {
  const { nowMs, alerts, rakes } = useStore();
  const { theme, toggle } = useTheme();
  const openCritical = alerts.filter((a) => a.severity === "critical" && !a.ack).length;
  const inPlant = rakes.filter((r) => r.stage !== "en-route").length;

  return (
    <header className="h-14 shrink-0 border-b border-panel-line bg-surface/80 backdrop-blur flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <LiveBadge />
        <span className="text-[13px] text-t2">
          B-Shift · <span className="mono text-t1">{fmtDateTime(new Date(nowMs).toISOString())}</span> IST
        </span>
        <span className="hidden md:flex items-center gap-1.5 text-[12px] text-muted ml-2">
          <Radio size={13} className="text-accent-teal" /> 4-sensor fusion: RFID · GNSS · OCR · Weighbridge
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-panel-line bg-panel px-3 py-1.5 text-[12px] text-muted w-64">
          <Search size={14} />
          <span>Search rake / RR / wagon…</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-t2">
          <span className="mono text-t1">{inPlant}</span> rakes in plant
        </div>
        <button
          onClick={toggle}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          className="grid h-9 w-9 place-items-center rounded-lg border border-panel-line bg-panel text-t2 hover:text-t1 transition-colors">
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-panel-line bg-panel text-t2 hover:text-t1">
          <Bell size={16} />
          {openCritical > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
              {openCritical}
            </span>
          )}
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand/20 text-brand text-[12px] font-semibold ring-1 ring-brand/30">
          GT
        </div>
      </div>
    </header>
  );
}
