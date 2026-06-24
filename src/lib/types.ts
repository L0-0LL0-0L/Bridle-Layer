export type ResourceType = "ai-agent" | "api" | "gpu" | "pc-worker" | "wallet" | "dataset";

export type ResourceStatus = "active" | "degraded" | "offline" | "pending";

export type Visibility = "private" | "team" | "public" | "monetized";

export type PricingMode = "internal" | "free" | "metered" | "subscription" | "settlement";

export type RouteVenueType = "agent-workload" | "api-proxy" | "compute" | "data" | "settlement";

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
  createdAt: string;
  lastHeartbeat: string;
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
};

export type RouteScoreBreakdown = {
  health: number;
  latency: number;
  reliability: number;
  cost: number;
  fit: number;
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
  resources: Resource[];
  connections: ResourceConnection[];
  venues: RouteVenue[];
  autoRoutes: AutoRoute[];
  routeReallocations: RouteReallocation[];
  flows: OrchestrationFlow[];
  flowRuns: FlowRun[];
  usageEvents: UsageEvent[];
  earnings: EarningsRecord[];
  payouts: Payout[];
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
