# DSP Live Wagon Tracking & Reporting Dashboard — Mockup

High-fidelity mockup for the **SAIL Durgapur Steel Plant (DSP)** *Live Tracking & Reporting Dashboard for Railway Wagons*, built for the Pravartanam Digital Transformation Programme presentation by **LIQUIDMIND®.AI**. It is a single-page-app-style Next.js dashboard that visualises, end to end, how railway rakes move through the plant — arrival, tippler placement, unloading/loading, internal movement and handover — alongside dwell/detention/turnaround metrics, MIS reporting, operational alerts and an upstream EXIM (import) intelligence view. All data is seeded and mocked with a live client-side simulation that animates rakes along a schematic plant track network, so the app runs entirely in the browser with no backend.

It demonstrates the use cases from the DSP RFP:

- Real-time tracking of railway logistics within the plant
- End-to-end rake tracking (arrival → tippler placement → unloading/loading → internal movement → handover)
- Dwell / detention / turnaround visibility and operational alerts
- MIS + customised reports
- Track inspection & high-hazard-zone intrusion detection
- Upstream **EXIM Intelligence** (TradeGuard AI · Patram AI · TariffIQ) for the coking-coal import flow that feeds the rakes

> Illustrative mockup. The plant rail layout is a plausible schematic over the real DSP footprint, not a survey drawing.

## Tech stack

- **Next.js 14.2.15** (App Router) with `reactStrictMode`
- **React 18.3.1** / React DOM 18.3.1
- **TypeScript 5.6.3** (strict mode; `@/*` path alias → project root)
- **Tailwind CSS 3.4.14** (semantic CSS-variable-based tokens, class + `[data-theme="dark"]` dark mode) with PostCSS 8 + Autoprefixer
- **Leaflet 1.9.4** + **react-leaflet 4.2.1** (OpenStreetMap-based maps)
- **Recharts 2.12.7** (charts)
- **lucide-react 0.454.0** (icons)
- Google Fonts via `next/font` (Inter, JetBrains Mono)
- **pnpm** as the package manager (`pnpm-lock.yaml` committed)

## Prerequisites

- **Node.js** — Next.js 14.2 requires Node `>= 18.17`; the repo pins `@types/node` to v20, so **Node 20 LTS** is the recommended version. (No `.nvmrc` or `engines` field is present, so this is inferred, not enforced.)
- **pnpm** — install with `npm install -g pnpm` or via Corepack (`corepack enable`).

## Local setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd rake-movement
   ```

2. **Install dependencies** (pnpm — matches the committed lockfile):

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the project root. The repo ships a `.env.local` containing ULIP (Unified Logistics Interface Platform) staging credentials. These variables are **not currently referenced anywhere in the application code** (the dashboard runs entirely on mocked/seeded data) — they appear to be reserved for a future ULIP API integration. Treat all three as **secret**; do not commit real credentials.

   | Variable | Description | Secret? |
   |----------|-------------|---------|
   | `ULIP_BASE_URL` | Base URL of the ULIP (DPIIT) API. In the shipped file this points at the staging environment (`https://www.ulipstaging.dpiit.gov.in`). | No (endpoint URL), but environment-specific |
   | `ULIP_USERNAME` | ULIP API account username. | Yes |
   | `ULIP_PASSWORD` | ULIP API account password. | Yes |

   Example `.env.local`:

   ```bash
   ULIP_BASE_URL=https://www.ulipstaging.dpiit.gov.in
   ULIP_USERNAME=your_ulip_username
   ULIP_PASSWORD=your_ulip_password
   ```

   > No `NEXT_PUBLIC_*` variables are used, and no other `process.env` / `import.meta.env` references exist in `app/`, `components/`, `lib/`, or `ulip/`. The app will run without any of these variables set.

4. **Run the development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Build for production**

   ```bash
   pnpm build
   pnpm start
   ```

## Available scripts

From `package.json`:

| Script | Command | Description |
|--------|---------|-------------|
| `pnpm dev` | `next dev` | Start the development server (http://localhost:3000). |
| `pnpm build` | `next build` | Create an optimized production build. |
| `pnpm start` | `next start` | Serve the production build (run `build` first). |
| `pnpm lint` | `next lint` | Run Next.js / ESLint checks. |

## Deployment

The project is configured for **Vercel** via `vercel.json`:

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

Vercel auto-detects the Next.js framework and installs with a frozen lockfile (uses `pnpm-lock.yaml` exactly). If the ULIP variables are wired into code in the future, add them in the Vercel project's **Environment Variables** settings rather than committing them.

## Project structure

```
rake-movement/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx           # Root layout: Sidebar, Topbar, providers, fonts
│   ├── page.tsx             # "Control Room" dashboard (home)
│   ├── globals.css          # Global styles / theme tokens
│   ├── plant-map/           # Live Plant Map
│   ├── inbound/             # Inbound Tracking
│   ├── lifecycle/           # Rake Lifecycle
│   ├── demurrage/           # Dwell & Demurrage
│   ├── mis/                 # MIS Reports
│   ├── alerts/              # Alerts & Intrusion
│   └── exim/                # EXIM Intelligence
├── components/              # UI components (Sidebar, Topbar, maps, boards,
│                            #   chat/report widgets, RakeDrawer, etc.)
├── lib/                     # App logic & data
│   ├── seed.ts              # Deterministic seeded/mock data
│   ├── store.tsx            # Client-side store + live simulation provider
│   ├── network.ts           # Plant track network / routing & interpolation
│   ├── commodities.ts       # Commodity metadata & colors
│   ├── types.ts             # Shared TypeScript types
│   ├── theme.tsx            # Theme provider + init script
│   └── format.ts            # Formatting helpers (INR, time, hours)
├── context/                 # Reference/source documents (PDFs, DOCX, notes) —
│                            #   NOT React context; background material only
├── ulip/                    # ULIP integration handover doc (.docx)
├── public/                  # Static assets
├── next.config.mjs          # Next.js config (reactStrictMode)
├── tailwind.config.ts       # Tailwind theme tokens & dark mode
├── tsconfig.json            # TypeScript config (@/* alias, strict)
├── vercel.json              # Vercel deployment config
└── package.json
```

> Note: the `context/` directory holds supporting business/reference documents (RFP notes, ULIP metadata, proposals, architecture PDFs), not application source. Application state/"context" lives in `lib/store.tsx` and `lib/theme.tsx`.
