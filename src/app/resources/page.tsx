"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ResourceCard } from "@/components/resource-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBridle } from "@/lib/store";
import type { ResourceType } from "@/lib/types";
import { resourceTypeLabel } from "@/lib/utils";

const filters: ("all" | ResourceType)[] = ["all", "ai-agent", "api", "gpu", "pc-worker", "wallet", "dataset"];

export default function ResourcesPage() {
  const { resources } = useBridle();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  const visibleResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesType = filter === "all" || resource.type === filter;
      const haystack = `${resource.name} ${resource.description} ${resource.tags.join(" ")}`.toLowerCase();
      return matchesType && haystack.includes(query.toLowerCase());
    });
  }, [filter, query, resources]);

  return (
    <AppShell title="Resource Registry" kicker="canonical inventory of bound assets">
      <Card className="mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="w-full border-2 border-white/40 bg-black py-3 pl-11 pr-4 text-white outline-none focus:border-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resources, tags, endpoints..."
              value={query}
            />
          </div>
          <Button asChild>
            <Link href="/resources/new">
              <Plus className="h-4 w-4" />
              Add Resource
            </Link>
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
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
        {visibleResources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </AppShell>
  );
}
