import { NextResponse } from "next/server";
import { z } from "zod";
import { executeResource } from "@/lib/resource-execution";
import type { Resource } from "@/lib/types";

const resourceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  type: z.enum(["ai-agent", "api", "gpu", "pc-worker", "wallet", "dataset"]),
  description: z.string(),
  status: z.enum(["active", "degraded", "offline", "pending"]),
  visibility: z.enum(["private", "team", "public", "monetized"]),
  pricingMode: z.enum(["internal", "free", "metered", "subscription", "settlement"]),
  endpoint: z.string().optional(),
  address: z.string().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  tags: z.array(z.string()),
  usage: z.object({
    requests: z.number(),
    computeHours: z.number(),
    uptime: z.number(),
    latencyMs: z.number(),
    errorRate: z.number()
  }),
  earningsEstimate: z.number(),
  healthStatus: z.enum(["unknown", "healthy", "degraded", "error"]),
  lastLatencyMs: z.number().optional(),
  lastHttpStatus: z.number().optional(),
  lastHealthAt: z.string().optional(),
  createdAt: z.string(),
  lastHeartbeat: z.string()
});

const executeSchema = z.object({
  resource: resourceSchema,
  callerUserId: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = executeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await executeResource({
    resource: parsed.data.resource as Resource,
    callerUserId: parsed.data.callerUserId,
    providerUserId: parsed.data.resource.ownerId
  });

  return NextResponse.json(result, {
    status: result.log.ok ? 200 : 502
  });
}
