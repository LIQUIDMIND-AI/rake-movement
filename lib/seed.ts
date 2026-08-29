import type {
  Rake, Wagon, LifecycleEvent, Alert, IntrusionEvent, InboundRake,
  MISRow, NLExchange, Commodity, SensorSource, LifecycleStage, Vessel,
} from "./types";
import { PORTS, interpolate, route } from "./network";

// ---------------------------------------------------------------------------
// Deterministic seed data for the mockup. All timestamps are anchored to a
// fixed "shift now" so the demo is reproducible; the live simulation layer
// (lib/sim.ts) advances rake positions from these seeds.
// ---------------------------------------------------------------------------

// Anchor: current running shift, computed from the real clock each load so
// the demo always reflects "today" instead of a fixed date.
export const SHIFT_NOW = new Date();

function iso(offsetMin: number): string {
  return new Date(SHIFT_NOW.getTime() + offsetMin * 60000).toISOString();
}

const WAGON_TYPES = ["BOXNHL", "BOBRN", "BOXNR", "BCNHL"];
function makeWagons(rakeSeed: number, count: number, loaded: boolean): Wagon[] {
  const w: Wagon[] = [];
  for (let i = 0; i < count; i++) {
    const tare = 22 + ((rakeSeed + i) % 3);
    const net = loaded ? 58 + ((rakeSeed * 7 + i * 3) % 8) : 0;
    const tagged = (rakeSeed + i) % 7 !== 0; // ~1 in 7 identified by OCR
    w.push({
      id: `${300000 + rakeSeed * 200 + i}`,
      type: WAGON_TYPES[(rakeSeed + i) % WAGON_TYPES.length],
      tareT: tare,
      grossT: loaded ? tare + net : 0,
      tagged,
      lastSensor: tagged ? "RFID" : "OCR",
    });
  }
  return w;
}

function lifecycle(stages: { stage: LifecycleStage; label: string; location: string; min: number; source: SensorSource; done: boolean }[]): LifecycleEvent[] {
  return stages.map((s) => ({ stage: s.stage, label: s.label, location: s.location, tsIso: iso(s.min), source: s.source, done: s.done }));
}

// --- Rakes currently inside / at the plant ----------------------------------
interface RakeSpec {
  id: string; rrNo: string; commodity: Commodity; origin: string; loco: string;
  wagonCount: number; routeId: string; progress: number; speed: number;
  status: Rake["status"]; stage: LifecycleStage; heading: string;
  arrivalMin: number; freeMin: number; detentionHrs: number; turnaround: number | null;
  sensor: SensorSource;
}

