// ---------------------------------------------------------------------------
// Domain types for the SAIL DSP Live Wagon Tracking & Reporting Dashboard
// ---------------------------------------------------------------------------

export type LatLng = [number, number]; // [lat, lng]

export type Commodity =
  | "imported-coking-coal"
  | "domestic-coal"
  | "iron-ore"
  | "limestone-flux"
  | "empties"
  | "finished-steel";

export type SensorSource = "RFID" | "GNSS" | "OCR" | "WEIGHBRIDGE" | "FOIS" | "ULIP";

// Provenance of a vessel (sea-leg) position feed.
export type VesselSource = "Sagar Setu (NLP-Marine)" | "PCS1x" | "AIS · DGLL" | "ULIP";

export type VesselStatus = "at-sea" | "anchorage" | "berthed" | "discharging";

export interface Vessel {
  id: string;             // internal id
  name: string;           // vessel name
  imo: string;            // IMO number
  cargo: Commodity;       // typically imported-coking-coal
  cargoT: number;         // cargo tonnage
  grade: string;          // coal grade / blend
  loadPort: string;       // origin load port (e.g. Hay Point, AU)
  destPort: string;       // Indian discharge port
  destPortId: "haldia" | "paradip" | "vizag";
  pos: LatLng;            // current at-sea position
  speedKn: number;        // knots
  courseDeg: number;      // heading
  progress: number;       // 0..1 of the modelled sea leg toward destination
  etaPortIso: string;     // ETA at discharge port
  status: VesselStatus;
  source: VesselSource;
  linkedRakePlan: string; // e.g. "≈ 4 rakes on discharge"
}

// End-to-end lifecycle stages of a rake, from IR interchange to return handover.
export type LifecycleStage =
  | "en-route"          // inbound on IR network, tracked via FOIS/ULIP
  | "interchange"       // arrived at DSP interchange yard, awaiting acceptance
  | "accepted"          // taken over from IR by plant railway
  | "placement"         // being placed at a tippler / unloading / loading point
  | "unloading"         // active tippling / unloading
  | "loading"           // loading finished steel / by-products
  | "formation"         // empties being formed into a rake
  | "handover";         // handed back to Indian Railways

export type RakeStatus = "moving" | "halted" | "unloading" | "loading" | "idle" | "detained";

export interface Wagon {
  id: string;           // wagon number
  type: string;         // BOXN, BOBRN, etc.
  tareT: number;
  grossT: number;       // 0 if empty
  tagged: boolean;      // RFID-tagged vs OCR-identified
  lastSensor: SensorSource;
}

export interface Rake {
  id: string;               // rake id e.g. RK-2261
  rrNo: string;             // railway receipt / indent no
  commodity: Commodity;
  origin: string;           // port / colliery / source
  wagonCount: number;
  loadedT: number;
  status: RakeStatus;
  stage: LifecycleStage;
  position: LatLng;         // current position
  routeId: string;         // which track polyline it is travelling on
  progress: number;         // 0..1 along the route polyline
  speedKmph: number;
  headingLabel: string;     // destination node label e.g. "Tippler T2"
  loco: string;             // loco number
  arrivalIso: string;       // arrival at plant / interchange
  freeUntilIso: string;     // demurrage free-time deadline
  detentionHrs: number;     // hours held so far
  turnaroundHrs: number | null;
  lastSensor: SensorSource;
  wagons: Wagon[];
  lifecycle: LifecycleEvent[];
}

export interface LifecycleEvent {
  stage: LifecycleStage;
  label: string;
  location: string;
  tsIso: string;
  source: SensorSource;
  done: boolean;
}

// A node in the plant rail network (yard, tippler, junction, gate).
export type NodeKind =
  | "gate" | "interchange" | "yard" | "tippler" | "unloading"
  | "loading" | "weighbridge" | "cokeoven" | "blastfurnace" | "junction";

export interface TrackNode {
  id: string;
  label: string;
  kind: NodeKind;
  pos: LatLng;
}

export interface TrackRoute {
  id: string;
  label: string;
  points: LatLng[];       // polyline
  commodityHint?: Commodity;
}

// Geofenced operational zone (tippler apron, hazard zone, etc.)
export interface Geofence {
  id: string;
  label: string;
  kind: "operational" | "hazard";
  polygon: LatLng[];
}

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertKind =
  | "free-time-breach" | "abnormal-halt" | "tippler-starvation"
  | "intrusion" | "overspeed" | "detention" | "eta-slip";

export interface Alert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  rakeId?: string;
  location: string;
  tsIso: string;
  role: string;          // routed-to role
  ack: boolean;
}

export interface IntrusionEvent {
  id: string;
  zone: string;
  pos: LatLng;
  tsIso: string;
  cameraId: string;
  confidence: number;
  cleared: boolean;
  snapshotLabel: string;
}

export interface InboundRake {
  id: string;
  commodity: Commodity;
  origin: string;        // port
  originPos: LatLng;
  pos: LatLng;
  progress: number;
  etaIso: string;
  distanceKm: number;
  status: string;
  source: SensorSource;
  vessel?: string;
}

export interface KPI {
  label: string;
  value: string;
  sub: string;
  trend?: number;        // percent change
  tone?: "good" | "bad" | "neutral";
}

export interface MISRow {
  rrNo: string;
  commodity: Commodity;
  rakeId: string;
  placedIso: string;
  releasedIso: string;
  wagons: number;
  netT: number;
  dwellHrs: number;
  demurrageInr: number;
  status: string;
}

export interface NLExchange {
  q: string;
  a: string;
  chips?: string[];      // data chips shown under the answer
}
