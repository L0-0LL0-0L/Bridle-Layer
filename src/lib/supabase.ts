import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}

export const supabaseTables = {
  users: "users",
  wallets: "wallets",
  membershipTiers: "membership_tiers",
  stakePositions: "stake_positions",
  earningsTickers: "earnings_tickers",
  tokenGates: "token_gates",
  resources: "resources",
  resourceConnections: "resource_connections",
  routeVenues: "route_venues",
  autoRoutes: "auto_routes",
  routeReallocations: "route_reallocations",
  usageEvents: "usage_events",
  earningsRecords: "earnings_records",
  payouts: "payouts",
  x402Settlements: "x402_settlements",
  healthChecks: "health_checks",
  apiKeys: "api_keys",
  auditLogs: "audit_logs",
  marketplaceListings: "marketplace_listings",
  notifications: "notifications"
} as const;
