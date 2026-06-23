"use client";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const codeBlocks = [
  {
    title: "Register a resource",
    code: `POST /api/resources
Authorization: Bearer brdl_pub_...

{
  "type": "gpu",
  "name": "Vision GPU Node 02",
  "endpoint": "grpc://node-02:9081",
  "metadata": { "vramGb": 48, "capability": "vision-inference" },
  "visibility": "monetized"
}`
  },
  {
    title: "Create a route",
    code: `POST /api/routes
{
  "sourceId": "res_agent",
  "targetId": "res_dataset",
  "label": "retrieves context",
  "status": "draft"
}`
  },
  {
    title: "Write usage",
    code: `POST /api/usage
{
  "resourceId": "res_gpu",
  "requests": 128,
  "computeHours": 2.4,
  "latencyMs": 980,
  "errors": 0
}`
  }
];

export default function DocsPage() {
  return (
    <AppShell title="Docs / API" kicker="developer-facing BRIDLE protocol notes">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardTitle>Terminology</CardTitle>
          <div className="mt-5 space-y-4 text-sm leading-6 text-zinc-400">
            <p>
              <span className="text-white">Resource:</span> Any agent, endpoint, machine, wallet, or dataset BRIDLE can
              identify and manage.
            </p>
            <p>
              <span className="text-white">Route:</span> A directed relationship between resources that describes how
              usage or value moves.
            </p>
            <p>
              <span className="text-white">Metering:</span> Request, latency, error, compute, uptime, and value records.
            </p>
            <p>
              <span className="text-white">Visibility:</span> Private, team, public, or monetized network exposure.
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>How BRIDLE works</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                ["Register", "Send metadata and connection details. BRIDLE creates identity, tags, and health state."],
                ["Route", "Connect resources conceptually so agents, APIs, data, compute, and wallets can cooperate."],
                ["Monetize", "Expose selected resources, meter usage, estimate earnings, and route payout records."]
              ].map(([title, copy]) => (
                <div className="border border-white/20 p-4" key={title}>
                  <div className="font-pixel text-xs text-white">{title}</div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{copy}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {codeBlocks.map((block) => (
            <Card key={block.title}>
              <CardTitle>{block.title}</CardTitle>
              <pre className="mt-5 overflow-x-auto border-2 border-white/30 bg-white/5 p-4 text-xs leading-6 text-zinc-200">
                <code>{block.code}</code>
              </pre>
            </Card>
          ))}

          <Card>
            <CardTitle>Architecture notes</CardTitle>
            <div className="mt-5 space-y-3 text-sm leading-7 text-zinc-400">
              <p>
                The MVP includes a Supabase-ready schema, local persistent demo state, wallet adapter integration,
                deterministic classification, marketplace listings, and visual orchestration. Server-side API proxying,
                worker heartbeat ingestion, and settlement should be hardened behind signed routes before production.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
