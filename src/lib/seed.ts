import type {
  AutoRoute,
  BridleState,
  EarningsTicker,
  FlowRun,
  MembershipTier,
  OrchestrationFlow,
  Resource,
  ResourceConnection,
  RouteReallocation,
  RouteVenue,
  StakePosition,
  TokenGate,
  X402Settlement
} from "@/lib/types";

export const bridleTokenMint = "4i52FSf22KYBU8424Z2AGmJNG299jQhxM74YK1Espump";

export const demoUser = {
  id: "user_demo",
  name: "Operator Zero",
  email: "operator@bridle.network",
  role: "admin" as const,
  createdAt: "2026-06-01T09:00:00.000Z"
};

export const seededResources: Resource[] = [
  {
    id: "res_research_agent_alpha",
    ownerId: demoUser.id,
    name: "Research Agent Alpha",
    type: "ai-agent",
    description: "Autonomous literature and market research agent with citation tools.",
    status: "active",
    visibility: "monetized",
    pricingMode: "metered",
    endpoint: "https://agents.bridle.local/research-alpha",
    metadata: {
      model: "gpt-router",
      tools: "search, summarize, cite",
      input: "prompt/json",
      output: "markdown/json"
    },
    tags: ["agent", "research", "citations", "auto-classified"],
    usage: {
      requests: 18420,
      computeHours: 62,
      uptime: 99.3,
      latencyMs: 842,
      errorRate: 0.7
    },
    earningsEstimate: 1240,
    createdAt: "2026-06-02T10:12:00.000Z",
    lastHeartbeat: "2026-06-23T15:35:00.000Z"
  },
  {
    id: "res_vision_gpu_node_01",
    ownerId: demoUser.id,
    name: "Vision GPU Node 01",
    type: "gpu",
    description: "A6000 inference endpoint for vision embeddings and image captioning.",
    status: "active",
    visibility: "public",
    pricingMode: "metered",
    endpoint: "grpc://gpu-node-01.bridle.local:9081",
    metadata: {
      vramGb: 48,
      cuda: "12.4",
      capability: "vision-inference",
      availability: "18:00-06:00 UTC"
    },
    tags: ["gpu", "vision", "inference", "a6000"],
    usage: {
      requests: 9402,
      computeHours: 411,
      uptime: 97.8,
      latencyMs: 1180,
      errorRate: 1.2
    },
    earningsEstimate: 2860,
    createdAt: "2026-06-04T18:21:00.000Z",
    lastHeartbeat: "2026-06-23T15:33:00.000Z"
  },
  {
    id: "res_internal_pricing_api",
    ownerId: demoUser.id,
    name: "Internal Pricing API",
    type: "api",
    description: "REST service that calculates dynamic resource pricing and quotas.",
    status: "degraded",
    visibility: "team",
    pricingMode: "internal",
    endpoint: "https://api.bridle.local/pricing",
    metadata: {
      method: "REST",
      auth: "bearer",
      rateLimit: "900 rpm",
      metering: true
    },
    tags: ["api", "pricing", "quota", "internal"],
    usage: {
      requests: 48720,
      computeHours: 12,
      uptime: 94.6,
      latencyMs: 231,
      errorRate: 3.8
    },
    earningsEstimate: 420,
    createdAt: "2026-06-08T08:00:00.000Z",
    lastHeartbeat: "2026-06-23T15:29:00.000Z"
  },
  {
    id: "res_worker_pc_delta",
    ownerId: demoUser.id,
    name: "Worker PC Delta",
    type: "pc-worker",
    description: "Idle workstation registered for batch jobs, crawling, and transforms.",
    status: "offline",
    visibility: "private",
    pricingMode: "internal",
    endpoint: "worker://delta.local",
    metadata: {
      cpu: "16 cores",
      ramGb: 64,
      storageGb: 1800,
      heartbeat: "missed"
    },
    tags: ["worker", "batch", "offline", "desktop"],
    usage: {
      requests: 1280,
      computeHours: 104,
      uptime: 82.1,
      latencyMs: 0,
      errorRate: 0
    },
    earningsEstimate: 160,
    createdAt: "2026-06-10T12:15:00.000Z",
    lastHeartbeat: "2026-06-23T13:02:00.000Z"
  },
  {
    id: "res_treasury_wallet",
    ownerId: demoUser.id,
    name: "Treasury Wallet",
    type: "wallet",
    description: "Solana settlement wallet for marketplace payouts and fee routing.",
    status: "active",
    visibility: "private",
    pricingMode: "settlement",
    address: "9wFFmGqRzXzDemo11111111111111111111111111",
    metadata: {
      chain: "solana",
      payoutRouting: true,
      multisig: false
    },
    tags: ["wallet", "solana", "settlement", "payouts"],
    usage: {
      requests: 312,
      computeHours: 0,
      uptime: 100,
      latencyMs: 410,
      errorRate: 0
    },
    earningsEstimate: 0,
    createdAt: "2026-06-11T16:42:00.000Z",
    lastHeartbeat: "2026-06-23T15:36:00.000Z"
  },
  {
    id: "res_product_embeddings_dataset",
    ownerId: demoUser.id,
    name: "Product Embeddings Dataset",
    type: "dataset",
    description: "Vectorized product catalog with permissions and retrieval metadata.",
    status: "active",
    visibility: "monetized",
    pricingMode: "metered",
    endpoint: "s3://bridle-datasets/product-embeddings",
    metadata: {
      records: 2800000,
      storage: "object-store",
      access: "token-gated",
      category: "commerce"
    },
    tags: ["dataset", "embeddings", "commerce", "rag"],
    usage: {
      requests: 22790,
      computeHours: 0,
      uptime: 99.9,
      latencyMs: 96,
      errorRate: 0.1
    },
    earningsEstimate: 980,
    createdAt: "2026-06-14T19:12:00.000Z",
    lastHeartbeat: "2026-06-23T15:34:00.000Z"
  }
];

