"use client";
import { useState } from "react";
import { Panel, Badge, Stat } from "./ui";
import { fmtInr } from "@/lib/format";
import { buildHsnDriftCase, CIMS_WATCH_VESSEL, BIS_NOC_CHECKLIST } from "@/lib/seed";
import { Sparkles, Loader2, ShieldCheck, Calculator, AlertTriangle, CheckCircle2, ScrollText } from "lucide-react";

export function HsnDriftCheck() {
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  async function run() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 650));
    setLoading(false);
    setRevealed(true);
  }

  const c = buildHsnDriftCase();

  return (
    <Panel
      title="HSN Drift Detected — TradeGuard, TariffIQ & Patram on one case"
      sub="A recurring coal-import dispute pattern — the same cargo, classified two different ways by two different documents"
      bodyClass="p-4 space-y-4"
    >
      {!revealed && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p className="text-[11.5px] leading-relaxed text-muted max-w-2xl">
            Coal cargo is routinely re-tested at the discharge port and can reclassify between HSN codes —
            a pattern with real litigated precedent (<span className="text-t2 font-medium">{c.precedent}</span>).
            Run the check to see how the three products divide the work on {c.vesselName}&apos;s {c.commodity}.
          </p>
          <button
            onClick={run}
            disabled={loading}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-brand text-t1 rounded-lg text-[12.5px] font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Run TradeGuard check
          </button>
        </div>
      )}

      {loading && (
        <div className="text-[11.5px] text-muted flex items-center gap-2 py-1">
          <Loader2 size={12} className="animate-spin" /> Cross-referencing supplier invoice against Bill of Entry…
        </div>
      )}

      {revealed && (
        <div className="space-y-3">
          {/* Step 1 — TradeGuard */}
          <div className="rounded-lg border border-panel-line bg-panel p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent-teal/15 text-accent-teal">
                <ShieldCheck size={13} />
              </span>
              <div className="text-[12.5px] font-semibold text-t1">TradeGuard — drift detected</div>
              <Badge tone="critical" className="ml-auto">HSN drift</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="rounded-md border border-panel-line bg-surface-2 p-2.5">
                <div className="text-[10px] uppercase tracking-wide text-t3 mb-1">Supplier invoice · load port</div>
                <div className="text-[12px] font-semibold text-t1 mono">{c.supplierHsn}</div>
                <div className="text-[11.5px] text-t2">{c.supplierDesc}</div>
                <div className="text-[10.5px] text-muted mt-1">{c.supplierBasis}</div>
              </div>
              <div className="rounded-md border border-accent-red/30 bg-accent-red/[0.05] p-2.5">
                <div className="text-[10px] uppercase tracking-wide text-t3 mb-1">Bill of Entry · destination</div>
                <div className="text-[12px] font-semibold text-t1 mono">{c.boeHsn}</div>
                <div className="text-[11.5px] text-t2">{c.boeDesc}</div>
                <div className="text-[10.5px] text-muted mt-1">{c.boeBasis}</div>
              </div>
            </div>
            <p className="text-[10.5px] text-t3 mt-2">
              Precedent: {c.precedent}
            </p>
          </div>

          {/* Step 2 — TariffIQ */}
          <div className="rounded-lg border border-panel-line bg-panel p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent-teal/15 text-accent-teal">
                <Calculator size={13} />
              </span>
              <div className="text-[12.5px] font-semibold text-t1">TariffIQ — correct classification &amp; duty impact</div>
            </div>
            <p className="text-[11.5px] leading-relaxed text-muted mb-2.5">
              TariffIQ resolves the dispute in favour of the lab-tested classification — {c.correctHsn} ({c.boeDesc}) —
              since that&apos;s what customs will enforce, and calculates the actual cost of the drift instead of
              leaving it as an open question.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Stat label="Duty impact (BCD/IGST/Cess)" value={fmtInr(c.dutyDeltaInr)} tone="bad" sub="vs. supplier's declared code" />
              <Stat label="Resolved classification" value={c.correctHsn} sub={c.boeDesc} />
            </div>
            <p className="text-[10.5px] text-t3 mt-2">{c.rodtepNote}</p>
          </div>

          {/* Step 3 — recommended action */}
          <div className="flex items-start gap-2 rounded-lg border border-accent-amber/25 bg-accent-amber/[0.06] px-3.5 py-2.5">
            <ScrollText size={14} className="text-accent-amber shrink-0 mt-0.5" />
            <p className="text-[11px] text-t2 leading-relaxed">
              <span className="font-medium text-t1">Recommended action:</span> {c.recommendedAction}
            </p>
          </div>

          {/* Side callouts — CIMS (TradeGuard) + BIS/NOC (Patram) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="rounded-lg border border-panel-line bg-panel p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-accent-grn" />
                <div className="text-[12px] font-semibold text-t1">TradeGuard — CIMS registration window</div>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                {CIMS_WATCH_VESSEL.name} registered on the Coal Import Monitoring System{" "}
                <span className="text-t2 font-medium">{CIMS_WATCH_VESSEL.registeredDaysAgo} days ago</span> — inside
                the {CIMS_WATCH_VESSEL.windowMinDays}–{CIMS_WATCH_VESSEL.windowMaxDays} day pre-arrival window, with
                the vessel now just {CIMS_WATCH_VESSEL.etaHrs}h from berth. Missing this window risks
                $15k–30k/day port demurrage — TradeGuard scheduled it automatically from the shipping instructions.
              </p>
            </div>
            <div className="rounded-lg border border-panel-line bg-panel p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-accent-amber" />
                <div className="text-[12px] font-semibold text-t1">Patram AI — BIS/NOC watch</div>
              </div>
              <div className="space-y-1.5">
                {BIS_NOC_CHECKLIST.map((item) => (
                  <div key={item.label} className="flex items-start gap-2 text-[11px]">
                    <Badge tone={item.status === "ok" ? "good" : "warning"} className="mt-0.5 shrink-0">
                      {item.status === "ok" ? "OK" : "Flagged"}
                    </Badge>
                    <div>
                      <div className="text-t2">{item.label}</div>
                      <div className="text-[10.5px] text-t3">{item.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
