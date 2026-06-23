"use client";

import { FormEvent, useState } from "react";
import { Network, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NetworkGraph } from "@/components/network-graph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBridle } from "@/lib/store";

export default function OrchestrationPage() {
  const { resources, connections, addConnection } = useBridle();
  const [sourceId, setSourceId] = useState(resources[0]?.id || "");
  const [targetId, setTargetId] = useState(resources[1]?.id || "");
  const [label, setLabel] = useState("uses");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (sourceId && targetId && sourceId !== targetId) {
      addConnection({ sourceId, targetId, label, status: "draft" });
    }
  }

  return (
    <AppShell title="Orchestration" kicker="connect resources into programmable routes">
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Network view</CardTitle>
            <Badge className="gap-2">
              <Network className="h-3 w-3" />
              {connections.length} routes
            </Badge>
          </CardHeader>
          <NetworkGraph connections={connections} resources={resources} />
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Create flow</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={submit}>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">source</span>
                  <select className="border-2 border-white/40 bg-black px-4 py-3 text-white" onChange={(event) => setSourceId(event.target.value)} value={sourceId}>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">target</span>
                  <select className="border-2 border-white/40 bg-black px-4 py-3 text-white" onChange={(event) => setTargetId(event.target.value)} value={targetId}>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">relationship</span>
                  <input
                    className="border-2 border-white/40 bg-black px-4 py-3 text-white outline-none focus:border-white"
                    onChange={(event) => setLabel(event.target.value)}
                    value={label}
                  />
                </label>
                <Button disabled={!sourceId || !targetId || sourceId === targetId} type="submit">
                  <Plus className="h-4 w-4" />
                  Add draft route
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardTitle>Suggested flows</CardTitle>
            <div className="mt-5 space-y-3 text-sm text-zinc-400">
              {[
                "AI Agent -> Dataset -> API -> Wallet settlement",
                "GPU -> Inference endpoint -> Paid API access",
                "PC Worker -> Dataset transform -> Internal API",
                "Dataset -> Agent retrieval -> Marketplace listing"
              ].map((flow) => (
                <div className="border border-dashed border-white/30 p-3" key={flow}>
                  {flow}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
