"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Polyline, Polygon, CircleMarker, Marker, Popup, Tooltip } from "react-leaflet";
import { NODES, ROUTES, GEOFENCES, PLANT_CENTER } from "@/lib/network";
import { COMMODITY_MAP_COLOR, COMMODITY_META } from "@/lib/commodities";
import { useStore } from "@/lib/store";
import { fmtTime } from "@/lib/format";
import type { NodeKind } from "@/lib/types";

const NODE_STYLE: Record<NodeKind, { color: string; r: number }> = {
  gate: { color: "#e2e8f0", r: 6 }, interchange: { color: "#e2e8f0", r: 6 },
  yard: { color: "#94a3b8", r: 5 }, tippler: { color: "#f97316", r: 7 },
  unloading: { color: "#fbbf24", r: 6 }, loading: { color: "#2dd4bf", r: 6 },
  weighbridge: { color: "#38bdf8", r: 5 }, cokeoven: { color: "#f87171", r: 6 },
  blastfurnace: { color: "#f87171", r: 6 }, junction: { color: "#64748b", r: 4 },
};

function rakeIcon(color: string, moving: boolean, label: string) {
  return L.divIcon({
    className: "rake-marker",
    html: `<div style="position:relative;color:${color}">
      <div class="rake-dot ${moving ? "rake-pulse" : ""}" style="background:${color}"></div>
      <div style="position:absolute;left:16px;top:-3px;white-space:nowrap;font:600 10px/1.2 var(--font-mono);color:#dbe6f2;text-shadow:0 1px 3px #000">${label}</div>
    </div>`,
    iconSize: [15, 15], iconAnchor: [7, 7],
  });
}

export function PlantMap({ height = "100%", showNodes = true }: { height?: string; showNodes?: boolean }) {
  const { rakes, selectedRakeId, setSelectedRakeId } = useStore();
  const plantRakes = rakes.filter((r) => r.stage !== "en-route");

  return (
    <MapContainer center={PLANT_CENTER} zoom={15} minZoom={13} maxZoom={17}
      style={{ height, width: "100%", borderRadius: 12 }} zoomControl={true} attributionControl={true}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap contributors' />

      {GEOFENCES.map((g) => (
        <Polygon key={g.id} positions={g.polygon}
          pathOptions={{
            color: g.kind === "hazard" ? "#f87171" : "#38bdf8",
            weight: 1.2, fillOpacity: g.kind === "hazard" ? 0.14 : 0.07,
            dashArray: g.kind === "hazard" ? "5 4" : undefined,
          }}>
          <Tooltip direction="center" opacity={0.9} className="!bg-transparent !border-0 !shadow-none">
            <span style={{ color: g.kind === "hazard" ? "#fca5a5" : "#7dd3fc", fontSize: 10, fontWeight: 600 }}>
              {g.kind === "hazard" ? "⚠ " : ""}{g.label}
            </span>
          </Tooltip>
        </Polygon>
      ))}

      {ROUTES.map((r) => (
        <Polyline key={r.id} positions={r.points}
          pathOptions={{ color: "#3d5876", weight: 3.2, opacity: 0.75 }} />
      ))}

      {showNodes && NODES.map((n) => {
        const s = NODE_STYLE[n.kind];
        return (
          <CircleMarker key={n.id} center={n.pos} radius={s.r}
            pathOptions={{ color: "#0a1622", weight: 1.5, fillColor: s.color, fillOpacity: 1 }}>
            <Tooltip direction="top" offset={[0, -4]}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{n.label}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {plantRakes.map((r) => {
        const color = COMMODITY_MAP_COLOR[r.commodity];
        const selected = selectedRakeId === r.id;
        return (
          <Marker key={r.id} position={r.position}
            icon={rakeIcon(selected ? "#ffffff" : color, r.status === "moving", r.id)}
            eventHandlers={{ click: () => setSelectedRakeId(r.id) }}>
            <Popup>
              <div style={{ minWidth: 190 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{r.id}
                  <span style={{ float: "right", color, fontWeight: 600 }}>{COMMODITY_META[r.commodity].short}</span>
                </div>
                <div style={{ color: "#9fb3c8", fontSize: 11, lineHeight: 1.6 }}>
                  <div>Origin · {r.origin}</div>
                  <div>Heading · {r.headingLabel}</div>
                  <div>Status · {r.status} · {r.speedKmph} km/h</div>
                  <div>Wagons · {r.wagonCount} · {r.loadedT ? r.loadedT + " t" : "empty"}</div>
                  <div>Last sensor · {r.lastSensor}</div>
                  <div>Arrived · {fmtTime(r.arrivalIso)}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
