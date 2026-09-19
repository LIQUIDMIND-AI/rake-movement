"use client";
import { useState } from "react";
import { Panel, Badge, Stat } from "./ui";
import { fmtInr } from "@/lib/format";
import { buildHsnDriftCase, CIMS_WATCH_VESSEL } from "@/lib/seed";
import { Sparkles, Loader2 } from "lucide-react";

export function HsnDriftCheck() {
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const c = buildHsnDriftCase();

  async function run() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 650));
    setLoading(false);
    setRevealed(true);
  }

  return (
    <Panel
      title="Case study — HSN classification drift"
      sub="A real, litigated dispute pattern for imported coal"
      bodyClass="p-4 space-y-3"
    >
      {!revealed && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p className="text-[11.5px] text-muted">
            {c.vesselName}&apos;s coal cargo gets re-tested and reclassified at the destination port — see how
            TradeGuard, TariffIQ and Patram each handle a piece of it.
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
        <div className="text-[11.5px] text-muted flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" /> Cross-referencing invoice against Bill of Entry…
        </div>
      )}

      {revealed && (
        <div className="space-y-3">
          {/* TradeGuard: the drift itself */}
          <div className="flex items-center gap-2">
            <Badge tone="critical">HSN drift detected</Badge>
            <span className="text-[10.5px] text-t3">TradeGuard · cross-doc check</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="rounded-md border border-panel-line bg-surface-2 p-2.5">
              <div className="text-[10px] uppercase tracking-wide text-t3 mb-1">Supplier invoice · load port</div>
              <div className="text-[12px] font-semibold text-t1 mono">{c.supplierHsn} <span className="font-normal text-t2">— {c.supplierDesc}</span></div>
              <div className="text-[10.5px] text-muted mt-0.5">{c.supplierBasis}</div>
            </div>
            <div className="rounded-md border border-accent-red/30 bg-accent-red/[0.05] p-2.5">
              <div className="text-[10px] uppercase tracking-wide text-t3 mb-1">Bill of Entry · destination</div>
              <div className="text-[12px] font-semibold text-t1 mono">{c.boeHsn} <span className="font-normal text-t2">— {c.boeDesc}</span></div>
              <div className="text-[10.5px] text-muted mt-0.5">{c.boeBasis}</div>
            </div>
          </div>

          {/* TariffIQ + TradeGuard's CIMS catch, as scannable stats */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <Stat label="Duty impact — TariffIQ" value={fmtInr(c.dutyDeltaInr)} tone="bad" sub={`resolves to ${c.correctHsn}`} />
            <Stat label="CIMS window — TradeGuard" value={`${CIMS_WATCH_VESSEL.registeredDaysAgo}d pre-arrival`} tone="good" sub="inside 15–60 day rule" />
            <Stat label="Precedent" value="CESTAT / SC" sub="coal classification line" />
          </div>

          <p className="text-[11px] text-t2 leading-relaxed border-t border-panel-line pt-2.5">
            <span className="font-medium text-t1">Recommended:</span> Section 149 Bill-of-Entry amendment + provisional
            duty bond — releases cargo without demurrage while the classification dispute is argued.
          </p>
        </div>
      )}
    </Panel>
  );
}
