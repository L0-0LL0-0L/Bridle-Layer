<p align="center">
  <img src="public/bridle-profile.svg" alt="BRIDLE profile picture" width="220" />
</p>

<h1 align="center">BRIDLE</h1>

<p align="center">
  <strong>Bind Your Digital Resources.</strong>
</p>

<p align="center">
  BRIDLE is a retro-futuristic resource orchestration and monetization platform for AI agents,
  GPUs, APIs, PCs, wallets, and datasets.
</p>

---

## What is BRIDLE?

BRIDLE is a control layer for fragmented digital resources.

It gives idle or scattered assets a shared identity, health model, route graph, usage meter, and economic surface. The MVP lets an operator register resources, classify them, connect them into flows, expose them to a marketplace, track usage, estimate earnings, and route payouts through a Solana-first wallet page.

The product language is intentionally tied to the name:

- A bridle guides and connects.
- BRIDLE reins in scattered compute, data, agents, APIs, and value.
- The app feels like a lost 16-bit operating system sitting above digital chaos.

## Repository profile image

The repository profile/logo asset lives at:

```text
public/bridle-profile.svg
```

It is used in this README and wired into app metadata/Open Graph. If you want the GitHub repository social preview to match it, upload this asset from the GitHub repository settings page.

## MVP surface area

| Area | What it does |
| --- | --- |
| Landing page | Pixel-art BRIDLE brand, hero, resource categories, product explanation, CTAs |
| Auth | Demo login/signup flow with local persistence and Supabase-ready architecture |
| Dashboard | Resource counts, active/offline state, usage, earnings, notifications, route activity |
| Add Resource | Guided wizard for type, connection details, classification, visibility, activation |
| Registry | Searchable/filterable canonical list of all bound resources |
| Resource Detail | Metadata, health, usage, monetization settings, route relationships, heartbeat simulation |
| Orchestration | React Flow graph for conceptual resource routing |
| Marketplace | Public/monetized resource explorer with pricing and availability |
| Analytics | Usage charts, earnings estimates, compute usage, uptime, error rate, payouts |
| Wallet | Solana wallet adapter, address display, balance, payout records |
| Settings | Profile, UI preferences, API keys, security settings, demo reset |
| Admin | Heartbeats, audit logs, degraded resources, production hardening notes |
| Docs/API | Developer-facing API examples and terminology |

## Supported resource types

BRIDLE models these resource classes in the MVP:

```ts
type ResourceType =
  | "ai-agent"
  | "api"
  | "gpu"
  | "pc-worker"
  | "wallet"
  | "dataset";
```

Examples included in seed data:

- Research Agent Alpha
- Vision GPU Node 01
- Internal Pricing API
- Worker PC Delta
- Treasury Wallet
- Product Embeddings Dataset

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Custom shadcn-style primitives
- Supabase client and SQL schema
- Solana wallet adapter
- React Flow via `@xyflow/react`
- Recharts
- Zod for API validation
- Local persistent demo store for instant MVP usage

## Project structure

```text
src/
  app/
    api/                 Demo API boundaries
    dashboard/           Operator overview
    resources/           Registry, detail pages, add wizard
    orchestration/       Route graph
    marketplace/         Public resource explorer
    analytics/           Usage and earnings
    wallet/              Solana-first payout page
    docs/                Developer documentation
  components/
    ui/                  Button, card, badge primitives
    app-shell.tsx        Retro product shell
    network-graph.tsx    Resource relationship graph
    resource-wizard.tsx  Add Resource flow
  lib/
    seed.ts              Demo state
    store.tsx            Client persistence and actions
    types.ts             Domain model
    supabase.ts          Supabase-ready client config
supabase/
  schema.sql             Production database model
public/
  bridle-profile.svg     Repo/profile image
  favicon.svg            App icon
```

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

The app runs immediately without Supabase credentials by using seeded data persisted in `localStorage`.

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Scripts

```bash
npm run dev        # Start local development server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
npm run build      # Build production app
npm run start      # Start production server
```

