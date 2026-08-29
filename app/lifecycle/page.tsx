"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Panel, Badge, Dot, PageHeader } from "@/components/ui";
import { fmtTime, fmtHrs } from "@/lib/format";
import { COMMODITY_META, COMMODITY_MAP_COLOR } from "@/lib/commodities";
import type { LifecycleStage } from "@/lib/types";
import { Route } from "lucide-react";

const LIFECYCLE_STAGES: LifecycleStage[] = [
  "en-route",
  "interchange",
  "accepted",
  "placement",
  "unloading",
  "loading",
  "formation",
  "handover",
];

function StageLabel(stage: LifecycleStage): string {
  const labels: Record<LifecycleStage, string> = {
    "en-route": "En-route",
    "interchange": "Interchange",
    "accepted": "Accepted",
    "placement": "Placement",
    "unloading": "Unload",
    "loading": "Load",
    "formation": "Formation",
    "handover": "Handover",
  };
  return labels[stage];
}

function StageTone(stage: LifecycleStage): "critical" | "warning" | "info" | "good" | "neutral" {
  if (stage === "handover") return "good";
  if (stage === "en-route" || stage === "interchange") return "info";
  return "neutral";
}

export default function LifecycleTracker() {
  const { rakes, setSelectedRakeId } = useStore();
  const [localSelectedId, setLocalSelectedId] = useState<string>(rakes[0]?.id || "");

  const selectedRake = rakes.find((r) => r.id === localSelectedId);

  // Count rakes at each stage
  const stageCounts = LIFECYCLE_STAGES.reduce<Record<LifecycleStage, number>>((m, s) => {
    m[s] = rakes.filter((r) => r.stage === s).length;
    return m;
  }, {} as Record<LifecycleStage, number>);

  const handleSelectRake = (id: string) => {
    setLocalSelectedId(id);
    setSelectedRakeId(id);
  };

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Rake Lifecycle Tracker"
        sub="Every stage timestamped automatically — IR interchange to return handover"
        icon={<Route size={20} />}
      />

      {/* Lifecycle Funnel Strip */}
      <div className="card p-4 space-y-2">
        <div className="text-[11px] text-muted font-semibold uppercase tracking-wide">Lifecycle Stages</div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {LIFECYCLE_STAGES.map((stage) => {
            const count = stageCounts[stage];
            const hasRakes = count > 0;
            return (
              <div
                key={stage}
                className={`flex-shrink-0 px-3 py-2 rounded-lg border ${
                  hasRakes
                    ? "bg-surface-2 border-panel-line"
                    : "bg-app border-line"
                }`}
              >
                <div className="text-[10.5px] font-medium text-t2">
                  {StageLabel(stage)}
                </div>
                <div className={`text-[13px] font-semibold mono ${hasRakes ? "text-brand" : "text-t3"}`}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column layout: Rake list (left) + Timeline (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* LEFT: Rake List */}
        <Panel title="In-Plant Rakes" sub="Click to view full lifecycle">
          <div className="space-y-1.5">
            {rakes
              .filter((r) => r.stage !== "en-route")
              .map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectRake(r.id)}
                  className={`cursor-pointer p-3 rounded-lg border transition-colors ${
                    localSelectedId === r.id
                      ? "bg-brand/10 border-brand"
                      : "border-panel-line bg-panel hover:bg-surface-3"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mono text-[12.5px] font-semibold text-t1">{r.id}</div>
                      <div className="flex items-center gap-1.5 text-[10.5px] text-muted mt-1">
                        <Dot color={COMMODITY_MAP_COLOR[r.commodity]} />
                        <span>{COMMODITY_META[r.commodity].short}</span>
                        <span className="text-t3">·</span>
                        <span>{r.origin}</span>
                      </div>
                    </div>
                    <Badge tone={StageTone(r.stage)} className="flex-shrink-0">
                      {StageLabel(r.stage)}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </Panel>

        {/* RIGHT: Timeline + Details */}
        <div className="xl:col-span-2 space-y-4">
          {selectedRake && (
            <>
              {/* Header Card with Key Facts */}
              <div className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mono text-[13px] font-semibold text-t1">{selectedRake.id}</div>
                    <div className="text-[10.5px] text-muted mt-0.5">
                      {COMMODITY_META[selectedRake.commodity].label} from {selectedRake.origin}
                    </div>
                  </div>
                  <Badge tone={StageTone(selectedRake.stage)}>
                    {StageLabel(selectedRake.stage)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <div className="text-muted mb-0.5">Loco</div>
                    <div className="mono text-t1 font-semibold">{selectedRake.loco}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5">Wagons</div>
                    <div className="mono text-t1 font-semibold">{selectedRake.wagonCount}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5">Loaded T</div>
                    <div className="mono text-t1 font-semibold">{selectedRake.loadedT}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5" title="Hours held so far since arrival — still running until the rake is released.">Detention (so far)</div>
                    <div className="mono text-t1 font-semibold">
                      {fmtHrs(selectedRake.detentionHrs)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5" title="TAT = full placement-to-handover cycle time. Only known once the rake completes its cycle.">TAT (Turnaround)</div>
                    <div className="mono text-t1 font-semibold">
                      {selectedRake.turnaroundHrs ? fmtHrs(selectedRake.turnaroundHrs) : <span className="text-t3 font-normal">in progress</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5">Arrival</div>
                    <div className="mono text-t1 font-semibold">{fmtTime(selectedRake.arrivalIso)}</div>
                  </div>
                </div>
              </div>

              {/* Vertical Timeline */}
              <Panel title="Event Timeline" sub="Timestamped milestones via sensor fusion">
                <div className="space-y-4 relative">
                  {/* Vertical line — sits behind the (opaque) node circles so it never crosses them */}
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-line z-0" />

                  {selectedRake.lifecycle.map((event, idx) => {
                    const isActive = event.stage === selectedRake.stage;
                    const isDone = event.done;
                    const isPending = !isDone && !isActive;

                    const borderColor = isDone ? "border-accent-grn" : isActive ? "border-brand" : "border-line";
                    const dotColor = isDone ? "bg-accent-grn" : isActive ? "bg-brand" : "bg-t3";

                    return (
                      <div key={idx} className="relative pl-14 flex gap-3">
                        {/* Dot indicator — opaque surface fill fully occludes the line behind it */}
                        <div className={`absolute left-0 z-10 w-10 h-10 rounded-full border-2 ${borderColor} bg-surface flex items-center justify-center`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        </div>

                        {/* Event content */}
                        <div className="pt-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-[12px] font-semibold text-t1">{event.label}</div>
                              <div className="text-[10.5px] text-muted mt-0.5">
                                {event.location}
                              </div>
                            </div>
                            {isActive && (
                              <div className="text-[10px] font-semibold text-brand whitespace-nowrap">NOW</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge tone="neutral" className="text-[9px] py-0.5 px-1.5">
                              {event.source}
                            </Badge>
                            <span className="text-[10.5px] text-t3 mono">{fmtTime(event.tsIso)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
