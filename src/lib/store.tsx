"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialState } from "@/lib/seed";
import type { BridleState, Resource, ResourceConnection, ResourceDraft, User, Wallet } from "@/lib/types";
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
  connectWallet: (address: string, balanceSol?: number) => void;
  resetDemo: () => void;
};

const storageKey = "bridle.state.v1";

const StoreContext = createContext<BridleStore | undefined>(undefined);

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

export function BridleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BridleState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        setState(JSON.parse(stored) as BridleState);
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