export const seededMembershipTiers: MembershipTier[] = [
  {
    id: "tier_unbridled",
    name: "Unbridled",
    minLockedTokens: 0,
    earningsMultiplier: 1,
    unlockDays: 0,
    description: "Base network access with no locked BRDL."
  },
  {
    id: "tier_reined",
    name: "Reined",
    minLockedTokens: 1000,
    earningsMultiplier: 1.1,
    unlockDays: 7,
    description: "Light stake that nudges marketplace and routing earnings."
  },
  {
    id: "tier_harnessed",
    name: "Harnessed",
    minLockedTokens: 10000,
    earningsMultiplier: 1.35,
    unlockDays: 21,
    description: "Operator-grade stake for serious resource providers."
  },
  {
    id: "tier_sovereign",
    name: "Sovereign",
    minLockedTokens: 50000,
    earningsMultiplier: 1.75,
    unlockDays: 45,
    description: "Maximum multiplier for high-throughput BRIDLE network operators."
  }
];

export const seededStakePositions: StakePosition[] = [
  {
    id: "stake_demo_harnessed",
    userId: demoUser.id,
    tierId: "tier_harnessed",
    lockedTokens: 12500,
    tokenSymbol: "BRDL",
    status: "active",
    lockedAt: "2026-06-18T12:00:00.000Z",
    unlockAvailableAt: "2026-07-09T12:00:00.000Z"
  }
];

export const seededEarningsTicker: EarningsTicker = {
  accruedUsdc: 42.18,
  baseUsdcPerSecond: 0.002184,
  boostedUsdcPerSecond: 0.002948,
  multiplier: 1.35,
  lastTickAt: "2026-06-23T15:36:00.000Z"
};

