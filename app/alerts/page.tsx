"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Panel, Stat, Badge, PageHeader } from "@/components/ui";
import { PlantMapCanvas } from "@/components/Maps";
import { fmtTime, fmtDateTime } from "@/lib/format";
import type { Alert, AlertSeverity } from "@/lib/types";
import { ShieldAlert, Camera, Check } from "lucide-react";

export default function AlertsPage() {
  const { alerts, intrusions } = useStore();
  const [selectedTab, setSelectedTab] = useState<"alerts" | "intrusion">("alerts");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");

  // Calculate stats
  const openCritical = alerts.filter((a) => a.severity === "critical" && !a.ack).length;
  const openWarnings = alerts.filter((a) => a.severity === "warning" && !a.ack).length;
  const intrusionEventsCount = intrusions.length;
  const activeIntrusions = intrusions.filter((i) => !i.cleared).length;

  // Filter alerts by severity
  const filteredAlerts = severityFilter === "all"
    ? alerts
    : alerts.filter((a) => a.severity === severityFilter);

  // Sort: unacked critical first, then unacked, then acked
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (a.ack !== b.ack) return a.ack ? 1 : -1;
    if (a.severity !== b.severity) {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    }
    return 0;
  });

  // Sort intrusions: active first
  const sortedIntrusions = [...intrusions].sort((a, b) => {
    if (a.cleared !== b.cleared) return a.cleared ? 1 : -1;
    return 0;
  });

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Alerts & Track Intrusion"
        sub="Operational alerts routed to the responsible role · AI intrusion detection in high-hazard zones near the tracks"
        icon={<ShieldAlert size={20} />}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Open critical alerts"
          value={String(openCritical)}
          tone={openCritical > 0 ? "bad" : "good"}
        />
        <Stat
          label="Warnings open"
          value={String(openWarnings)}
          tone={openWarnings > 0 ? "bad" : "neutral"}
        />
        <Stat
          label="Intrusion events today"
          value={String(intrusionEventsCount)}
        />
        <Stat
          label="Active hazard-zone intrusions"
          value={String(activeIntrusions)}
          tone={activeIntrusions > 0 ? "bad" : "good"}
        />
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab("alerts")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedTab === "alerts"
                ? "bg-brand text-slate-900"
                : "bg-panel text-t2 hover:text-t1"
            }`}
          >
            Operational Alerts
          </button>
          <button
            onClick={() => setSelectedTab("intrusion")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedTab === "intrusion"
                ? "bg-brand text-slate-900"
                : "bg-panel text-t2 hover:text-t1"
            }`}
          >
            Track Intrusion
          </button>
        </div>

        {/* Tab 1: Operational Alerts */}
        {selectedTab === "alerts" && (
          <div className="space-y-4">
            {/* Severity Filter Pills */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "critical", "warning", "info"] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev as AlertSeverity | "all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    severityFilter === sev
                      ? "bg-brand text-slate-900"
                      : "bg-panel text-t2 hover:text-t1 border border-panel-line"
                  }`}
                >
                  {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
                </button>
              ))}
            </div>

            {/* Alerts Feed */}
            <Panel title="Alert Feed" bodyClass="p-0">
              <div className="divide-y divide-panel-line">
                {sortedAlerts.length === 0 ? (
                  <div className="p-4 text-center text-muted text-sm">No alerts</div>
                ) : (
                  sortedAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onAck={() => {}} />
                  ))
                )}
              </div>
            </Panel>
          </div>
        )}

        {/* Tab 2: Track Intrusion */}
        {selectedTab === "intrusion" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: High-hazard zones map */}
            <Panel title="High-hazard zones" bodyClass="p-0" className="lg:col-span-1">
              <div className="h-[440px]">
                <PlantMapCanvas />
              </div>
              <div className="border-t border-panel-line px-4 py-3 text-xs text-t2 space-y-1.5">
                <div className="font-medium text-t1 mb-2">Monitored zones:</div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent-red shrink-0" />
                  <span>Coke Oven</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent-red shrink-0" />
                  <span>Blast Furnace</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent-red shrink-0" />
                  <span>Level Crossing LC-7</span>
                </div>
              </div>
            </Panel>

            {/* Right: Intrusion events */}
            <Panel title="Intrusion events" sub="AI-detected unauthorised activity" className="lg:col-span-2" bodyClass="p-0">
              <div className="divide-y divide-panel-line">
                {sortedIntrusions.length === 0 ? (
                  <div className="p-4 text-center text-muted text-sm">No intrusion events</div>
                ) : (
                  <>
                    {sortedIntrusions.map((intrusion) => (
                      <div key={intrusion.id} className="p-4 space-y-3 hover:bg-panel/50 transition">
                        {/* Camera snapshot placeholder */}
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                          <Camera size={32} className="text-t3" />
                          <div className="absolute bottom-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-xs text-t2 mono">
                            {intrusion.cameraId}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-t1">{intrusion.zone}</div>
                              <div className="text-xs text-muted mt-0.5">{intrusion.snapshotLabel}</div>
                            </div>
                            <Badge tone={intrusion.cleared ? "good" : "critical"}>
                              {intrusion.cleared ? "Cleared" : "ACTIVE"}
                            </Badge>
                          </div>

                          {/* Confidence bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted">Confidence</span>
                              <span className="mono text-t2">{Math.round(intrusion.confidence * 100)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-accent-red"
                                style={{ width: `${intrusion.confidence * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-panel-line">
                            <span className="mono">{intrusion.cameraId}</span>
                            <span>{fmtDateTime(intrusion.tsIso)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-3 bg-panel/40 border-t border-panel-line">
                      <p className="text-xs text-t3">
                        Detection runs on edge GPU cameras with human-in-the-loop verification
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline alert card component
function AlertCard({ alert, onAck }: { alert: Alert; onAck: () => void }) {
  const { ackAlert } = useStore();

  const severityColor = {
    critical: "border-accent-red",
    warning: "border-accent-amber",
    info: "border-accent",
  }[alert.severity];

  const severityTone = ({
    critical: "critical" as const,
    warning: "warning" as const,
    info: "info" as const,
  })[alert.severity];

  return (
    <div className={`border-l-4 ${severityColor} bg-panel/40 px-4 py-3 hover:bg-panel/60 transition flex items-start gap-3 justify-between`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone={severityTone}>{alert.severity}</Badge>
          <span className="text-xs text-muted">{alert.kind}</span>
        </div>
        <div className="text-sm font-medium text-t1 mb-1">{alert.title}</div>
        <div className="text-xs text-muted mb-2">{alert.detail}</div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{alert.location}</span>
          <span>{fmtTime(alert.tsIso)}</span>
          <span>→ {alert.role}</span>
          {alert.rakeId && <span className="mono bg-surface-2 px-2 py-0.5 rounded text-t3">{alert.rakeId}</span>}
        </div>
      </div>
      <button
        onClick={() => ackAlert(alert.id)}
        disabled={alert.ack}
        className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium transition ${
          alert.ack
            ? "bg-panel/40 text-t3 cursor-default"
            : "bg-accent hover:bg-accent/80 text-slate-900"
        }`}
      >
        {alert.ack ? (
          <span className="flex items-center gap-1">
            <Check size={12} />
            Acknowledged
          </span>
        ) : (
          "Acknowledge"
        )}
      </button>
    </div>
  );
}
