"use client";
import { useState } from "react";
import { buildMIS } from "@/lib/seed";
import { Panel, Stat, Badge, Dot, PageHeader } from "@/components/ui";
import { fmtTime, fmtInr, fmtHrs } from "@/lib/format";
import { COMMODITY_META, COMMODITY_MAP_COLOR } from "@/lib/commodities";
import type { Commodity, MISRow } from "@/lib/types";
import { FileBarChart2, Download } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export default function MISReports() {
  const [period, setPeriod] = useState<"shift" | "daily" | "monthly">("shift");
  const misData = buildMIS();

  // Calculate stat tiles
  const rakesHandled = misData.length;
  const totalNetT = misData.reduce((sum, row) => sum + row.netT, 0);
  const avgDwell = misData.length > 0 ? misData.reduce((sum, row) => sum + row.dwellHrs, 0) / misData.length : 0;
  const totalDemurrage = misData.reduce((sum, row) => sum + row.demurrageInr, 0);

  // Chart data: rakes by commodity
  const rakesByCommodity = Object.entries(
    misData.reduce<Record<string, number>>((m, row) => {
      m[row.commodity] = (m[row.commodity] || 0) + 1;
      return m;
    }, {})
  ).map(([commodity, count]) => ({
    commodity: COMMODITY_META[commodity as Commodity].short,
    count,
    fill: COMMODITY_MAP_COLOR[commodity as Commodity],
  }));

  // Chart data: avg dwell by commodity
  const dwellByCommodity = Object.entries(
    misData.reduce<Record<string, { total: number; count: number }>>((m, row) => {
      if (!m[row.commodity]) m[row.commodity] = { total: 0, count: 0 };
      m[row.commodity].total += row.dwellHrs;
      m[row.commodity].count += 1;
      return m;
    }, {})
  ).map(([commodity, { total, count }]) => ({
    commodity: COMMODITY_META[commodity as Commodity].short,
    avgDwell: total / count,
    fill: COMMODITY_MAP_COLOR[commodity as Commodity],
  }));

  // Chart data: rakes per shift (fabricated for last 6 shifts)
  const rakesPerShift = [
    { shift: "A-Shift (D-1)", rakes: 9 },
    { shift: "B-Shift (D-1)", rakes: 11 },
    { shift: "C-Shift (D-1)", rakes: 8 },
    { shift: "A-Shift (D0)", rakes: 10 },
    { shift: "B-Shift (D0)", rakes: rakesHandled },
    { shift: "C-Shift (D0)", rakes: 0 },
  ];

  return (
    <div className="p-5 space-y-4">
      {/* Page Header */}
      <PageHeader
        title="MIS Reports"
        sub="Shift, daily and RR-wise reports — generated automatically, not compiled by hand"
        icon={<FileBarChart2 size={20} />}
        actions={
          <div className="flex items-center gap-2">
            {/* Segmented toggle */}
            <div className="inline-flex gap-0.5 bg-panel rounded-lg p-1">
              {(["shift", "daily", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                    period === p
                      ? "bg-brand text-slate-900"
                      : "text-t2 hover:text-t1"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Export buttons */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-panel-line text-xs text-t2 hover:text-t1 transition">
              <Download size={13} />
              Export XLSX
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-panel-line text-xs text-t2 hover:text-t1 transition">
              <Download size={13} />
              Export PDF
            </button>
          </div>
        }
      />

      {/* Stat tiles row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Rakes handled this shift"
          value={String(rakesHandled)}
          sub="B-Shift in progress"
        />
        <Stat
          label="Total net tonnage unloaded"
          value={totalNetT.toLocaleString("en-IN") + " t"}
          sub="net weight"
        />
        <Stat
          label="Avg dwell"
          value={fmtHrs(avgDwell)}
          sub="all rakes"
        />
        <Stat
          label="Total demurrage incurred"
          value={fmtInr(totalDemurrage)}
          sub="this shift"
          tone="bad"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rakes by commodity */}
        <Panel title="Rakes by commodity" sub="Count this shift">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rakesByCommodity}>
              <CartesianGrid strokeDasharray="0" stroke="rgb(var(--line))" />
              <XAxis
                dataKey="commodity"
                tick={{ fill: "rgb(var(--t3))", fontSize: 11 }}
              />
              <YAxis tick={{ fill: "rgb(var(--t3))", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--line))",
                  borderRadius: 8,
                  color: "rgb(var(--t1))",
                }}
              />
              <Bar dataKey="count" fill="rgb(var(--brand))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Avg dwell by commodity */}
        <Panel title="Avg dwell by commodity" sub="Hours">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dwellByCommodity}>
              <CartesianGrid strokeDasharray="0" stroke="rgb(var(--line))" />
              <XAxis
                dataKey="commodity"
                tick={{ fill: "rgb(var(--t3))", fontSize: 11 }}
              />
              <YAxis tick={{ fill: "rgb(var(--t3))", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--line))",
                  borderRadius: 8,
                  color: "rgb(var(--t1))",
                }}
                formatter={(value: any) => fmtHrs(value)}
              />
              <Line
                type="monotone"
                dataKey="avgDwell"
                stroke="#2dd4bf"
                strokeWidth={2}
                dot={{ fill: "#2dd4bf", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        {/* Rakes per shift */}
        <Panel title="Rakes per shift" sub="Last 6 shifts">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={rakesPerShift}>
              <CartesianGrid strokeDasharray="0" stroke="rgb(var(--line))" />
              <XAxis
                dataKey="shift"
                tick={{ fill: "rgb(var(--t3))", fontSize: 11 }}
              />
              <YAxis tick={{ fill: "rgb(var(--t3))", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--line))",
                  borderRadius: 8,
                  color: "rgb(var(--t1))",
                }}
              />
              <Area
                type="monotone"
                dataKey="rakes"
                fill="#38bdf8"
                stroke="#38bdf8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* MIS table */}
      <Panel title="Rake-wise MIS — current shift (B-Shift)" sub="Detailed completion log">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-panel-line">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted">RR No</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted">Rake</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted">Commodity</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted">Placed</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted">Released</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted">Wagons</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted">Net (t)</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted">Dwell</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted">Demurrage</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {misData.map((row) => (
                <tr key={row.rrNo} className="border-b border-panel-line hover:bg-panel transition">
                  <td className="px-4 py-2.5 mono text-t1">{row.rrNo}</td>
                  <td className="px-4 py-2.5 mono text-t1">{row.rakeId}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Dot color={COMMODITY_MAP_COLOR[row.commodity]} />
                      <span className="text-t2">{COMMODITY_META[row.commodity].short}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-t2">{fmtTime(row.placedIso)}</td>
                  <td className="px-4 py-2.5 text-t2">
                    {row.releasedIso ? fmtTime(row.releasedIso) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right mono text-t2">{row.wagons}</td>
                  <td className="px-4 py-2.5 text-right mono text-t2">{row.netT.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 text-right mono text-t2">{fmtHrs(row.dwellHrs)}</td>
                  <td className="px-4 py-2.5 text-right mono text-t2">
                    {row.demurrageInr > 0 ? fmtInr(row.demurrageInr) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge
                      tone={
                        row.status === "Released"
                          ? "good"
                          : row.status === "Detained"
                          ? "critical"
                          : "info"
                      }
                    >
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {/* Footer totals row */}
              <tr className="border-t-2 border-panel-line bg-panel font-semibold">
                <td colSpan={2} className="px-4 py-2.5 text-t1">
                  TOTAL
                </td>
                <td className="px-4 py-2.5" />
                <td className="px-4 py-2.5" />
                <td className="px-4 py-2.5" />
                <td className="px-4 py-2.5 text-right mono text-t1">
                  {misData.reduce((s, r) => s + r.wagons, 0)}
                </td>
                <td className="px-4 py-2.5 text-right mono text-t1">
                  {totalNetT.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-2.5 text-right mono text-t2">
                  {fmtHrs(avgDwell)}
                </td>
                <td className="px-4 py-2.5 text-right mono text-t1">
                  {fmtInr(totalDemurrage)}
                </td>
                <td className="px-4 py-2.5" />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-muted border-t border-panel-line pt-3">
          Customised reports (RR-wise, siding-wise, commodity-wise, detention-wise) generated on demand and scheduled to email/SAP.
        </div>
      </Panel>
    </div>
  );
}
