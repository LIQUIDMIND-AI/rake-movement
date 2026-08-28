"use client";

import { useStore } from "@/lib/store";
import { Panel, Stat, Badge, PageHeader } from "@/components/ui";
import { InboundMapCanvas } from "@/components/Maps";
import { Integrations } from "@/components/Integrations";
import { fmtDateTime } from "@/lib/format";
import { COMMODITY_META, COMMODITY_MAP_COLOR } from "@/lib/commodities";
import type { Commodity } from "@/lib/types";
import { Ship, Anchor, Droplets, Flame, Zap, Train } from "lucide-react";

export default function InboundPage() {
  const { inbound, vessels } = useStore();
  const atSeaT = vessels.reduce((s, v) => s + v.cargoT, 0);

  // Calculate stats
  const nextEta = inbound.length > 0
    ? new Date(
        Math.min(
          ...inbound
            .filter((r) => r.progress < 1)
            .map((r) => new Date(r.etaIso).getTime())
        )
      ).toISOString()
    : "";
  const avgDistance = inbound.length > 0 ? Math.round(inbound.reduce((sum, r) => sum + r.distanceKm, 0) / inbound.length) : 0;

  // Sort by ETA ascending
  const manifestRakes = [...inbound].sort((a, b) => new Date(a.etaIso).getTime() - new Date(b.etaIso).getTime());

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Inbound Tracking — Sea & Rail Leg"
        sub="End-to-end visibility from load port to DSP interchange · vessels via Sagar Setu (NLP-Marine) / PCS1x / AIS, rakes via FOIS — all through ULIP"
        icon={<Ship size={20} />}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Vessels at sea" value={String(vessels.filter((v) => v.status === "at-sea").length)} sub={`${(atSeaT / 1000).toFixed(0)}k t coking coal afloat`} />
        <Stat label="Inbound rakes" value={String(inbound.filter((r) => r.progress < 1).length)} sub="on IR network to DSP" />
        <Stat label="Next ETA rake" value={nextEta ? fmtDateTime(nextEta).split(",")[1].trim() : "—"} sub={nextEta ? fmtDateTime(nextEta).split(",")[0] : "no ETA"} />
        <Stat label="Avg rake distance" value={`${avgDistance} km`} sub="origin to DSP" />
      </div>

      {/* Two-column layout: map + manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Map */}
        <div className="lg:col-span-1">
          <Panel title="En-route to DSP" sub="▲ vessels (AIS) at sea · ● rakes on IR network" bodyClass="p-0">
            <div className="h-[460px]">
              <InboundMapCanvas />
            </div>
          </Panel>
        </div>

        {/* RIGHT: Manifest table */}
        <div className="lg:col-span-2">
          <Panel title="Inbound manifest" sub="Sorted by ETA ascending">
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="border-b border-panel-line text-muted">
                    <th className="text-left px-3 py-2 font-medium">Rake</th>
                    <th className="text-left px-3 py-2 font-medium">Ex (Origin + Vessel)</th>
                    <th className="text-left px-3 py-2 font-medium">Commodity</th>
                    <th className="text-right px-3 py-2 font-medium">Distance</th>
                    <th className="text-left px-3 py-2 font-medium">ETA</th>
                    <th className="text-left px-3 py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {manifestRakes.map((r) => {
                    const sourceColor =
                      r.source === "FOIS"
                        ? "info"
                        : r.source === "ULIP"
                          ? "warning"
                          : ("neutral" as const);
                    return (
                      <tr key={r.id} className="border-b border-panel-line hover:bg-panel transition-colors">
                        <td className="px-3 py-2 mono text-t1">{r.id}</td>
                        <td className="px-3 py-2 text-t2">
                          {r.origin}
                          {r.vessel ? <div className="text-[10px] text-muted">{r.vessel}</div> : null}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COMMODITY_MAP_COLOR[r.commodity as Commodity] }} />
                            <span className="text-t2">{COMMODITY_META[r.commodity as Commodity].short}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 mono text-right text-t2">{r.distanceKm} km</td>
                        <td className="px-3 py-2 text-t2">{fmtDateTime(r.etaIso)}</td>
                        <td className="px-3 py-2">
                          <Badge tone={sourceColor}>{r.source}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Progress bar under table */}
            {manifestRakes.length > 0 && (
              <div className="mt-4 border-t border-panel-line pt-3 space-y-2">
                {manifestRakes.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <span className="text-[11px] mono text-muted w-12">{r.id}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${r.progress * 100}%`,
                          background: COMMODITY_MAP_COLOR[r.commodity as Commodity],
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted w-8 text-right">{Math.round(r.progress * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Sea leg — vessel manifest */}
      <Panel title="Sea leg — coking coal vessels" sub="AIS positions surfaced via Sagar Setu (NLP-Marine) / PCS1x / ULIP before rail-out">
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="border-b border-panel-line text-muted">
                <th className="text-left px-3 py-2 font-medium">Vessel</th>
                <th className="text-left px-3 py-2 font-medium">Load port → discharge</th>
                <th className="text-left px-3 py-2 font-medium">Grade</th>
                <th className="text-right px-3 py-2 font-medium">Cargo</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">ETA port</th>
                <th className="text-left px-3 py-2 font-medium">Rake plan</th>
                <th className="text-left px-3 py-2 font-medium">Feed</th>
              </tr>
            </thead>
            <tbody>
              {[...vessels].sort((a, b) => new Date(a.etaPortIso).getTime() - new Date(b.etaPortIso).getTime()).map((v) => (
                <tr key={v.id} className="border-b border-panel-line hover:bg-panel transition-colors">
                  <td className="px-3 py-2">
                    <div className="text-t1">{v.name}</div>
                    <div className="text-[10px] text-muted mono">IMO {v.imo}</div>
                  </td>
                  <td className="px-3 py-2 text-t2">
                    {v.loadPort}
                    <span className="text-muted"> → </span>
                    <span className="text-t1">{v.destPort}</span>
                  </td>
                  <td className="px-3 py-2 text-t2">{v.grade}</td>
                  <td className="px-3 py-2 mono text-right text-t2">{(v.cargoT / 1000).toFixed(0)}k t</td>
                  <td className="px-3 py-2">
                    <Badge tone={v.status === "at-sea" ? "info" : v.status === "anchorage" ? "warning" : "good"}>
                      <Anchor size={10} /> {v.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-t2">{fmtDateTime(v.etaPortIso)}</td>
                  <td className="px-3 py-2 text-muted">{v.linkedRakePlan}</td>
                  <td className="px-3 py-2"><Badge tone="neutral">{v.source}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Rail-out from the port berth is planned against blast-furnace coke demand — so the plant sees each shipment as
          prospective rakes days before the first BOXN reaches the interchange, closing the port-to-plant blind spot.
        </p>
      </Panel>

      {/* Port to Plant Flow Stepper */}
      <Panel title="Load port → blast furnace flow" sub="One continuous chain: sea leg + rail leg + in-plant movement">
        <div className="overflow-x-auto py-2">
          <div className="flex items-center gap-1.5 min-w-max px-4">
            {/* Vessel / sea leg */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-panel border border-accent/30">
                <Ship size={20} className="text-accent" />
              </div>
              <div className="text-[10.5px] text-center max-w-[80px]">
                <span className="text-t1 font-medium block">Vessel · Sea leg</span>
                <span className="text-muted text-[9px]">AIS · Sagar Setu</span>
              </div>
            </div>

            <div className="flex-shrink-0 text-muted">→</div>

            {/* Port */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-panel border border-panel-line">
                <Anchor size={20} className="text-accent" />
              </div>
              <div className="text-[10.5px] text-center max-w-[80px]">
                <span className="text-t1 font-medium block">Haldia/Paradip/Vizag</span>
                <span className="text-muted text-[9px]">Discharge · PCS1x</span>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="flex-shrink-0 text-muted">→</div>

            {/* IR Rail Haul */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-panel border border-panel-line">
                <Train size={20} className="text-accent-teal" />
              </div>
              <div className="text-[10.5px] text-center max-w-[80px]">
                <span className="text-t1 font-medium block">IR Rail</span>
                <span className="text-muted text-[9px]">FOIS · Howrah–Delhi</span>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="flex-shrink-0 text-muted">→</div>

            {/* DSP Interchange */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-panel border border-panel-line">
                <Droplets size={20} className="text-accent-amber" />
              </div>
              <div className="text-[10.5px] text-center max-w-[80px]">
                <span className="text-t1 font-medium block">Interchange</span>
                <span className="text-muted text-[9px]">DSP Gate Yard</span>
              </div>
            </div>

            {/* Arrow 3 */}
            <div className="flex-shrink-0 text-muted">→</div>

            {/* Wagon Tippler */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-panel border border-panel-line">
                <Droplets size={20} className="text-accent-grn" />
              </div>
              <div className="text-[10.5px] text-center max-w-[80px]">
                <span className="text-t1 font-medium block">Tipplers</span>
                <span className="text-muted text-[9px]">T-1 / T-2 Unload</span>
              </div>
            </div>

            {/* Arrow 4 */}
            <div className="flex-shrink-0 text-muted">→</div>

            {/* Coke Ovens */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-panel border border-panel-line">
                <Flame size={20} className="text-accent-red" />
              </div>
              <div className="text-[10.5px] text-center max-w-[80px]">
                <span className="text-t1 font-medium block">Coke Oven</span>
                <span className="text-muted text-[9px]">Carbonization</span>
              </div>
            </div>

            {/* Arrow 5 */}
            <div className="flex-shrink-0 text-muted">→</div>

            {/* Blast Furnace */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-panel border border-panel-line">
                <Zap size={20} className="text-accent-violet" />
              </div>
              <div className="text-[10.5px] text-center max-w-[80px]">
                <span className="text-t1 font-medium block">Blast Furnace</span>
                <span className="text-muted text-[9px]">Iron Production</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Integrations */}
      <Integrations sub="Sea leg (Sagar Setu / PCS1x / AIS) + rail leg (FOIS) + ERP (SAP / Zoho) — unified through ULIP, consent-based" />
    </div>
  );
}