const RAKE_SPECS: RakeSpec[] = [
  { id: "RK-2261", rrNo: "E-4471190", commodity: "imported-coking-coal", origin: "Haldia Port", loco: "WAG9-31245",
    wagonCount: 59, routeId: "R-COAL-T1", progress: 0.62, speed: 8, status: "moving", stage: "placement",
    heading: "Tippler T-1", arrivalMin: -186, freeMin: 90, detentionHrs: 3.1, turnaround: null, sensor: "GNSS" },
  { id: "RK-2258", rrNo: "E-4470882", commodity: "imported-coking-coal", origin: "Paradip Port", loco: "WAG7-24518",
    wagonCount: 58, routeId: "R-COAL-T1", progress: 1.0, speed: 0, status: "unloading", stage: "unloading",
    heading: "Tippler T-1", arrivalMin: -262, freeMin: -35, detentionHrs: 5.2, turnaround: null, sensor: "RFID" },
  { id: "RK-2264", rrNo: "E-4471544", commodity: "iron-ore", origin: "Barajamda (Noamundi)", loco: "WAG9-30991",
    wagonCount: 52, routeId: "R-ORE-BF", progress: 0.44, speed: 11, status: "moving", stage: "placement",
    heading: "Blast Furnace Stock House", arrivalMin: -92, freeMin: 260, detentionHrs: 1.5, turnaround: null, sensor: "GNSS" },
  { id: "RK-2249", rrNo: "E-4470120", commodity: "domestic-coal", origin: "Sonepur Bazari (ECL)", loco: "WAG7-22110",
    wagonCount: 58, routeId: "R-COAL-T2", progress: 1.0, speed: 0, status: "unloading", stage: "unloading",
    heading: "Tippler T-2", arrivalMin: -175, freeMin: 40, detentionHrs: 2.9, turnaround: null, sensor: "WEIGHBRIDGE" },
  { id: "RK-2270", rrNo: "E-4471903", commodity: "limestone-flux", origin: "Bhawanathpur", loco: "WAG5-18877",
    wagonCount: 45, routeId: "R-FLUX", progress: 0.7, speed: 9, status: "moving", stage: "placement",
    heading: "Flux / Limestone Bunker", arrivalMin: -58, freeMin: 300, detentionHrs: 0.9, turnaround: null, sensor: "RFID" },
  { id: "RK-2255", rrNo: "E-4470655", commodity: "empties", origin: "Tippler T-2 release", loco: "WDG4-12040",
    wagonCount: 58, routeId: "R-RETURN", progress: 0.35, speed: 6, status: "moving", stage: "formation",
    heading: "IR Interchange Gate", arrivalMin: -320, freeMin: 20, detentionHrs: 5.9, turnaround: 6.4, sensor: "GNSS" },
  { id: "RK-2246", rrNo: "E-4469981", commodity: "finished-steel", origin: "Merchant Mill despatch", loco: "WDG4-11888",
    wagonCount: 42, routeId: "R-MILL", progress: 0.5, speed: 7, status: "loading", stage: "loading",
    heading: "Mills Despatch / Loading", arrivalMin: -140, freeMin: 180, detentionHrs: 2.3, turnaround: null, sensor: "RFID" },
  { id: "RK-2267", rrNo: "E-4471720", commodity: "imported-coking-coal", origin: "Haldia Port", loco: "WAG9-31402",
    wagonCount: 59, routeId: "R-INBOUND", progress: 0.5, speed: 14, status: "moving", stage: "accepted",
    heading: "Marshalling Yard", arrivalMin: -22, freeMin: 350, detentionHrs: 0.4, turnaround: null, sensor: "GNSS" },
  { id: "RK-2242", rrNo: "E-4469640", commodity: "domestic-coal", origin: "Jhanjra (ECL)", loco: "WAG7-21980",
    wagonCount: 58, routeId: "R-INBOUND", progress: 0.15, speed: 12, status: "moving", stage: "interchange",
    heading: "Interchange Yard", arrivalMin: -8, freeMin: 360, detentionHrs: 0.1, turnaround: null, sensor: "RFID" },
  { id: "RK-2238", rrNo: "E-4469355", commodity: "iron-ore", origin: "Kiriburu", loco: "WAG9-30870",
    wagonCount: 52, routeId: "R-ORE-BF", progress: 1.0, speed: 0, status: "detained", stage: "unloading",
    heading: "Blast Furnace Stock House", arrivalMin: -410, freeMin: -95, detentionHrs: 6.8, turnaround: null, sensor: "OCR" },
];

function stageChain(spec: RakeSpec): LifecycleEvent[] {
  const loc = spec.heading;
  const base: { stage: LifecycleStage; label: string; location: string; min: number; source: SensorSource }[] = [
    { stage: "en-route", label: "Departed source", location: spec.origin, min: spec.arrivalMin - 600, source: "FOIS" },
    { stage: "interchange", label: "Arrived DSP interchange", location: "Interchange Yard", min: spec.arrivalMin, source: "RFID" },
    { stage: "accepted", label: "Accepted from IR", location: "Interchange Yard", min: spec.arrivalMin + 18, source: "GNSS" },
    { stage: "placement", label: "Placement in progress", location: loc, min: spec.arrivalMin + 40, source: "GNSS" },
    { stage: "unloading", label: "Unloading / tippling", location: loc, min: spec.arrivalMin + 65, source: "WEIGHBRIDGE" },
    { stage: "formation", label: "Empties formation", location: "Empties Formation Yard", min: spec.arrivalMin + 150, source: "RFID" },
    { stage: "handover", label: "Handed back to IR", location: "IR Interchange Gate", min: spec.arrivalMin + 210, source: "RFID" },
  ];
  const order: LifecycleStage[] = ["en-route", "interchange", "accepted", "placement", "unloading", "loading", "formation", "handover"];
  const curIdx = order.indexOf(spec.stage);
  return lifecycle(base.map((b) => ({ ...b, done: order.indexOf(b.stage) < curIdx })));
}

