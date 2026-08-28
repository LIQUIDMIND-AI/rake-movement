"use client";
import { useStore } from "@/lib/store";
import { COMMODITY_META, COMMODITY_MAP_COLOR } from "@/lib/commodities";
import { fmtTime } from "@/lib/format";
import { Badge, Dot } from "./ui";
import { X, Train, Radio, Weight } from "lucide-react";

const STAGES = ["en-route", "interchange", "accepted", "placement", "unloading", "loading", "formation", "handover"];

export function RakeDrawer() {
  const { rakes, selectedRakeId, setSelectedRakeId, nowMs } = useStore();
  const r = rakes.find((x) => x.id === selectedRakeId);
  if (!r) return null;
  const meta = COMMODITY_META[r.commodity];
  const color = COMMODITY_MAP_COLOR[r.commodity];
  const taggedCount = r.wagons.filter((w) => w.tagged).length;

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/40" onClick={() => setSelectedRakeId(null)} />
      <aside className="fixed right-0 top-0 z-[1001] h-full w-[380px] max-w-[90vw] overflow-y-auto border-l border-panel-line bg-surface shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-panel-line bg-surface px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: color + "22", color }}>
              <Train size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-t1">{r.id}</div>
              <div className="text-[11px] text-muted">{meta.label} · {r.origin}</div>
            </div>
          </div>
          <button onClick={() => setSelectedRakeId(null)} className="text-muted hover:text-t1"><X size={18} /></button>
        </header>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Status"><span className="capitalize">{r.status}</span></Field>
            <Field label="Speed">{r.speedKmph} km/h</Field>
            <Field label="Loco">{r.loco}</Field>
            <Field label="RR No.">{r.rrNo}</Field>
            <Field label="Wagons">{r.wagonCount}</Field>
            <Field label="Net load">{r.loadedT ? r.loadedT + " t" : "Empty"}</Field>
            <Field label="Heading">{r.headingLabel}</Field>
            <Field label="Last sensor"><span className="inline-flex items-center gap-1"><Radio size={12} className="text-accent-teal" />{r.lastSensor}</span></Field>
          </div>

          <div className="rounded-lg border border-panel-line bg-panel p-3">
            <div className="flex items-center justify-between text-[11px] text-muted mb-1.5">
              <span className="inline-flex items-center gap-1"><Weight size={12} /> Wagon identity fusion</span>
              <span>{taggedCount}/{r.wagonCount} RFID · {r.wagonCount - taggedCount} OCR</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="bg-accent-teal" style={{ width: `${(taggedCount / r.wagonCount) * 100}%` }} />
              <div className="bg-accent-violet" style={{ width: `${((r.wagonCount - taggedCount) / r.wagonCount) * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">Lifecycle</div>
            <ol className="relative ml-1.5 border-l border-panel-line">
              {r.lifecycle.map((ev, i) => {
                const active = ev.stage === r.stage;
                return (
                  <li key={i} className="mb-3 ml-4">
                    <span className="absolute -left-[6.5px] mt-1 h-3 w-3 rounded-full border-2 border-surface"
                      style={{ background: ev.done ? "#34d399" : active ? color : "#3d5876" }} />
                    <div className="flex items-center justify-between">
                      <span className={`text-[12.5px] ${active ? "text-t1 font-medium" : ev.done ? "text-t2" : "text-t3"}`}>{ev.label}</span>
                      <span className="mono text-[10.5px] text-muted">{ev.done || active ? fmtTime(ev.tsIso) : "—"}</span>
                    </div>
                    <div className="text-[10.5px] text-muted">{ev.location} · {ev.source}{active && <span className="text-brand"> · now</span>}</div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-panel-line bg-panel px-3 py-2">
            <span className="text-[11px] text-muted">Detention so far</span>
            <span className="mono text-sm text-t1">{r.detentionHrs.toFixed(1)} h</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-panel-line bg-panel px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-t3">{label}</div>
      <div className="mt-0.5 text-[12.5px] text-t1">{children}</div>
    </div>
  );
}
