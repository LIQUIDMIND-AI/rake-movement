import { NextResponse } from "next/server";
import { callIcegate } from "@/lib/ulip";
import { ICEGATE_APIS } from "@/lib/ulip-catalog";

// Node runtime required: undici ProxyAgent (bastion proxy) isn't available on edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generic ICEGATE test endpoint used by the ULIP API Test Console. Takes an api
// number (validated against the catalog) and the request body fields ULIP expects,
// and returns ULIP's raw response so it can be rendered in-app for a test-case screenshot.
export async function POST(req: Request) {
  const { api, body } = await req.json();
  if (typeof api !== "number" || !ICEGATE_APIS.has(api)) {
    return NextResponse.json({ error: `Unknown ICEGATE api: ${api}` }, { status: 400 });
  }

  const started = Date.now();
  try {
    const response = await callIcegate(api, (body ?? {}) as Record<string, string>);
    return NextResponse.json({ api, request: body ?? {}, response, ms: Date.now() - started });
  } catch (e) {
    const err = e as Error & { body?: unknown; status?: number };
    return NextResponse.json(
      { api, request: body ?? {}, error: err.message, body: err.body ?? null, ms: Date.now() - started },
      { status: err.status ?? 502 },
    );
  }
}