export function buildRakes(): Rake[] {
  return RAKE_SPECS.map((spec, i) => {
    const loaded = !["empties"].includes(spec.commodity);
    const wagons = makeWagons(i + 1, spec.wagonCount, loaded && spec.commodity !== "finished-steel" ? true : loaded);
    const pos = interpolate(route(spec.routeId).points, spec.progress);
    const loadedT = spec.commodity === "empties" ? 0 : wagons.reduce((s, w) => s + Math.max(0, w.grossT - w.tareT), 0);
    return {
      id: spec.id, rrNo: spec.rrNo, commodity: spec.commodity, origin: spec.origin,
      wagonCount: spec.wagonCount, loadedT: Math.round(loadedT), status: spec.status, stage: spec.stage,
      position: pos, routeId: spec.routeId, progress: spec.progress, speedKmph: spec.speed,
      headingLabel: spec.heading, loco: spec.loco, arrivalIso: iso(spec.arrivalMin),
      freeUntilIso: iso(spec.freeMin), detentionHrs: spec.detentionHrs, turnaroundHrs: spec.turnaround,
      lastSensor: spec.sensor, wagons, lifecycle: stageChain(spec),
    };
  });
}

// --- Inbound rakes on the IR network (macro map) ----------------------------
export function buildInbound(): InboundRake[] {
  const mk = (id: string, commodity: Commodity, port: keyof typeof PORTS, progress: number, etaMin: number, dist: number, status: string, source: SensorSource, vessel?: string): InboundRake => {
    const originPos = PORTS[port].pos;
    const dsp: [number, number] = [23.528, 87.318];
    const pos: [number, number] = [originPos[0] + (dsp[0] - originPos[0]) * progress, originPos[1] + (dsp[1] - originPos[1]) * progress];
    return { id, commodity, origin: PORTS[port].label, originPos, pos, progress, etaIso: iso(etaMin), distanceKm: dist, status, source, vessel };
  };
  return [
    mk("RK-2267", "imported-coking-coal", "haldia", 0.97, 15, 12, "Approaching interchange", "GNSS", "MV Cape Orion"),
    mk("RK-2273", "imported-coking-coal", "paradip", 0.55, 640, 420, "In transit — Kharagpur", "FOIS", "MV Pacific Dawn"),
    mk("RK-2279", "imported-coking-coal", "haldia", 0.28, 380, 190, "In transit — Kolkata bypass", "ULIP", "MV Cape Orion"),
    mk("RK-2281", "imported-coking-coal", "vizag", 0.12, 1180, 780, "In transit — Bhadrak", "FOIS", "MV Iron Symphony"),
  ];
}

