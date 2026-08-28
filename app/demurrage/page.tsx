"use client";
import { useStore } from "@/lib/store";
import { Panel, Stat, Badge, Dot, PageHeader } from "@/components/ui";
import { fmtTime, fmtInr, fmtHrs, countdown } from "@/lib/format";
import { COMMODITY_META, COMMODITY_MAP_COLOR } from "@/lib/commodities";
import type { Commodity } from "@/lib/types";
import { Timer } from "lucide-react";

export default function DemurrageConsole() {
  const { rakes, nowMs, setSelectedRakeId } = useStore();

  const inPlant = rakes.filter((r) => r.stage !== "en-route");
  const breached = inPlant.filter((r) => countdown(nowMs, r.freeUntilIso).breached);
  const atRisk = inPlant.filter((r) => {
    const cd = countdown(nowMs, r.freeUntilIso);
    return cd.mins < 60 && cd.mins >= -60;
  });

  // Calculate live demurrage exposure (₹150/wagon/hr)
  const demurrageExposure = breached.reduce((sum, r) => {
    const cd = countdown(nowMs, r.freeUntilIso);
    const hrsOver = Math.abs(cd.mins) / 60;
    const rake_demurrage = hrsOver * r.wagonCount * 150;
    return sum + rake_demurrage;
  }, 0);

  const avgDetention = inPlant.length > 0
    ? inPlant.reduce((sum, r) => sum + r.detentionHrs, 0) / inPlant.length
    : 0;

  // Sort by countdown ascending (most urgent first)
  const sortedRakes = [...inPlant].sort(
    (a, b) => countdown(nowMs, a.freeUntilIso).mins - countdown(nowMs, b.freeUntilIso).mins
  );

  // Group by commodity for exposure chart
  const commodityDemurrage = breached.reduce<Record<Commodity, number>>((m, r) => {
    const cd = countdown(nowMs, r.freeUntilIso);
    const hrsOver = Math.abs(cd.mins) / 60;
    const rake_demurrage = hrsOver * r.wagonCount * 150;
    m[r.commodity] = (m[r.commodity] || 0) + rake_demurrage;
    return m;
  }, {} as Record<Commodity, number>);

  const totalCommodityDemurrage = Object.values(commodityDemurrage).reduce((sum, v) => sum + v, 0);

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Dwell & Demurrage Console"
        sub="Free-time countdown and live cost exposure per rake"
        icon={<Timer size={20} />}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Rakes past free time"
          value={String(breached.length)}
          sub={breached.length ? "demurrage running" : "none"}
          tone={breached.length ? "bad" : "good"}
        />
        <Stat
          label="Live demurrage exposure"
          value={fmtInr(demurrageExposure)}
          sub="est. this shift"
          tone={demurrageExposure > 0 ? "bad" : "good"}
        />
        <Stat
          label="Rakes at risk (<60 min)"
          value={String(atRisk.length)}
          sub="approaching breach"
          tone={atRisk.length ? "bad" : "good"}
        />
        <Stat
          label="Avg detention"
          value={fmtHrs(avgDetention)}
          sub="in-plant rakes"
          tone="neutral"
        />
      </div>

      {/* Free-time Countdown Table */}
      <Panel
        title="Free-time countdown"
        sub="All in-plant rakes sorted by urgency — IR free time expires per wagon per hour"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-panel-line">
                <th className="text-left py-2 px-3 font-semibold text-muted">Rake</th>
                <th className="text-left py-2 px-3 font-semibold text-muted">Commodity</th>
                <th className="text-left py-2 px-3 font-semibold text-muted">Location</th>
                <th className="text-left py-2 px-3 font-semibold text-muted">Arrived</th>
                <th className="text-left py-2 px-3 font-semibold text-muted">Free until</th>
                <th className="text-left py-2 px-3 font-semibold text-muted">Countdown</th>
                <th className="text-right py-2 px-3 font-semibold text-muted">Detention</th>
                <th className="text-right py-2 px-3 font-semibold text-muted">Est. demurrage</th>
              </tr>
            </thead>
            <tbody>
              {sortedRakes.map((r) => {
                const cd = countdown(nowMs, r.freeUntilIso);
                const hrsOver = Math.abs(cd.mins) / 60;
                const rakeDemurrage = cd.breached ? hrsOver * r.wagonCount * 150 : 0;

                return (
                  <tr
                    key={r.id}
                    className={`border-b border-panel-line transition-colors ${
                      cd.breached
                        ? "bg-accent-red/5 border-l-2 border-l-accent-red hover:bg-accent-red/10"
                        : "hover:bg-surface-3"
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setSelectedRakeId(r.id)}
                        className="mono font-semibold text-brand hover:underline"
                      >
                        {r.id}
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Dot color={COMMODITY_MAP_COLOR[r.commodity]} />
                        <span>{COMMODITY_META[r.commodity].short}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-t2">{r.headingLabel}</td>
                    <td className="py-2.5 px-3 text-t3">{fmtTime(r.arrivalIso)}</td>
                    <td className="py-2.5 px-3 text-t3">{fmtTime(r.freeUntilIso)}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        tone={
                          cd.breached
                            ? "critical"
                            : cd.mins < 60
                            ? "warning"
                            : "neutral"
                        }
                        className={`text-[10px] py-0.5 px-1.5 ${
                          cd.breached || cd.mins < 60 ? "font-semibold" : ""
                        }`}
                      >
                        {cd.text}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right text-t2 mono">
                      {fmtHrs(r.detentionHrs)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      {rakeDemurrage > 0 ? (
                        <span className="text-accent-red">{fmtInr(rakeDemurrage)}</span>
                      ) : (
                        <span className="text-t3">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Two-column bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Demurrage Logic Explanation */}
        <Panel title="How demurrage works" sub="The demurrage clock and cost model">
          <div className="space-y-3 text-[11.5px] leading-relaxed">
            <div>
              <div className="font-semibold text-t1 mb-1">Free time</div>
              <p className="text-muted">
                Indian Railways grants free time per wagon per commodity type. At SAIL DSP, coking coal &
                iron ore typically get 48–72 hours from placement weighbridge timestamp.
              </p>
            </div>
            <div>
              <div className="font-semibold text-t1 mb-1">Automatic clock start</div>
              <p className="text-muted">
                This platform fuses RFID AEI gantry scans, weighbridge gross/tare, and OCR wagon numbers
                to capture the precise placement moment — eliminating the "bill arrives before anyone saw
                the clock started" problem.
              </p>
            </div>
            <div>
              <div className="font-semibold text-t1 mb-1">Cost per breach</div>
              <p className="text-muted">
                Beyond free time: ₹150 per wagon per hour (subject to actual IR tariff). Coking coal rakes
                often run 30–40 wagons, so a 24-hour breach costs ₹108–144 lakhs.
              </p>
            </div>
            <div>
              <div className="font-semibold text-t1 mb-1">Mitigation</div>
              <p className="text-muted">
                Real-time alerts at T−60 min and T−0 trigger tippler scheduling, yard reorganization, and
                IR liaison — turning reactive "bill shock" into proactive cost control.
              </p>
            </div>
          </div>
        </Panel>

        {/* RIGHT: Exposure by Commodity */}
        <Panel title="Exposure by commodity" sub="Estimated demurrage of breached rakes">
          {Object.keys(commodityDemurrage).length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {(Object.keys(commodityDemurrage) as Commodity[]).map((c) => {
                const value = commodityDemurrage[c];
                const pct = totalCommodityDemurrage > 0 ? (value / totalCommodityDemurrage) * 100 : 0;
                return (
                  <div key={c}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-t2">{COMMODITY_META[c].label}</span>
                      <span className="font-semibold text-t1">{fmtInr(value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: COMMODITY_MAP_COLOR[c] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[11.5px] text-muted py-6 text-center">
              No breached rakes. Free-time buffer healthy.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