export const seededTokenGate: TokenGate = {
  id: "gate_bridle_holder",
  tokenSymbol: "$BRIDLE",
  mintAddress: bridleTokenMint,
  holderAddress: "DemoWallet111111111111111111111111111111111",
  balance: 18888,
  minBalance: 1000,
  priorityBoost: 12,
  status: "active",
  verifiedAt: "2026-06-23T15:36:00.000Z"
};

export const seededConnections: ResourceConnection[] = [
  {
    id: "conn_agent_dataset",
    sourceId: "res_research_agent_alpha",
    targetId: "res_product_embeddings_dataset",
    label: "retrieves context",
    status: "live"
  },
  {
    id: "conn_agent_api",
    sourceId: "res_research_agent_alpha",
    targetId: "res_internal_pricing_api",
    label: "quotes usage",
    status: "live"
  },
  {
    id: "conn_gpu_api",
    sourceId: "res_vision_gpu_node_01",
    targetId: "res_internal_pricing_api",
    label: "meters inference",
    status: "draft"
  },
  {
    id: "conn_api_wallet",
    sourceId: "res_internal_pricing_api",
    targetId: "res_treasury_wallet",
    label: "settles payouts",
    status: "live"
  }
];

export const seededVenues: RouteVenue[] = [
  {
    id: "venue_agent_market",
    name: "Agent marketplace ingress",
    type: "agent-workload",
    description: "Public agent requests that need high uptime and monetized execution.",
    requiredTypes: ["ai-agent", "api", "dataset"],
    demandUnits: 780,
    priority: 92,
    latencyTargetMs: 900,
    maxErrorRate: 2,
    status: "open"
  },
  {
    id: "venue_inference_lane",
    name: "Paid inference lane",
    type: "compute",
    description: "GPU-backed inference calls routed toward available compute capacity.",
    requiredTypes: ["gpu", "api"],
    demandUnits: 520,
    priority: 86,
    latencyTargetMs: 1300,
    maxErrorRate: 2.5,
    status: "open"
  },
  {
    id: "venue_data_retrieval",
    name: "Dataset retrieval pool",
    type: "data",
    description: "Retrieval traffic for token-gated datasets and agent context windows.",
    requiredTypes: ["dataset", "api"],
    demandUnits: 430,
    priority: 74,
    latencyTargetMs: 220,
    maxErrorRate: 1,
    status: "open"
  },
  {
    id: "venue_settlement",
    name: "Settlement rail",
    type: "settlement",
    description: "Wallet-enabled payout and value routing operations.",
    requiredTypes: ["wallet", "api"],
    demandUnits: 160,
    priority: 68,
    latencyTargetMs: 650,
    maxErrorRate: 1.5,
    status: "open"
  }
];

