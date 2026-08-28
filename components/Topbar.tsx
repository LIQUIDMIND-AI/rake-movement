"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { fmtDateTime, fmtTime } from "@/lib/format";
import { COMMODITY_META } from "@/lib/commodities";
import { LiveBadge } from "./ui";
import { Bell, Radio, Search, Sun, Moon, User, Settings, LogOut, X } from "lucide-react";

const CURRENT_USER = { name: "Gaurav Tiwari", role: "Shift Traffic Controller · B-Shift", initials: "GT" };

type Menu = "search" | "notif" | "profile" | null;

export function Topbar() {
  const { nowMs, alerts, rakes, setSelectedRakeId, ackAlert } = useStore();
  const { theme, toggle } = useTheme();
  const openCritical = alerts.filter((a) => a.severity === "critical" && !a.ack).length;
  const openAlerts = alerts.filter((a) => !a.ack);
  const inPlant = rakes.filter((r) => r.stage !== "en-route").length;

  const [query, setQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<Menu>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setActiveMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveMenu(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches: { key: string; rakeId: string; label: string; sub: string }[] = [];
    for (const r of rakes) {
      if (matches.length >= 6) break;
      if (r.id.toLowerCase().includes(q) || r.rrNo.toLowerCase().includes(q)) {
        matches.push({ key: r.id, rakeId: r.id, label: r.id, sub: `${r.rrNo} · ${COMMODITY_META[r.commodity].short}` });
        continue;
      }
      const wagon = r.wagons.find((w) => w.id.toLowerCase().includes(q));
      if (wagon) {
        matches.push({ key: r.id + wagon.id, rakeId: r.id, label: `Wagon ${wagon.id}`, sub: `${r.id} · ${COMMODITY_META[r.commodity].short}` });
      }
    }
    return matches;
  }, [query, rakes]);

  function selectResult(rakeId: string) {
    setSelectedRakeId(rakeId);
    setQuery("");
    setActiveMenu(null);
  }

  return (
    <header ref={rootRef} className="relative z-[900] h-14 shrink-0 border-b border-panel-line bg-surface/80 backdrop-blur flex items-center justify-between px-5">
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
        {/* Search */}
        <div className="relative hidden lg:block">
          <div className="flex w-64 items-center gap-2 rounded-lg border border-panel-line bg-panel px-3 py-1.5 text-[12px] text-muted transition focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30">
            <Search size={14} className="shrink-0" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveMenu("search"); }}
              onFocus={() => setActiveMenu("search")}
              placeholder="Search rake / RR / wagon…"
              className="w-full bg-transparent text-t1 placeholder-muted outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="shrink-0 text-muted hover:text-t1">
                <X size={13} />
              </button>
            )}
          </div>
          {activeMenu === "search" && query && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-panel-line bg-surface shadow-pop">
              {results.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-muted">No matches for &ldquo;{query}&rdquo;</div>
              ) : (
                results.map((r) => (
                  <button key={r.key} onClick={() => selectResult(r.rakeId)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[12.5px] transition hover:bg-surface-3">
                    <span className="mono text-t1">{r.label}</span>
                    <span className="text-[11px] text-muted">{r.sub}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-t2">
          <span className="mono text-t1">{inPlant}</span> rakes in plant
        </div>

        <button
          onClick={toggle}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          className="grid h-9 w-9 place-items-center rounded-lg border border-panel-line bg-panel text-t2 transition-colors hover:text-t1">
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "notif" ? null : "notif")}
            aria-label="Notifications"
            aria-expanded={activeMenu === "notif"}
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-panel-line bg-panel text-t2 hover:text-t1">
            <Bell size={16} />
            {openCritical > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
                {openCritical}
              </span>
            )}
          </button>
          {activeMenu === "notif" && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-panel-line bg-surface shadow-pop">
              <div className="flex items-center justify-between border-b border-panel-line px-3 py-2">
                <span className="text-[12.5px] font-semibold text-t1">Notifications</span>
                <span className="text-[11px] text-muted">{openAlerts.length} open</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {openAlerts.length === 0 ? (
                  <div className="px-3 py-4 text-center text-[12px] text-muted">All caught up — no open alerts.</div>
                ) : (
                  openAlerts.slice(0, 6).map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5 border-b border-panel-line/60 px-3 py-2.5 last:border-0">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.severity === "critical" ? "bg-red" : a.severity === "warning" ? "bg-amber" : "bg-sky"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] text-t2">{a.title}</div>
                        <div className="text-[10.5px] text-muted">{fmtTime(a.tsIso)} · {a.location}</div>
                      </div>
                      <button onClick={() => ackAlert(a.id)} className="shrink-0 text-[10.5px] text-brand hover:underline">Ack</button>
                    </div>
                  ))
                )}
              </div>
              <Link href="/alerts" onClick={() => setActiveMenu(null)}
                className="block border-t border-panel-line px-3 py-2 text-center text-[12px] text-brand hover:underline">
                View all alerts
              </Link>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "profile" ? null : "profile")}
            aria-label="Account menu"
            aria-expanded={activeMenu === "profile"}
            className="grid h-9 w-9 place-items-center rounded-full bg-brand/20 text-brand text-[12px] font-semibold ring-1 ring-brand/30 transition hover:ring-brand/50">
            {CURRENT_USER.initials}
          </button>
          {activeMenu === "profile" && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-panel-line bg-surface shadow-pop">
              <div className="border-b border-panel-line px-3 py-3">
                <div className="text-[13px] font-medium text-t1">{CURRENT_USER.name}</div>
                <div className="text-[11px] text-muted">{CURRENT_USER.role}</div>
              </div>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-t2 transition hover:bg-surface-3 hover:text-t1">
                <User size={14} /> View profile
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-t2 transition hover:bg-surface-3 hover:text-t1">
                <Settings size={14} /> Settings
              </button>
              <button className="flex w-full items-center gap-2 border-t border-panel-line px-3 py-2 text-left text-[12.5px] text-red transition hover:bg-red/10">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
