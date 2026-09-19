import { NextResponse } from "next/server";
import { callIcegate } from "@/lib/ulip";

// Node runtime required: undici ProxyAgent (bastion proxy) isn't available on edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reference trade documents tracked by the DSP EXIM desk. These are live ICEGATE
// records (staging) surfaced through ULIP — the customs dossier is built from them.
const REFS = {
  igm: { igmNo: "1197501", igmDt: "09062026" }, // ICEGATE/01 vessel IGM
  be: { beNo: "2036579", beDt: "22062026" }, // ICEGATE/02 Bill of Entry
  beItems: { beNo: "2036579", beDt: "22062026" }, // ICEGATE/03 OOC
  vessel: { siteId: "INBOM1", imoCode: "9680956", vesselCode: "9V2251", arrivalDate: "30062026" }, // ICEGATE/04
  importManifest: { igmNo: "1199447", igmDt: "22062026" }, // ICEGATE/07
  sb: { sbNo: "4356948", sbDt: "22062026" }, // ICEGATE/05 Shipping Bill
  sbItems: { sbNo: "4356948", sbDt: "22062026" }, // ICEGATE/06 LEO
  egm: { egmNo: "1199683", egmDt: "23062026" }, // ICEGATE/08 Export manifest
  eseal: { esealNumber: "ESSC01223660", containerNumber: "WHSU2542650" }, // ICEGATE/13
} as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pad = (n: number) => String(n).padStart(2, "0");

type DocResult = {
  source: string;
  ref: Record<string, string>;
  ok: boolean;
  data: unknown | null;
  note?: string;
};

// Call one ICEGATE API, unwrap ULIP's envelope, and retry the transient
// "3rd party service is down" upstream blip a few times.
async function fetchDoc(api: number, ref: Record<string, string>): Promise<DocResult> {
  const source = `ICEGATE/${pad(api)}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = (await callIcegate(api, ref)) as any;
      const entry = Array.isArray(r?.response) ? r.response[0] : r?.response;
      const inner = entry?.response;
      if (typeof inner === "string" && inner.includes("3rd party service is down")) {
        await sleep(1500);
        continue;
      }
      if (inner && typeof inner === "object" && !("errCode" in inner)) {
        return { source, ref, ok: true, data: inner };
      }
      return {
        source,
        ref,
        ok: false,
        data: null,
        note: inner?.errMsg ?? (typeof inner === "string" ? inner : "No data"),
      };
    } catch (e) {
      return { source, ref, ok: false, data: null, note: e instanceof Error ? e.message : String(e) };
    }
  }
  return { source, ref, ok: false, data: null, note: "ICEGATE upstream temporarily unavailable" };
}

export async function GET() {
  const [igm, be, beItems, vessel, importManifest, sb, sbItems, egm, eseal] = await Promise.all([
    fetchDoc(1, REFS.igm),
    fetchDoc(2, REFS.be),
    fetchDoc(3, REFS.beItems),
    fetchDoc(4, REFS.vessel),
    fetchDoc(7, REFS.importManifest),
    fetchDoc(5, REFS.sb),
    fetchDoc(6, REFS.sbItems),
    fetchDoc(8, REFS.egm),
    fetchDoc(13, REFS.eseal),
  ]);

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    import: { igm, be, beItems, vessel, importManifest },
    export: { sb, sbItems, egm },
    container: { eseal },
  });
}
