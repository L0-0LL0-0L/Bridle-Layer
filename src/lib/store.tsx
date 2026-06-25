"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialState } from "@/lib/seed";
import type {
  AutoRoute,
  BridleState,
  EarningsTicker,
  FlowRun,
  FlowStepTrace,
  FlowStep,
  MembershipTier,
  OrchestrationFlow,
  RouteReallocation,
  RouteScoreBreakdown,
  RouteVenue,
  Resource,
  ResourceConnection,
  ResourceDraft,
  StakePosition,
  TokenGate,
  User,
  Wallet,
  X402Settlement
} from "@/lib/types";
import { makeId, nowIso } from "@/lib/utils";

type AuthPayload = {
  email: string;
  name?: string;
};

type BridleStore = BridleState & {
  hydrated: boolean;
  signIn: (payload: AuthPayload) => void;
  signUp: (payload: Required<AuthPayload>) => void;
  signOut: () => void;
  addResource: (draft: ResourceDraft) => Resource;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  addConnection: (connection: Omit<ResourceConnection, "id" | "status"> & { status?: ResourceConnection["status"] }) => void;
  saveFlow: (flow: {
    id?: string;
    name: string;
    description: string;
    steps: Array<Pick<FlowStep, "resourceId" | "verb">>;
  }) => OrchestrationFlow;
  runFlow: (flowId: string) => FlowRun | null;
  reallocateRoutes: () => RouteReallocation;
  lockMembershipTokens: (lockedTokens: number) => StakePosition;
  requestStakeUnlock: (stakeId: string) => void;
  createX402Settlement: (settlement: {
    resourceId?: string;
    payerAddress?: string;
    recipientAddress: string;
    amountUsdc: number;
    memo: string;
    usdcMint: string;
    network: X402Settlement["network"];
  }) => X402Settlement;
  markX402Settlement: (
    id: string,
    patch: Pick<Partial<X402Settlement>, "status" | "signature" | "payerAddress" | "error">
  ) => void;
  connectWallet: (address: string, balanceSol?: number) => void;
  updateTokenGate: (gate: Pick<TokenGate, "holderAddress" | "balance" | "status" | "verifiedAt">) => void;
  resetDemo: () => void;
};

const storageKey = "bridle.state.v1";
const reallocationIntervalMs = 5 * 60 * 1000;
const monthSeconds = 30 * 24 * 60 * 60;

const StoreContext = createContext<BridleStore | undefined>(undefined);

function normalizeState(state: BridleState): BridleState {
  return {
    ...initialState,
    ...state,
    tokenGate: state.tokenGate || initialState.tokenGate,
    membershipTiers: state.membershipTiers || initialState.membershipTiers,
    stakePositions: state.stakePositions || initialState.stakePositions,
    earningsTicker: state.earningsTicker || initialState.earningsTicker,
    venues: state.venues || initialState.venues,
    autoRoutes: state.autoRoutes || initialState.autoRoutes,
    routeReallocations: state.routeReallocations || initialState.routeReallocations,
    flows: state.flows || initialState.flows,
    flowRuns: state.flowRuns || initialState.flowRuns,
    x402Settlements: state.x402Settlements || initialState.x402Settlements
  };
}

function activeStake(stakePositions: StakePosition[]) {
  return [...stakePositions]
    .filter((stake) => stake.status === "active")
    .sort((a, b) => b.lockedTokens - a.lockedTokens)[0];
}

function tierForLockedTokens(tiers: MembershipTier[], lockedTokens: number) {
  return [...tiers]
    .filter((tier) => lockedTokens >= tier.minLockedTokens)
    .sort((a, b) => b.minLockedTokens - a.minLockedTokens)[0];
}

function activeMembershipTier(tiers: MembershipTier[], stakePositions: StakePosition[]) {
  const stake = activeStake(stakePositions);
  return tierForLockedTokens(tiers, stake?.lockedTokens || 0) || tiers[0];
}

function baseEarningsPerSecond(resources: Resource[]) {
  const monthlyEstimate = resources
    .filter((resource) => resource.status === "active")
    .reduce((total, resource) => total + resource.earningsEstimate, 0);

  return monthlyEstimate / monthSeconds;
}

