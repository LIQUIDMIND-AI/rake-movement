import type { Commodity } from "./types";

export const COMMODITY_META: Record<Commodity, { label: string; short: string; color: string; icon: string }> = {
  "imported-coking-coal": { label: "Imported Coking Coal", short: "Cok.Coal", color: "#0f172a", icon: "▮" },
  "domestic-coal": { label: "Domestic Coal (CIL)", short: "Dom.Coal", color: "#64748b", icon: "▮" },
  "iron-ore": { label: "Iron Ore", short: "Ore", color: "#b45309", icon: "▮" },
  "limestone-flux": { label: "Limestone / Flux", short: "Flux", color: "#0891b2", icon: "▮" },
  "empties": { label: "Empty Rake", short: "Empties", color: "#94a3b8", icon: "▯" },
  "finished-steel": { label: "Finished Steel", short: "Steel", color: "#2dd4bf", icon: "▮" },
};

// Bright, map-legible variants used for rake markers on the dark basemap.
export const COMMODITY_MAP_COLOR: Record<Commodity, string> = {
  "imported-coking-coal": "#f97316",
  "domestic-coal": "#a78bfa",
  "iron-ore": "#fbbf24",
  "limestone-flux": "#38bdf8",
  "empties": "#94a3b8",
  "finished-steel": "#2dd4bf",
};
