import type { TrackNode, TrackRoute, Geofence, LatLng } from "./types";

// ---------------------------------------------------------------------------
// Geographic model of the DSP internal rail network.
// Coordinates are a plausible schematic laid over the real Durgapur Steel Plant
// footprint (~23.53N, 87.29E), West Bengal — on the Howrah–Delhi main line.
// This is an illustrative mockup layout, not a survey drawing.
// ---------------------------------------------------------------------------

export const PLANT_CENTER: LatLng = [23.5365, 87.295];
export const PLANT_ZOOM = 14;

// Macro geography — imported coking coal enters via eastern ports.
export const PORTS = {
  haldia: { label: "Haldia Port", pos: [22.0257, 88.0583] as LatLng },
  paradip: { label: "Paradip Port", pos: [20.2648, 86.6947] as LatLng },
  vizag: { label: "Visakhapatnam Port", pos: [17.6868, 83.2185] as LatLng },
};
export const DSP_GATE: LatLng = [23.528, 87.318]; // IR interchange / entry

// --- Plant rail network nodes -------------------------------------------------
export const NODES: TrackNode[] = [
  { id: "N-GATE", label: "IR Interchange Gate", kind: "gate", pos: [23.528, 87.318] },
  { id: "N-ICY", label: "Interchange Yard", kind: "interchange", pos: [23.5305, 87.3105] },
  { id: "N-WB1", label: "In-motion Weighbridge WB-1", kind: "weighbridge", pos: [23.5322, 87.3055] },
  { id: "N-MSY", label: "Marshalling Yard", kind: "yard", pos: [23.5342, 87.3008] },
  { id: "N-RMHS", label: "Raw Material Handling", kind: "junction", pos: [23.5358, 87.2965] },
  { id: "N-T1", label: "Wagon Tippler T-1", kind: "tippler", pos: [23.5375, 87.2925] },
  { id: "N-T2", label: "Wagon Tippler T-2", kind: "tippler", pos: [23.5388, 87.2905] },
  { id: "N-COB", label: "Coke Oven Battery Siding", kind: "cokeoven", pos: [23.5402, 87.2872] },
  { id: "N-BF", label: "Blast Furnace Stock House", kind: "blastfurnace", pos: [23.5418, 87.2905] },
  { id: "N-ORE", label: "Ore Unloading Point", kind: "unloading", pos: [23.5348, 87.2938] },
  { id: "N-FLUX", label: "Flux / Limestone Bunker", kind: "unloading", pos: [23.5335, 87.2912] },
  { id: "N-MILL", label: "Mills Despatch / Loading", kind: "loading", pos: [23.5305, 87.2882] },
  { id: "N-EMP", label: "Empties Formation Yard", kind: "yard", pos: [23.5288, 87.2952] },
  { id: "N-WB2", label: "Despatch Weighbridge WB-2", kind: "weighbridge", pos: [23.5296, 87.2925] },
];

export function node(id: string): TrackNode {
  const n = NODES.find((x) => x.id === id);
  if (!n) throw new Error("unknown node " + id);
  return n;
}

// helper to build a polyline from a list of node ids (+ optional inserted points)
function line(ids: string[]): LatLng[] {
  return ids.map((id) => node(id).pos);
}

// --- Plant rail routes (polylines rakes travel along) -------------------------
export const ROUTES: TrackRoute[] = [
  { id: "R-INBOUND", label: "Gate → Interchange → Marshalling", points: line(["N-GATE", "N-ICY", "N-WB1", "N-MSY"]) },
  { id: "R-COAL-T1", label: "Marshalling → Tippler T-1", points: line(["N-MSY", "N-RMHS", "N-T1"]), commodityHint: "imported-coking-coal" },
  { id: "R-COAL-T2", label: "Marshalling → Tippler T-2", points: line(["N-MSY", "N-RMHS", "N-T2"]), commodityHint: "domestic-coal" },
  { id: "R-COKE", label: "Tippler → Coke Ovens", points: line(["N-T1", "N-COB"]), commodityHint: "imported-coking-coal" },
  { id: "R-ORE-BF", label: "Marshalling → Ore Point → Blast Furnace", points: line(["N-MSY", "N-ORE", "N-BF"]), commodityHint: "iron-ore" },
  { id: "R-FLUX", label: "Marshalling → Flux Bunker", points: line(["N-MSY", "N-FLUX"]), commodityHint: "limestone-flux" },
  { id: "R-MILL", label: "Empties → Mills Loading", points: line(["N-EMP", "N-MILL"]), commodityHint: "finished-steel" },
  { id: "R-RETURN", label: "Empties Formation → Weighbridge → Gate", points: line(["N-EMP", "N-WB2", "N-ICY", "N-GATE"]), commodityHint: "empties" },
];

export function route(id: string): TrackRoute {
  const r = ROUTES.find((x) => x.id === id);
  if (!r) throw new Error("unknown route " + id);
  return r;
}

// --- Geofences: operational aprons + high-hazard zones ------------------------
function box(center: LatLng, dLat: number, dLng: number): LatLng[] {
  const [la, ln] = center;
  return [
    [la - dLat, ln - dLng],
    [la - dLat, ln + dLng],
    [la + dLat, ln + dLng],
    [la + dLat, ln - dLng],
  ];
}

export const GEOFENCES: Geofence[] = [
  { id: "G-T1", label: "Tippler T-1 Apron", kind: "operational", polygon: box([23.5375, 87.2925], 0.0012, 0.0016) },
  { id: "G-T2", label: "Tippler T-2 Apron", kind: "operational", polygon: box([23.5388, 87.2905], 0.0012, 0.0016) },
  { id: "G-ICY", label: "Interchange Yard", kind: "operational", polygon: box([23.5305, 87.3105], 0.0014, 0.0026) },
  { id: "G-COB", label: "Coke Oven Hazard Zone", kind: "hazard", polygon: box([23.5402, 87.2872], 0.0016, 0.0018) },
  { id: "G-BF", label: "Blast Furnace Hazard Zone", kind: "hazard", polygon: box([23.5418, 87.2905], 0.0015, 0.0017) },
  { id: "G-XING", label: "Level Crossing LC-7 Hazard", kind: "hazard", polygon: box([23.5342, 87.3008], 0.0008, 0.0010) },
];

// Interpolate a position along a polyline given progress 0..1 (by segment length).
export function interpolate(points: LatLng[], t: number): LatLng {
  if (points.length < 2) return points[0];
  const clamped = Math.max(0, Math.min(1, t));
  const segLens = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
    segLens.push(d);
    total += d;
  }
  let target = clamped * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const f = segLens[i] === 0 ? 0 : target / segLens[i];
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * f,
        points[i][1] + (points[i + 1][1] - points[i][1]) * f,
      ];
    }
    target -= segLens[i];
  }
  return points[points.length - 1];
}
