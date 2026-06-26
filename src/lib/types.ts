export type ResourceType = "ai-agent" | "api" | "gpu" | "pc-worker" | "wallet" | "dataset";

export type ResourceStatus = "active" | "degraded" | "offline" | "pending";

export type ResourceHealthStatus = "unknown" | "healthy" | "degraded" | "error";

export type Visibility = "private" | "team" | "public" | "monetized";

export type PricingMode = "internal" | "free" | "metered" | "subscription" | "settlement";

export type RouteVenueType = "agent-workload" | "api-proxy" | "compute" | "data" | "settlement";

export type MembershipTier = {
  id: string;
  name: string;
  minLockedTokens: number;
  earningsMultiplier: number;
  unlockDays: number;
  description: string;
};

export type StakePosition = {
  id: string;
  userId: string;
  tierId: string;
  lockedTokens: number;
  tokenSymbol: "BRDL";
  status: "active" | "unlocking" | "unlocked";
  lockedAt: string;
  unlockAvailableAt: string;
};

export type EarningsTicker = {
  accruedUsdc: number;
  baseUsdcPerSecond: number;
  boostedUsdcPerSecond: number;
  multiplier: number;
  lastTickAt: string;
};

export type TokenGate = {
  id: string;
  tokenSymbol: "$BRIDLE";
  mintAddress: string;
  holderAddress?: string;
  balance: number;
  minBalance: number;
  priorityBoost: number;
  status: "unverified" | "active" | "insufficient";
  verifiedAt?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "operator" | "admin";
  createdAt: string;
};

export type Wallet = {
  id: string;
  userId: string;
  chain: "solana";
  address: string;
  balanceSol: number;
  payoutEnabled: boolean;
  createdAt: string;
};

export type ResourceUsage = {
  requests: number;
  computeHours: number;
  uptime: number;
  latencyMs: number;
  errorRate: number;
};

export type Resource = {
  id: string;
  ownerId: string;
  name: string;
  type: ResourceType;
  description: string;
  status: ResourceStatus;
  visibility: Visibility;
  pricingMode: PricingMode;
  endpoint?: string;
  address?: string;
  metadata: Record<string, string | number | boolean>;
  tags: string[];
  usage: ResourceUsage;
  earningsEstimate: number;
  healthStatus: ResourceHealthStatus;
  lastLatencyMs?: number;
  lastHttpStatus?: number;
  lastHealthAt?: string;
  createdAt: string;
  lastHeartbeat: string;
};

export type ExecutionKind = "live_call" | "health_probe";

export type ExecutionLog = {
  id: string;
  resourceId: string;
  callerUserId?: string;
  providerUserId: string;
  kind: ExecutionKind;
  httpStatus?: number;
  latencyMs: number;
  attempts: number;
  ok: boolean;
  error?: string;
  responseExcerpt: string;
  endpointHost: string;
  charged: boolean;
  createdAt: string;
};

export type ResourceConnection = {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  status: "live" | "draft" | "paused";
};

export type RouteVenue = {
  id: string;
  name: string;
  type: RouteVenueType;
  description: string;
  requiredTypes: ResourceType[];
  demandUnits: number;
  priority: number;
  latencyTargetMs: number;
  maxErrorRate: number;
  status: "open" | "saturated" | "paused";
  pausedUntil?: string;
  pausedReason?: string;
  pausedByResourceId?: string;
};

export type RouteScoreBreakdown = {
  health: number;
  latency: number;
  reliability: number;
  cost: number;
  fit: number;
  holder: number;
};

export type AutoRoute = {
  id: string;
  venueId: string;
  resourceId: string;
  score: number;
  allocationPercent: number;
  status: "live" | "standby" | "blocked";
  reason: string;
  scoreBreakdown: RouteScoreBreakdown;
  lastScoredAt: string;
  nextReallocationAt: string;
};

export type RouteReallocation = {
  id: string;
  ranAt: string;
  nextRunAt: string;
  durationMs: number;
  routesChanged: number;
  summary: string;
};

export type FlowStep = {
  id: string;
  resourceId: string;
  order: number;
  verb: string;
};

export type OrchestrationFlow = {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  createdAt: string;
  updatedAt: string;
};

export type FlowStepTrace = {
  id: string;
  stepId: string;
  resourceId: string;
  resourceName: string;
  verb: string;
  status: "success" | "failed";
  latencyMs: number;
  message: string;
  startedAt: string;
  finishedAt: string;
};

export type FlowRun = {
  id: string;
  flowId: string;
  status: "success" | "failed";
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  trace: FlowStepTrace[];
};

export type UsageEvent = {
  id: string;
  resourceId: string;
  timestamp: string;
  requests: number;
  computeHours: number;
  value: number;
  latencyMs: number;
  errors: number;
};

export type EarningsRecord = {
  id: string;
  resourceId: string;
  amountUsd: number;
  source: string;
  timestamp: string;
  status: "estimated" | "settled" | "pending";
};

export type Payout = {
  id: string;
  walletId: string;
  amountUsd: number;
  txSignature: string;
  status: "pending" | "settled" | "failed";
  createdAt: string;
};

export type X402Settlement = {
  id: string;
  resourceId?: string;
  payerAddress?: string;
  recipientAddress: string;
  amountUsdc: number;
  memo: string;
  status: "draft" | "pending-signature" | "submitted" | "confirmed" | "failed";
  signature?: string;
  usdcMint: string;
  network: "devnet" | "mainnet-beta";
  createdAt: string;
  updatedAt: string;
  error?: string;
};

export type HealthCheck = {
  id: string;
  resourceId: string;
  status: ResourceStatus;
  latencyMs: number;
  message: string;
  checkedAt: string;
};

export type ApiKey = {
  id: string;
  label: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

export type MarketplaceListing = {
  id: string;
  resourceId: string;
  availability: string;
  priceLabel: string;
  shortDescription: string;
  featured: boolean;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "success" | "warning" | "critical";
  createdAt: string;
};

export type BridleState = {
  user: User | null;
  wallet: Wallet | null;
  tokenGate: TokenGate;
  membershipTiers: MembershipTier[];
  stakePositions: StakePosition[];
  earningsTicker: EarningsTicker;
  resources: Resource[];
  executionLogs: ExecutionLog[];
  connections: ResourceConnection[];
  venues: RouteVenue[];
  autoRoutes: AutoRoute[];
  routeReallocations: RouteReallocation[];
  flows: OrchestrationFlow[];
  flowRuns: FlowRun[];
  usageEvents: UsageEvent[];
  earnings: EarningsRecord[];
  payouts: Payout[];
  x402Settlements: X402Settlement[];
  healthChecks: HealthCheck[];
  apiKeys: ApiKey[];
  auditLogs: AuditLog[];
  marketplace: MarketplaceListing[];
  notifications: Notification[];
};

export type ResourceDraft = {
  name: string;
  type: ResourceType;
  description: string;
  endpoint?: string;
  address?: string;
  visibility: Visibility;
  pricingMode: PricingMode;
  metadata: Record<string, string | number | boolean>;
  tags: string[];
};
