create type resource_type as enum ('ai-agent', 'api', 'gpu', 'pc-worker', 'wallet', 'dataset');
create type resource_status as enum ('active', 'degraded', 'offline', 'pending');
create type resource_visibility as enum ('private', 'team', 'public', 'monetized');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text not null default 'operator',
  created_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  chain text not null default 'solana',
  address text not null,
  balance_sol numeric not null default 0,
  payout_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  name text not null,
  type resource_type not null,
  description text not null,
  status resource_status not null default 'pending',
  visibility resource_visibility not null default 'private',
  pricing_mode text not null default 'internal',
  endpoint text,
  address text,
  metadata jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  usage jsonb not null default '{}'::jsonb,
  earnings_estimate numeric not null default 0,
  created_at timestamptz not null default now(),
  last_heartbeat timestamptz not null default now()
);

create table public.resource_connections (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.resources(id) on delete cascade,
  target_id uuid references public.resources(id) on delete cascade,
  label text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.orchestration_flows (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flow_runs (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid references public.orchestration_flows(id) on delete cascade,
  status text not null,
  duration_ms integer not null,
  trace jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now()
);

create table public.route_venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  name text not null,
  type text not null,
  description text not null default '',
  required_types resource_type[] not null default '{}',
  demand_units integer not null default 0,
  priority integer not null default 50,
  latency_target_ms integer not null default 1000,
  max_error_rate numeric not null default 2,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.auto_routes (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.route_venues(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  score integer not null,
  allocation_percent integer not null,
  status text not null default 'standby',
  reason text not null default '',
  score_breakdown jsonb not null default '{}'::jsonb,
  last_scored_at timestamptz not null default now(),
  next_reallocation_at timestamptz not null default now(),
  unique (venue_id, resource_id)
);

create table public.route_reallocations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  ran_at timestamptz not null default now(),
  next_run_at timestamptz not null,
  duration_ms integer not null,
  routes_changed integer not null default 0,
  summary text not null
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade,
  requests integer not null default 0,
  compute_hours numeric not null default 0,
  value numeric not null default 0,
  latency_ms integer not null default 0,
  errors integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.earnings_records (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade,
  amount_usd numeric not null,
  source text not null,
  status text not null default 'estimated',
  created_at timestamptz not null default now()
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.wallets(id) on delete cascade,
  amount_usd numeric not null,
  tx_signature text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.x402_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete set null,
  payer_address text,
  recipient_address text not null,
  amount_usdc numeric not null,
  memo text not null,
  status text not null default 'draft',
  signature text,
  usdc_mint text not null,
  network text not null default 'devnet',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.health_checks (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade,
  status resource_status not null,
  latency_ms integer not null default 0,
  message text not null,
  checked_at timestamptz not null default now()
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  label text not null,
  prefix text not null,
  hashed_secret text not null,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade,
  availability text not null,
  price_label text not null,
  short_description text not null,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  severity text not null default 'info',
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.wallets enable row level security;
alter table public.resources enable row level security;
alter table public.resource_connections enable row level security;
alter table public.orchestration_flows enable row level security;
alter table public.flow_runs enable row level security;
alter table public.route_venues enable row level security;
alter table public.auto_routes enable row level security;
alter table public.route_reallocations enable row level security;
alter table public.usage_events enable row level security;
alter table public.earnings_records enable row level security;
alter table public.payouts enable row level security;
alter table public.x402_settlements enable row level security;
alter table public.health_checks enable row level security;
alter table public.api_keys enable row level security;
alter table public.audit_logs enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.notifications enable row level security;
