"use client";
import React from "react";

export interface FlowNode {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeTone?: "brand" | "teal";
}

/**
 * A horizontal process track: icon nodes joined by a dashed rail-tie connector.
 * Nodes and connectors are laid out as normal flex siblings (never absolutely
 * stacked), so a connector can never visually cross a node — no arrow glyphs.
 */
export function FlowTrack({ nodes, scopeFrom }: { nodes: FlowNode[]; scopeFrom?: number }) {
  return (
    <div className="overflow-x-auto py-1">
      <div className="flex items-start min-w-max px-1">
        {nodes.map((n, i) => {
          const inScope = scopeFrom !== undefined && i >= scopeFrom;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-2 shrink-0" style={{ width: 104 }}>
                <div
                  className={`grid h-12 w-12 place-items-center rounded-full border-2 transition-colors ${
                    inScope ? "border-brand bg-brand/10 text-brand" : "border-line bg-surface-2 text-t2"
                  }`}
                >
                  {n.icon}
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-medium leading-tight text-t1">{n.label}</div>
                  {n.sublabel && <div className="mt-0.5 text-[9.5px] leading-tight text-muted">{n.sublabel}</div>}
                  {n.badge && (
                    <div className={`mt-1 text-[9px] font-semibold tracking-wide ${n.badgeTone === "brand" ? "text-brand" : "text-accent-teal"}`}>
                      {n.badge}
                    </div>
                  )}
                </div>
              </div>

              {i < nodes.length - 1 && (
                <div className="flex shrink-0 items-center pt-6" style={{ width: 30 }}>
                  <div
                    className={`w-full border-t-2 border-dashed ${
                      scopeFrom !== undefined && i + 1 >= scopeFrom ? "border-brand/50" : "border-line"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
