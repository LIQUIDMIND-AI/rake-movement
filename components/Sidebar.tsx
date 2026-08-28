"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Map, Ship, Route, Timer, FileBarChart2,
  ShieldAlert, MessageSquareText, Boxes, Train,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Control Room", icon: LayoutDashboard, group: "Operations" },
  { href: "/plant-map", label: "Live Plant Map", icon: Map, group: "Operations" },
  { href: "/inbound", label: "Inbound Tracking", icon: Ship, group: "Operations" },
  { href: "/lifecycle", label: "Rake Lifecycle", icon: Route, group: "Operations" },
  { href: "/demurrage", label: "Dwell & Demurrage", icon: Timer, group: "Operations" },
  { href: "/mis", label: "MIS Reports", icon: FileBarChart2, group: "Intelligence" },
  { href: "/alerts", label: "Alerts & Intrusion", icon: ShieldAlert, group: "Intelligence" },
  { href: "/ask", label: "Ask LiquidMind", icon: MessageSquareText, group: "Intelligence" },
  { href: "/exim", label: "EXIM Intelligence", icon: Boxes, group: "Intelligence" },
];

export function Sidebar() {
  const path = usePathname();
  const groups = ["Operations", "Intelligence"];
  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-panel-line flex flex-col">
      <div className="px-4 py-4 border-b border-panel-line">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30">
            <Train size={19} />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-t1">DSP Wagon Track</div>
            <div className="text-[10.5px] text-muted">SAIL Durgapur · Control Room</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {groups.map((g) => (
          <div key={g} className="mb-4">
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-t3">{g}</div>
            {NAV.filter((n) => n.group === g).map((n) => {
              const active = path === n.href;
              const Icon = n.icon;
              return (
                <Link key={n.href} href={n.href}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] mb-0.5 transition
                    ${active ? "bg-brand/15 text-brand ring-1 ring-brand/25 font-medium" : "text-t2 hover:bg-surface-3 hover:text-t1"}`}>
                  <Icon size={16} className={active ? "text-brand" : "text-t3"} />
                  {n.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-panel-line">
        <div className="text-[10.5px] text-muted leading-relaxed">
          <span className="text-t2 font-medium">Pravartanam</span> Digital
          Transformation Programme
        </div>
        <div className="mt-1 text-[10px] text-t3">Powered by LIQUIDMIND<span className="text-brand">®</span>.AI</div>
      </div>
    </aside>
  );
}