// --- Vessels (sea leg) — imported coking coal approaching Indian ports -------
// Positions are at-sea in the Bay of Bengal / east coast, tracked via AIS and
// surfaced through Sagar Setu (NLP-Marine) / PCS1x / ULIP before rail-out.
export function buildVessels(): Vessel[] {
  const mk = (
    id: string, name: string, imo: string, cargoT: number, grade: string, loadPort: string,
    destPortId: "haldia" | "paradip" | "vizag", pos: [number, number], speedKn: number,
    courseDeg: number, progress: number, etaMin: number, status: Vessel["status"],
    source: Vessel["source"], linkedRakePlan: string
  ): Vessel => ({
    id, name, imo, cargo: "imported-coking-coal", cargoT, grade, loadPort,
    destPort: PORTS[destPortId].label, destPortId, pos, speedKn, courseDeg, progress,
    etaPortIso: iso(etaMin), status, source, linkedRakePlan,
  });
  return [
    mk("V-01", "MV Cape Orion", "9583214", 82000, "Prime Hard Coking (AU)", "Hay Point, Australia",
      "haldia", [19.35, 89.9], 12.4, 312, 0.86, 26 * 60, "at-sea", "Sagar Setu (NLP-Marine)", "≈ 14 rakes on discharge"),
    mk("V-02", "MV Pacific Dawn", "9611255", 76000, "Semi-Soft Coking (US)", "Hampton Roads, USA",
      "paradip", [17.9, 87.4], 11.1, 285, 0.62, 58 * 60, "at-sea", "AIS · DGLL", "≈ 13 rakes on discharge"),
    mk("V-03", "MV Iron Symphony", "9744820", 88000, "Hard Coking (AU blend)", "Gladstone, Australia",
      "vizag", [16.2, 84.6], 13.0, 268, 0.4, 96 * 60, "at-sea", "PCS1x", "≈ 15 rakes on discharge"),
    mk("V-04", "MV Bengal Trader", "9522017", 71000, "PCI / Blend (MZ)", "Maputo, Mozambique",
      "haldia", [21.2, 88.6], 8.6, 350, 0.95, 8 * 60, "anchorage", "Sagar Setu (NLP-Marine)", "berth pending · 12 rakes"),
  ];
}

// --- Alerts ------------------------------------------------------------------
export function buildAlerts(): Alert[] {
  return [
    { id: "AL-901", kind: "free-time-breach", severity: "critical", title: "Free time breached — RK-2258", detail: "Coking coal rake at Tippler T-1 has exceeded IR free time by 35 min. Live demurrage exposure ₹41,300 and rising.", rakeId: "RK-2258", location: "Tippler T-1", tsIso: iso(-8), role: "GM (Traffic)", ack: false },
    { id: "AL-902", kind: "detention", severity: "critical", title: "Detention > 6h — RK-2238", detail: "Iron ore rake detained 6.8h at Blast Furnace stock house. Unloading stalled; escalate to shift in-charge.", rakeId: "RK-2238", location: "Blast Furnace Stock House", tsIso: iso(-15), role: "Shift In-charge", ack: false },
    { id: "AL-903", kind: "intrusion", severity: "critical", title: "Intrusion — Coke Oven hazard zone", detail: "Human intrusion detected on track near Coke Oven Battery by edge camera CAM-COB-2. Confidence 0.94.", location: "Coke Oven Hazard Zone", tsIso: iso(-3), role: "Safety / Security", ack: false },
    { id: "AL-904", kind: "tippler-starvation", severity: "warning", title: "Tippler T-2 idle 22 min", detail: "T-2 unloading capacity idle while RK-2270 (flux) queued 1 yard away. Consider re-sequencing placement.", location: "Tippler T-2", tsIso: iso(-20), role: "Yard Master", ack: false },
    { id: "AL-905", kind: "abnormal-halt", severity: "warning", title: "Abnormal halt — RK-2255", detail: "Empty rake halted 12 min at LC-7 junction against plan. No movement authority logged.", rakeId: "RK-2255", location: "Level Crossing LC-7", tsIso: iso(-12), role: "Yard Master", ack: true },
    { id: "AL-906", kind: "eta-slip", severity: "info", title: "ETA slip — RK-2273", detail: "Inbound coking coal ETA moved +40 min (P50) due to congestion beyond Kharagpur. Now 01:00 (+1).", rakeId: "RK-2273", location: "IR network — Kharagpur", tsIso: iso(-30), role: "Planning", ack: true },
    { id: "AL-907", kind: "overspeed", severity: "warning", title: "Overspeed — WAG9-30991", detail: "Loco recorded 19 km/h in 15 km/h plant zone near Ore Unloading Point.", rakeId: "RK-2264", location: "Ore Unloading Point", tsIso: iso(-42), role: "Safety / Security", ack: true },
  ];
}

