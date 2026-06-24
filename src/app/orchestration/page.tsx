"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Clock, ListOrdered, Network, Play, Plus, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NetworkGraph } from "@/components/network-graph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBridle } from "@/lib/store";
import type { FlowRun, OrchestrationFlow, Resource } from "@/lib/types";
import { cn, resourceTypeLabel } from "@/lib/utils";

type DraftStep = {
  resourceId: string;
  verb: string;
};

function defaultVerb(resource?: Resource) {
  if (!resource) {
    return "execute";
  }

  const verbs: Record<Resource["type"], string> = {
    "ai-agent": "invoke agent",
    api: "call api",
    gpu: "run inference",
    "pc-worker": "dispatch job",
    wallet: "prepare payout",
    dataset: "query dataset"
  };

  return verbs[resource.type];
}

function runStatusTone(status: FlowRun["status"]) {
  return status === "success"
    ? "border-emerald-200/70 bg-emerald-400/10 text-emerald-200"
    : "border-yellow-100/70 bg-yellow-400/10 text-yellow-100";
}

export default function OrchestrationPage() {
  const { resources, connections, flows, flowRuns, addConnection, saveFlow, runFlow } = useBridle();
  const [sourceId, setSourceId] = useState(resources[0]?.id || "");
  const [targetId, setTargetId] = useState(resources[1]?.id || "");
  const [label, setLabel] = useState("uses");
  const [flowName, setFlowName] = useState("New resource flow");
  const [flowDescription, setFlowDescription] = useState("A saved BRIDLE orchestration sequence.");
  const [selectedResourceId, setSelectedResourceId] = useState(resources[0]?.id || "");
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState(flows[0]?.id || "");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (sourceId && targetId && sourceId !== targetId) {
      addConnection({ sourceId, targetId, label, status: "draft" });
    }
  }

  const effectiveSelectedResourceId = selectedResourceId || resources[0]?.id || "";

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.id === selectedFlowId) || flows[0],
    [flows, selectedFlowId]
  );

  const selectedFlowRuns = useMemo(
    () => (selectedFlow ? flowRuns.filter((run) => run.flowId === selectedFlow.id) : flowRuns),
    [flowRuns, selectedFlow]
  );

  function addDraftStep() {
    const resource = resources.find((item) => item.id === effectiveSelectedResourceId);

    if (!resource) {
      return;
    }

    setDraftSteps((current) => [
      ...current,
      {
        resourceId: resource.id,
        verb: defaultVerb(resource)
      }
    ]);
  }

  function moveStep(index: number, direction: -1 | 1) {
    setDraftSteps((current) => {
      const next = [...current];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= next.length) {
        return current;
      }

      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function updateStep(index: number, patch: Partial<DraftStep>) {
    setDraftSteps((current) => current.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step)));
  }

  function removeStep(index: number) {
    setDraftSteps((current) => current.filter((_, stepIndex) => stepIndex !== index));
  }

  function saveDraftFlow() {
    const saved = saveFlow({
      name: flowName,
      description: flowDescription,
      steps: draftSteps
    });
    setSelectedFlowId(saved.id);
  }

  function loadFlow(flow: OrchestrationFlow) {
    setSelectedFlowId(flow.id);
    setFlowName(flow.name);
    setFlowDescription(flow.description);
    setDraftSteps([...flow.steps].sort((a, b) => a.order - b.order).map((step) => ({ resourceId: step.resourceId, verb: step.verb })));
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
              <CardTitle>Flow builder</CardTitle>
              <Badge className="gap-2">
                <ListOrdered className="h-3 w-3" />
                {draftSteps.length} steps
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">flow name</span>
                  <input
                    className="border-2 border-white/40 bg-black px-4 py-3 text-white outline-none focus:border-white"
                    onChange={(event) => setFlowName(event.target.value)}
                    value={flowName}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">description</span>
                  <textarea
                    className="min-h-20 border-2 border-white/40 bg-black px-4 py-3 text-white outline-none focus:border-white"
                    onChange={(event) => setFlowDescription(event.target.value)}
                    value={flowDescription}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    className="border-2 border-white/40 bg-black px-4 py-3 text-white"
                    onChange={(event) => setSelectedResourceId(event.target.value)}
                    value={effectiveSelectedResourceId}
                  >
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name} / {resourceTypeLabel(resource.type)}
                      </option>
                    ))}
                  </select>
                  <Button onClick={addDraftStep} type="button">
                    <Plus className="h-4 w-4" />
                    Add step
                  </Button>
                </div>

                <div className="space-y-3">
                  {draftSteps.length === 0 ? (
                    <div className="border border-dashed border-white/30 p-4 text-sm leading-6 text-zinc-400">
                      Pick registered resources and add them in execution order. Each step will log a verb, latency, and
                      status when the flow runs.
                    </div>
                  ) : null}

                  {draftSteps.map((step, index) => {
                    const resource = resources.find((item) => item.id === step.resourceId);

                    return (
                      <div className="border border-white/20 p-3" key={`${step.resourceId}-${index}`}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-pixel text-[10px] leading-5 text-white">
                              {String(index + 1).padStart(2, "0")} / {resource?.name || "Missing resource"}
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                              {resource ? resourceTypeLabel(resource.type) : "unknown"}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="border border-white/30 p-2 text-zinc-300 hover:border-white hover:text-white disabled:opacity-30"
                              disabled={index === 0}
                              onClick={() => moveStep(index, -1)}
                              type="button"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              className="border border-white/30 p-2 text-zinc-300 hover:border-white hover:text-white disabled:opacity-30"
                              disabled={index === draftSteps.length - 1}
                              onClick={() => moveStep(index, 1)}
                              type="button"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              className="border border-white/30 p-2 text-zinc-300 hover:border-red-200 hover:text-red-200"
                              onClick={() => removeStep(index)}
                              type="button"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <input
                          className="w-full border border-white/30 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white"
                          onChange={(event) => updateStep(index, { verb: event.target.value })}
                          placeholder="verb logged during execution"
                          value={step.verb}
                        />
                      </div>
                    );
                  })}
                </div>

                <Button disabled={!flowName || draftSteps.length === 0} onClick={saveDraftFlow} type="button">
                  <Save className="h-4 w-4" />
                  Save flow
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create route edge</CardTitle>
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
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Saved flows</CardTitle>
            <Badge>{flows.length} saved</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {flows.map((flow) => {
              const latestRun = flowRuns.find((run) => run.flowId === flow.id);
              const active = selectedFlow?.id === flow.id;

              return (
                <div
                  className={cn(
                    "border p-4",
                    active ? "border-white bg-white/5" : "border-white/20 hover:border-white/60"
                  )}
                  key={flow.id}
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="font-pixel text-xs leading-5 text-white">{flow.name}</div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{flow.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>{flow.steps.length} steps</Badge>
                        {latestRun ? <Badge className={runStatusTone(latestRun.status)}>{latestRun.status}</Badge> : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => loadFlow(flow)} size="sm" type="button" variant="ghost">
                        Edit
                      </Button>
                      <Button onClick={() => setSelectedFlowId(flow.id)} size="sm" type="button" variant="ghost">
                        History
                      </Button>
                      <Button onClick={() => runFlow(flow.id)} size="sm" type="button">
                        <Play className="h-3 w-3" />
                        Run
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[...flow.steps]
                      .sort((a, b) => a.order - b.order)
                      .map((step) => {
                        const resource = resources.find((item) => item.id === step.resourceId);

                        return (
                          <div className="grid gap-2 border border-white/10 p-2 text-xs md:grid-cols-[44px_1fr_auto]" key={step.id}>
                            <span className="font-pixel text-white">{String(step.order).padStart(2, "0")}</span>
                            <span className="text-zinc-300">{resource?.name || "Missing resource"}</span>
                            <span className="uppercase tracking-[0.18em] text-zinc-500">{step.verb}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run history</CardTitle>
            {selectedFlow ? <Badge>{selectedFlow.name}</Badge> : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFlowRuns.length === 0 ? (
              <div className="border border-dashed border-white/30 p-4 text-sm leading-6 text-zinc-400">
                No runs yet. Save a flow, press Run, and BRIDLE will persist the status, duration, and per-step trace here.
              </div>
            ) : null}

            {selectedFlowRuns.map((run) => (
              <div className="border border-white/20 p-4" key={run.id}>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={runStatusTone(run.status)}>{run.status}</Badge>
                    <Badge className="gap-2">
                      <Clock className="h-3 w-3" />
                      {run.durationMs}ms
                    </Badge>
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {new Date(run.startedAt).toLocaleString()}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {run.trace.map((trace, index) => (
                    <div className="grid gap-3 border border-white/10 p-3 md:grid-cols-[44px_1fr_auto]" key={trace.id}>
                      <div className="font-pixel text-xs text-white">{String(index + 1).padStart(2, "0")}</div>
                      <div>
                        <div className="font-pixel text-[10px] leading-5 text-white">{trace.resourceName}</div>
                        <div className="mt-1 text-xs leading-5 text-zinc-400">{trace.message}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{trace.verb}</div>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <Badge className={trace.status === "success" ? "border-emerald-200/70 text-emerald-200" : "border-yellow-100/70 text-yellow-100"}>
                          {trace.status}
                        </Badge>
                        <span className="font-pixel text-xs text-white">{trace.latencyMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
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

          <Card>
            <CardTitle>Execution semantics</CardTitle>
            <div className="mt-5 space-y-3 text-sm leading-6 text-zinc-400">
              <div className="border border-dashed border-white/30 p-3">
                Saved flows are local persisted orchestration plans made from registered resource IDs.
              </div>
              <div className="border border-dashed border-white/30 p-3">
                Running a flow simulates execution step-by-step and records verb, status, latency, message, and timestamps.
              </div>
              <div className="border border-dashed border-white/30 p-3">
                Offline or missing resources mark the step and run as failed while preserving the full trace for debugging.
              </div>
            </div>
          </Card>
      </div>
    </AppShell>
  );
}
