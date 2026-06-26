import { NextResponse } from "next/server";
import { listExecutionLogsForPrincipal } from "@/lib/resource-execution";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const principalId = searchParams.get("principalId");

  if (!principalId) {
    return NextResponse.json({ error: "principalId is required." }, { status: 400 });
  }

  return NextResponse.json({
    data: listExecutionLogsForPrincipal(principalId)
  });
}
