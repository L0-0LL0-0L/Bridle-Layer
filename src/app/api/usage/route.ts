import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, nowIso } from "@/lib/utils";

const usageSchema = z.object({
  resourceId: z.string().min(1),
  requests: z.number().int().nonnegative(),
  computeHours: z.number().nonnegative().default(0),
  value: z.number().nonnegative().default(0),
  latencyMs: z.number().int().nonnegative().default(0),
  errors: z.number().int().nonnegative().default(0)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = usageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      data: {
        id: makeId("usage"),
        timestamp: nowIso(),
        ...parsed.data
      },
      mode: "demo-echo",
      next: "Write to usage_events, update resource aggregates, and recalculate earnings."
    },
    { status: 201 }
  );
}
