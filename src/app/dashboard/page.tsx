"use client";

import Link from "next/link";
import { Activity, AlertTriangle, ChartNoAxesCombined, CircleDollarSign, Network, Plus, Server } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTypeBadge, StatCard, StatusBadge } from "@/components/retro";
import { UsageAreaChart } from "@/components/charts";
import { useBridle } from "@/lib/store";
import { formatCompact, formatCurrency, summarizeResources } from "@/lib/utils";

export default function DashboardPage() {
  const { resources, connections, notifications, auditLogs, usageEvents } = useBridle();
  const summary = summarizeResources(resources);

  return (
    <AppShell title="Dashboard" kicker="bind idle systems into one living network">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail={`${summary.active} active`} icon={Server} label="total resources" value={summary.total} />
        <StatCard detail={`${summary.offline} offline`} icon={Activity} label="active resources" value={summary.active} />
        <StatCard detail="metered calls" icon={ChartNoAxesCombined} label="total usage" value={summary.requests} />
        <StatCard detail="estimated value" icon={CircleDollarSign} label="earnings" value={formatCurrency(summary.earnings)} />
      </div>

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
