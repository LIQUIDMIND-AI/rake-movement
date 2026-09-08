import { NextResponse } from "next/server";
import { ulipStatus } from "@/lib/ulip";

// Node runtime required: undici ProxyAgent (bastion proxy) isn't available on edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await ulipStatus();
  return NextResponse.json(status, { status: status.connected ? 200 : 502 });
}
