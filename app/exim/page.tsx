"use client";
import { PageHeader, Panel, Stat, Badge } from "@/components/ui";
import { FlowTrack, type FlowNode } from "@/components/FlowTrack";
import { Boxes, ShieldCheck, FileSearch, Calculator, Ship, Train, Factory, Check } from "lucide-react";

interface ProductCard {
  name: string;
  tagline: string;
  headerHex: string;
  icon: React.ReactNode;
  metrics: { label: string; value: string }[];
  bullets: string[];
}

const SUPPLY_CHAIN: FlowNode[] = [
  { icon: <Ship size={20} />, label: "Vessel at Port", sublabel: "Haldia / Paradip / Vizag" },
  { icon: <FileSearch size={20} />, label: "EXIM Documents", sublabel: "15–40 docs / vessel", badge: "LIQUIDMIND", badgeTone: "teal" },
  { icon: <ShieldCheck size={20} />, label: "Customs Clearance", sublabel: "HS code · duty · FTA" },
  { icon: <Train size={20} />, label: "IR Rail Haul", sublabel: "2–5 days" },
  { icon: <Factory size={20} />, label: "DSP Wagon Tracking", sublabel: "Interchange → blast furnace", badge: "THIS SYSTEM", badgeTone: "brand" },
];

const PRODUCTS: ProductCard[] = [
  {
    name: "TradeGuard AI",
    tagline: "Shipping Bill & Invoice cross-validation",
    headerHex: "#1e293b",
    icon: <ShieldCheck size={18} />,
    metrics: [
      { label: "Fields validated", value: "40+" },
      { label: "Response time", value: "<5 sec" },
      { label: "Accuracy", value: "95%" },
    ],
    bullets: [
      "Cross-validates 40+ semantic fields (HS codes, port codes, incoterm compliance, vessel registry)",
      "Catches mismatches between commercial invoice, packing list and bill of lading",
      "Flags customs holds, demurrage exposure before cargo arrives port",
      "Semantic matching: ports (UNLOCODE), commodities (ITC-HS), currencies vs live rates",
    ],
  },
  {
    name: "Patram AI",
    tagline: "Trade Document Intelligence & Q&A",
    headerHex: "#134e4a",
    icon: <FileSearch size={18} />,
    metrics: [
      { label: "Trade frameworks", value: "190+" },
      { label: "Q&A latency", value: "1.5 sec" },
      { label: "Coverage", value: "24×7" },
    ],
    bullets: [
      "Sourced answers across 190+ country frameworks: origin rules, FTA eligibility, supplier compliance",
      "Live access to AUS/USA/Russia/Mozambique coal trade agreements",
      "Contract term extraction: force majeure, payment terms, delivery obligations",
      "Flags hidden duty liability, subsidy implications, trade sanctions",
    ],
  },
  {
    name: "TariffIQ (HSN+ AI)",
    tagline: "HS classification & duty calculator",
    headerHex: "#7c2d12",
    icon: <Calculator size={18} />,
    metrics: [
      { label: "HSN codes", value: "21,000+" },
      { label: "Calc time", value: "<3 sec" },
      { label: "Duty per shipment", value: "₹ impact" },
    ],
    bullets: [
      "8-digit ITC-HS classification for coking coal grades, blends, origins (India, Australia, Indonesia, Mozambique)",
      "Live BCD (Basic Customs Duty), IGST, Cess, RoDTEP vs Drawback eligibility",
      "Real-time duty impact: coal import duty swings ₹30–50 Cr per shipment under policy changes",
      "Tracks regulatory changes (Board Rates, FTA updates) automatically",
    ],
  },
];

const PORTS = [
  { name: "Haldia Port", state: "West Bengal" },
  { name: "Paradip Port", state: "Odisha" },
  { name: "Vizag Port", state: "Andhra Pradesh" },
];

