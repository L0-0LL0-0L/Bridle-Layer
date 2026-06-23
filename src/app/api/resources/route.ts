import { NextResponse } from "next/server";
import { z } from "zod";
import { seededResources } from "@/lib/seed";
import { makeId, nowIso } from "@/lib/utils";

const resourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["ai-agent", "api", "gpu", "pc-worker", "wallet", "dataset"]),
  description: z.string().min(1),
  endpoint: z.string().optional(),
  address: z.string().optional(),
  visibility: z.enum(["private", "team", "public", "monetized"]).default("private"),
  pricingMode: z.enum(["internal", "free", "metered", "subscription", "settlement"]).default("internal"),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  tags: z.array(z.string()).default([])
});

export async function GET() {
  return NextResponse.json({
    data: seededResources,
    mode: "seeded-demo"
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = resourceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const resource = {
    id: makeId("res"),
    ownerId: "api_user",
    status: "pending",
    usage: {
      requests: 0,
      computeHours: 0,
      uptime: 0,
      latencyMs: 0,
      errorRate: 0
    },
    earningsEstimate: 0,
    createdAt: nowIso(),
    lastHeartbeat: nowIso(),
    ...parsed.data
  };

  return NextResponse.json(
    {
      data: resource,
      mode: "demo-echo",
      next: "Persist this payload to Supabase resources and enqueue classification."
    },
    { status: 201 }
  );
}
