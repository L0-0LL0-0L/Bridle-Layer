import { Activity, CircleDollarSign, Cpu, Database, Link2, Server, WalletCards, Workflow } from "lucide-react";
import type { ResourceType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCompact, resourceTypeLabel, statusTone } from "@/lib/utils";

export const resourceIcons: Record<ResourceType, typeof Cpu> = {
  "ai-agent": Workflow,
  api: Link2,
  gpu: Cpu,
  "pc-worker": Server,
  wallet: WalletCards,
  dataset: Database
};

export function PixelSeparator({ className }: { className?: string }) {
  return <div className={cn("my-6 h-1 w-full bg-[linear-gradient(90deg,#fff_0_12px,transparent_12px_20px)]", className)} />;
}

export function StatusBadge({ status }: { status: "active" | "degraded" | "offline" | "pending" }) {
  return <Badge className={cn("gap-2", statusTone(status))}>● {status}</Badge>;
}

export function ResourceTypeBadge({ type }: { type: ResourceType }) {
  const Icon = resourceIcons[type];

  return (
    <Badge className="gap-2 border-white/40 bg-white/5">
      <Icon className="h-3 w-3" />
      {resourceTypeLabel(type)}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon = Activity
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: typeof Activity;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-3 top-3 text-white/10">
        <Icon className="h-12 w-12" />
      </div>
      <CardHeader>
        <CardTitle className="text-[10px] text-zinc-300">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-pixel text-2xl text-white">{typeof value === "number" ? formatCompact(value) : value}</div>
        {detail ? <p className="mt-3 text-xs uppercase tracking-[0.2em] text-zinc-500">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

export function MascotSigil() {
  return (
    <div className="mascot-sigil" aria-hidden="true">
      <div className="mascot-veil" />
      <div className="mascot-face">
        <span className="eye left" />
        <span className="eye right" />
        <span className="mouth" />
      </div>
      <div className="mascot-dress" />
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="text-center">
      <CardTitle>{title}</CardTitle>
      <p className="mt-4 text-sm leading-6 text-zinc-400">{body}</p>
    </Card>
  );
}

export function CurrencyLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-white/20 py-3">
      <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      <span className="font-pixel text-xs text-white">{value}</span>
    </div>
  );
}

export function EarningsGlyph() {
  return <CircleDollarSign className="h-4 w-4 text-emerald-200" />;
}
