import { NextResponse } from "next/server";
import { importLookup } from "@/lib/ulip";

// Node runtime required: undici ProxyAgent (bastion proxy) isn't available on edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { beNo, beDt } = await req.json();
  if (!beNo || !beDt) {
    return NextResponse.json({ error: "beNo and beDt are required (beDt as DDMMYYYY)" }, { status: 400 });
  }

  try {
    const result = await importLookup(beNo, beDt);
    return NextResponse.json(result);
  } catch (e) {
    const err = e as Error & { body?: unknown; status?: number };
    return NextResponse.json({ error: err.message, body: err.body ?? null }, { status: err.status ?? 502 });
  }
}
