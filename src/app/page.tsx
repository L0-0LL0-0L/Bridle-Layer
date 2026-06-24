import Link from "next/link";
import { ArrowRight, Cpu, Database, Link2, Server, WalletCards, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MascotSigil, PixelSeparator, StatCard } from "@/components/retro";

const resourceBlocks = [
  ["AI Agents", Workflow, "Register external agents, tools, capabilities, and pricing modes."],
  ["GPUs", Cpu, "Expose idle inference endpoints with health, VRAM, and metering."],
  ["APIs", Link2, "Forward requests through rate limits, auth, telemetry, and settlement."],
  ["PC Workers", Server, "Enroll machines with heartbeat, eligibility, and job metadata."],
  ["Wallets", WalletCards, "Route value to Solana payout addresses and future settlements."],
  ["Datasets", Database, "Bind storage references, access permissions, tags, and usage value."]
] as const;

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-[1.05fr_0.95fr] md:py-20">
        <div className="pixel-grid absolute inset-0 -z-10 opacity-35" />
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit border border-white/40 px-3 py-2 text-xs uppercase tracking-[0.28em] text-zinc-300">
            lost handheld operating layer <span className="blink ml-2">_</span>
          </div>
          <h1 className="font-pixel text-5xl leading-[1.25] text-white md:text-7xl">BRIDLE</h1>
          <p className="mt-6 max-w-2xl font-pixel text-lg leading-9 text-white md:text-2xl">Bind Your Digital Resources.</p>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            BRIDLE reins in AI agents, GPUs, APIs, PCs, wallets, and datasets, then turns scattered digital assets into
            one programmable network for routing, management, and monetization.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Enter console
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/docs">
                Read protocol docs
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/network">Explore venues</Link>
            </Button>
          </div>
          <PixelSeparator />
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="resource classes" value="06" detail="agents compute data value" />
            <StatCard label="route states" value="live" detail="draft paused active" />
            <StatCard label="settlement" value="USDC" detail="x402 wallet transfer" />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="pixel-corners relative w-full max-w-lg border-2 border-white bg-black p-6 shadow-[14px_14px_0_rgba(255,255,255,0.12)]">
            <div className="mb-5 flex items-center justify-between border-b-2 border-white pb-3">
              <span className="font-pixel text-xs">BRIDLE-OS</span>
              <span className="text-xs uppercase tracking-[0.24em] text-zinc-500">chaos bound</span>
            </div>
            <div className="flex justify-center py-8">
              <MascotSigil />
            </div>
            <div className="border-2 border-white/60 p-4 text-center">
              <div className="font-pixel text-sm leading-7 text-white">ONE BRIDLE FOR AGENTS, COMPUTE, DATA, AND VALUE.</div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center font-pixel text-[10px]">
              <div className="border border-white/30 p-3">REG</div>
              <div className="border border-white/30 p-3">ROUTE</div>
              <div className="border border-white/30 p-3">EARN</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>What BRIDLE is</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 leading-7">
              <p>
                A control layer for fragmented resources. Register endpoints, machines, wallets, and datasets; BRIDLE
                classifies them, observes health, and lets you compose routes across them.
              </p>
              <p className="text-white">What was fragmented is now orchestrated.</p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resource inventory</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {resourceBlocks.map(([title, Icon, copy]) => (
                <div className="border border-white/20 p-4" key={title}>
                  <Icon className="mb-3 h-6 w-6 text-white" />
                  <div className="font-pixel text-xs text-white">{title}</div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{copy}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["01 REGISTER", "Connect a resource, define metadata, and let BRIDLE classify its capabilities."],
            ["02 ROUTE", "Compose conceptual flows such as Agent -> Dataset -> API -> Wallet settlement."],
            ["03 MONETIZE", "Expose public resources, estimate venue earnings, and settle with USDC."]
          ].map(([title, copy]) => (
            <Card key={title}>
              <CardTitle>{title}</CardTitle>
              <p className="mt-5 text-sm leading-7 text-zinc-400">{copy}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 pb-20">
        <Card className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <CardTitle>Why it matters</CardTitle>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-400">
              Digital assets are idle, duplicated, hidden, and hard to compose. BRIDLE gives them identity, health,
              permissions, routes, and economic context so teams can turn underused infrastructure into useful services.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/resources/new">Bind first resource</Link>
          </Button>
        </Card>
      </section>
    </main>
  );
}
