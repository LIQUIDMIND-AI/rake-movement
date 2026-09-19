// Server-only client for ULIP (Unified Logistics Interface Platform) / ICEGATE.
// Docs/quirks captured in ulip/Liquidmind_Technical_Handover.docx:
//  - Accept: application/json is mandatory, or ULIP returns HTTP 400 with an empty body.
//  - Do NOT send requestId — the spec says optional but ULIP returns HTTP 500 if present.
//  - Login token lives at response.id (JWT, HS512), not response.token.
//  - Dates are DDMMYYYY; anything older than ~6 months returns ERROR0003 / ERROR0008.
//  - ULIP whitelists the CALLER'S source IP. A non-whitelisted IP gets HTTP 412
//    ("Access denied Please contact ULIP support!"). Set ULIP_PROXY_URL to route
//    every ULIP request through the dev-bastion's forward proxy so the request
//    egresses from the whitelisted Elastic IP (works identically on Vercel).
import "server-only";
import { readFileSync } from "node:fs";
// Use undici's OWN fetch (not Node's built-in global fetch): a ProxyAgent created
// from the installed undici package is only accepted as a `dispatcher` by that same
// package's fetch. Mixing them throws UND_ERR_INVALID_ARG.
import { fetch as undiciFetch, ProxyAgent, type Dispatcher } from "undici";

const BASE_URL = process.env.ULIP_BASE_URL ?? "https://www.ulipstaging.dpiit.gov.in";
const USERNAME = process.env.ULIP_USERNAME;
const PASSWORD = process.env.ULIP_PASSWORD;
// Forward proxy on the dev-bastion (egresses from the whitelisted EIP). Prefer the
// TLS endpoint so the FIRST hop (app -> bastion) is encrypted too:
//   https://<user>:<pass>@<dev-bastion-eip>:8443   (nginx TLS -> tinyproxy)
// Plain http://...:3128 also works but sends the proxy credential in cleartext.
// Unset => direct connection.
const PROXY_URL = process.env.ULIP_PROXY_URL;
// For an https:// proxy using a self-signed cert, pin it here: either the PEM text
// itself or a path to a .crt file. Not a secret (public cert) — safe to commit/ship.
const PROXY_CA = loadProxyCa();

function loadProxyCa(): string | undefined {
  const v = process.env.ULIP_PROXY_CA?.trim();
  if (!v) return undefined;
  if (v.includes("BEGIN CERTIFICATE")) return v;
  try {
    return readFileSync(v, "utf8");
  } catch {
    console.warn(`ULIP_PROXY_CA path not readable: ${v}`);
    return undefined;
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;

// One shared dispatcher so every ULIP call reuses the same proxied connection pool.
let proxyDispatcher: Dispatcher | undefined;
function ulipDispatcher(): Dispatcher | undefined {
  if (!PROXY_URL) return undefined;
  if (!proxyDispatcher) {
    // Pull credentials out of the URL so they become a Proxy-Authorization header
    // (undici does not always parse userinfo from the URI), and TLS-pin the proxy
    // when a CA is supplied (https:// endpoint).
    const u = new URL(PROXY_URL);
    const token =
      u.username || u.password
        ? "Basic " +
          Buffer.from(
            `${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`,
          ).toString("base64")
        : undefined;
    const uri = `${u.protocol}//${u.host}${u.pathname === "/" ? "" : u.pathname}`;
    proxyDispatcher = new ProxyAgent({
      uri,
      token,
      proxyTls: PROXY_CA ? { ca: PROXY_CA } : undefined,
    });
  }
  return proxyDispatcher;
}

// Wrapper around undici.fetch that injects the proxy dispatcher when configured.
type UlipFetchInit = Parameters<typeof undiciFetch>[1] & { dispatcher?: Dispatcher };
function ulipFetch(url: string, init: UlipFetchInit) {
  const dispatcher = ulipDispatcher();
  return undiciFetch(url, dispatcher ? { ...init, dispatcher } : init);
}

async function login(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  if (!USERNAME || !PASSWORD) {
    throw new Error("ULIP_USERNAME / ULIP_PASSWORD are not configured");
  }

  const res = await ulipFetch(`${BASE_URL}/ulip/v1.0.0/user/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`ULIP login failed (${res.status}): ${text || "empty body"}`);

  const data = JSON.parse(text);
  const token: string | undefined = data?.response?.id;
  if (!token) throw new Error("ULIP login response did not contain response.id");

  // JWT lifetime unknown from docs — refresh a little defensively (20 min).
  cachedToken = { value: token, expiresAt: Date.now() + 20 * 60 * 1000 };
  return token;
}

async function icegateCall(apiNumber: number, body: Record<string, string>) {
  const token = await login();
  // ULIP's path is case-sensitive and zero-padded: ICEGATE/02, not icegate/2.
  // A lowercase / non-padded path is rejected by the gateway with HTTP 403 (empty body).
  const api = `ICEGATE/${String(apiNumber).padStart(2, "0")}`;
  const res = await ulipFetch(`${BASE_URL}/ulip/v1.0.0/${api}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  if (!res.ok) {
    const err = new Error(`${api} failed (${res.status})`) as Error & { body?: unknown; status?: number };
    err.body = parsed;
    err.status = res.status;
    throw err;
  }
  return parsed;
}

// DDMM YYYY formatter for the dates ULIP expects.
export function toUlipDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}${mm}${d.getFullYear()}`;
}

// Generic ICEGATE caller for the test console (any implemented API + its fields).
export function callIcegate(apiNumber: number, body: Record<string, string>) {
  return icegateCall(apiNumber, body);
}

// ICEGATE/02 — Bill of Entry status.
export function billOfEntryStatus(beNo: string, beDt: string) {
  return icegateCall(2, { beNo, beDt });
}

// ICEGATE/01 — IGM (Import General Manifest) vessel info.
export function igmVesselInfo(igmNo: string, igmDt: string) {
  return icegateCall(1, { igmNo, igmDt });
}

// ICEGATE/05 — Shipping Bill status.
export function shippingBillStatus(sbNo: string, sbDt: string) {
  return icegateCall(5, { sbNo, sbDt });
}

// Aggregated import chain used by the inbound page: BE status -> BE line items -> IGM (best effort).
export async function importLookup(beNo: string, beDt: string) {
  const be = (await billOfEntryStatus(beNo, beDt)) as Record<string, unknown>;
  const igmNo = (be as any)?.response?.igmNo as string | undefined;
  const igmDt = (be as any)?.response?.igmDt as string | undefined;

  let igm: unknown = null;
  if (igmNo && igmDt) {
    try {
      igm = await igmVesselInfo(igmNo, igmDt);
    } catch (e) {
      igm = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return { billOfEntry: be, igm };
}

export async function ulipStatus() {
  try {
    await login();
    return { connected: true as const, baseUrl: BASE_URL, proxied: Boolean(PROXY_URL) };
  } catch (e) {
    return {
      connected: false as const,
      baseUrl: BASE_URL,
      proxied: Boolean(PROXY_URL),
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
