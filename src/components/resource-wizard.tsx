"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, Cpu, Database, Link2, Server, Sparkles, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PixelSeparator } from "@/components/retro";
import { useBridle } from "@/lib/store";
import type { PricingMode, ResourceDraft, ResourceType, Visibility } from "@/lib/types";
import { cn, resourceTypeLabel } from "@/lib/utils";

const resourceTypes: { type: ResourceType; icon: typeof Bot; copy: string }[] = [
  { type: "ai-agent", icon: Bot, copy: "External agent endpoint, tools, models, input/output contract." },
  { type: "api", icon: Link2, copy: "REST endpoint, auth behavior, forwarding, metering, rate limits." },
  { type: "gpu", icon: Cpu, copy: "Inference worker, VRAM, availability windows, compute allocation." },
  { type: "pc-worker", icon: Server, copy: "Desktop or server worker with heartbeat, eligibility, hardware." },
  { type: "wallet", icon: WalletCards, copy: "Solana address, payout routing, settlement metadata." },
  { type: "dataset", icon: Database, copy: "Storage reference, permissions, tags, access mode." }
];

const visibilityOptions: Visibility[] = ["private", "team", "public", "monetized"];
const pricingOptions: PricingMode[] = ["internal", "free", "metered", "subscription", "settlement"];

function suggestClassification(draft: ResourceDraft) {
  const baseTags = new Set<string>([draft.type, "auto-classified"]);
  const metadata: Record<string, string | number | boolean> = { ...draft.metadata };

  if (draft.type === "ai-agent") {
    baseTags.add("agent");
    baseTags.add("tool-router");
    metadata.input = metadata.input || "prompt/json";
    metadata.output = metadata.output || "json";
  }

  if (draft.type === "gpu") {
    baseTags.add("compute");
    baseTags.add("inference");
    metadata.vramGb = metadata.vramGb || 24;
  }

  if (draft.type === "dataset") {
    baseTags.add("data");
    baseTags.add("retrieval");
    metadata.access = metadata.access || "token-gated";
  }

  if (draft.type === "wallet") {
    baseTags.add("solana");
    baseTags.add("settlement");
    metadata.chain = "solana";
  }

  if (draft.endpoint?.includes("api")) {
    baseTags.add("api-forwarding");
  }

  return {
    tags: Array.from(new Set([...draft.tags, ...baseTags])),
    metadata
  };
}

