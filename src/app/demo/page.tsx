"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, DatabaseZap, Play, RadioTower, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTypeBadge, StatusBadge } from "@/components/retro";
import { useBridle } from "@/lib/store";
import { listMarketplace, type MarketplaceListItem } from "@/lib/marketplace";

const demoWalletAddress = "DemoWallet111111111111111111111111111111111";
const demoResourceId = "res_research_agent_alpha";

const steps = [
  {
    title: "Load seeded network",
    body: "Restore BRIDLE demo state with resources, venues, routes, marketplace listings, staking, and settlements.",
    icon: DatabaseZap
  },
  {
    title: "Connect wallet",
    body: "Attach a demo Solana wallet so settlement and marketplace flows have an operator identity.",
    icon: WalletCards
  },
  {
    title: "List a resource",
    body: "Publish Research Agent Alpha through the marketplace directory if it is not already listed.",
    icon: RadioTower
  },
  {
    title: "Make marketplace call",
    body: "Call the curated marketplace projection and return public-safe listing data.",
    icon: Play
  }
];

export default function DemoPage() {
  const {
    resources,
    marketplace,
    wallet,
    loadDemoSeedData,
    connectWallet,
    listResourceOnMarketplace
  } = useBridle();
  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [marketplaceResponse, setMarketplaceResponse] = useState<MarketplaceListItem[]>([]);
  const [runId, setRunId] = useState(0);
  const demoResource = resources.find((resource) => resource.id === demoResourceId);

  function appendLog(message: string) {
    setLogs((current) => [`${new Date().toLocaleTimeString()} :: ${message}`, ...current].slice(0, 8));
  }

  function replayDemo() {
    setActiveStep(0);
    setLogs([]);
    setMarketplaceResponse([]);
    setRunId((current) => current + 1);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (activeStep === 0) {
        loadDemoSeedData();
        appendLog("Seeded demo resources loaded.");
        setActiveStep(1);
      }

      if (activeStep === 1) {
        connectWallet(demoWalletAddress, 42.81);
        appendLog(`Demo wallet connected: ${demoWalletAddress.slice(0, 10)}...`);
        setActiveStep(2);
      }

      if (activeStep === 2) {
        listResourceOnMarketplace(demoResourceId);
        appendLog("Research Agent Alpha listed for marketplace access.");
        setActiveStep(3);
      }

      if (activeStep === 3) {
        const response = listMarketplace({
          listings: marketplace,
          resources,
          type: "ai-agent"
        });
        setMarketplaceResponse(response);
        appendLog(`Marketplace call returned ${response.length} curated AI agent listing(s).`);
        setActiveStep(4);
      }
    }, activeStep === 0 ? 350 : 1100);

    return () => window.clearTimeout(timeout);
  }, [activeStep, connectWallet, listResourceOnMarketplace, loadDemoSeedData, marketplace, resources, runId]);

  const completedCount = Math.min(activeStep, steps.length);
  const marketplacePreview = useMemo(() => JSON.stringify(marketplaceResponse, null, 2), [marketplaceResponse]);

  return (
    <AppShell title="Demo Mode" kicker="guided BRIDLE operator walkthrough">
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Autoplay sequence</CardTitle>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                Demo Mode auto-loads seeded BRIDLE data, connects a demo wallet, lists a resource, and calls the curated
                marketplace projection.
              </p>
            </div>
            <Badge>{completedCount}/{steps.length} complete</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const done = activeStep > index;
              const active = activeStep === index;

              return (
                <div
                  className={`grid gap-4 border p-4 md:grid-cols-[44px_1fr_auto] md:items-center ${
                    active ? "border-white bg-white/5" : done ? "border-emerald-200/60" : "border-white/20"
                  }`}
                  key={step.title}
                >
                  <div className="grid h-10 w-10 place-items-center border border-white/40">
                    {done ? <Check className="h-5 w-5 text-emerald-200" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-pixel text-xs leading-5 text-white">{step.title}</div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{step.body}</p>
                  </div>
                  <Badge className={done ? "border-emerald-200/70 text-emerald-200" : active ? "border-white text-white" : "border-white/30 text-zinc-500"}>
                    {done ? "done" : active ? "running" : "queued"}
                  </Badge>
                </div>
              );
            })}

            <div className="flex flex-wrap gap-3 pt-3">
              <Button onClick={replayDemo} type="button">
                <Play className="h-4 w-4" />
                Replay demo
              </Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/marketplace">Open marketplace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle>Demo state</CardTitle>
            <div className="mt-5 space-y-3">
              <div className="border border-white/20 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">wallet</div>
                <div className="mt-2 break-all font-pixel text-[10px] leading-5 text-white">{wallet?.address || "not connected"}</div>
              </div>
              {demoResource ? (
                <div className="border border-white/20 p-3">
                  <div className="mb-3 font-pixel text-[10px] leading-5 text-white">{demoResource.name}</div>
                  <div className="flex flex-wrap gap-2">
                    <ResourceTypeBadge type={demoResource.type} />
                    <StatusBadge status={demoResource.status} />
                    <Badge>{demoResource.visibility}</Badge>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardTitle>Run log</CardTitle>
            <div className="mt-5 space-y-2">
              {logs.length === 0 ? (
                <div className="border border-dashed border-white/30 p-3 text-sm text-zinc-400">Waiting for demo...</div>
              ) : null}
              {logs.map((log) => (
                <div className="border border-white/20 p-3 text-xs leading-5 text-zinc-300" key={log}>
                  {log}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Marketplace call response</CardTitle>
          <Badge>{marketplaceResponse.length} listing(s)</Badge>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto border-2 border-white/30 bg-white/5 p-4 text-xs leading-6 text-zinc-200">
            <code>{marketplacePreview || "[]"}</code>
          </pre>
        </CardContent>
      </Card>
    </AppShell>
  );
}
