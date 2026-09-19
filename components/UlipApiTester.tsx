"use client";
import { useEffect, useMemo, useState } from "react";
import { Panel, Badge } from "./ui";
import { Boxes, Loader2, Camera } from "lucide-react";
import { ICEGATE_CATALOG, todayDDMMYYYY, type IcegateApi } from "@/lib/ulip-catalog";

type Status = { connected: boolean; baseUrl: string; error?: string };

function defaultsFor(api: IcegateApi): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of api.fields) out[f.k] = f.date ? todayDDMMYYYY() : f.v ?? "";
  return out;
}

// Turn ULIP's response into a one-line human status + tone for the screenshot.
function summarize(data: any): { tone: "good" | "warning" | "bad"; label: string } {
  if (!data) return { tone: "bad", label: "No response" };
  if (data.error && !data.response) return { tone: "bad", label: String(data.error) };
  const ulip = data.response ?? data;
  const inner = Array.isArray(ulip?.response) ? ulip.response[0]?.response : ulip?.response;
  const code = ulip?.code ?? data?.code;
  if (typeof inner === "string") {
    // e.g. "ICEGATE_02 - 3rd party service is down!"
    return { tone: "warning", label: inner };
  }
  if (inner?.errCode) {
    return { tone: "warning", label: `${inner.errCode} — ${inner.errMsg ?? ""}`.trim() };
  }
  if (inner && typeof inner === "object") {
    return { tone: "good", label: `HTTP ${code ?? 200} — records returned` };
  }
  return { tone: "good", label: `HTTP ${code ?? 200}` };
}

export function UlipApiTester() {
  const [status, setStatus] = useState<Status | null>(null);
  const [apiNo, setApiNo] = useState<number>(2);
  const api = useMemo(() => ICEGATE_CATALOG.find((a) => a.api === apiNo)!, [apiNo]);
  const [fields, setFields] = useState<Record<string, string>>(() => defaultsFor(api));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [ranAt, setRanAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ulip/status").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  // Reset inputs to the selected API's defaults when the API changes.
  useEffect(() => {
    setFields(defaultsFor(api));
    setResult(null);
    setRanAt(null);
  }, [api]);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ulip/icegate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api: apiNo, body: fields }),
      });
      setResult(await res.json());
      setRanAt(new Date().toLocaleString());
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : String(e) });
      setRanAt(new Date().toLocaleString());
    } finally {
      setLoading(false);
    }
  }

  const s = result ? summarize(result) : null;

  return (
    <Panel
      title="ULIP ICEGATE — API Test Console"
      sub="Live calls to ULIP staging via the whitelisted egress. Use for prod-access test-case screenshots (one per API)."
      right={
        status && (
          <Badge tone={status.connected ? "good" : "bad"}>
            {status.connected ? "ULIP staging connected" : "ULIP unreachable"}
          </Badge>
        )
      }
    >
      {/* API selector */}
      <div className="flex flex-wrap gap-1.5">
        {ICEGATE_CATALOG.map((a) => (
          <button
            key={a.api}
            onClick={() => setApiNo(a.api)}
            className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
              a.api === apiNo
                ? "border-brand bg-brand/10 text-brand"
                : "border-panel-line bg-surface-3 text-t2 hover:text-t1"
            }`}
          >
            {a.code}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[12px] text-t2">
        <span className="font-semibold text-t1">{api.code}</span> — {api.name}
      </p>

      {/* Request inputs */}
      <div className="mt-2 flex flex-wrap items-end gap-2">
        {api.fields.map((f) => (
          <label key={f.k} className="text-[11px] text-muted">
            {f.label}
            <input
              value={fields[f.k] ?? ""}
              onChange={(e) => setFields((prev) => ({ ...prev, [f.k]: e.target.value }))}
              className="mt-1 block w-36 rounded-md border border-panel-line bg-surface-3 px-2 py-1.5 text-[12px] text-t1"
            />
          </label>
        ))}
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-60"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Boxes size={13} />}
          Call {api.code}
        </button>
      </div>

      {/* Request echo + response */}
      {result && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={s!.tone}>{s!.label}</Badge>
            {typeof result.ms === "number" && (
              <span className="text-[11px] text-muted">{result.ms} ms</span>
            )}
            {ranAt && <span className="text-[11px] text-muted">· {ranAt}</span>}
          </div>

          <div className="text-[11px] text-muted">
            <span className="font-semibold text-t2">POST</span>{" "}
            <span className="mono">/ulip/v1.0.0/{api.code}</span>{" "}
            <span className="mono text-t3">{JSON.stringify(result.request ?? fields)}</span>
          </div>

          <pre className="max-h-72 overflow-auto rounded-md border border-panel-line bg-surface-3 p-3 text-[11px] text-t2">
            {JSON.stringify(result.response ?? result.body ?? result, null, 2)}
          </pre>
        </div>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted">
        <Camera size={13} className="mt-0.5 shrink-0" />
        Screenshot this panel (request + response visible) as the “created application” test case
        for each API. A valid business response such as “No Records Available” still demonstrates a
        working integration.
      </p>
    </Panel>
  );
}
