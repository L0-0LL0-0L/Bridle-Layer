"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ChartNoAxesCombined,
  CircleDollarSign,
  GitBranch,
  Network,
  Plus,
  RotateCcw,
  Server
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTypeBadge, StatCard, StatusBadge } from "@/components/retro";
import { UsageAreaChart } from "@/components/charts";
import { useBridle } from "@/lib/store";
import { cn, formatCompact, formatCurrency, resourceTypeLabel, summarizeResources } from "@/lib/utils";

function routeTone(status: "live" | "standby" | "blocked") {
  return {
    live: "border-emerald-200/70 bg-emerald-400/10 text-emerald-200",
    standby: "border-yellow-100/70 bg-yellow-400/10 text-yellow-100",
    blocked: "border-red-200/70 bg-red-400/10 text-red-100"
  }[status];
}

export default function DashboardPage() {
  const {
    resources,
    connections,
    notifications,
    auditLogs,
    usageEvents,
    venues,
    autoRoutes,
    routeReallocations,
    reallocateRoutes
  } = useBridle();
  const summary = summarizeResources(resources);
  const latestReallocation = routeReallocations[0];
  const liveRouteRows = [...autoRoutes].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "live" ? -1 : b.status === "live" ? 1 : 0;
    }

    return b.score - a.score;
  });

  return (
    <AppShell title="Dashboard" kicker="bind idle systems into one living network">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail={`${summary.active} active`} icon={Server} label="total resources" value={summary.total} />
        <StatCard detail={`${summary.offline} offline`} icon={Activity} label="active resources" value={summary.active} />
        <StatCard detail="metered calls" icon={ChartNoAxesCombined} label="total usage" value={summary.requests} />
        <StatCard detail="estimated value" icon={CircleDollarSign} label="earnings" value={formatCurrency(summary.earnings)} />
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>Live auto-router</CardTitle>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              BRIDLE scores registered resources against routing venues and reallocates live traffic every 5 minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="gap-2">
              <GitBranch className="h-3 w-3" />
              {venues.length} venues
            </Badge>
            {latestReallocation ? <Badge>{latestReallocation.routesChanged} changed</Badge> : null}
            <Button onClick={() => reallocateRoutes()} size="sm" type="button" variant="ghost">
              <RotateCcw className="h-3 w-3" />
              Reroute
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="border border-white/20 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">last allocation</div>
              <div className="mt-2 font-pixel text-xs leading-5 text-white">
                {latestReallocation ? new Date(latestReallocation.ranAt).toLocaleTimeString() : "not run"}
              </div>
            </div>
            <div className="border border-white/20 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">next allocation</div>
              <div className="mt-2 font-pixel text-xs leading-5 text-white">
                {latestReallocation ? new Date(latestReallocation.nextRunAt).toLocaleTimeString() : "pending"}
              </div>
            </div>
            <div className="border border-white/20 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">router summary</div>
              <div className="mt-2 text-xs leading-5 text-zinc-300">{latestReallocation?.summary || "Seeded routes active."}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-2 border-white/40 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  <th className="py-3 pr-4">venue</th>
                  <th className="py-3 pr-4">resource</th>
                  <th className="py-3 pr-4">status</th>
                  <th className="py-3 pr-4">score</th>
                  <th className="py-3 pr-4">allocation</th>
                  <th className="py-3 pr-4">breakdown</th>
                </tr>
              </thead>
              <tbody>
                {liveRouteRows.map((route) => {
                  const venue = venues.find((item) => item.id === route.venueId);
                  const resource = resources.find((item) => item.id === route.resourceId);

                  return (
                    <tr className="border-b border-white/10 align-top" key={route.id}>
                      <td className="py-4 pr-4">
                        <div className="font-pixel text-[10px] leading-5 text-white">{venue?.name || "Unknown venue"}</div>
                        <div className="mt-1 uppercase tracking-[0.18em] text-zinc-500">{venue?.type || "unknown"}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-pixel text-[10px] leading-5 text-white">{resource?.name || "Missing resource"}</div>
                        <div className="mt-1 uppercase tracking-[0.18em] text-zinc-500">
                          {resource ? resourceTypeLabel(resource.type) : "unknown"}
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <Badge className={cn("whitespace-nowrap", routeTone(route.status))}>{route.status}</Badge>
                        <div className="mt-2 max-w-48 leading-5 text-zinc-500">{route.reason}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-pixel text-lg text-white">{route.score}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-pixel text-sm text-white">{route.allocationPercent}%</div>
                        <div className="mt-2 h-2 border border-white/40 bg-black">
                          <div className="h-full bg-white" style={{ width: `${route.allocationPercent}%` }} />
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="grid grid-cols-5 gap-1 text-center text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                          {Object.entries(route.scoreBreakdown).map(([label, value]) => (
                            <div className="border border-white/10 p-1" key={label}>
                              <div className="text-white">{value}</div>
                              <div>{label[0]}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
        <UsageAreaChart events={usageEvents} />
        <Card>
          <CardHeader>
            <CardTitle>System notifications</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin">Health</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div className="border border-white/20 p-3" key={notification.id}>
                <div className="mb-2 flex items-center gap-2 font-pixel text-[10px] uppercase tracking-[0.18em] text-white">
                  <AlertTriangle className="h-3 w-3" />
                  {notification.title}
                </div>
                <p className="text-xs leading-5 text-zinc-400">{notification.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registry pulse</CardTitle>
            <Button asChild size="sm">
              <Link href="/resources/new">
                <Plus className="h-3 w-3" />
                Add
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.slice(0, 6).map((resource) => (
              <Link
                className="flex flex-col justify-between gap-3 border border-white/20 p-3 hover:border-white hover:bg-white/5 md:flex-row md:items-center"
                href={`/resources/${resource.id}`}
                key={resource.id}
              >
                <div>
                  <div className="font-pixel text-xs leading-5 text-white">{resource.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ResourceTypeBadge type={resource.type} />
                    <StatusBadge status={resource.status} />
                  </div>
                </div>
                <div className="text-right font-pixel text-xs text-white">{formatCompact(resource.usage.requests)}</div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Routing activity</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/orchestration">
                <Network className="h-3 w-3" />
                Graph
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {connections.map((connection) => {
              const source = resources.find((resource) => resource.id === connection.sourceId);
              const target = resources.find((resource) => resource.id === connection.targetId);

              return (
                <div className="border border-white/20 p-3" key={connection.id}>
                  <div className="font-pixel text-[10px] uppercase leading-5 text-white">
                    {source?.name || "Unknown"} -&gt; {target?.name || "Unknown"}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-400">
                    <span>{connection.label}</span>
                    <span className="uppercase tracking-[0.18em] text-white">{connection.status}</span>
                  </div>
                </div>
              );
            })}
            {auditLogs.slice(0, 2).map((log) => (
              <div className="border border-dashed border-white/20 p-3 text-xs text-zinc-400" key={log.id}>
                {log.actor} {log.action} <span className="text-white">{log.target}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
