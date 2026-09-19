"use client";
import { useEffect, useState } from "react";
import { Panel, Badge, Stat, LiveBadge } from "./ui";
import {
  Ship, Anchor, FileCheck2, Container, PackageCheck, Building2,
  ShieldCheck, Truck, Loader2, Waypoints,
} from "lucide-react";

type Doc = { source: string; ref: Record<string, string>; ok: boolean; data: any; note?: string };
type Customs = {
  fetchedAt: string;
  import: { igm: Doc; be: Doc; beItems: Doc; vessel: Doc; importManifest: Doc };
  export: { sb: Doc; sbItems: Doc; egm: Doc };
  container: { eseal: Doc };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(d?: string) {
  if (!d) return "—";
  const m = /^(\d{2})(\d{2})(\d{4})/.exec(d);
  if (!m) return d;
  const rest = d.slice(8).trim();
  return `${m[1]} ${MONTHS[+m[2] - 1] ?? m[2]} ${m[3]}${rest ? " · " + rest : ""}`;
}
const COUNTRY: Record<string, string> = {
  IN: "India", CN: "China", US: "United States", BT: "Bhutan", ID: "Indonesia",
  AE: "UAE", SG: "Singapore", AU: "Australia", ZA: "South Africa", GB: "United Kingdom",
};
function portCountry(code?: string) {
  if (!code || code.length < 2) return "";
  return COUNTRY[code.slice(0, 2).toUpperCase()] ?? "";
}

function Field({ label, value, mono = false }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  const empty = value === undefined || value === null || value === "" || value === "null";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`text-[13px] text-t1 ${mono ? "mono" : ""}`}>{empty ? "—" : value}</div>
    </div>
  );
}

