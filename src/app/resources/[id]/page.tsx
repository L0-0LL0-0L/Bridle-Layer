"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity, ArrowLeft, Save, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTypeBadge, StatusBadge } from "@/components/retro";
import { EarningsBarChart } from "@/components/charts";
import { useBridle } from "@/lib/store";
import type { ResourceStatus, Visibility } from "@/lib/types";
import { formatCurrency, resourceTypeLabel } from "@/lib/utils";

const statuses: ResourceStatus[] = ["active", "degraded", "offline", "pending"];
const visibilities: Visibility[] = ["private", "team", "public", "monetized"];

export default function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, resources, connections, usageEvents, healthChecks, updateResource, recordExecutionLog } = useBridle();
  const [probing, setProbing] = useState(false);
  const [probeError, setProbeError] = useState<string | null>(null);
  const resource = resources.find((item) => item.id === params.id);

  if (!resource) {
    return (
      <AppShell title="Resource missing">
        <Card>
          <CardTitle>Nothing bound here</CardTitle>
          <Button asChild className="mt-5">
            <Link href="/resources">Return to registry</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  const currentResource = resource;
  const relatedConnections = connections.filter((connection) => connection.sourceId === currentResource.id || connection.targetId === currentResource.id);
  const relatedEvents = usageEvents.filter((event) => event.resourceId === currentResource.id);
  const relatedHealth = healthChecks.filter((check) => check.resourceId === currentResource.id);

  async function runHealthProbe() {
    setProbeError(null);
    setProbing(true);
    try {
      const response = await fetch("/api/resources/health", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          resource: currentResource,
          providerUserId: currentResource.ownerId
        })
      });
      const payload = await response.json();

      if (payload.log) {
        recordExecutionLog(payload.log);
      } else {
        setProbeError(payload.error || `Health probe failed (${response.status}).`);
      }
    } catch (error) {
      setProbeError(error instanceof Error ? error.message : "Health probe failed.");
    } finally {
      setProbing(false);
    }
  }

  return (
    <AppShell title={resource.name} kicker={`${resourceTypeLabel(resource.type)} detail page`}>
      <div className="mb-5 flex flex-wrap justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/resources">
            <ArrowLeft className="h-4 w-4" />
            Registry
          </Link>
        </Button>
        <Button onClick={() => updateResource(resource.id, { lastHeartbeat: new Date().toISOString(), status: "active" })}>
          <Save className="h-4 w-4" />
          Simulate heartbeat
        </Button>
        <Button disabled={probing || user?.id !== resource.ownerId} onClick={runHealthProbe} variant="ghost">
          <Stethoscope className="h-4 w-4" />
          {probing ? "Probing..." : "Provider health probe"}
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Metadata</CardTitle>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ResourceTypeBadge type={resource.type} />
                  <StatusBadge status={resource.status} />
                </div>
              </div>
              <div className="font-pixel text-sm text-white">{formatCurrency(resource.earningsEstimate)}</div>
            </CardHeader>
            <CardContent>
              <p className="mb-5 leading-7 text-zinc-300">{resource.description}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="border border-white/20 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">endpoint</div>
                  <div className="mt-2 break-words text-sm text-white">{resource.endpoint || resource.address || "not supplied"}</div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">last heartbeat</div>
                  <div className="mt-2 text-sm text-white">{new Date(resource.lastHeartbeat).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {Object.entries(resource.metadata).map(([key, value]) => (
                  <div className="border border-white/20 p-4" key={key}>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{key}</div>
                    <div className="mt-2 break-words font-pixel text-[10px] leading-5 text-white">{String(value)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <EarningsBarChart events={relatedEvents.length ? relatedEvents : usageEvents.slice(0, 8)} />
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle>Controls</CardTitle>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">status</span>
                <select
                  className="border-2 border-white/40 bg-black px-4 py-3 text-white"
                  onChange={(event) => updateResource(resource.id, { status: event.target.value as ResourceStatus })}
                  value={resource.status}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">visibility</span>
                <select
                  className="border-2 border-white/40 bg-black px-4 py-3 text-white"
                  onChange={(event) => updateResource(resource.id, { visibility: event.target.value as Visibility })}
                  value={resource.visibility}
                >
                  {visibilities.map((visibility) => (
                    <option key={visibility}>{visibility}</option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage and health</CardTitle>
              <Activity className="h-5 w-5" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["requests", resource.usage.requests.toLocaleString()],
                ["uptime", `${resource.usage.uptime}%`],
                ["latency", `${resource.lastLatencyMs ?? resource.usage.latencyMs}ms`],
                ["http", resource.lastHttpStatus ? String(resource.lastHttpStatus) : "n/a"],
                ["health", resource.healthStatus],
                ["errors", `${resource.usage.errorRate}%`]
              ].map(([label, value]) => (
                <div className="flex justify-between border-b border-white/10 pb-2" key={label}>
                  <span className="uppercase tracking-[0.18em] text-zinc-500">{label}</span>
                  <span className="font-pixel text-xs text-white">{value}</span>
                </div>
              ))}
              {probeError ? <div className="border border-red-200/60 p-3 text-xs leading-5 text-red-100">{probeError}</div> : null}
              {relatedHealth.map((check) => (
                <div className="border border-white/20 p-3 text-xs leading-5 text-zinc-400" key={check.id}>
                  {check.message}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardTitle>Routing relationships</CardTitle>
            <div className="mt-5 space-y-3">
              {relatedConnections.map((connection) => {
                const source = resources.find((item) => item.id === connection.sourceId);
                const target = resources.find((item) => item.id === connection.targetId);

                return (
                  <div className="border border-white/20 p-3 text-xs" key={connection.id}>
                    <div className="font-pixel leading-5 text-white">
                      {source?.name} -&gt; {target?.name}
                    </div>
                    <div className="mt-2 uppercase tracking-[0.16em] text-zinc-500">{connection.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
