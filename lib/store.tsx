"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Rake, Alert, IntrusionEvent, InboundRake, Vessel } from "./types";
import { buildRakes, buildInbound, buildAlerts, buildIntrusions, buildVessels, SHIFT_NOW } from "./seed";
import { PORTS, interpolate, route } from "./network";

interface StoreValue {
  rakes: Rake[];
  inbound: InboundRake[];
  vessels: Vessel[];
  alerts: Alert[];
  intrusions: IntrusionEvent[];
  nowMs: number;         // simulated clock, drives countdowns
  tick: number;
  selectedRakeId: string | null;
  setSelectedRakeId: (id: string | null) => void;
  ackAlert: (id: string) => void;
}

const Ctx = createContext<StoreValue | null>(null);

// Advance a rake one simulation step: move along its route, park at the end.
function advance(r: Rake): Rake {
  if (r.status !== "moving" || r.progress >= 1) return r;
  const pts = route(r.routeId).points;
  // step scaled by speed; routes are short so keep increments gentle
  const step = (r.speedKmph / 3600) * 3 * 0.02 + 0.006;
  let progress = Math.min(1, r.progress + step);
  const position = interpolate(pts, progress);
  let status: Rake["status"] = r.status;
  let stage: Rake["stage"] = r.stage;
  if (progress >= 1) {
    status = r.commodity === "empties" ? "idle" : r.commodity === "finished-steel" ? "loading" : "unloading";
    stage = r.commodity === "empties" ? "handover" : r.commodity === "finished-steel" ? "loading" : "unloading";
  }
  return { ...r, progress, position, status, stage, speedKmph: progress >= 1 ? 0 : r.speedKmph };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [rakes, setRakes] = useState<Rake[]>(() => buildRakes());
  const [inbound, setInbound] = useState<InboundRake[]>(() => buildInbound());
  const [vessels, setVessels] = useState<Vessel[]>(() => buildVessels());
  const [alerts, setAlerts] = useState<Alert[]>(() => buildAlerts());
  const [intrusions] = useState<IntrusionEvent[]>(() => buildIntrusions());
  const [tick, setTick] = useState(0);
  const [nowMs, setNowMs] = useState(() => SHIFT_NOW.getTime());
  const [selectedRakeId, setSelectedRakeId] = useState<string | null>(null);
  const start = useRef(SHIFT_NOW.getTime());

  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      setNowMs((n) => n + 20000); // 20 simulated seconds per tick
      setRakes((rs) => rs.map(advance));
      setInbound((ins) =>
        ins.map((i) => {
          if (i.progress >= 1) return i;
          const progress = Math.min(1, i.progress + 0.004 + i.progress * 0.001);
          const pos: [number, number] = [
            i.originPos[0] + (23.528 - i.originPos[0]) * progress,
            i.originPos[1] + (87.318 - i.originPos[1]) * progress,
          ];
          return { ...i, progress, pos };
        })
      );
      setVessels((vs) =>
        vs.map((v) => {
          if (v.status !== "at-sea" || v.progress >= 1) return v;
          const dest = PORTS[v.destPortId].pos;
          const progress = Math.min(1, v.progress + 0.0016);
          const pos: [number, number] = [
            v.pos[0] + (dest[0] - v.pos[0]) * 0.02,
            v.pos[1] + (dest[1] - v.pos[1]) * 0.02,
          ];
          return { ...v, progress, pos };
        })
      );
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const ackAlert = (id: string) => setAlerts((a) => a.map((x) => (x.id === id ? { ...x, ack: true } : x)));

  const value = useMemo<StoreValue>(
    () => ({ rakes, inbound, vessels, alerts, intrusions, nowMs, tick, selectedRakeId, setSelectedRakeId, ackAlert }),
    [rakes, inbound, vessels, alerts, intrusions, nowMs, tick, selectedRakeId]
  );
  void start;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}
