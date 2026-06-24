"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialState } from "@/lib/seed";
import type {
  BridleState,
  FlowRun,
  FlowStepTrace,
  FlowStep,
  OrchestrationFlow,
  Resource,
  ResourceConnection,
  ResourceDraft,
  User,
  Wallet
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
  connectWallet: (address: string, balanceSol?: number) => void;
  resetDemo: () => void;
};

const storageKey = "bridle.state.v1";

const StoreContext = createContext<BridleStore | undefined>(undefined);

function normalizeState(state: BridleState): BridleState {
  return {
    ...initialState,
    ...state,
    flows: state.flows || initialState.flows,
    flowRuns: state.flowRuns || initialState.flowRuns
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
