"use client";

import { Activity, DatabaseZap, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatusBadge } from "@/components/retro";
import { useBridle } from "@/lib/store";
import { summarizeResources } from "@/lib/utils";

export default function AdminPage() {
  const { resources, healthChecks, auditLogs, connections } = useBridle();
  const summary = summarizeResources(resources);
  const degraded = resources.filter((resource) => resource.status === "degraded").length;

  return (
    <AppShell title="System Health" kicker="admin view of the BRIDLE control layer">
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard detail="routing pool" icon={Activity} label="active" value={summary.active} />
        <StatCard detail="needs attention" icon={ShieldAlert} label="degraded" value={degraded} />
        <StatCard detail="resource graph" icon={DatabaseZap} label="routes" value={connections.length} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Heartbeat checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthChecks.map((check) => {
              const resource = resources.find((item) => item.id === check.resourceId);

              return (
                <div className="grid gap-3 border border-white/20 p-4 md:grid-cols-[1fr_auto] md:items-center" key={check.id}>
                  <div>
                    <div className="font-pixel text-xs leading-5 text-white">{resource?.name || check.resourceId}</div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{check.message}</p>
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{new Date(check.checkedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <StatusBadge status={check.status} />
                    <Badge>{check.latencyMs}ms</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle>Audit log</CardTitle>
            <div className="mt-5 space-y-3">
              {auditLogs.map((log) => (
                <div className="border border-white/20 p-3 text-sm" key={log.id}>
                  <div className="text-white">
                    {log.actor} <span className="text-zinc-500">{log.action}</span>
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{log.target}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle>Production hardening TODOs</CardTitle>
            <div className="mt-5 space-y-3 text-sm leading-6 text-zinc-400">
              <div className="border border-dashed border-white/30 p-3">Enable Supabase RLS policies for every table.</div>
              <div className="border border-dashed border-white/30 p-3">Move API proxy execution to signed server routes.</div>
              <div className="border border-dashed border-white/30 p-3">Add worker heartbeat ingestion and retry queues.</div>
              <div className="border border-dashed border-white/30 p-3">Settle payouts through audited Solana programs.</div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
