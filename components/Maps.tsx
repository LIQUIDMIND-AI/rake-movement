"use client";
import dynamic from "next/dynamic";

const loading = (
  <div className="grid h-full min-h-[300px] w-full place-items-center rounded-xl bg-surface-2 text-sm text-muted">
    <span className="animate-pulse">Loading map…</span>
  </div>
);

export const PlantMapCanvas = dynamic(() => import("./PlantMap").then((m) => m.PlantMap), {
  ssr: false, loading: () => loading,
});

export const InboundMapCanvas = dynamic(() => import("./InboundMap").then((m) => m.InboundMap), {
  ssr: false, loading: () => loading,
});