function DocCard({
  icon, title, doc, tone = "sky", children,
}: {
  icon: React.ReactNode; title: string; doc: Doc; tone?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-panel-line bg-surface-2 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-${tone}`}>{icon}</span>
          <h4 className="text-[13px] font-semibold text-t1">{title}</h4>
        </div>
        <Badge tone={doc.ok ? "good" : "warning"}>ULIP · {doc.source}</Badge>
      </div>
      {doc.ok ? (
        children
      ) : (
        <p className="text-[12px] text-muted">
          Awaiting ICEGATE feed — {doc.note ?? "no record"}.
        </p>
      )}
    </div>
  );
}

function Milestone({ label, date, done, icon }: { label: string; date?: string; done: boolean; icon: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-start gap-2">
      <div className={`mt-0.5 rounded-full p-1 ${done ? "bg-grn/15 text-grn" : "bg-t3/10 text-muted"}`}>{icon}</div>
      <div>
        <div className={`text-[11.5px] font-medium ${done ? "text-t1" : "text-muted"}`}>{label}</div>
        <div className="text-[10.5px] text-muted">{date ? fmtDate(date) : "pending"}</div>
      </div>
    </div>
  );
}

export function CustomsIntelligence() {
  const [c, setC] = useState<Customs | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/ulip/customs");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setC(await r.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Panel title="EXIM Customs & Vessel Intelligence" sub="Live import/export status from Indian Customs (ICEGATE), unified through ULIP">
        <div className="flex items-center gap-2 py-8 text-[13px] text-muted">
          <Loader2 size={15} className="animate-spin" /> Fetching live customs status from ICEGATE via ULIP…
        </div>
      </Panel>
    );
  }
  if (err || !c) {
    return (
      <Panel title="EXIM Customs & Vessel Intelligence" sub="Live from ICEGATE via ULIP">
        <p className="text-[12px] text-accent-red">Could not reach ULIP: {err}</p>
      </Panel>
    );
  }

  const igm = c.import.igm.data ?? {};
  const be = c.import.be.data?.boeDetails?.[0] ?? {};
  const ooc = c.import.beItems.data ?? {};
  const vessel = c.import.vessel.data ?? {};
  const imp = c.import.importManifest.data ?? {};
  const sb = c.export.sb.data ?? {};
  const leo = c.export.sbItems.data ?? {};
  const egm = c.export.egm.data ?? {};
  const eseal = c.container.eseal.data ?? {};

  return (
    <div className="space-y-4">
      {/* Overview */}
      <Panel
        title="EXIM Customs & Vessel Intelligence"
        sub="Live import/export status from Indian Customs (ICEGATE), unified through ULIP — consent-based"
        right={<div className="flex items-center gap-2"><LiveBadge /><Badge tone="good">ICEGATE via ULIP</Badge></div>}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Inbound Vessel" value={igm.vesselCode ?? "—"} sub={igm.masterName ? `Capt. ${igm.masterName.replace(/^Capt\.?/i, "").trim()}` : "IGM manifest"} />
          <Stat label="Port of Arrival" value={igm.portOfArrival ?? "—"} sub={c.import.igm.ok ? `IMO ${igm.imoCodeOfVessel}` : ""} />
          <Stat label="Origin" value={COUNTRY[be.countryOrig] ?? be.countryOrig ?? "—"} sub={`BE ${c.import.be.ref.beNo}`} />
          <Stat label="Import Gross Wt" value={be.grossWt ? `${(be.grossWt / 1000).toFixed(1)}t` : "—"} sub={`${be.totNoPkg ?? "—"} pkg`} />
          <Stat
            label="Customs Status"
            value={c.import.beItems.ok ? "Out of Charge" : "In clearance"}
            tone={c.import.beItems.ok ? "good" : "neutral"}
            sub={ooc.oocNo ? `OOC ${ooc.oocNo}` : ""}
          />
        </div>
      </Panel>

      {/* IMPORT */}
      <Panel title="Import consignment — customs dossier" sub="Coking-coal inbound: vessel manifest → bill of entry → customs clearance, before rail-out to plant">
        {/* milestone timeline */}
        <div className="mb-4 flex flex-wrap gap-4 rounded-lg border border-panel-line bg-surface-2 p-3">
          <Milestone label="IGM filed (vessel)" date={igm.igmDt} done={c.import.igm.ok} icon={<Ship size={13} />} />
          <Milestone label="Bill of Entry filed" date={c.import.be.ref.beDt} done={c.import.be.ok} icon={<FileCheck2 size={13} />} />
          <Milestone label="Out of Charge (cleared)" date={ooc.oocDt} done={c.import.beItems.ok} icon={<ShieldCheck size={13} />} />
          <Milestone label="Rail-out to DSP" date={undefined} done={false} icon={<Waypoints size={13} />} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DocCard icon={<Ship size={16} />} title="Vessel & Arrival Manifest" doc={c.import.igm} tone="sky">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Vessel Code" value={igm.vesselCode} mono />
              <Field label="IMO" value={igm.imoCodeOfVessel} mono />
              <Field label="Voyage" value={igm.voyageNo} mono />
              <Field label="Master" value={igm.masterName} />
              <Field label="Port of Arrival" value={igm.portOfArrival} mono />
              <Field label="ETA" value={fmtDate(igm.expDtOfArrival)} />
              <Field label="IGM No" value={igm.igmNo} mono />
              <Field label="IGM Date" value={fmtDate(igm.igmDt)} />
              <Field label="Manifest Lines" value={igm.totalNoOfLines} mono />
            </div>
          </DocCard>

          <DocCard icon={<FileCheck2 size={16} />} title="Bill of Entry" doc={c.import.be} tone="teal">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="BE No" value={c.import.be.ref.beNo} mono />
              <Field label="BE Date" value={fmtDate(c.import.be.ref.beDt)} />
              <Field label="Origin" value={COUNTRY[be.countryOrig] ? `${COUNTRY[be.countryOrig]} (${be.countryOrig})` : be.countryOrig} />
              <Field label="Gross Weight" value={be.grossWt ? `${be.grossWt.toLocaleString()} ${be.unitOfQt ?? ""}` : undefined} mono />
              <Field label="Packages" value={be.totNoPkg} mono />
              <Field label="Linked IGM Date" value={fmtDate(be.igmDt)} />
            </div>
          </DocCard>

          <DocCard icon={<ShieldCheck size={16} />} title="Customs Clearance (Out of Charge)" doc={c.import.beItems} tone="grn">
            <div className="grid grid-cols-2 gap-3">
              <Field label="OOC Number" value={ooc.oocNo} mono />
              <Field label="OOC Date" value={fmtDate(ooc.oocDt)} />
              <div className="col-span-2"><Badge tone="good"><ShieldCheck size={11} /> Cargo customs-cleared — cleared for rail movement</Badge></div>
            </div>
          </DocCard>

          <DocCard icon={<Building2 size={16} />} title="Shipping Line & Rotation" doc={c.import.vessel} tone="violet">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Shipping Line" value={vessel.shippingLineCode} mono />
              <Field label="Agent Code" value={vessel.shippingAgentCode} mono />
              <Field label="Rotation No" value={vessel.rotationNumber} mono />
              <Field label="Rotation Date" value={fmtDate(vessel.rotationDt)} />
            </div>
          </DocCard>

          <DocCard icon={<Anchor size={16} />} title="Import Manifest" doc={c.import.importManifest} tone="sky">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Importer" value={imp.importerName} />
              <Field label="Vessel" value={imp.vesselCode} mono />
              <Field label="Voyage" value={imp.voyageNo} mono />
              <Field label="Port of Shipment" value={imp.portOfShipment ? `${imp.portOfShipment}${portCountry(imp.portOfShipment) ? " · " + portCountry(imp.portOfShipment) : ""}` : undefined} />
              <Field label="Port of Destination" value={imp.portOfDest} mono />
              <Field label="Mode" value={imp.modeOfTransport === "1" ? "Sea (1)" : imp.modeOfTransport} />
            </div>
          </DocCard>
        </div>
      </Panel>

      {/* EXPORT */}
      <Panel title="Export consignment — customs dossier" sub="Outbound: shipping bill → let-export order → export manifest → container e-seal">
        <div className="mb-4 flex flex-wrap gap-4 rounded-lg border border-panel-line bg-surface-2 p-3">
          <Milestone label="Shipping Bill filed" date={c.export.sb.ref.sbDt} done={c.export.sb.ok} icon={<FileCheck2 size={13} />} />
          <Milestone label="Let Export Order" date={leo.leoDt} done={c.export.sbItems.ok} icon={<PackageCheck size={13} />} />
          <Milestone label="Export Manifest (EGM)" date={egm.egmDt} done={c.export.egm.ok} icon={<Ship size={13} />} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DocCard icon={<PackageCheck size={16} />} title="Shipping Bill" doc={c.export.sb} tone="teal">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="SB No" value={sb.sbNo} mono />
              <Field label="SB Date" value={fmtDate(sb.sbDt)} />
              <Field label="Destination" value={sb.portOfDest ? `${sb.portOfDest}${portCountry(sb.portOfDest) ? " · " + portCountry(sb.portOfDest) : ""}` : undefined} />
              <Field label="Packages" value={sb.noOfPkgs?.toLocaleString?.() ?? sb.noOfPkgs} mono />
              <Field label="Gross Qty" value={sb.grossQt ? `${sb.grossQt.toLocaleString()} ${sb.unitOfQt ?? ""}` : undefined} mono />
              <Field label="Cargo" value={sb.natureOfCargo === "C" ? "Containerized (C)" : sb.natureOfCargo} />
            </div>
          </DocCard>

          <DocCard icon={<ShieldCheck size={16} />} title="Let Export Order" doc={c.export.sbItems} tone="grn">
            <div className="grid grid-cols-2 gap-3">
              <Field label="LEO Date" value={fmtDate(leo.leoDt)} />
              <div className="col-span-2"><Badge tone="good"><PackageCheck size={11} /> Let-Export Order granted — cleared for loading</Badge></div>
            </div>
          </DocCard>

          <DocCard icon={<Ship size={16} />} title="Export Manifest (EGM)" doc={c.export.egm} tone="violet">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="EGM No" value={egm.egmNo} mono />
              <Field label="EGM Date" value={fmtDate(egm.egmDt)} />
              <Field label="Shipping Bills" value={egm.sbDetails?.length} mono />
              {egm.sbDetails?.[0] && (
                <>
                  <Field label="SB No" value={egm.sbDetails[0].sbNo} mono />
                  <Field label="Packages" value={egm.sbDetails[0].noOfPckgs} mono />
                  <Field label="Destination" value={egm.sbDetails[0].portOfDest ? `${egm.sbDetails[0].portOfDest}${portCountry(egm.sbDetails[0].portOfDest) ? " · " + portCountry(egm.sbDetails[0].portOfDest) : ""}` : undefined} />
                </>
              )}
            </div>
          </DocCard>

          <DocCard icon={<Container size={16} />} title="Container E-Seal" doc={c.container.eseal} tone="amber">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Container" value={eseal.containerNumber} mono />
              <Field label="E-Seal" value={eseal.esealNumber} mono />
              <Field label="Truck" value={eseal.truckNumber} mono />
              <Field label="Sealed At" value={fmtDate(eseal.sealDateTime)} />
              <Field label="Linked SB" value={eseal.sbNumber} mono />
              <Field label="SB Date" value={fmtDate(eseal.sbDate)} />
            </div>
            <div className="mt-2"><Badge tone="info"><Truck size={11} /> Factory-stuffed container, e-sealed for port movement</Badge></div>
          </DocCard>
        </div>

        <p className="mt-3 text-[11px] text-muted">
          Live data via <span className="font-semibold text-t2">ULIP</span> (Unified Logistics Interface Platform) ·
          Indian Customs <span className="font-semibold text-t2">ICEGATE</span> · routed through DSP secure gateway ·
          fetched {new Date(c.fetchedAt).toLocaleString()}
        </p>
      </Panel>
    </div>
  );
}