export const seededAutoRoutes: AutoRoute[] = [
  {
    id: "route_agent_market_research",
    venueId: "venue_agent_market",
    resourceId: "res_research_agent_alpha",
    score: 93,
    allocationPercent: 66,
    status: "live",
    reason: "Best fit for agent workload with monetized visibility and healthy uptime.",
    scoreBreakdown: {
      health: 99,
      latency: 94,
      reliability: 96,
      cost: 86,
      fit: 100,
      holder: 60
    },
    lastScoredAt: "2026-06-23T15:35:00.000Z",
    nextReallocationAt: "2026-06-23T15:40:00.000Z"
  },
  {
    id: "route_agent_market_dataset",
    venueId: "venue_agent_market",
    resourceId: "res_product_embeddings_dataset",
    score: 88,
    allocationPercent: 34,
    status: "live",
    reason: "Dataset supports context retrieval for marketplace agent requests.",
    scoreBreakdown: {
      health: 100,
      latency: 100,
      reliability: 99,
      cost: 82,
      fit: 82,
      holder: 60
    },
    lastScoredAt: "2026-06-23T15:35:00.000Z",
    nextReallocationAt: "2026-06-23T15:40:00.000Z"
  },
  {
    id: "route_inference_gpu",
    venueId: "venue_inference_lane",
    resourceId: "res_vision_gpu_node_01",
    score: 91,
    allocationPercent: 78,
    status: "live",
    reason: "Highest compute fit with active heartbeat and public metered mode.",
    scoreBreakdown: {
      health: 98,
      latency: 91,
      reliability: 95,
      cost: 88,
      fit: 100,
      holder: 60
    },
    lastScoredAt: "2026-06-23T15:35:00.000Z",
    nextReallocationAt: "2026-06-23T15:40:00.000Z"
  },
  {
    id: "route_inference_pricing_api",
    venueId: "venue_inference_lane",
    resourceId: "res_internal_pricing_api",
    score: 63,
    allocationPercent: 22,
    status: "standby",
    reason: "Useful for metering but degraded error rate limits allocation.",
    scoreBreakdown: {
      health: 76,
      latency: 100,
      reliability: 52,
      cost: 90,
      fit: 62,
      holder: 60
    },
    lastScoredAt: "2026-06-23T15:35:00.000Z",
    nextReallocationAt: "2026-06-23T15:40:00.000Z"
  },
  {
    id: "route_retrieval_dataset",
    venueId: "venue_data_retrieval",
    resourceId: "res_product_embeddings_dataset",
    score: 96,
    allocationPercent: 100,
    status: "live",
    reason: "Fast token-gated dataset with excellent uptime and direct retrieval fit.",
    scoreBreakdown: {
      health: 100,
      latency: 100,
      reliability: 100,
      cost: 86,
      fit: 100,
      holder: 60
    },
    lastScoredAt: "2026-06-23T15:35:00.000Z",
    nextReallocationAt: "2026-06-23T15:40:00.000Z"
  },
  {
    id: "route_settlement_wallet",
    venueId: "venue_settlement",
    resourceId: "res_treasury_wallet",
    score: 94,
    allocationPercent: 100,
    status: "live",
    reason: "Settlement-compatible Solana wallet with perfect uptime.",
    scoreBreakdown: {
      health: 100,
      latency: 100,
      reliability: 100,
      cost: 92,
      fit: 100,
      holder: 60
    },
    lastScoredAt: "2026-06-23T15:35:00.000Z",
    nextReallocationAt: "2026-06-23T15:40:00.000Z"
  }
];

export const seededRouteReallocations: RouteReallocation[] = [
  {
    id: "realloc_20260623_1535",
    ranAt: "2026-06-23T15:35:00.000Z",
    nextRunAt: "2026-06-23T15:40:00.000Z",
    durationMs: 148,
    routesChanged: 3,
    summary: "Scored 6 resources against 4 venues. Reduced degraded API allocation and favored dataset retrieval."
  }
];

export const seededFlows: OrchestrationFlow[] = [
  {
    id: "flow_research_settlement",
    name: "Research settlement loop",
    description: "Agent retrieves context, prices the request, and prepares wallet settlement.",
    createdAt: "2026-06-20T11:00:00.000Z",
    updatedAt: "2026-06-23T14:12:00.000Z",
    steps: [
      {
        id: "step_research_agent",
        resourceId: "res_research_agent_alpha",
        order: 1,
        verb: "invoke agent"
      },
      {
        id: "step_embeddings_dataset",
        resourceId: "res_product_embeddings_dataset",
        order: 2,
        verb: "query dataset"
      },
      {
        id: "step_pricing_api",
        resourceId: "res_internal_pricing_api",
        order: 3,
        verb: "quote usage"
      },
      {
        id: "step_treasury_wallet",
        resourceId: "res_treasury_wallet",
        order: 4,
        verb: "prepare payout"
      }
    ]
  }
];

