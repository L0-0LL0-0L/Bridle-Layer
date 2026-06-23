"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity, ArrowLeft, Save } from "lucide-react";
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
  const { resources, connections, usageEvents, healthChecks, updateResource } = useBridle();
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

  const relatedConnections = connections.filter((connection) => connection.sourceId === resource.id || connection.targetId === resource.id);
  const relatedEvents = usageEvents.filter((event) => event.resourceId === resource.id);
  const relatedHealth = healthChecks.filter((check) => check.resourceId === resource.id);

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
                ["latency", `${resource.usage.latencyMs}ms`],
                ["errors", `${resource.usage.errorRate}%`]
              ].map(([label, value]) => (
                <div className="flex justify-between border-b border-white/10 pb-2" key={label}>
                  <span className="uppercase tracking-[0.18em] text-zinc-500">{label}</span>
                  <span className="font-pixel text-xs text-white">{value}</span>
                </div>
              ))}
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
