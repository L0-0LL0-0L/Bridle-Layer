"use client";

import Link from "next/link";
import { ArrowUpRight, Clock, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTypeBadge, StatusBadge } from "@/components/retro";
import type { Resource } from "@/lib/types";
import { formatCompact, formatCurrency } from "@/lib/utils";

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card className="group transition hover:-translate-y-1 hover:border-white hover:shadow-[10px_10px_0_rgba(255,255,255,0.18)]">
      <CardHeader>
        <div>
          <CardTitle className="leading-relaxed">{resource.name}</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            <ResourceTypeBadge type={resource.type} />
            <StatusBadge status={resource.status} />
          </div>
        </div>
        <Link href={`/resources/${resource.id}`} className="border border-white/40 p-2 text-white hover:bg-white hover:text-black">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <p className="min-h-12 text-sm leading-6 text-zinc-400">{resource.description}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="border border-white/20 p-3">
            <div className="mb-2 flex items-center gap-2 uppercase tracking-[0.2em] text-zinc-500">
              <Gauge className="h-3 w-3" />
              usage
            </div>
            <div className="font-pixel text-sm text-white">{formatCompact(resource.usage.requests)}</div>
          </div>
          <div className="border border-white/20 p-3">
            <div className="mb-2 flex items-center gap-2 uppercase tracking-[0.2em] text-zinc-500">
              <Clock className="h-3 w-3" />
              value
            </div>
            <div className="font-pixel text-sm text-white">{formatCurrency(resource.earningsEstimate)}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="border-white/30 text-zinc-300">{resource.visibility}</Badge>
          <Badge className="border-white/30 text-zinc-300">{resource.pricingMode}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