export function ResourceWizard() {
  const router = useRouter();
  const { addResource } = useBridle();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ResourceDraft>({
    name: "",
    type: "ai-agent",
    description: "",
    endpoint: "",
    address: "",
    visibility: "private",
    pricingMode: "internal",
    metadata: {},
    tags: []
  });
  const [metadataText, setMetadataText] = useState("capability=general\nregion=local");
  const [tagText, setTagText] = useState("");

  const classification = useMemo(() => suggestClassification(draft), [draft]);

  function update<K extends keyof ResourceDraft>(key: K, value: ResourceDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function syncMetadata() {
    const metadata = Object.fromEntries(
      metadataText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [key, ...rest] = line.split("=");
          return [key.trim(), rest.join("=").trim() || "true"];
        })
    );
    const tags = tagText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    setDraft((current) => ({ ...current, metadata, tags }));
  }

  function activate() {
    syncMetadata();
    const enriched = {
      ...draft,
      metadata: classification.metadata,
      tags: classification.tags
    };
    const resource = addResource(enriched);
    router.push(`/resources/${resource.id}`);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <Card>
        <CardTitle>Add Resource</CardTitle>
        <PixelSeparator />
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            className={cn(
              "mb-2 flex w-full items-center gap-3 border px-3 py-3 text-left text-xs uppercase tracking-[0.18em]",
              step === item ? "border-white bg-white text-black" : "border-white/20 text-zinc-400"
            )}
            key={item}
            onClick={() => {
              syncMetadata();
              setStep(item);
            }}
            type="button"
          >
            <span className="font-pixel">{item}</span>
            {["type", "config", "classify", "visibility", "activate"][item - 1]}
          </button>
        ))}
      </Card>

      <Card>
        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle>Choose resource type</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {resourceTypes.map((item) => {
                const Icon = item.icon;
                const active = draft.type === item.type;

                return (
                  <button
                    className={cn(
                      "pixel-corners border-2 p-4 text-left transition hover:-translate-y-1",
                      active ? "border-white bg-white text-black" : "border-white/30 bg-black text-white"
                    )}
                    key={item.type}
                    onClick={() => update("type", item.type)}
                    type="button"
                  >
                    <Icon className="mb-4 h-7 w-7" />
                    <div className="font-pixel text-xs">{resourceTypeLabel(item.type)}</div>
                    <p className={cn("mt-3 text-xs leading-5", active ? "text-zinc-800" : "text-zinc-400")}>{item.copy}</p>
                  </button>
                );
              })}
            </CardContent>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <CardHeader>
              <CardTitle>Connection details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">name</span>
                <input
                  className="border-2 border-white/50 bg-black px-4 py-3 text-white outline-none focus:border-white"
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="e.g. Settlement Agent Beta"
                  value={draft.name}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">description</span>
                <textarea
                  className="min-h-28 border-2 border-white/50 bg-black px-4 py-3 text-white outline-none focus:border-white"
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="What does this resource do?"
                  value={draft.description}
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">endpoint / storage ref</span>
                  <input
                    className="border-2 border-white/50 bg-black px-4 py-3 text-white outline-none focus:border-white"
                    onChange={(event) => update("endpoint", event.target.value)}
                    placeholder="https://, grpc://, s3://, worker://"
                    value={draft.endpoint}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">wallet address</span>
                  <input
                    className="border-2 border-white/50 bg-black px-4 py-3 text-white outline-none focus:border-white"
                    onChange={(event) => update("address", event.target.value)}
                    placeholder="Solana address if applicable"
                    value={draft.address}
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">metadata key=value</span>
                  <textarea
                    className="min-h-36 border-2 border-white/50 bg-black px-4 py-3 text-white outline-none focus:border-white"
                    onBlur={syncMetadata}
                    onChange={(event) => setMetadataText(event.target.value)}
                    value={metadataText}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">tags comma-separated</span>
                  <textarea
                    className="min-h-36 border-2 border-white/50 bg-black px-4 py-3 text-white outline-none focus:border-white"
                    onBlur={syncMetadata}
                    onChange={(event) => setTagText(event.target.value)}
                    placeholder="inference, public, commerce"
                    value={tagText}
                  />
                </label>
              </div>
            </CardContent>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <CardHeader>
              <CardTitle>BRIDLE classification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex items-center gap-3 border-2 border-white/30 p-4 text-sm text-zinc-300">
                <Sparkles className="h-5 w-5 text-white" />
                Local classifier inferred routing labels and sensible defaults. Connect an AI key later to replace this deterministic mock.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-white/20 p-4">
                  <div className="mb-3 font-pixel text-xs text-white">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {classification.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="mb-3 font-pixel text-xs text-white">Metadata</div>
                  <div className="space-y-2 text-xs text-zinc-300">
                    {Object.entries(classification.metadata).map(([key, value]) => (
                      <div className="flex justify-between gap-4 border-b border-white/10 pb-2" key={key}>
                        <span>{key}</span>
                        <span className="text-white">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <CardHeader>
              <CardTitle>Visibility and value mode</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div>
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">visibility</div>
                <div className="grid gap-3 md:grid-cols-4">
                  {visibilityOptions.map((option) => (
                    <button
                      className={cn(
                        "border-2 px-4 py-4 font-pixel text-[10px] uppercase",
                        draft.visibility === option ? "border-white bg-white text-black" : "border-white/30 text-white"
                      )}
                      key={option}
                      onClick={() => update("visibility", option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">pricing / access mode</div>
                <div className="grid gap-3 md:grid-cols-5">
                  {pricingOptions.map((option) => (
                    <button
                      className={cn(
                        "border-2 px-4 py-4 font-pixel text-[10px] uppercase",
                        draft.pricingMode === option ? "border-white bg-white text-black" : "border-white/30 text-white"
                      )}
                      key={option}
                      onClick={() => update("pricingMode", option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <CardHeader>
              <CardTitle>Review and activate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["name", draft.name || "Untitled resource"],
                  ["type", resourceTypeLabel(draft.type)],
                  ["visibility", draft.visibility],
                  ["mode", draft.pricingMode],
                  ["endpoint", draft.endpoint || "not supplied"],
                  ["address", draft.address || "not supplied"]
                ].map(([label, value]) => (
                  <div className="border border-white/20 p-4" key={label}>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
                    <div className="mt-2 break-words font-pixel text-xs leading-5 text-white">{value}</div>
                  </div>
                ))}
              </div>
              <Button disabled={!draft.name || !draft.description} onClick={activate} size="lg">
                <Check className="h-4 w-4" />
                Activate resource
              </Button>
            </CardContent>
          </>
        ) : null}

        <div className="mt-6 flex justify-between gap-3">
          <Button disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))} variant="ghost">
            Back
          </Button>
          <Button
            disabled={step === 5}
            onClick={() => {
              syncMetadata();
              setStep((current) => Math.min(5, current + 1));
            }}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