export const seededFlowRuns: FlowRun[] = [
  {
    id: "run_research_settlement_001",
    flowId: "flow_research_settlement",
    status: "success",
    durationMs: 1794,
    startedAt: "2026-06-23T14:40:00.000Z",
    finishedAt: "2026-06-23T14:40:01.794Z",
    trace: [
      {
        id: "trace_research_agent_001",
        stepId: "step_research_agent",
        resourceId: "res_research_agent_alpha",
        resourceName: "Research Agent Alpha",
        verb: "invoke agent",
        status: "success",
        latencyMs: 842,
        message: "Agent invocation accepted and returned structured output.",
        startedAt: "2026-06-23T14:40:00.000Z",
        finishedAt: "2026-06-23T14:40:00.842Z"
      },
      {
        id: "trace_embeddings_dataset_001",
        stepId: "step_embeddings_dataset",
        resourceId: "res_product_embeddings_dataset",
        resourceName: "Product Embeddings Dataset",
        verb: "query dataset",
        status: "success",
        latencyMs: 96,
        message: "Dataset lookup returned retrieval context.",
        startedAt: "2026-06-23T14:40:00.842Z",
        finishedAt: "2026-06-23T14:40:00.938Z"
      },
      {
        id: "trace_pricing_api_001",
        stepId: "step_pricing_api",
        resourceId: "res_internal_pricing_api",
        resourceName: "Internal Pricing API",
        verb: "quote usage",
        status: "success",
        latencyMs: 446,
        message: "Pricing quote returned with degraded route weight.",
        startedAt: "2026-06-23T14:40:00.938Z",
        finishedAt: "2026-06-23T14:40:01.384Z"
      },
      {
        id: "trace_treasury_wallet_001",
        stepId: "step_treasury_wallet",
        resourceId: "res_treasury_wallet",
        resourceName: "Treasury Wallet",
        verb: "prepare payout",
        status: "success",
        latencyMs: 410,
        message: "Settlement intent staged for Solana payout routing.",
        startedAt: "2026-06-23T14:40:01.384Z",
        finishedAt: "2026-06-23T14:40:01.794Z"
      }
    ]
  }
];

export const seededX402Settlements: X402Settlement[] = [
  {
    id: "x402_settlement_demo_001",
    resourceId: "res_research_agent_alpha",
    payerAddress: "demo-payer-wallet",
    recipientAddress: "11111111111111111111111111111111",
    amountUsdc: 18.75,
    memo: "x402:BRIDLE:Research Agent Alpha:usage-settlement",
    status: "draft",
    usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    network: "devnet",
    createdAt: "2026-06-23T15:00:00.000Z",
    updatedAt: "2026-06-23T15:00:00.000Z"
  }
];

