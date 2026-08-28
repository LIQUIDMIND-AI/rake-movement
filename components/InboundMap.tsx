"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip } from "react-leaflet";
import { PORTS, DSP_GATE } from "@/lib/network";
import { COMMODITY_MAP_COLOR } from "@/lib/commodities";
import { useStore } from "@/lib/store";
import { fmtDateTime } from "@/lib/format";

function pin(color: string, label: string, moving: boolean) {
  return L.divIcon({
    className: "rake-marker",
    html: `<div style="position:relative;color:${color}">
      <div class="rake-dot ${moving ? "rake-pulse" : ""}" style="background:${color}"></div>
      <div style="position:absolute;left:16px;top:-3px;white-space:nowrap;font:600 10px/1.2 var(--font-mono);color:#dbe6f2;text-shadow:0 1px 3px #000">${label}</div>
    </div>`,
    iconSize: [15, 15], iconAnchor: [7, 7],
  });
}

function vesselIcon(course: number, label: string) {
  return L.divIcon({
    className: "rake-marker",
    html: `<div style="position:relative">
      <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:15px solid #38bdf8;transform:rotate(${course}deg);filter:drop-shadow(0 0 4px rgba(56,189,248,.6))"></div>
      <div style="position:absolute;left:14px;top:0;white-space:nowrap;font:600 10px/1.2 var(--font-mono);color:#bfe6fb;text-shadow:0 1px 3px #000">${label}</div>
    </div>`,
    iconSize: [14, 15], iconAnchor: [7, 7],
  });
}

const PORT_POS: Record<string, [number, number]> = {
  haldia: PORTS.haldia.pos, paradip: PORTS.paradip.pos, vizag: PORTS.vizag.pos,
};

export function InboundMap({ height = "100%" }: { height?: string }) {
  const { inbound, vessels } = useStore();
  return (
    <div className="relative h-full w-full">
      <MapContainer center={[20.2, 86.5]} zoom={6} minZoom={4} maxZoom={9}
        style={{ height, width: "100%", borderRadius: 12 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />

      {/* Sea leg: vessel → discharge port */}
      {vessels.map((v) => (
        <Polyline key={"sea" + v.id} positions={[v.pos, PORT_POS[v.destPortId]]}
          pathOptions={{ color: "#38bdf8", weight: 1.3, opacity: 0.4, dashArray: "3 7" }} />
      ))}

      {inbound.map((i) => (
        <Polyline key={"line" + i.id} positions={[i.originPos, DSP_GATE]}
          pathOptions={{ color: COMMODITY_MAP_COLOR[i.commodity], weight: 1.4, opacity: 0.35, dashArray: "6 6" }} />
      ))}

      {Object.values(PORTS).map((p) => (
        <CircleMarker key={p.label} center={p.pos} radius={6}
          pathOptions={{ color: "#0a1622", weight: 1.5, fillColor: "#38bdf8", fillOpacity: 1 }}>
          <Tooltip direction="top"><span style={{ fontWeight: 600 }}>{p.label}</span></Tooltip>
        </CircleMarker>
      ))}

      <CircleMarker center={DSP_GATE} radius={8}
        pathOptions={{ color: "#0a1622", weight: 2, fillColor: "#f97316", fillOpacity: 1 }}>
        <Tooltip direction="top" permanent><span style={{ fontWeight: 700 }}>DSP Durgapur</span></Tooltip>
      </CircleMarker>

      {inbound.map((i) => (
        <Marker key={i.id} position={i.pos} icon={pin(COMMODITY_MAP_COLOR[i.commodity], i.id, i.progress < 1)}>
          <Popup>
            <div style={{ minWidth: 190 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{i.id}</div>
              <div style={{ color: "#9fb3c8", fontSize: 11, lineHeight: 1.6 }}>
                <div>Ex · {i.origin}{i.vessel ? ` (${i.vessel})` : ""}</div>
                <div>Status · {i.status}</div>
                <div>Distance to plant · {i.distanceKm} km</div>
                <div>ETA · {fmtDateTime(i.etaIso)}</div>
                <div>Source · {i.source}</div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Vessels (sea leg) — AIS via Sagar Setu / PCS1x / ULIP */}
      {vessels.map((v) => (
        <Marker key={v.id} position={v.pos} icon={vesselIcon(v.courseDeg, v.name)}>
          <Popup>
            <div style={{ minWidth: 210 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{v.name}
                <span style={{ float: "right", color: "#38bdf8", fontWeight: 600 }}>⚓ {v.status}</span>
              </div>
              <div style={{ color: "#9fb3c8", fontSize: 11, lineHeight: 1.6 }}>
                <div>IMO · {v.imo}</div>
                <div>Cargo · {(v.cargoT / 1000).toFixed(0)}k t · {v.grade}</div>
                <div>Load port · {v.loadPort}</div>
                <div>Discharge · {v.destPort}</div>
                <div>Speed · {v.speedKn} kn · course {v.courseDeg}°</div>
                <div>ETA port · {fmtDateTime(v.etaPortIso)}</div>
                <div>Plan · {v.linkedRakePlan}</div>
                <div>Source · {v.source}</div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg border border-panel-line bg-surface/90 backdrop-blur px-3 py-2 shadow-pop">
        <div className="mb-1.5 text-[10.5px] font-semibold text-t1">Map key</div>
        <div className="space-y-1 text-[10.5px] text-t2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed" style={{ borderColor: "#38bdf8" }} />
            Vessel sea route (AIS)
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed" style={{ borderColor: "#f97316" }} />
            Rake rail route (by commodity)
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#f97316" }} />
            DSP Durgapur · <span className="inline-block h-2 w-2 rounded-full ml-1" style={{ background: "#38bdf8" }} /> Port
          </div>
        </div>
      </div>
    </div>
  );
}
