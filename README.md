# DSP Live Wagon Tracking & Reporting Dashboard — Mockup

High-fidelity mockup for the **SAIL Durgapur Steel Plant (DSP)** *Live Tracking & Reporting Dashboard for Railway Wagons*, built for the Pravartanam Digital Transformation Programme presentation (31 Aug 2026) by **LIQUIDMIND®.AI**.

It demonstrates the use cases from the DSP RFP email:
- Real-time tracking of railway logistics within the plant
- End-to-end rake tracking (arrival → tippler placement → unloading/loading → internal movement → handover)
- Dwell / detention / turnaround visibility and operational alerts
- MIS + customised reports
- Track inspection & high-hazard-zone intrusion detection

Plus the upstream **EXIM Intelligence** use case (TradeGuard AI · Patram AI · TariffIQ) for the coking-coal import flow that feeds the rakes.

## Stack
Next.js 14 (app router) · TypeScript · Tailwind · Leaflet/OpenStreetMap · Recharts · lucide-react.
All data is seeded/mocked (`lib/seed.ts`) with a live client-side simulation (`lib/store.tsx`) that animates rakes along the plant track network (`lib/network.ts`).

## Run
```bash
pnpm install
pnpm dev      # http://localhost:3000
```

> Illustrative mockup. The plant rail layout is a plausible schematic over the real DSP footprint, not a survey drawing.
