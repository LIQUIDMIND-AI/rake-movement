"use client";
import { Panel, Badge } from "./ui";
import { Ship, Anchor, Waypoints, Train, Database, Boxes, Radar, ScanLine, ShieldCheck } from "lucide-react";

type Status = "live" | "onboarding" | "planned";

const INTEGRATIONS: {
  name: string; layer: string; desc: string; icon: any; status: Status; tone: "good" | "warning" | "info" | "neutral";
}[] = [
  { name: "Sagar Setu (NLP-Marine)", layer: "Sea leg", icon: Anchor, tone: "info",
    desc: "MoPSW single-window maritime portal — vessel & cargo track-and-trace at the discharge port.", status: "onboarding" },
  { name: "PCS1x", layer: "Sea leg", icon: Ship, tone: "info",
    desc: "Indian Ports Association Port Community System — vessel calls, berthing and discharge events.", status: "onboarding" },
  { name: "AIS · DGLL", layer: "Sea leg", icon: Radar, tone: "info",
    desc: "Live AIS vessel positions via Directorate General of Lighthouses & Lightships.", status: "live" },
  { name: "ULIP", layer: "Aggregator", icon: Boxes, tone: "good",
    desc: "Unified Logistics Interface Platform — 125+ GoI APIs (coal/steel sector). One consent-based feed for sea + rail.", status: "live" },
  { name: "TradeGuard AI", layer: "Compliance", icon: ShieldCheck, tone: "good",
    desc: "Customs clearance check at the ocean port, then a SAP-embedded recheck when the barge → rail RR is issued. See EXIM Intelligence for the full flow.", status: "live" },
  { name: "FOIS", layer: "Rail leg", icon: Train, tone: "good",
    desc: "Freight Operations Information System (Indian Railways) — inbound rake visibility pre-interchange.", status: "live" },
  { name: "SAP S/4HANA · OData V4", layer: "ERP", icon: Database, tone: "good",
    desc: "POs, material masters and goods-receipt post-back — SAP PartnerEdge authorised.", status: "live" },
  { name: "Zoho / other ERP", layer: "ERP", icon: Database, tone: "warning",
    desc: "REST/OData connector for plants on Zoho, Oracle or Tally — same event contract as SAP.", status: "planned" },
  { name: "Weighbridge · SCADA", layer: "Plant", icon: ScanLine, tone: "neutral",
    desc: "Serial / OPC-UA / file-drop adapters for in-motion weighbridges and installed vendor systems.", status: "live" },
];

const statusLabel: Record<Status, string> = { live: "Live", onboarding: "Onboarding", planned: "On roadmap" };
const statusTone: Record<Status, "good" | "warning" | "info"> = { live: "good", onboarding: "info", planned: "warning" };

export function Integrations({ title = "Integrations — API-first, read-mostly", sub }: { title?: string; sub?: string }) {
  return (
    <Panel title={title} sub={sub || "Nothing invasive touches DSP's running systems · mTLS everywhere · data resident in India"}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {INTEGRATIONS.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.name} className="rounded-lg border border-panel-line bg-panel p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-3 text-accent">
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium text-t1">{it.name}</div>
                    <div className="text-[10px] uppercase tracking-wide text-t3">{it.layer}</div>
                  </div>
                </div>
                <Badge tone={statusTone[it.status]}>{statusLabel[it.status]}</Badge>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">{it.desc}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
        <Waypoints size={13} className="text-accent-teal" />
        One normalized event stream — sea, rail, plant and ERP feeds cross-validated into a single rake truth.
      </div>
    </Panel>
  );
}
