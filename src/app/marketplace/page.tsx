"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Globe2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTypeBadge, StatusBadge } from "@/components/retro";
import { useBridle } from "@/lib/store";
import type { ResourceType } from "@/lib/types";
import { formatCompact, resourceTypeLabel } from "@/lib/utils";

const filters: ("all" | ResourceType)[] = ["all", "ai-agent", "api", "gpu", "pc-worker", "wallet", "dataset"];

export default function MarketplacePage() {
  const { marketplace, resources } = useBridle();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  const listings = useMemo(
    () =>
      marketplace
        .map((listing) => ({
          listing,
          resource: resources.find((resource) => resource.id === listing.resourceId)
        }))
        .filter((item) => item.resource && (filter === "all" || item.resource.type === filter)),
    [filter, marketplace, resources]
  );

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
        {listings.map(({ listing, resource }) =>
          resource ? (
            <Card className={listing.featured ? "border-white shadow-[12px_12px_0_rgba(255,255,255,0.16)]" : ""} key={listing.id}>
              <CardHeader>
                <div>
                  <CardTitle className="leading-6">{resource.name}</CardTitle>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ResourceTypeBadge type={resource.type} />
                    <StatusBadge status={resource.status} />
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
                  <span className="font-pixel text-white">{formatCompact(resource.usage.requests)}</span>
                </div>
              </CardContent>
            </Card>
          ) : null
        )}
      </div>
    </AppShell>
  );
}