export const initialState: BridleState = {
  user: demoUser,
  wallet: {
    id: "wallet_demo",
    userId: demoUser.id,
    chain: "solana",
    address: "9wFFmGqRzXzDemo11111111111111111111111111",
    balanceSol: 42.81,
    payoutEnabled: true,
    createdAt: "2026-06-11T16:42:00.000Z"
  },
  tokenGate: seededTokenGate,
  membershipTiers: seededMembershipTiers,
  stakePositions: seededStakePositions,
  earningsTicker: seededEarningsTicker,
  resources: seededResources,
  connections: seededConnections,
  venues: seededVenues,
  autoRoutes: seededAutoRoutes,
  routeReallocations: seededRouteReallocations,
  flows: seededFlows,
  flowRuns: seededFlowRuns,
  usageEvents: seededResources.flatMap((resource, resourceIndex) =>
    Array.from({ length: 8 }).map((_, index) => ({
      id: `usage_${resource.id}_${index}`,
      resourceId: resource.id,
      timestamp: new Date(Date.UTC(2026, 5, 16 + index, 10, resourceIndex * 5)).toISOString(),
      requests: Math.round(resource.usage.requests / 16 + index * (resourceIndex + 18)),
      computeHours: Number((resource.usage.computeHours / 20 + index * 0.8).toFixed(1)),
      value: Math.round(resource.earningsEstimate / 12 + index * (resourceIndex + 9)),
      latencyMs: Math.max(40, resource.usage.latencyMs - index * 12),
      errors: Math.round(resource.usage.errorRate * (index + 1))
    }))
  ),
  earnings: seededResources.map((resource, index) => ({
    id: `earn_${resource.id}`,
    resourceId: resource.id,
    amountUsd: Math.round(resource.earningsEstimate * 0.72),
    source: resource.pricingMode === "internal" ? "internal value estimate" : "marketplace usage",
    timestamp: new Date(Date.UTC(2026, 5, 20 + index, 9, 30)).toISOString(),
    status: resource.visibility === "monetized" ? "estimated" : "pending"
  })),
  payouts: [
    {
      id: "payout_001",
      walletId: "wallet_demo",
      amountUsd: 620,
      txSignature: "4CUX...BRDL",
      status: "settled",
      createdAt: "2026-06-18T12:00:00.000Z"
    },
    {
      id: "payout_002",
      walletId: "wallet_demo",
      amountUsd: 840,
      txSignature: "8LkP...REIN",
      status: "pending",
      createdAt: "2026-06-22T18:40:00.000Z"
    }
  ],
  x402Settlements: seededX402Settlements,
  healthChecks: seededResources.map((resource, index) => ({
    id: `health_${resource.id}`,
    resourceId: resource.id,
    status: resource.status,
    latencyMs: resource.usage.latencyMs,
    message:
      resource.status === "active"
        ? "Heartbeat accepted. Resource remains in routing pool."
        : resource.status === "degraded"
          ? "Elevated error rate. Routing weight reduced."
          : "Heartbeat missed. Resource removed from live routes.",
    checkedAt: new Date(Date.UTC(2026, 5, 23, 15, 20 + index)).toISOString()
  })),
  apiKeys: [
    {
      id: "key_public_router",
      label: "Public router key",
      prefix: "brdl_pub_8f2a",
      scopes: ["resources:read", "routes:invoke"],
      createdAt: "2026-06-05T10:00:00.000Z"
    },
    {
      id: "key_worker_ingest",
      label: "Worker ingest key",
      prefix: "brdl_wrk_19bd",
      scopes: ["workers:heartbeat", "usage:write"],
      createdAt: "2026-06-09T14:20:00.000Z"
    }
  ],
  auditLogs: [
    {
      id: "audit_route",
      actor: "Operator Zero",
      action: "activated route",
      target: "Research Agent Alpha -> Product Embeddings Dataset",
      createdAt: "2026-06-23T14:12:00.000Z"
    },
    {
      id: "audit_gpu",
      actor: "BRIDLE classifier",
      action: "labeled capability",
      target: "Vision GPU Node 01",
      createdAt: "2026-06-23T13:51:00.000Z"
    }
  ],
  marketplace: [
    {
      id: "listing_research_agent",
      resourceId: "res_research_agent_alpha",
      availability: "99.3% live",
      priceLabel: "$0.018 / call",
      shortDescription: "Citation-ready research agent for paid API workflows.",
      featured: true
    },
    {
      id: "listing_gpu",
      resourceId: "res_vision_gpu_node_01",
      availability: "Night-window compute",
      priceLabel: "$1.40 / GPU hr",
      shortDescription: "Vision inference node with metered A6000 capacity.",
      featured: true
    },
    {
      id: "listing_dataset",
      resourceId: "res_product_embeddings_dataset",
      availability: "Token-gated",
      priceLabel: "$0.006 / query",
      shortDescription: "Commerce embeddings dataset for agent retrieval.",
      featured: false
    }
  ],
  notifications: [
    {
      id: "note_degraded_api",
      title: "Pricing API degraded",
      body: "BRIDLE reduced route weight until error rate falls below 2%.",
      severity: "warning",
      createdAt: "2026-06-23T15:12:00.000Z"
    },
    {
      id: "note_new_listing",
      title: "Marketplace listing indexed",
      body: "Research Agent Alpha is now discoverable by public API consumers.",
      severity: "success",
      createdAt: "2026-06-23T14:45:00.000Z"
    }
  ]
};
