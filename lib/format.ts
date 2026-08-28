export function fmtTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function fmtDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

export function fmtInr(n: number): string {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
  return "₹" + n.toLocaleString("en-IN");
}

export function fmtHrs(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}h ${String(mm).padStart(2, "0")}m`;
}

// signed countdown from now to an ISO deadline, using a supplied "now"
export function countdown(nowMs: number, iso: string): { text: string; breached: boolean; mins: number } {
  const diffMs = new Date(iso).getTime() - nowMs;
  const breached = diffMs < 0;
  const mins = Math.round(Math.abs(diffMs) / 60000);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  const body = `${hh}h ${String(mm).padStart(2, "0")}m`;
  return { text: breached ? `+${body} over` : body, breached, mins: Math.round(diffMs / 60000) };
}
