import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Resource, ResourceStatus, ResourceType } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function resourceTypeLabel(type: ResourceType) {
  const labels: Record<ResourceType, string> = {
    "ai-agent": "AI Agent",
    api: "API",
    gpu: "GPU",
    "pc-worker": "PC Worker",
    wallet: "Wallet",
    dataset: "Dataset"
  };

  return labels[type];
}

export function statusTone(status: ResourceStatus) {
  const tones: Record<ResourceStatus, string> = {
    active: "text-emerald-200 border-emerald-200/70 bg-emerald-400/10",
    degraded: "text-yellow-100 border-yellow-100/70 bg-yellow-400/10",
    offline: "text-zinc-400 border-zinc-500/70 bg-zinc-800/60",
    pending: "text-sky-100 border-sky-100/70 bg-sky-400/10"
  };

  return tones[status];
}

export function summarizeResources(resources: Resource[]) {
  return {
    total: resources.length,
    active: resources.filter((resource) => resource.status === "active").length,
    offline: resources.filter((resource) => resource.status === "offline").length,
    requests: resources.reduce((total, resource) => total + resource.usage.requests, 0),
    earnings: resources.reduce((total, resource) => total + resource.earningsEstimate, 0),
    avgUptime: resources.length
      ? resources.reduce((total, resource) => total + resource.usage.uptime, 0) / resources.length
      : 0
  };
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}
