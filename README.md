# BRIDLE

BRIDLE binds AI agents, GPUs, APIs, PCs, wallets, and datasets into one programmable resource network.

This repository contains a serious MVP built with Next.js App Router, TypeScript, Tailwind CSS, custom shadcn-style UI primitives, Supabase-ready data modeling, Solana wallet adapter, React Flow, and Recharts.

## Features

- Retro monochrome BRIDLE landing page and product shell
- Demo auth flow with local persistence
- Guided Add Resource wizard with deterministic BRIDLE classification
- Canonical resource registry with filtering and detail pages
- Orchestration graph for conceptual resource routing
- Marketplace/network explorer for public and monetized resources
- Usage, uptime, error, earnings, and payout analytics
- Solana wallet adapter integration with devnet balance display
- Settings, API keys, notifications, admin health, audit logs
- Supabase schema for production database/auth hardening

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The MVP runs without Supabase credentials by using seeded state persisted in `localStorage`. Add Supabase credentials to `.env.local` when wiring real auth and database reads/writes.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Supabase

The database schema is in `supabase/schema.sql` and includes:

- users
- wallets
- resources
- resource_connections
- usage_events
- earnings_records
- payouts
- health_checks
- api_keys
- audit_logs
- marketplace_listings
- notifications

Row-level security is enabled in the schema. Production policies should be added before accepting real user data.

## Production hardening TODOs

- Replace local demo auth with Supabase Auth sessions and RLS policies.
- Move resource writes, usage ingestion, and route creation behind signed server routes.
- Implement API proxy execution with request validation, metering, retries, and per-route quotas.
- Add worker heartbeat ingestion for GPU and PC resources.
- Use durable queues for orchestration jobs and health checks.
- Integrate audited Solana settlement flows for payouts.
- Add end-to-end tests for signup, resource registration, route creation, and wallet connection.
- Replace deterministic classification with a provider-backed classifier when an API key is configured.
