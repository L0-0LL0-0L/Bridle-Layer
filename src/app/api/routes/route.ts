import { NextResponse } from "next/server";
import { z } from "zod";
import { seededConnections } from "@/lib/seed";
import { makeId } from "@/lib/utils";

const routeSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["live", "draft", "paused"]).default("draft")
});

export async function GET() {
  return NextResponse.json({
    data: seededConnections,
    mode: "seeded-demo"
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = routeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      data: {
        id: makeId("conn"),
        ...parsed.data
      },
      mode: "demo-echo",
      next: "Persist to Supabase resource_connections and update routing weights."
    },
    { status: 201 }
  );
}
