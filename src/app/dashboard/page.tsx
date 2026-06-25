"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ChartNoAxesCombined,
  CircleDollarSign,
  Crown,
  GitBranch,
  Lock,
  Network,
  Plus,
  RotateCcw,
  Server,
  TrendingUp
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTypeBadge, StatCard, StatusBadge } from "@/components/retro";
import { UsageAreaChart } from "@/components/charts";
import { useBridle } from "@/lib/store";
import { cn, formatCompact, formatCurrency, resourceTypeLabel, summarizeResources } from "@/lib/utils";
import type { MembershipTier, StakePosition } from "@/lib/types";

function routeTone(status: "live" | "standby" | "blocked") {
  return {
    live: "border-emerald-200/70 bg-emerald-400/10 text-emerald-200",
    standby: "border-yellow-100/70 bg-yellow-400/10 text-yellow-100",
    blocked: "border-red-200/70 bg-red-400/10 text-red-100"
  }[status];
}

function activeStake(stakePositions: StakePosition[]) {
  return [...stakePositions]
    .filter((stake) => stake.status === "active")
    .sort((a, b) => b.lockedTokens - a.lockedTokens)[0];
}

function tierForStake(tiers: MembershipTier[], stake?: StakePosition) {
  return [...tiers]
    .filter((tier) => (stake?.lockedTokens || 0) >= tier.minLockedTokens)
    .sort((a, b) => b.minLockedTokens - a.minLockedTokens)[0];
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
    reallocateRoutes,
    membershipTiers,
    stakePositions,
    earningsTicker,
    lockMembershipTokens,
    requestStakeUnlock
  } = useBridle();
  const [tickerNow, setTickerNow] = useState(() => Date.now());
  const [stakeAmount, setStakeAmount] = useState("25000");
  const summary = summarizeResources(resources);
  const currentStake = activeStake(stakePositions);
  const currentTier = tierForStake(membershipTiers, currentStake) || membershipTiers[0];
  const tickerElapsedSeconds = Math.max(0, (tickerNow - new Date(earningsTicker.lastTickAt).getTime()) / 1000);
  const liveAccruedUsdc = earningsTicker.accruedUsdc + tickerElapsedSeconds * earningsTicker.boostedUsdcPerSecond;
  const boostedHourlyUsdc = earningsTicker.boostedUsdcPerSecond * 3600;
  const baseHourlyUsdc = earningsTicker.baseUsdcPerSecond * 3600;
  const nextTier = useMemo(
    () =>
      [...membershipTiers]
        .sort((a, b) => a.minLockedTokens - b.minLockedTokens)
        .find((tier) => tier.minLockedTokens > (currentStake?.lockedTokens || 0)),
    [currentStake?.lockedTokens, membershipTiers]
  );
  const latestReallocation = routeReallocations[0];
  const liveRouteRows = [...autoRoutes].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "live" ? -1 : b.status === "live" ? 1 : 0;
    }

    return b.score - a.score;
  });

  useEffect(() => {
    const interval = window.setInterval(() => setTickerNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <AppShell title="Dashboard" kicker="bind idle systems into one living network">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail={`${summary.active} active`} icon={Server} label="total resources" value={summary.total} />
        <StatCard detail={`${summary.offline} offline`} icon={Activity} label="active resources" value={summary.active} />
        <StatCard detail="metered calls" icon={ChartNoAxesCombined} label="total usage" value={summary.requests} />
        <StatCard detail="estimated value" icon={CircleDollarSign} label="earnings" value={formatCurrency(summary.earnings)} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_430px]">
        <Card className="relative overflow-hidden">
          <div className="absolute right-5 top-5 text-white/10">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader>
            <div>
              <CardTitle>Live earnings ticker</CardTitle>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                Estimated USDC accrues every second from active resource earnings, boosted by the current membership tier.
              </p>
            </div>
            <Badge className="border-emerald-200/70 bg-emerald-400/10 text-emerald-200">
              {earningsTicker.multiplier.toFixed(2)}x live
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="font-pixel text-4xl leading-relaxed text-white md:text-6xl">
              {liveAccruedUsdc.toFixed(6)}
              <span className="ml-3 text-base text-zinc-500">USDC</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">base / sec</div>
                <div className="mt-2 font-pixel text-xs text-white">{earningsTicker.baseUsdcPerSecond.toFixed(6)}</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">boosted / sec</div>
                <div className="mt-2 font-pixel text-xs text-white">{earningsTicker.boostedUsdcPerSecond.toFixed(6)}</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">base / hour</div>
                <div className="mt-2 font-pixel text-xs text-white">{baseHourlyUsdc.toFixed(3)}</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">boosted / hour</div>
                <div className="mt-2 font-pixel text-xs text-white">{boostedHourlyUsdc.toFixed(3)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Membership stake</CardTitle>
              <p className="mt-3 text-sm leading-6 text-zinc-400">Lock BRDL to unlock higher earnings multipliers.</p>
            </div>
            <Crown className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="mb-4 border-2 border-white/40 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">active tier</div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="font-pixel text-lg text-white">{currentTier?.name || "Unbridled"}</div>
                <Badge>{(currentTier?.earningsMultiplier || 1).toFixed(2)}x</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{currentTier?.description || "Base network access."}</p>
              {currentStake ? (
                <div className="mt-4 grid gap-2 text-xs text-zinc-400">
                  <div className="flex justify-between gap-3">
                    <span>locked</span>
                    <span className="font-pixel text-white">{currentStake.lockedTokens.toLocaleString()} BRDL</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>unlock available</span>
                    <span className="text-white">{new Date(currentStake.unlockAvailableAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">lock amount</span>
                <input
                  className="border-2 border-white/40 bg-black px-4 py-3 text-white outline-none focus:border-white"
                  inputMode="numeric"
                  onChange={(event) => setStakeAmount(event.target.value)}
                  value={stakeAmount}
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <Button onClick={() => lockMembershipTokens(Number(stakeAmount) || 0)} type="button">
                  <Lock className="h-4 w-4" />
                  Lock BRDL
                </Button>
                <Button disabled={!currentStake} onClick={() => currentStake && requestStakeUnlock(currentStake.id)} type="button" variant="ghost">
                  Request unlock
                </Button>
              </div>
              {nextTier ? (
                <div className="border border-dashed border-white/30 p-3 text-xs leading-5 text-zinc-400">
                  Next tier: <span className="text-white">{nextTier.name}</span> at {nextTier.minLockedTokens.toLocaleString()} BRDL for{" "}
                  {nextTier.earningsMultiplier.toFixed(2)}x.
                </div>
              ) : (
                <div className="border border-dashed border-white/30 p-3 text-xs leading-5 text-zinc-400">
                  Maximum tier active. The reins are fully tightened.
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2">
              {membershipTiers.map((tier) => (
                <div
                  className={cn(
                    "grid gap-2 border p-3 text-xs md:grid-cols-[1fr_auto]",
                    currentTier?.id === tier.id ? "border-white bg-white/5" : "border-white/20"
                  )}
                  key={tier.id}
                >
                  <div>
                    <div className="font-pixel text-[10px] leading-5 text-white">{tier.name}</div>
                    <div className="mt-1 uppercase tracking-[0.18em] text-zinc-500">
                      {tier.minLockedTokens.toLocaleString()} BRDL / {tier.unlockDays}d lock
                    </div>
                  </div>
                  <Badge>{tier.earningsMultiplier.toFixed(2)}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
