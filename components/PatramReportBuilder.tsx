"use client";
import { useState } from "react";
import { Panel, Badge, Dot, Stat } from "./ui";
import { fmtHrs, fmtInr } from "@/lib/format";
import { generatePatramReport, PATRAM_SEED_PROMPTS, type PatramReport } from "@/lib/seed";
import { COMMODITY_META, COMMODITY_MAP_COLOR } from "@/lib/commodities";
import type { MISRow } from "@/lib/types";
import { Sparkles, Loader2 } from "lucide-react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function PatramReportBuilder({ misData }: { misData: MISRow[] }) {
  const [query, setQuery] = useState(PATRAM_SEED_PROMPTS[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PatramReport | null>(null);

  async function run(q: string) {
    setQuery(q);
    setLoading(true);
    setReport(null);
    await new Promise((r) => setTimeout(r, 650));
    setReport(generatePatramReport(q, misData));
    setLoading(false);
  }

  const chartTooltipStyle = {
    background: "rgb(var(--surface))",
    border: "1px solid rgb(var(--line))",
    borderRadius: 8,
    color: "rgb(var(--t1))",
  };

  return (
    <Panel
      title="Patram AI — Natural-language report builder"
      sub="Describe the report in plain English — Patram reads this shift's MIS data and generates it, with charts, on demand"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {PATRAM_SEED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => run(p)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-accent/40 text-accent hover:bg-accent/10 transition"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && run(query)}
            placeholder="e.g. Iron ore rakes over 4 hours dwell this shift"
            className="flex-1 bg-surface-2 border border-panel-line rounded-lg px-3 py-2 text-[12.5px] text-t1 placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          <button
            onClick={() => run(query)}
            disabled={!query.trim() || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-t1 rounded-lg text-[12.5px] font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate report
          </button>
        </div>

        {loading && (
          <div className="text-[11.5px] text-muted flex items-center gap-2 py-2">
            <Loader2 size={12} className="animate-spin" /> Reading MIS data, matching filters…
          </div>
        )}

        {report && !loading && (
          <div className="space-y-3">
            <div className="rounded-lg border border-panel-line overflow-hidden">
              <div className="px-4 py-3 bg-panel/60 border-b border-panel-line">
                <div className="text-[12.5px] font-semibold text-t1">{report.title}</div>
                <div className="text-[11px] text-muted mt-0.5">{report.summary}</div>
              </div>
            </div>

            {report.rows.length > 0 && (
              <>
                {/* Data points */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Stat label="Rakes matched" value={String(report.totals.rakes)} sub={`${report.totals.wagons} wagons`} />
                  <Stat label="Net tonnage" value={report.totals.netT.toLocaleString("en-IN") + " t"} sub="matched rakes" />
                  <Stat label="Avg dwell (TAT)" value={fmtHrs(report.totals.avgDwellHrs)} sub="matched rakes" />
                  <Stat
                    label="Total demurrage"
                    value={report.totals.demurrageInr > 0 ? fmtInr(report.totals.demurrageInr) : "₹0"}
                    sub="matched rakes"
                    tone={report.totals.demurrageInr > 0 ? "bad" : "good"}
                  />
                </div>

                {/* Charts */}
                {report.byCommodity.length > 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-panel-line p-3">
                      <div className="text-[11px] font-medium text-t2 mb-1">Avg dwell (TAT) by commodity — hrs</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={report.byCommodity}>
                          <CartesianGrid strokeDasharray="0" stroke="rgb(var(--line))" />
                          <XAxis dataKey="label" tick={{ fill: "rgb(var(--t3))", fontSize: 10.5 }} />
                          <YAxis tick={{ fill: "rgb(var(--t3))", fontSize: 10.5 }} />
                          <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => fmtHrs(v)} />
                          <Bar dataKey="avgDwellHrs" radius={[4, 4, 0, 0]}>
                            {report.byCommodity.map((c) => (
                              <Cell key={c.commodity} fill={c.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="rounded-lg border border-panel-line p-3">
                      <div className="text-[11px] font-medium text-t2 mb-1">Demurrage by commodity — ₹</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={report.byCommodity}>
                          <CartesianGrid strokeDasharray="0" stroke="rgb(var(--line))" />
                          <XAxis dataKey="label" tick={{ fill: "rgb(var(--t3))", fontSize: 10.5 }} />
                          <YAxis tick={{ fill: "rgb(var(--t3))", fontSize: 10.5 }} />
                          <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => fmtInr(v)} />
                          <Bar dataKey="demurrageInr" radius={[4, 4, 0, 0]}>
                            {report.byCommodity.map((c) => (
                              <Cell key={c.commodity} fill={c.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Row-level table */}
                <div className="rounded-lg border border-panel-line overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-panel-line">
                          <th className="text-left py-2 px-3 font-semibold text-muted">Rake</th>
                          <th className="text-left py-2 px-3 font-semibold text-muted">Commodity</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted">Wagons</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted">Net (t)</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted">Dwell (TAT)</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted">Demurrage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.rows.map((r) => (
                          <tr key={r.rrNo} className="border-b border-panel-line last:border-b-0">
                            <td className="py-2 px-3 mono text-t1">{r.rakeId}</td>
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center gap-1.5">
                                <Dot color={COMMODITY_MAP_COLOR[r.commodity]} />
                                <span className="text-t2">{COMMODITY_META[r.commodity].short}</span>
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right mono text-t2">{r.wagons}</td>
                            <td className="py-2 px-3 text-right mono text-t2">{r.netT.toLocaleString("en-IN")}</td>
                            <td className="py-2 px-3 text-right mono text-t2">{fmtHrs(r.dwellHrs)}</td>
                            <td className="py-2 px-3 text-right mono text-t2">
                              {r.demurrageInr > 0 ? fmtInr(r.demurrageInr) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2.5 bg-panel/40 border-t border-panel-line flex items-center gap-2">
                    <Badge tone="neutral">Mock generation</Badge>
                    <span className="text-[10.5px] text-t3">
                      Filtered live from this shift&apos;s MIS data. Production runs this through Patram AI&apos;s
                      NLP layer over the full report warehouse, not keyword matching.
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