// --- Intrusion events (track inspection module) -----------------------------
export function buildIntrusions(): IntrusionEvent[] {
  return [
    { id: "IN-51", zone: "Coke Oven Hazard Zone", pos: [23.5402, 87.2872], tsIso: iso(-3), cameraId: "CAM-COB-2", confidence: 0.94, cleared: false, snapshotLabel: "Person on track near battery apron" },
    { id: "IN-50", zone: "Blast Furnace Hazard Zone", pos: [23.5418, 87.2905], tsIso: iso(-88), cameraId: "CAM-BF-1", confidence: 0.87, cleared: true, snapshotLabel: "Trespass at stock house crossing" },
    { id: "IN-49", zone: "Level Crossing LC-7 Hazard", pos: [23.5342, 87.3008], tsIso: iso(-160), cameraId: "CAM-LC7", confidence: 0.79, cleared: true, snapshotLabel: "Two-wheeler crossing against signal" },
    { id: "IN-48", zone: "Coke Oven Hazard Zone", pos: [23.5399, 87.2878], tsIso: iso(-240), cameraId: "CAM-COB-1", confidence: 0.91, cleared: true, snapshotLabel: "Contractor without PPE near track" },
  ];
}

// --- MIS report rows (completed cycles this shift) ---------------------------
export function buildMIS(): MISRow[] {
  const rows: [string, Commodity, string, number, number, number, number, number, string][] = [
    ["E-4468900", "imported-coking-coal", "RK-2231", -720, -520, 59, 3540, 3.3, "Released"],
    ["E-4469010", "iron-ore", "RK-2233", -690, -505, 52, 3120, 3.1, "Released"],
    ["E-4469120", "domestic-coal", "RK-2235", -650, -430, 58, 3480, 3.7, "Released"],
    ["E-4469355", "iron-ore", "RK-2238", -410, 0, 52, 3016, 6.8, "Detained"],
    ["E-4469640", "domestic-coal", "RK-2242", -8, 0, 58, 3422, 0.1, "In plant"],
    ["E-4469981", "finished-steel", "RK-2246", -140, 0, 42, 2310, 2.3, "Loading"],
    ["E-4470120", "domestic-coal", "RK-2249", -175, 0, 58, 3480, 2.9, "Unloading"],
    ["E-4470655", "empties", "RK-2255", -320, 0, 58, 0, 5.9, "Formation"],
    ["E-4470882", "imported-coking-coal", "RK-2258", -262, 0, 58, 3480, 5.2, "Unloading"],
    ["E-4471190", "imported-coking-coal", "RK-2261", -186, 0, 59, 3540, 3.1, "Placement"],
  ];
  const demurrageRate = 150; // ₹ per wagon per hour beyond free time (illustrative)
  return rows.map(([rr, c, rk, placed, released, wagons, net, dwell, status]) => {
    const over = Math.max(0, dwell - 4);
    return {
      rrNo: rr, commodity: c, rakeId: rk, placedIso: iso(placed),
      releasedIso: released === 0 ? "" : iso(released), wagons, netT: net, dwellHrs: dwell,
      demurrageInr: Math.round(over * wagons * demurrageRate), status,
    };
  });
}

// --- NL query canned exchanges (Ask LiquidMind) -----------------------------
export const NL_SUGGESTIONS = [
  "Which coking coal rakes crossed 6 hours dwell this shift?",
  "Total demurrage exposure right now",
  "Where is RK-2261?",
  "Which coking coal vessels are due this week?",
  "How many inbound coking coal rakes and their ETAs?",
];

