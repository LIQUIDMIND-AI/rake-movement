"use client";

import { useStore } from "@/lib/store";
import { Panel, Stat, LiveBadge, Badge, Dot, PageHeader } from "@/components/ui";
import { PlantMapCanvas } from "@/components/Maps";
import { RakeBoard } from "@/components/RakeBoard";
import { fmtTime } from "@/lib/format";
import { COMMODITY_META, COMMODITY_MAP_COLOR } from "@/lib/commodities";
import type { Commodity, SensorSource } from "@/lib/types";
import { Map, Wifi, Radio, Zap } from "lucide-react";

export default function PlantMapPage() {
  const { rakes, nowMs } = useStore();
  const inPlant = rakes.filter((r) => r.stage !== "en-route");
  const moving = inPlant.filter((r) => r.status === "moving").length;

  // Calculate tipplers active (count unique tippler destinations)
  const activeTipplers = new Set(
    inPlant
      .filter((r) => ["placement", "unloading"].includes(r.stage))
      .map((r) => r.headingLabel)
  ).size;

  // Average speed of moving rakes
  const avgSpeed =
    moving > 0
      ? Math.round(
          inPlant
            .filter((r) => r.status === "moving")
            .reduce((s, r) => s + r.speedKmph, 0) / moving
        )
      : 0;

  // Sensor sources with counts
  const sensorSources: Array<{ name: string; icon: React.ReactNode; desc: string; count: number; source: SensorSource }> = [
    { name: "RFID AEI Gantries", icon: <Radio size={14} />, desc: "Wagon identity at choke points", count: inPlant.filter((r) => r.lastSensor === "RFID").length, source: "RFID" },
    { name: "Loco GNSS", icon: <Wifi size={14} />, desc: "Continuous rake position", count: inPlant.filter((r) => r.lastSensor === "GNSS").length, source: "GNSS" },
    { name: "Wagon-number OCR", icon: <Radio size={14} />, desc: "Untagged IR wagons", count: inPlant.filter((r) => r.lastSensor === "OCR").length, source: "OCR" },
    { name: "In-motion Weighbridges", icon: <Zap size={14} />, desc: "Gross / tare measurement", count: inPlant.filter((r) => r.lastSensor === "WEIGHBRIDGE").length, source: "WEIGHBRIDGE" },
  ];

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Live Plant Rail Map"
        sub="Georeferenced DSP track schematic · real-time rake positions colour-coded by commodity"
        icon={<Map size={20} />}
        actions={<LiveBadge />}
      />

      {/* Two-column layout: map (70%) + right panel (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Map */}
        <div className="lg:col-span-2">
          <Panel
            className="overflow-hidden"
            bodyClass="p-0"
          >
            <div className="h-[calc(100vh-230px)] min-h-[460px]">
              <PlantMapCanvas />
            </div>
          </Panel>
        </div>

        {/* RIGHT: Stacked panels */}
        <div className="space-y-4">
          {/* Legend */}
          <Panel title="Legend" sub="Commodities & zones">
            <div className="space-y-3">
              {(["imported-coking-coal", "domestic-coal", "iron-ore", "limestone-flux", "empties", "finished-steel"] as Commodity[]).map((c) => (
                <div key={c} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COMMODITY_MAP_COLOR[c] }} />
                  <span className="text-[12px] text-t2">{COMMODITY_META[c].short}</span>
                </div>
              ))}
              <div className="border-t border-panel-line pt-2.5 mt-2">
                <p className="text-[10px] text-muted leading-relaxed">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent align-middle mr-1" /> Operational geofences
                  <br />
                  <span className="inline-block h-2 w-2 rounded-full border border-dashed border-accent-red align-middle mr-1" /> Hazard zones
                </p>
              </div>
            </div>
          </Panel>

          {/* Sensor Fusion */}
          <Panel title="Sensor fusion" sub="4-source integration">
            <div className="space-y-2">
              {sensorSources.map((src) => (
                <div key={src.source} className="flex items-center justify-between text-[12px] py-1.5 px-2 rounded border border-panel-line bg-panel">
                  <div className="flex items-center gap-2">
                    <span className="text-accent">{src.icon}</span>
                    <div>
                      <div className="text-t1">{src.name}</div>
                      <div className="text-[10px] text-muted">{src.desc}</div>
                    </div>
                  </div>
                  <Badge tone="info">{src.count}</Badge>
                </div>
              ))}
            </div>
          </Panel>

          {/* In-plant Rakes */}
          <Panel title="In-plant rakes" sub={`${inPlant.length} active`}>
            <RakeBoard compact limit={5} />
          </Panel>
        </div>
      </div>

      {/* Bottom: 4 stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total in-plant rakes" value={String(inPlant.length)} sub="currently handled" />
        <Stat label="Rakes moving" value={String(moving)} sub={`avg speed ${avgSpeed} km/h`} />
        <Stat label="Tipplers active" value={String(activeTipplers)} sub="unloading in progress" />
        <Stat label="Avg speed" value={`${avgSpeed} km/h`} sub="of moving rakes" />
      </div>
    </div>
  );
}