export default function EXIMIntelligence() {
  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="EXIM Intelligence — Coking Coal Import"
        sub="How LIQUIDMIND's EXIM product suite de-risks the coking-coal import flow that feeds DSP's rakes — document flow, funds flow, goods flow."
        icon={<Boxes size={20} />}
      />

      {/* Supply chain flow visualization */}
      <Panel
        title="End-to-End Supply Chain"
        sub="From port to blast furnace: where EXIM intelligence acts, and where wagon tracking takes over"
        className="overflow-hidden"
        bodyClass="p-4"
      >
        <FlowTrack nodes={SUPPLY_CHAIN} scopeFrom={4} />

        <div className="mt-4 pt-3 border-t border-panel-line text-[11px] text-muted">
          <span className="text-brand font-semibold">Key insight:</span> EXIM
          products validate and de-risk the goods/document/funds flow before coal
          ever touches Indian Railways. DSP wagon tracking begins at the
          interchange gate and runs through tipplers to blast furnace.
        </div>
      </Panel>

      {/* Product cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PRODUCTS.map((product) => (
          <div key={product.name} className="card rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3" style={{ backgroundColor: product.headerHex }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white">{product.icon}</span>
                <div>
                  <div className="font-semibold text-sm text-white">
                    {product.name}
                  </div>
                  <div className="text-[11px] text-white/65">{product.tagline}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2">
                {product.metrics.map((metric, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-sm font-semibold text-accent">
                      {metric.value}
                    </div>
                    <div className="text-[10px] text-muted">{metric.label}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-panel-line" />

              {/* Bullets */}
              <div className="space-y-2">
                {product.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex gap-2 text-[12px] text-t2">
                    <Check size={14} className="text-accent-grn flex-shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SAIL Coal Import Group use case */}
      <Panel
        title="SAIL Coal Import Group (CIG) Use Case"
        sub="End-to-end coking-coal import de-risking across SAIL's integrated steel assets"
        className=""
        bodyClass="p-4 space-y-3"
      >
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-sm text-t1 mb-1">
              The Flow
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Every imported coking-coal vessel (MV Cape Orion, Pacific Dawn,
              Iron Symphony) brings 15–40 trade documents: commercial invoice,
              bill of lading, certificate of analysis, packing list, insurance
              certificate, customs entry, and regulatory filings.{" "}
              <span className="text-accent-teal font-semibold">TradeGuard AI</span>{" "}
              cross-validates all 40+ semantic fields in parallel, catching
              mismatches (port code mismatch, incoterm breach, weight variance)
              before customs holds or demurrage accrues.{" "}
              <span className="text-accent-teal font-semibold">Patram AI</span>{" "}
              queries FTA eligibility (Australia, USA, Russia, Mozambique coal)
              and contract terms against live frameworks, flagging subsidy
              implications or force majeure clauses. At clearance,{" "}
              <span className="text-accent-teal font-semibold">TariffIQ</span>{" "}
              assigns the 8-digit HS code, calculates BCD/IGST/Cess and RoDTEP
              eligibility — coal-specific duty can swing ₹30–50 Cr per shipment.
            </p>
          </div>

          <div className="border-t border-panel-line" />

          <div>
            <div className="font-semibold text-sm text-t1 mb-1">
              Scope
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PORTS.map((port, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                  {port.name} ({port.state})
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm text-muted col-span-2">
                <span className="h-2 w-2 rounded-full bg-brand" />
                SAIL Rourkela, Durgapur, IISCO Burnpur, MSTC facilities
              </div>
            </div>
          </div>

          <div className="border-t border-panel-line" />

          <div>
            <div className="font-semibold text-sm text-t1 mb-1">
              Business Impact
            </div>
            <p className="text-sm text-muted leading-relaxed">
              CAG report (2024) documented ₹3,770 Cr cumulative losses across SAIL
              integrated steel plants: ₹2,539 Cr excess coal spend due to document
              delays and duty miscalculation, and ₹1,231 Cr lost blast-furnace
              production during import bottlenecks. LIQUIDMIND's EXIM suite
              eliminates document-hold rework loops, ensures optimal duty
              classification, and guarantees coal availability at DSP's rake
              interchange — keeping the tipplers and furnace fed.
            </p>
          </div>
        </div>
      </Panel>

      {/* Credentials footer */}
      <div className="border-t border-panel-line pt-4">
        <div className="text-center text-[11px] space-y-2">
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "DPIIT recognised",
              "MSTC empanelled",
              "SAP PartnerEdge",
              "NVIDIA Inception",
              "AWS Activate",
              "Aegis Graham Bell Award 2026",
            ].map((cred, idx) => (
              <span
                key={idx}
                className="text-muted before:content-['•'] before:mr-2 first:before:content-none"
              >
                {cred}
              </span>
            ))}
          </div>
          <div className="text-muted">
            Built on <span className="text-accent">AWS</span> with{" "}
            <span className="text-accent-teal">Anthropic Claude on Amazon Bedrock</span>
          </div>
        </div>
      </div>
    </div>
  );
}
