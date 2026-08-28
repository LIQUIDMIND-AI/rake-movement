"use client";
import { useStore } from "@/lib/store";
import { COMMODITY_META, COMMODITY_MAP_COLOR } from "@/lib/commodities";
import { countdown } from "@/lib/format";
import { Badge, Dot } from "./ui";

const statusTone: Record<string, "good" | "bad" | "neutral" | "warning" | "info"> = {
  moving: "info", unloading: "good", loading: "good", idle: "neutral", halted: "warning", detained: "bad",
};

export function RakeBoard({ limit, compact = false }: { limit?: number; compact?: boolean }) {
  const { rakes, nowMs, setSelectedRakeId, selectedRakeId } = useStore();
  const rows = rakes.filter((r) => r.stage !== "en-route");
  const shown = limit ? rows.slice(0, limit) : rows;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-wide text-t3 border-b border-panel-line">
            <th className="py-2 pl-1 font-medium">Rake</th>
            <th className="py-2 font-medium">Commodity</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Location / Heading</th>
            {!compact && <th className="py-2 font-medium">Wagons</th>}
            <th className="py-2 font-medium">Free time</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => {
            const cd = countdown(nowMs, r.freeUntilIso);
            const meta = COMMODITY_META[r.commodity];
            return (
              <tr key={r.id}
                onClick={() => setSelectedRakeId(r.id)}
                className={`cursor-pointer border-b border-panel-line/60 hover:bg-surface-3 ${selectedRakeId === r.id ? "bg-brand/5" : ""}`}>
                <td className="py-2 pl-1"><span className="mono font-medium text-t1">{r.id}</span></td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Dot color={COMMODITY_MAP_COLOR[r.commodity]} />
                    <span className="text-t2">{meta.short}</span>
                  </span>
                </td>
                <td className="py-2">
                  <Badge tone={statusTone[r.status] === "info" ? "info" : statusTone[r.status] === "good" ? "good" : statusTone[r.status] === "bad" ? "critical" : statusTone[r.status] === "warning" ? "warning" : "neutral"}>
                    {r.status === "moving" && <span className="live-dot">●</span>} {r.status}
                  </Badge>
                </td>
                <td className="py-2 text-t2">{r.headingLabel}</td>
                {!compact && <td className="py-2 mono text-t2">{r.wagonCount}</td>}
                <td className="py-2">
                  <span className={`mono ${cd.breached ? "text-accent-red" : cd.mins < 60 ? "text-accent-amber" : "text-t2"}`}>
                    {cd.text}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