export const NL_ANSWERS: Record<string, NLExchange> = {
  "Which coking coal rakes crossed 6 hours dwell this shift?": {
    q: "Which coking coal rakes crossed 6 hours dwell this shift?",
    a: "No imported coking-coal rake has crossed 6h dwell this shift yet. The closest is RK-2258 (Paradip) at 5.2h and already past free time — projected to breach 6h at 15:12. RK-2238 (iron ore) is the only rake over 6h at 6.8h.",
    chips: ["RK-2258 · 5.2h · past free time", "RK-2238 · 6.8h · iron ore"],
  },
  "Total demurrage exposure right now": {
    q: "Total demurrage exposure right now",
    a: "Live demurrage exposure across the plant is ₹1.24 lakh, concentrated in two rakes past free time: RK-2258 (₹41,300) and RK-2238 (₹83,000). Three more rakes breach free time within the next 2 hours if not released.",
    chips: ["₹1.24 L exposure now", "2 rakes past free time", "3 at risk < 2h"],
  },
  "Where is RK-2261?": {
    q: "Where is RK-2261?",
    a: "RK-2261 (imported coking coal, ex-Haldia, 59 wagons) is under placement on route Marshalling → Tippler T-1, 62% along, moving at 8 km/h, last confirmed by loco GNSS 40 seconds ago. Free time expires at 15:50 — 90 minutes of clearance remaining.",
    chips: ["Placement → Tippler T-1", "8 km/h · GNSS", "Free until 15:50"],
  },
  "Tippler T-1 utilisation today": {
    q: "Tippler T-1 utilisation today",
    a: "Tippler T-1 has handled 4 rakes this shift (RK-2231, RK-2258 active, RK-2261 inbound) at 78% utilisation. Idle time 1h 46m, largely a placement gap at 12:40. T-2 is running lower at 61% with a starvation alert open.",
    chips: ["78% utilisation", "4 rakes / shift", "1h46m idle"],
  },
  "How many inbound coking coal rakes and their ETAs?": {
    q: "How many inbound coking coal rakes and their ETAs?",
    a: "4 imported coking-coal rakes are inbound on the IR network. RK-2267 (Haldia) arrives in ~15 min; RK-2279 (Haldia) ~06:20; RK-2273 (Paradip) ~01:00 (+1, slipped +40m); RK-2281 (Vizag) ~10:00 (+1). Combined ~9,400 t against blast-furnace coke demand.",
    chips: ["4 inbound", "Next: RK-2267 in 15m", "~9,400 t en route"],
  },
  "Which coking coal vessels are due this week?": {
    q: "Which coking coal vessels are due this week?",
    a: "4 coking-coal vessels are tracked on the sea leg (AIS via Sagar Setu / PCS1x, surfaced through ULIP), ~317k t afloat. MV Bengal Trader is at Haldia anchorage, berth pending (~8h). MV Cape Orion (Hay Point → Haldia, 82k t) discharges in ~26h. MV Pacific Dawn (→ Paradip) ~58h, MV Iron Symphony (→ Vizag) ~96h. Rail-out is pre-planned as ≈54 rakes against BF coke demand.",
    chips: ["4 vessels · 317k t", "Bengal Trader · berth pending", "≈54 rakes planned"],
  },
};

// resolve an arbitrary query to the closest canned answer
export function answerFor(q: string): NLExchange {
  const key = Object.keys(NL_ANSWERS).find((k) => k.toLowerCase() === q.toLowerCase());
  if (key) return NL_ANSWERS[key];
  const fuzzy = Object.keys(NL_ANSWERS).find((k) => {
    const a = k.toLowerCase(); const b = q.toLowerCase();
    return a.includes(b) || b.includes(a) || b.split(" ").filter((w) => w.length > 3 && a.includes(w)).length >= 2;
  });
  if (fuzzy) return NL_ANSWERS[fuzzy];
  return {
    q,
    a: "This is a demonstration dataset. In the live deployment this query is answered by the agentic layer (Claude on Amazon Bedrock) over the plant's rake, dwell and MIS tables, with every figure traceable to a source event. Try one of the suggested questions to see a grounded answer.",
    chips: ["Demo mode", "Live: Claude on Bedrock"],
  };
}
