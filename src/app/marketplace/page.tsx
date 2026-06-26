"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FlaskConical, Globe2, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTypeBadge, StatusBadge } from "@/components/retro";
import { useBridle } from "@/lib/store";
import type { ExecutionLog, ResourceType } from "@/lib/types";
import { listMarketplace } from "@/lib/marketplace";
import { cn, formatCompact, resourceTypeLabel } from "@/lib/utils";

const filters: ("all" | ResourceType)[] = ["all", "ai-agent", "api", "gpu", "pc-worker", "wallet", "dataset"];

type CallResult = {
  mode: "sim" | "live";
  resourceName: string;
  log: Pick<ExecutionLog, "httpStatus" | "latencyMs" | "attempts" | "ok" | "error" | "responseExcerpt" | "charged">;
  billingReason: string;
};

function healthChip(resource: { healthStatus: string; lastLatencyMs?: number }) {
  const healthy = resource.healthStatus === "healthy";
  return (
    <Badge className={healthy ? "border-emerald-200/70 text-emerald-200" : "border-red-200/70 text-red-100"}>
      ● {healthy && typeof resource.lastLatencyMs === "number" ? `${resource.lastLatencyMs}ms` : "ERR"}
    </Badge>
  );
}

export default function MarketplacePage() {
  const { user, marketplace, resources, recordExecutionLog } = useBridle();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [callResult, setCallResult] = useState<CallResult | null>(null);
  const [callingResourceId, setCallingResourceId] = useState<string | null>(null);

  const listings = useMemo(
    () =>
      listMarketplace({
        listings: marketplace,
        resources,
        type: filter
      }),
    [filter, marketplace, resources]
  );

  function simulateCall(resourceId: string) {
    const resource = resources.find((item) => item.id === resourceId);
    if (!resource) {
      return;
    }

    setCallResult({
      mode: "sim",
      resourceName: resource.name,
      log: {
        httpStatus: 200,
        latencyMs: resource.lastLatencyMs || resource.usage.latencyMs || 160,
        attempts: 1,
        ok: true,
        responseExcerpt: `Simulated BRIDLE marketplace call for ${resource.name}. No provider endpoint was invoked and no credits were charged.`,
        charged: false
      },
      billingReason: "No charge: simulation only."
    });
  }

  async function liveCall(resourceId: string) {
    const resource = resources.find((item) => item.id === resourceId);
    if (!resource) {
      return;
    }

    setCallingResourceId(resourceId);
    try {
      const response = await fetch("/api/resources/execute", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          resource,
          callerUserId: user?.id || "guest"
        })
      });
      const payload = await response.json();

      if (payload.log) {
        recordExecutionLog(payload.log);
        setCallResult({
          mode: "live",
          resourceName: resource.name,
          log: payload.log,
          billingReason: payload.billing?.reason || (payload.log.charged ? "Charged." : "No charge.")
        });
      } else {
        setCallResult({
          mode: "live",
          resourceName: resource.name,
          log: {
            httpStatus: response.status,
            latencyMs: 0,
            attempts: 0,
            ok: false,
            error: payload.error || "Live call failed before execution.",
            responseExcerpt: "",
            charged: false
          },
          billingReason: "No charge: execution did not complete."
        });
      }
    } finally {
      setCallingResourceId(null);
    }
  }

  return (
    <AppShell title="Marketplace" kicker="discover the public BRIDLE network">
      <Card className="mb-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Network explorer</CardTitle>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Browse public and monetized resources that can be routed, invoked, or composed through BRIDLE.
            </p>
          </div>
          <Badge className="gap-2 border-white bg-white text-black">
            <Globe2 className="h-3 w-3" />
            {listings.length} listed
          </Badge>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              className={`border px-3 py-2 text-xs uppercase tracking-[0.18em] ${
                filter === item ? "border-white bg-white text-black" : "border-white/30 text-zinc-400 hover:text-white"
              }`}
              key={item}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item === "all" ? "All" : resourceTypeLabel(item)}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {listings.map(({ listing, resource }) => (
            <Card className={listing.featured ? "border-white shadow-[12px_12px_0_rgba(255,255,255,0.16)]" : ""} key={listing.id}>
              <CardHeader>
                <div>
                  <CardTitle className="leading-6">{resource.name}</CardTitle>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ResourceTypeBadge type={resource.type} />
                    <StatusBadge status={resource.status} />
                    {healthChip(resource)}
                  </div>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/resources/${resource.id}`}>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="min-h-16 text-sm leading-6 text-zinc-400">{listing.shortDescription}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="border border-white/20 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">availability</div>
                    <div className="mt-2 text-sm text-white">{listing.availability}</div>
                  </div>
                  <div className="border border-white/20 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">price</div>
                    <div className="mt-2 text-sm text-white">{listing.priceLabel}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  <span>usage</span>
                  <span className="font-pixel text-white">{formatCompact(resource.usageRequests)}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button onClick={() => simulateCall(resource.id)} size="sm" type="button" variant="ghost">
                    <FlaskConical className="h-3 w-3" />
                    ▸ Sim
                  </Button>
                  <Button disabled={callingResourceId === resource.id} onClick={() => liveCall(resource.id)} size="sm" type="button">
                    <Play className="h-3 w-3" />
                    ▶ Live
                  </Button>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>

      {callResult ? (
        <Card className="mt-5">
          <CardHeader>
            <div>
              <CardTitle>{callResult.mode === "live" ? "Live call result" : "Simulation result"}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{callResult.resourceName}</p>
            </div>
            <Badge className={cn(callResult.log.ok ? "border-emerald-200/70 text-emerald-200" : "border-red-200/70 text-red-100")}>
              {callResult.log.ok ? "OK" : "ERR"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">HTTP</div>
                <div className="mt-2 font-pixel text-xs text-white">{callResult.log.httpStatus || "n/a"}</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">latency</div>
                <div className="mt-2 font-pixel text-xs text-white">{callResult.log.latencyMs}ms</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">attempts</div>
                <div className="mt-2 font-pixel text-xs text-white">{callResult.log.attempts}</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">ledger</div>
                <div className="mt-2 font-pixel text-xs text-white">{callResult.log.charged ? "charged" : "no charge"}</div>
              </div>
            </div>
            <div className="mt-4 border border-white/20 p-4">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">response excerpt</div>
              <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-zinc-300">
                {callResult.log.responseExcerpt || callResult.log.error || "No response body."}
              </pre>
            </div>
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">{callResult.billingReason}</div>
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}
