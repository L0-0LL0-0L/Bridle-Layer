"use client";

import { Activity, AlertTriangle, CircleDollarSign, Cpu, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EarningsBarChart, UsageAreaChart } from "@/components/charts";
import { StatCard } from "@/components/retro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBridle } from "@/lib/store";
import { formatCurrency, summarizeResources } from "@/lib/utils";

export default function AnalyticsPage() {
  const { resources, usageEvents, payouts, earnings } = useBridle();
  const summary = summarizeResources(resources);
  const topResources = [...resources].sort((a, b) => b.earningsEstimate - a.earningsEstimate).slice(0, 5);
  const errorRate = resources.length ? resources.reduce((total, resource) => total + resource.usage.errorRate, 0) / resources.length : 0;
  const computeHours = resources.reduce((total, resource) => total + resource.usage.computeHours, 0);

  return (
    <AppShell title="Analytics" kicker="metering, uptime, and value estimates">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail="all resources" icon={TrendingUp} label="requests" value={summary.requests} />
        <StatCard detail="gpu + worker" icon={Cpu} label="compute hours" value={computeHours.toFixed(1)} />
        <StatCard detail="weighted average" icon={Activity} label="uptime" value={`${summary.avgUptime.toFixed(1)}%`} />
        <StatCard detail="estimated" icon={CircleDollarSign} label="earnings" value={formatCurrency(summary.earnings)} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <UsageAreaChart events={usageEvents} />
        <EarningsBarChart events={usageEvents} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Top resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topResources.map((resource, index) => (
              <div className="grid gap-3 border border-white/20 p-3 md:grid-cols-[48px_1fr_auto] md:items-center" key={resource.id}>
                <div className="font-pixel text-sm text-white">#{index + 1}</div>
                <div>
                  <div className="font-pixel text-xs leading-5 text-white">{resource.name}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {resource.usage.requests.toLocaleString()} requests · {resource.usage.uptime}% uptime
                  </div>
                </div>
                <div className="font-pixel text-xs text-white">{formatCurrency(resource.earningsEstimate)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border border-white/20 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <AlertTriangle className="h-3 w-3" />
                average error rate
              </div>
              <div className="font-pixel text-xl text-white">{errorRate.toFixed(2)}%</div>
            </div>
            {payouts.map((payout) => (
              <div className="border border-white/20 p-3 text-sm" key={payout.id}>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-400">{payout.txSignature}</span>
                  <span className="font-pixel text-xs text-white">{formatCurrency(payout.amountUsd)}</span>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{payout.status}</div>
              </div>
            ))}
            {earnings.slice(0, 3).map((earning) => (
              <div className="border border-dashed border-white/20 p-3 text-xs text-zinc-400" key={earning.id}>
                {earning.source}: <span className="text-white">{formatCurrency(earning.amountUsd)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
