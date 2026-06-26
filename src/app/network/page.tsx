"use client";

import { useMemo, useState } from "react";
import { Calculator, CircleDollarSign, Gauge, RadioTower, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/retro";
import { useBridle } from "@/lib/store";
import type { ResourceType, RouteVenue } from "@/lib/types";
import { cn, formatCompact, resourceTypeLabel } from "@/lib/utils";

const resourceTypeFilters: ("all" | ResourceType)[] = ["all", "ai-agent", "api", "gpu", "pc-worker", "wallet", "dataset"];

function venueTone(status: RouteVenue["status"]) {
  return {
    open: "border-emerald-200/70 bg-emerald-400/10 text-emerald-200",
    saturated: "border-yellow-100/70 bg-yellow-400/10 text-yellow-100",
    paused: "border-zinc-500/70 bg-zinc-800/60 text-zinc-400"
  }[status];
}

function routeTone(status: "live" | "standby" | "blocked") {
  return {
    live: "border-emerald-200/70 text-emerald-200",
    standby: "border-yellow-100/70 text-yellow-100",
    blocked: "border-red-200/70 text-red-100"
  }[status];
}

export default function NetworkPage() {
  const { venues, autoRoutes, resources } = useBridle();
  const [filter, setFilter] = useState<(typeof resourceTypeFilters)[number]>("all");
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0]?.id || "");
  const [monthlyRequests, setMonthlyRequests] = useState("50000");
  const [pricePerRequest, setPricePerRequest] = useState("0.012");
  const [allocationPercent, setAllocationPercent] = useState("35");
  const [successRate, setSuccessRate] = useState("98");
  const [platformFee, setPlatformFee] = useState("12");

  const filteredVenues = useMemo(
    () => venues.filter((venue) => filter === "all" || venue.requiredTypes.includes(filter)),
    [filter, venues]
  );
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId) || venues[0];
  const selectedVenueRoutes = selectedVenue ? autoRoutes.filter((route) => route.venueId === selectedVenue.id) : [];
  const totalDemand = venues.reduce((total, venue) => total + venue.demandUnits, 0);
  const liveRoutes = autoRoutes.filter((route) => route.status === "live");
  const avgScore = autoRoutes.length
    ? autoRoutes.reduce((total, route) => total + route.score, 0) / autoRoutes.length
    : 0;

  const estimator = useMemo(() => {
    const requests = Number(monthlyRequests) || 0;
    const price = Number(pricePerRequest) || 0;
    const allocation = Math.max(0, Math.min(100, Number(allocationPercent) || 0)) / 100;
    const success = Math.max(0, Math.min(100, Number(successRate) || 0)) / 100;
    const fee = Math.max(0, Math.min(100, Number(platformFee) || 0)) / 100;
    const routedRequests = requests * allocation;
    const billableRequests = routedRequests * success;
    const gross = billableRequests * price;
    const feeAmount = gross * fee;

    return {
      routedRequests,
      billableRequests,
      gross,
      feeAmount,
      net: gross - feeAmount
    };
  }, [allocationPercent, monthlyRequests, platformFee, pricePerRequest, successRate]);

  return (
    <AppShell title="Venue Directory" kicker="public network demand and earning potential">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail="routing destinations" icon={RadioTower} label="venues" value={venues.length} />
        <StatCard detail="open demand units" icon={Users} label="demand" value={formatCompact(totalDemand)} />
        <StatCard detail="active allocations" icon={Gauge} label="live routes" value={liveRoutes.length} />
        <StatCard detail="route quality" icon={CircleDollarSign} label="avg score" value={avgScore.toFixed(0)} />
      </div>

      <Card className="mt-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>Public venue directory</CardTitle>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Venues are demand surfaces where BRIDLE can route resources. Each venue declares acceptable resource types,
              demand, priority, latency target, and error tolerance.
            </p>
          </div>
          <Badge className="gap-2 border-white bg-white text-black">
            <RadioTower className="h-3 w-3" />
            {filteredVenues.length} visible
          </Badge>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {resourceTypeFilters.map((item) => (
            <button
              className={cn(
                "border px-3 py-2 text-xs uppercase tracking-[0.18em]",
                filter === item ? "border-white bg-white text-black" : "border-white/30 text-zinc-400 hover:text-white"
              )}
              key={item}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item === "all" ? "All" : resourceTypeLabel(item)}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredVenues.map((venue) => {
            const routes = autoRoutes
              .filter((route) => route.venueId === venue.id)
              .sort((a, b) => b.allocationPercent - a.allocationPercent);

            return (
              <Card
                className={cn("cursor-pointer transition hover:-translate-y-1", selectedVenue?.id === venue.id ? "border-white" : "")}
                key={venue.id}
                onClick={() => {
                  setSelectedVenueId(venue.id);
                  const liveAllocation = routes
                    .filter((route) => route.status === "live")
                    .reduce((total, route) => total + route.allocationPercent, 0);
                  setAllocationPercent(String(Math.max(1, Math.round(liveAllocation / Math.max(1, routes.length)))));
                }}
              >
                <CardHeader>
                  <div>
                    <CardTitle className="leading-6">{venue.name}</CardTitle>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className={venueTone(venue.status)}>{venue.status}</Badge>
                      <Badge>{venue.type}</Badge>
                    </div>
                  </div>
                  <div className="font-pixel text-sm text-white">{venue.priority}</div>
                </CardHeader>
                <CardContent>
                  <p className="min-h-16 text-sm leading-6 text-zinc-400">{venue.description}</p>
                  {venue.status === "paused" ? (
                    <div className="mb-4 border border-red-200/50 bg-red-950/20 p-3 text-xs leading-5 text-red-100">
                      Removed from active routes: {venue.pausedReason || "health probe failed"}
                      {venue.pausedUntil ? ` until ${new Date(venue.pausedUntil).toLocaleTimeString()}` : ""}
                    </div>
                  ) : null}
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="border border-white/20 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">demand</div>
                      <div className="mt-2 font-pixel text-xs text-white">{formatCompact(venue.demandUnits)}</div>
                    </div>
                    <div className="border border-white/20 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">latency</div>
                      <div className="mt-2 font-pixel text-xs text-white">{venue.latencyTargetMs}ms</div>
                    </div>
                    <div className="border border-white/20 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">error</div>
                      <div className="mt-2 font-pixel text-xs text-white">{venue.maxErrorRate}%</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {venue.requiredTypes.map((type) => (
                      <Badge className="border-white/30 text-zinc-300" key={type}>
                        {resourceTypeLabel(type)}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-5 space-y-2">
                    {routes.slice(0, 3).map((route) => {
                      const resource = resources.find((item) => item.id === route.resourceId);

                      return (
                        <div className="grid gap-2 border border-white/10 p-2 text-xs md:grid-cols-[1fr_auto_auto]" key={route.id}>
                          <span className="text-zinc-300">{resource?.name || "Missing resource"}</span>
                          <Badge className={routeTone(route.status)}>{route.status}</Badge>
                          <span className="font-pixel text-white">{route.allocationPercent}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Earnings estimator</CardTitle>
              <Calculator className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="mb-4 border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">selected venue</div>
                <div className="mt-2 font-pixel text-xs leading-5 text-white">{selectedVenue?.name || "No venue selected"}</div>
              </div>
              <div className="grid gap-4">
                {[
                  ["monthly requests", monthlyRequests, setMonthlyRequests],
                  ["USDC / request", pricePerRequest, setPricePerRequest],
                  ["allocation %", allocationPercent, setAllocationPercent],
                  ["success rate %", successRate, setSuccessRate],
                  ["platform fee %", platformFee, setPlatformFee]
                ].map(([label, value, setter]) => (
                  <label className="grid gap-2" key={label as string}>
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label as string}</span>
                    <input
                      className="border-2 border-white/40 bg-black px-4 py-3 text-white outline-none focus:border-white"
                      inputMode="decimal"
                      onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                      value={value as string}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["routed requests", formatCompact(estimator.routedRequests)],
                  ["billable requests", formatCompact(estimator.billableRequests)],
                  ["gross", `${estimator.gross.toFixed(2)} USDC`],
                  ["BRIDLE fee", `${estimator.feeAmount.toFixed(2)} USDC`],
                  ["estimated net", `${estimator.net.toFixed(2)} USDC`]
                ].map(([label, value]) => (
                  <div className="flex items-center justify-between border-b border-dashed border-white/20 py-3" key={label}>
                    <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">{label}</span>
                    <span className="font-pixel text-xs text-white">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardTitle>Venue route detail</CardTitle>
            <div className="mt-5 space-y-3">
              {selectedVenueRoutes.map((route) => {
                const resource = resources.find((item) => item.id === route.resourceId);

                return (
                  <div className="border border-white/20 p-3 text-sm" key={route.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <span className="font-pixel text-[10px] leading-5 text-white">{resource?.name || "Missing resource"}</span>
                      <Badge className={routeTone(route.status)}>{route.status}</Badge>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-zinc-400">{route.reason}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="border border-white/10 p-2">
                        <span className="text-zinc-500">score</span>
                        <div className="font-pixel text-white">{route.score}</div>
                      </div>
                      <div className="border border-white/10 p-2">
                        <span className="text-zinc-500">allocation</span>
                        <div className="font-pixel text-white">{route.allocationPercent}%</div>
                      </div>
                    </div>
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