function nextTicker(resources: Resource[], tiers: MembershipTier[], stakes: StakePosition[], current?: EarningsTicker): EarningsTicker {
  const tier = activeMembershipTier(tiers, stakes);
  const baseUsdcPerSecond = baseEarningsPerSecond(resources);
  const multiplier = tier?.earningsMultiplier || 1;

  return {
    accruedUsdc: current?.accruedUsdc || 0,
    baseUsdcPerSecond,
    boostedUsdcPerSecond: baseUsdcPerSecond * multiplier,
    multiplier,
    lastTickAt: nowIso()
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pricingScore(resource: Resource) {
  const byMode: Record<Resource["pricingMode"], number> = {
    internal: 92,
    free: 96,
    metered: 84,
    subscription: 78,
    settlement: 90
  };
  const visibilityBonus = resource.visibility === "public" || resource.visibility === "monetized" ? 5 : 0;

  return clampScore(byMode[resource.pricingMode] + visibilityBonus);
}

function healthScore(resource: Resource) {
  const statusScore: Record<Resource["status"], number> = {
    active: 100,
    degraded: 66,
    pending: 54,
    offline: 0
  };

  return clampScore(statusScore[resource.status] * 0.55 + resource.usage.uptime * 0.45);
}

function latencyScore(resource: Resource, venue: RouteVenue) {
  if (resource.status === "offline") {
    return 0;
  }

  const latency = resource.usage.latencyMs || venue.latencyTargetMs;
  if (latency <= venue.latencyTargetMs) {
    return clampScore(100 - (latency / Math.max(venue.latencyTargetMs, 1)) * 10);
  }

  return clampScore(100 - ((latency - venue.latencyTargetMs) / Math.max(venue.latencyTargetMs, 1)) * 70);
}

function reliabilityScore(resource: Resource, venue: RouteVenue) {
  if (resource.status === "offline") {
    return 0;
  }

  const errorRatio = resource.usage.errorRate / Math.max(venue.maxErrorRate, 0.1);
  return clampScore(100 - errorRatio * 34);
}

function fitScore(resource: Resource, venue: RouteVenue) {
  return venue.requiredTypes.includes(resource.type) ? 100 : 0;
}

function holderScore(tokenGate: TokenGate) {
  if (tokenGate.status !== "active") {
    return 0;
  }

  return clampScore(Math.min(tokenGate.priorityBoost, 20) * 5);
}

function scoreResourceForVenue(resource: Resource, venue: RouteVenue, tokenGate: TokenGate) {
  const scoreBreakdown: RouteScoreBreakdown = {
    health: healthScore(resource),
    latency: latencyScore(resource, venue),
    reliability: reliabilityScore(resource, venue),
    cost: pricingScore(resource),
    fit: fitScore(resource, venue),
    holder: holderScore(tokenGate)
  };

  const score = clampScore(
    scoreBreakdown.health * 0.25 +
      scoreBreakdown.latency * 0.2 +
      scoreBreakdown.reliability * 0.2 +
      scoreBreakdown.cost * 0.15 +
      scoreBreakdown.fit * 0.15 +
      scoreBreakdown.holder * 0.05
  );

  return {
    score,
    scoreBreakdown
  };
}

function routeReason(resource: Resource, venue: RouteVenue, score: number, tokenGate: TokenGate) {
  if (resource.status === "offline") {
    return "Resource offline; blocked until heartbeat returns.";
  }

  if (resource.status === "degraded") {
    return "Resource matches venue but degraded health reduced allocation.";
  }

  if (score >= 90) {
    return tokenGate.status === "active"
      ? `Strong ${resource.type} fit for ${venue.name}; $BRIDLE holder gate added priority boost.`
      : `Strong ${resource.type} fit for ${venue.name} with healthy telemetry.`;
  }

  if (score >= 70) {
    return "Eligible route with acceptable score and venue fit.";
  }

  return "Kept on standby because score is below the live allocation threshold.";
}

function applyRouteReallocation(current: BridleState): { state: BridleState; reallocation: RouteReallocation } {
  const started = Date.now();
  const ranAt = new Date(started).toISOString();
  const nextRunAt = new Date(started + reallocationIntervalMs).toISOString();
  const nextRoutes: AutoRoute[] = current.venues.flatMap((venue) => {
    if (venue.status === "paused") {
      return [];
    }

    const candidates = current.resources
      .filter((resource) => venue.requiredTypes.includes(resource.type))
      .map((resource) => ({
        resource,
        ...scoreResourceForVenue(resource, venue, current.tokenGate)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const allocationPool = candidates.filter((candidate) => candidate.score >= 45 && candidate.resource.status !== "offline");
    const scoreTotal = allocationPool.reduce((total, candidate) => total + candidate.score, 0);

    return candidates.map((candidate) => {
      const allocationPercent =
        scoreTotal > 0 && candidate.score >= 45 && candidate.resource.status !== "offline"
          ? Math.round((candidate.score / scoreTotal) * 100)
          : 0;
      const status: AutoRoute["status"] =
        candidate.resource.status === "offline" || candidate.score < 45
          ? "blocked"
          : candidate.score >= 70
            ? "live"
            : "standby";

      return {
        id: `route_${venue.id}_${candidate.resource.id}`,
        venueId: venue.id,
        resourceId: candidate.resource.id,
        score: candidate.score,
        allocationPercent,
        status,
        reason: routeReason(candidate.resource, venue, candidate.score, current.tokenGate),
        scoreBreakdown: candidate.scoreBreakdown,
        lastScoredAt: ranAt,
        nextReallocationAt: nextRunAt
      };
    });
  });

  const previousById = new Map(current.autoRoutes.map((route) => [route.id, route]));
  const routesChanged = nextRoutes.filter((route) => {
    const previous = previousById.get(route.id);
    return !previous || previous.status !== route.status || previous.allocationPercent !== route.allocationPercent || previous.score !== route.score;
  }).length;

  const reallocation: RouteReallocation = {
    id: makeId("realloc"),
    ranAt,
    nextRunAt,
    durationMs: Math.max(1, Date.now() - started),
    routesChanged,
    summary: `Scored ${current.resources.length} resources against ${current.venues.length} venues; ${routesChanged} route rows changed. Holder gate: ${current.tokenGate.status}.`
  };

  return {
    state: {
      ...current,
      autoRoutes: nextRoutes,
      routeReallocations: [reallocation, ...current.routeReallocations].slice(0, 20),
      auditLogs: [
        {
          id: makeId("audit"),
          actor: "BRIDLE auto-router",
          action: "reallocated routes",
          target: `${routesChanged} changes`,
          createdAt: ranAt
        },
        ...current.auditLogs
      ],
      notifications:
        routesChanged > 0
          ? [
              {
                id: makeId("note"),
                title: "Routes reallocated",
                body: reallocation.summary,
                severity: "info",
                createdAt: ranAt
              },
              ...current.notifications
            ]
          : current.notifications
    },
    reallocation
  };
}

function resourceDefaults(draft: ResourceDraft, ownerId: string): Resource {
  const baseRequests = draft.type === "wallet" ? 0 : Math.round(400 + Math.random() * 1400);
  const activeStatus = draft.type === "pc-worker" ? "pending" : "active";

  return {
    id: makeId("res"),
    ownerId,
    name: draft.name,
    type: draft.type,
    description: draft.description,
    status: activeStatus,
    visibility: draft.visibility,
    pricingMode: draft.pricingMode,
    endpoint: draft.endpoint,
    address: draft.address,
    metadata: draft.metadata,
    tags: draft.tags,
    usage: {
      requests: baseRequests,
      computeHours: draft.type === "gpu" || draft.type === "pc-worker" ? 8 : 0,
      uptime: activeStatus === "active" ? 99.1 : 0,
      latencyMs: draft.type === "dataset" ? 88 : 420,
      errorRate: 0.2
    },
    earningsEstimate: draft.visibility === "monetized" ? 120 : 0,
    createdAt: nowIso(),
    lastHeartbeat: nowIso()
  };
}

function createUser(payload: AuthPayload): User {
  return {
    id: makeId("user"),
    name: payload.name || payload.email.split("@")[0] || "BRIDLE Operator",
    email: payload.email,
    role: "operator",
    createdAt: nowIso()
  };
}

function stepLatency(resource: Resource | undefined) {
  if (!resource || resource.status === "offline") {
    return 0;
  }

  const base = resource.usage.latencyMs || 160;
  const statusPenalty = resource.status === "degraded" ? 220 : resource.status === "pending" ? 90 : 0;
  const jitter = Math.round(24 + Math.random() * 120);

  return base + statusPenalty + jitter;
}

function traceMessage(resource: Resource | undefined, verb: string) {
  if (!resource) {
    return "Resource missing from registry. Step could not execute.";
  }

  if (resource.status === "offline") {
    return "Resource offline. BRIDLE stopped this step and marked the run failed.";
  }

  if (resource.status === "degraded") {
    return `${verb} completed through degraded resource with elevated latency.`;
  }

  return `${verb} completed and emitted trace telemetry.`;
}

function simulateFlowRun(flow: OrchestrationFlow, resources: Resource[]): FlowRun {
  const startedAtMs = Date.now();
  let cursor = startedAtMs;
  let hasFailure = false;

  const trace = [...flow.steps]
    .sort((a, b) => a.order - b.order)
    .map((step) => {
      const resource = resources.find((item) => item.id === step.resourceId);
      const latencyMs = stepLatency(resource);
      const status: FlowStepTrace["status"] = !resource || resource.status === "offline" ? "failed" : "success";
      const startedAt = new Date(cursor).toISOString();
      cursor += latencyMs;
      const finishedAt = new Date(cursor).toISOString();

      if (status === "failed") {
        hasFailure = true;
      }

      return {
        id: makeId("trace"),
        stepId: step.id,
        resourceId: step.resourceId,
        resourceName: resource?.name || "Missing resource",
        verb: step.verb,
        status,
        latencyMs,
        message: traceMessage(resource, step.verb),
        startedAt,
        finishedAt
      };
    });

  return {
    id: makeId("run"),
    flowId: flow.id,
    status: hasFailure ? "failed" : "success",
    durationMs: Math.max(1, cursor - startedAtMs),
    startedAt: new Date(startedAtMs).toISOString(),
    finishedAt: new Date(cursor).toISOString(),
    trace
  };
}

export function BridleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BridleState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        setState(normalizeState(JSON.parse(stored) as BridleState));
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const interval = window.setInterval(() => {
      setState((current) => applyRouteReallocation(current).state);
    }, reallocationIntervalMs);

    return () => window.clearInterval(interval);
  }, [hydrated]);

  const value = useMemo<BridleStore>(
    () => ({
      ...state,
      hydrated,
      signIn: (payload) => {
        setState((current) => ({
          ...current,
          user:
            current.user?.email === payload.email
              ? current.user
              : createUser({
                  email: payload.email,
                  name: payload.name
                })
        }));
      },
      signUp: (payload) => {
        setState((current) => ({
          ...current,
          user: createUser(payload)
        }));
      },
      signOut: () => {
        setState((current) => ({
          ...current,
          user: null
        }));
      },
      addResource: (draft) => {
        const ownerId = state.user?.id || initialState.user?.id || "user_demo";
        const resource = resourceDefaults(draft, ownerId);
        setState((current) => ({
          ...current,
          resources: [resource, ...current.resources],
          healthChecks: [
            {
              id: makeId("health"),
              resourceId: resource.id,
              status: resource.status,
              latencyMs: resource.usage.latencyMs,
              message: "Resource activated through add-resource wizard.",
              checkedAt: nowIso()
            },
            ...current.healthChecks
          ],
          auditLogs: [
            {
              id: makeId("audit"),
              actor: current.user?.name || "BRIDLE operator",
              action: "registered resource",
              target: resource.name,
              createdAt: nowIso()
            },
            ...current.auditLogs
          ],
          notifications: [
            {
              id: makeId("note"),
              title: "Resource bound",
              body: `${resource.name} joined the programmable network.`,
              severity: "success",
              createdAt: nowIso()
            },
            ...current.notifications
          ],
          marketplace:
            resource.visibility === "public" || resource.visibility === "monetized"
              ? [
                  {
                    id: makeId("listing"),
                    resourceId: resource.id,
                    availability: `${resource.usage.uptime.toFixed(1)}% live`,
                    priceLabel: resource.pricingMode === "metered" ? "Metered" : resource.pricingMode,
                    shortDescription: resource.description,
                    featured: false
                  },
                  ...current.marketplace
                ]
              : current.marketplace
        }));
        return resource;
      },
      updateResource: (id, patch) => {
        setState((current) => ({
          ...current,
          resources: current.resources.map((resource) => (resource.id === id ? { ...resource, ...patch } : resource))
        }));
      },
      addConnection: (connection) => {
        setState((current) => ({
          ...current,
          connections: [
            {
              id: makeId("conn"),
              status: connection.status || "draft",
              sourceId: connection.sourceId,
              targetId: connection.targetId,
              label: connection.label
            },
            ...current.connections
          ],
          auditLogs: [
            {
              id: makeId("audit"),
              actor: current.user?.name || "BRIDLE router",
              action: "created route",
              target: connection.label,
              createdAt: nowIso()
            },
            ...current.auditLogs
          ]
        }));
      },
      saveFlow: (flow) => {
        const existing = flow.id ? state.flows.find((item) => item.id === flow.id) : undefined;
        const savedFlow: OrchestrationFlow = {
          id: existing?.id || makeId("flow"),
          name: flow.name,
          description: flow.description,
          createdAt: existing?.createdAt || nowIso(),
          updatedAt: nowIso(),
          steps: flow.steps.map((step, index) => ({
            id: existing?.steps[index]?.id || makeId("step"),
            resourceId: step.resourceId,
            verb: step.verb,
            order: index + 1
          }))
        };

        setState((current) => ({
          ...current,
          flows: existing
            ? current.flows.map((item) => (item.id === savedFlow.id ? savedFlow : item))
            : [savedFlow, ...current.flows],
          auditLogs: [
            {
              id: makeId("audit"),
              actor: current.user?.name || "BRIDLE orchestrator",
              action: existing ? "updated flow" : "saved flow",
              target: savedFlow.name,
              createdAt: nowIso()
            },
            ...current.auditLogs
          ],
          notifications: [
            {
              id: makeId("note"),
              title: existing ? "Flow updated" : "Flow saved",
              body: `${savedFlow.name} contains ${savedFlow.steps.length} ordered resource steps.`,
              severity: "success",
              createdAt: nowIso()
            },
            ...current.notifications
          ]
        }));

        return savedFlow;
      },
      runFlow: (flowId) => {
        const flow = state.flows.find((item) => item.id === flowId);

        if (!flow) {
          return null;
        }

        const run = simulateFlowRun(flow, state.resources);

        setState((current) => ({
          ...current,
          flowRuns: [run, ...current.flowRuns],
          auditLogs: [
            {
              id: makeId("audit"),
              actor: current.user?.name || "BRIDLE orchestrator",
              action: `ran flow (${run.status})`,
              target: flow.name,
              createdAt: run.startedAt
            },
            ...current.auditLogs
          ],
          notifications: [
            {
              id: makeId("note"),
              title: run.status === "success" ? "Flow completed" : "Flow failed",
              body: `${flow.name} finished in ${run.durationMs}ms with ${run.trace.length} trace events.`,
              severity: run.status === "success" ? "success" : "warning",
              createdAt: run.finishedAt
            },
            ...current.notifications
          ]
        }));

        return run;
      },
      reallocateRoutes: () => {
        const { state: nextState, reallocation } = applyRouteReallocation(state);
        setState(nextState);
        return reallocation;
      },
      lockMembershipTokens: (lockedTokens) => {
        const safeAmount = Math.max(0, Math.floor(lockedTokens));
        const tier = tierForLockedTokens(state.membershipTiers, safeAmount) || state.membershipTiers[0];
        const lockedAt = nowIso();
        const unlockAvailableAt = new Date(Date.now() + (tier?.unlockDays || 0) * 24 * 60 * 60 * 1000).toISOString();
        const stake: StakePosition = {
          id: makeId("stake"),
          userId: state.user?.id || "user_demo",
          tierId: tier.id,
          lockedTokens: safeAmount,
          tokenSymbol: "BRDL",
          status: "active",
          lockedAt,
          unlockAvailableAt
        };

        setState((current) => {
          const stakePositions = [stake, ...current.stakePositions];

          return {
            ...current,
            stakePositions,
            earningsTicker: nextTicker(current.resources, current.membershipTiers, stakePositions, current.earningsTicker),
            auditLogs: [
              {
                id: makeId("audit"),
                actor: current.user?.name || "BRIDLE member",
                action: "locked membership stake",
                target: `${safeAmount.toLocaleString()} BRDL -> ${tier.name}`,
                createdAt: lockedAt
              },
              ...current.auditLogs
            ],
            notifications: [
              {
                id: makeId("note"),
                title: "Membership boosted",
                body: `${tier.name} tier active at ${tier.earningsMultiplier.toFixed(2)}x earnings.`,
                severity: "success",
                createdAt: lockedAt
              },
              ...current.notifications
            ]
          };
        });

        return stake;
      },
      requestStakeUnlock: (stakeId) => {
        setState((current) => {
          const stakePositions = current.stakePositions.map((stake) =>
            stake.id === stakeId
              ? {
                  ...stake,
                  status: "unlocking" as const
                }
              : stake
          );

          return {
            ...current,
            stakePositions,
            earningsTicker: nextTicker(current.resources, current.membershipTiers, stakePositions, current.earningsTicker),
            auditLogs: [
              {
                id: makeId("audit"),
                actor: current.user?.name || "BRIDLE member",
                action: "requested stake unlock",
                target: stakeId,
                createdAt: nowIso()
              },
              ...current.auditLogs
            ]
          };
        });
      },
      createX402Settlement: (settlement) => {
        const created: X402Settlement = {
          id: makeId("x402"),
          status: "pending-signature",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          ...settlement
        };

        setState((current) => ({
          ...current,
          x402Settlements: [created, ...current.x402Settlements],
          auditLogs: [
            {
              id: makeId("audit"),
              actor: current.user?.name || "BRIDLE settlement",
              action: "created x402 USDC settlement",
              target: `${created.amountUsdc} USDC`,
              createdAt: created.createdAt
            },
            ...current.auditLogs
          ]
        }));

        return created;
      },
      markX402Settlement: (id, patch) => {
        setState((current) => ({
          ...current,
          x402Settlements: current.x402Settlements.map((settlement) =>
            settlement.id === id
              ? {
                  ...settlement,
                  ...patch,
                  updatedAt: nowIso()
                }
              : settlement
          ),
          auditLogs: [
            {
              id: makeId("audit"),
              actor: current.user?.name || "BRIDLE settlement",
              action: `x402 settlement ${patch.status || "updated"}`,
              target: patch.signature || id,
              createdAt: nowIso()
            },
            ...current.auditLogs
          ],
          notifications:
            patch.status === "confirmed" || patch.status === "failed"
              ? [
                  {
                    id: makeId("note"),
                    title: patch.status === "confirmed" ? "USDC settlement confirmed" : "USDC settlement failed",
                    body: patch.signature || patch.error || id,
                    severity: patch.status === "confirmed" ? "success" : "warning",
                    createdAt: nowIso()
                  },
                  ...current.notifications
                ]
              : current.notifications
        }));
      },
      connectWallet: (address, balanceSol = 0) => {
        setState((current) => {
          const wallet: Wallet = {
            id: current.wallet?.id || makeId("wallet"),
            userId: current.user?.id || "user_demo",
            chain: "solana",
            address,
            balanceSol,
            payoutEnabled: true,
            createdAt: current.wallet?.createdAt || nowIso()
          };

          return {
            ...current,
            wallet,
            notifications: [
              {
                id: makeId("note"),
                title: "Wallet connected",
                body: "Solana payout routing is ready for BRIDLE settlement.",
                severity: "success",
                createdAt: nowIso()
              },
              ...current.notifications
            ]
          };
        });
      },
      updateTokenGate: (gate) => {
        setState((current) => {
          const tokenGate: TokenGate = {
            ...current.tokenGate,
            ...gate
          };
          const { state: routedState } = applyRouteReallocation({
            ...current,
            tokenGate
          });

          return {
            ...routedState,
            tokenGate,
            auditLogs: [
              {
                id: makeId("audit"),
                actor: current.user?.name || "BRIDLE holder gate",
                action: "verified $BRIDLE holder gate",
                target: `${tokenGate.balance.toLocaleString()} ${tokenGate.tokenSymbol} / ${tokenGate.status}`,
                createdAt: gate.verifiedAt || nowIso()
              },
              ...routedState.auditLogs
            ],
            notifications: [
              {
                id: makeId("note"),
                title: tokenGate.status === "active" ? "$BRIDLE priority unlocked" : "$BRIDLE priority locked",
                body:
                  tokenGate.status === "active"
                    ? `${tokenGate.balance.toLocaleString()} $BRIDLE detected. Auto-router priority boost is active.`
                    : `Hold at least ${tokenGate.minBalance.toLocaleString()} $BRIDLE to unlock router priority.`,
                severity: tokenGate.status === "active" ? "success" : "warning",
                createdAt: gate.verifiedAt || nowIso()
              },
              ...routedState.notifications
            ]
          };
        });
      },
      resetDemo: () => {
        setState(initialState);
        window.localStorage.removeItem(storageKey);
      }
    }),
    [hydrated, state]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useBridle() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useBridle must be used inside BridleProvider");
  }

  return context;
}