## API examples

The MVP includes demo API route handlers that validate input and echo production-ready payloads. They are designed as server boundaries for later Supabase persistence, signed proxying, queues, and metering.

### Register a resource

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gpu",
    "name": "Vision GPU Node 02",
    "description": "A metered inference worker for image embeddings.",
    "endpoint": "grpc://vision-gpu-02.local:9081",
    "visibility": "monetized",
    "pricingMode": "metered",
    "metadata": {
      "vramGb": 48,
      "cuda": "12.4",
      "capability": "vision-inference"
    },
    "tags": ["gpu", "vision", "inference"]
  }'
```

### Create a route

```bash
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "res_research_agent_alpha",
    "targetId": "res_product_embeddings_dataset",
    "label": "retrieves context",
    "status": "draft"
  }'
```

### Write usage

```bash
curl -X POST http://localhost:3000/api/usage \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "res_vision_gpu_node_01",
    "requests": 128,
    "computeHours": 2.4,
    "value": 18.75,
    "latencyMs": 980,
    "errors": 0
  }'
```

## Client-side resource registration example

The add-resource wizard uses the shared BRIDLE store. A simplified client action looks like this:

```tsx
"use client";

import { useBridle } from "@/lib/store";

export function QuickRegisterDataset() {
  const { addResource } = useBridle();

  return (
    <button
      onClick={() =>
        addResource({
          type: "dataset",
          name: "Telemetry Lake",
          description: "Operational events available for internal agent retrieval.",
          endpoint: "s3://bridle-datasets/telemetry-lake",
          visibility: "team",
          pricingMode: "internal",
          metadata: {
            records: 900000,
            access: "team-token"
          },
          tags: ["dataset", "telemetry", "rag"]
        })
      }
    >
      Bind dataset
    </button>
  );
}
```

## Supabase schema

The database schema is in `supabase/schema.sql` and includes:

- `users`
- `wallets`
- `resources`
- `resource_connections`
- `usage_events`
- `earnings_records`
- `payouts`
- `health_checks`
- `api_keys`
- `audit_logs`
- `marketplace_listings`
- `notifications`

Example query for marketplace resources:

```ts
import { getSupabaseClient, supabaseTables } from "@/lib/supabase";

export async function listMarketplaceResources() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from(supabaseTables.marketplaceListings)
    .select("*, resources(*)")
    .eq("featured", true);

  if (error) {
    throw error;
  }

  return data;
}
```

Row-level security is enabled in the schema. Add production policies before accepting real user data.

Example policy direction:

```sql
create policy "users can read their own resources"
on public.resources
for select
using (owner_id = auth.uid());
```

## Orchestration model

BRIDLE treats relationships as directed edges:

```ts
type ResourceConnection = {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  status: "live" | "draft" | "paused";
};
```

Example flows:

```text
AI Agent -> Dataset -> API -> Wallet settlement
GPU -> Inference endpoint -> Paid API access
PC Worker -> Dataset transform -> Internal API
Dataset -> Agent retrieval -> Marketplace listing
```

## Design language

The UI is intentionally not a generic SaaS template.

- Black background
- White pixel typography
- Pixel borders and chunky controls
- Subtle CRT/scanline atmosphere
- Minimal accent color for status only
- Game-menu hover states
- Inventory-like resource cards
- Command-center dashboards

## Verification

Current checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Production hardening TODOs

- Replace local demo auth with Supabase Auth sessions and RLS policies.
- Move resource writes, usage ingestion, and route creation behind signed server routes.
- Implement API proxy execution with request validation, metering, retries, and per-route quotas.
- Add worker heartbeat ingestion for GPU and PC resources.
- Use durable queues for orchestration jobs and health checks.
- Integrate audited Solana settlement flows for payouts.
- Add end-to-end tests for signup, resource registration, route creation, wallet connection, and routing.
- Replace deterministic classification with a provider-backed classifier when an API key is configured.
- Add per-resource billing policies, payout holds, and marketplace abuse controls.
