"use client";
import { useStore } from "@/lib/store";
import { Panel, Stat, LiveBadge, Badge } from "@/components/ui";
import { PlantMapCanvas } from "@/components/Maps";
import { RakeBoard } from "@/components/RakeBoard";
import { fmtInr, fmtTime, fmtHrs, countdown } from "@/lib/format";
import { COMMODITY_META, COMMODITY_MAP_COLOR } from "@/lib/commodities";
import { buildMIS } from "@/lib/seed";
import type { Commodity } from "@/lib/types";
import { ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ControlRoom() {
  const { rakes, inbound, vessels, alerts, nowMs } = useStore();
  const inPlant = rakes.filter((r) => r.stage !== "en-route");
  const moving = inPlant.filter((r) => r.status === "moving").length;
  const breached = inPlant.filter((r) => countdown(nowMs, r.freeUntilIso).breached);
  const exposure = 124300;
  // Detention: hours a rake has been held so far (in-plant, still running).
  const avgDetention = inPlant.reduce((s, r) => s + r.detentionHrs, 0) / inPlant.length;
  // TAT (Turnaround Time): placement -> release, for rakes that completed a full cycle this shift.
  const releasedThisShift = buildMIS().filter((r) => r.status === "Released");
  const avgTat = releasedThisShift.length > 0
    ? releasedThisShift.reduce((s, r) => s + r.dwellHrs, 0) / releasedThisShift.length
    : 0;
  const openCrit = alerts.filter((a) => a.severity === "critical" && !a.ack);
  const topCrit = openCrit[0];

  const split = inPlant.reduce<Record<string, number>>((m, r) => { m[r.commodity] = (m[r.commodity] || 0) + 1; return m; }, {});
  const splitKeys = Object.keys(split) as Commodity[];

  return (
    <div className="mx-auto max-w-[1600px] p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-t1">Traffic Control Room</h1>
          <p className="mt-1 text-sm text-t3">
            Single live view of every rake across the DSP rail network — coking coal, ore, flux and empties.
          </p>
        </div>
        <LiveBadge />
      </header>

      {/* Calm attention strip — only when something needs a human */}
      {topCrit && (
        <Link href="/alerts"
          className="flex items-center gap-3 rounded-xl border border-red/25 bg-red/[0.06] px-4 py-2.5 text-sm transition hover:bg-red/[0.1]">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-red/15 text-red">
            <AlertTriangle size={14} />
          </span>
          <span className="text-t1 font-medium">{openCrit.length} critical alert{openCrit.length > 1 ? "s" : ""} open</span>
          <span className="hidden sm:inline text-t3 truncate">— {topCrit.title} · {topCrit.location}</span>
          <ChevronRight size={16} className="ml-auto text-t3" />
        </Link>
      )}

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat label="Rakes in plant" value={String(inPlant.length)} sub={`${moving} moving now`} />
        <Stat label="Inbound to DSP" value={String(inbound.length)} sub={`+ ${vessels.filter((v) => v.status === "at-sea").length} vessels at sea`} />
        <Stat label="Past free time" value={String(breached.length)} sub="demurrage running" tone={breached.length ? "bad" : "good"} />
        <Stat label="Demurrage exposure" value={fmtInr(exposure)} sub="live, this shift" tone="bad" />
        <Stat label="Avg detention" value={fmtHrs(avgDetention)} sub="hrs held so far, in-plant" tone="neutral" />
        <Stat
          label="Avg TAT (Turnaround)"
          value={releasedThisShift.length > 0 ? fmtHrs(avgTat) : "—"}
          sub={`${releasedThisShift.length} rakes released, this shift`}
          tone={avgTat > 6 ? "bad" : "neutral"}
        />
      </section>

      {/* Primary — live map + rake board */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel className="xl:col-span-2 overflow-hidden" title="Live Plant Rail Map"
          sub="Georeferenced DSP track schematic · rakes colour-coded by commodity"
          right={<Link href="/plant-map" className="inline-flex items-center gap-0.5 text-[12px] text-brand hover:underline">Full map <ChevronRight size={14} /></Link>}
          bodyClass="p-0">
          <div className="h-[440px]"><PlantMapCanvas /></div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line px-4 py-3 text-[11px]">
            {splitKeys.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 text-t2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COMMODITY_MAP_COLOR[c] }} />
                {COMMODITY_META[c].label}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Rake Board" sub="Click a rake for full lifecycle"
          right={<Link href="/lifecycle" className="text-[12px] text-brand hover:underline">Lifecycle</Link>}
          bodyClass="px-2 py-1">
          <RakeBoard limit={8} compact />
        </Panel>
      </section>

      {/* Secondary — watchlist */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Free-time watchlist" sub="Approaching or past IR free time"
          right={<Link href="/demurrage" className="text-[12px] text-brand hover:underline">Console</Link>}>
          <div className="space-y-2.5">
            {[...inPlant].sort((a, b) => countdown(nowMs, a.freeUntilIso).mins - countdown(nowMs, b.freeUntilIso).mins).slice(0, 4).map((r) => {
              const cd = countdown(nowMs, r.freeUntilIso);
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="mono text-[12.5px] text-t1">{r.id}</div>
                    <div className="text-[10.5px] text-t3 truncate">{COMMODITY_META[r.commodity].short} · {r.headingLabel}</div>
                  </div>
                  <Badge tone={cd.breached ? "critical" : cd.mins < 60 ? "warning" : "good"}>{cd.text}</Badge>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Operational alerts" sub="Routed to the responsible role"
          right={<Link href="/alerts" className="text-[12px] text-brand hover:underline">All</Link>}>
          <div className="space-y-2.5">
            {alerts.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.severity === "critical" ? "bg-red" : a.severity === "warning" ? "bg-amber" : "bg-sky"}`} />
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] text-t2">{a.title}</div>
                  <div className="text-[10.5px] text-t3">{fmtTime(a.tsIso)} · → {a.role}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Commodity mix in plant" sub={`${inPlant.length} rakes · ${inPlant.reduce((s, r) => s + r.wagonCount, 0)} wagons tracked`}>
          <div className="space-y-3 pt-0.5">
            {splitKeys.map((c) => {
              const pct = (split[c] / inPlant.length) * 100;
              return (
                <div key={c}>
                  <div className="mb-1 flex items-center justify-between text-[11.5px]">
                    <span className="text-t2">{COMMODITY_META[c].label}</span>
                    <span className="mono text-t3">{split[c]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COMMODITY_MAP_COLOR[c] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </section>
    </div>
  );
}
