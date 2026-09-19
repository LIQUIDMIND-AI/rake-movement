"use client";
import { useEffect, useState } from "react";
import { Panel, Badge } from "./ui";
import { Boxes, Loader2 } from "lucide-react";

type Status = { connected: boolean; baseUrl: string; error?: string };

// ULIP rejects Bill-of-Entry dates older than ~6 months (ERROR0003). Default to
// today (DDMMYYYY) so the demo shows a clean response instead of a stale-date error.
function todayDDMMYYYY() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}${mm}${d.getFullYear()}`;
}

export function UlipLookup() {
  const [status, setStatus] = useState<Status | null>(null);
  const [beNo, setBeNo] = useState("1234567");
  const [beDt, setBeDt] = useState(todayDDMMYYYY);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ulip/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch((e) => setStatus({ connected: false, baseUrl: "", error: String(e) }));
  }, []);

  async function runLookup() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ulip/import-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beNo, beDt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel
      title="ULIP Live Lookup — Bill of Entry"
      sub="Real call to ULIP/ICEGATE staging (gmmt_liquidmind_usr) — not seeded data"
      right={
        status && (
          <Badge tone={status.connected ? "good" : "bad"}>
            {status.connected ? "ULIP staging connected" : "ULIP unreachable"}
          </Badge>
        )
      }
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[11px] text-muted">
          BE No.
          <input
            value={beNo}
            onChange={(e) => setBeNo(e.target.value)}
            className="mt-1 block w-32 rounded-md border border-panel-line bg-surface-3 px-2 py-1.5 text-[12px] text-t1"
          />
        </label>
        <label className="text-[11px] text-muted">
          BE Date (DDMMYYYY)
          <input
            value={beDt}
            onChange={(e) => setBeDt(e.target.value)}
            className="mt-1 block w-32 rounded-md border border-panel-line bg-surface-3 px-2 py-1.5 text-[12px] text-t1"
          />
        </label>
        <button
          onClick={runLookup}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-60"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Boxes size={13} />}
          Run live lookup
        </button>
      </div>

      {error && <p className="mt-3 text-[11.5px] text-accent-red">{error}</p>}

      {typeof result !== "undefined" && result !== null && (
        <pre className="mt-3 max-h-72 overflow-auto rounded-md border border-panel-line bg-surface-3 p-3 text-[11px] text-t2">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </Panel>
  );
}
