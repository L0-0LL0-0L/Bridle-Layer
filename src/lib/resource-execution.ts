import { lookup } from "node:dns/promises";
import net from "node:net";
import type { ExecutionKind, ExecutionLog, Resource } from "./types";
import { makeId } from "./utils";

type ExecuteInput = {
  resource: Resource;
  callerUserId?: string;
  providerUserId?: string;
  kind?: ExecutionKind;
};

type ExecuteResult = {
  log: ExecutionLog;
  billing: {
    charged: boolean;
    reason: string;
  };
};

const timeoutMs = 8000;
const maxAttempts = 3;

declare global {
  var __bridleExecutionLogs: ExecutionLog[] | undefined;
}

function logsStore() {
  globalThis.__bridleExecutionLogs ||= [];
  return globalThis.__bridleExecutionLogs;
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isBlockedIpv6(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  );
}

function isBlockedAddress(address: string) {
  const family = net.isIP(address);
  if (family === 4) {
    return isPrivateIpv4(address);
  }

  if (family === 6) {
    return isBlockedIpv6(address);
  }

  return false;
}

export async function assertSafeProviderUrl(endpoint: string) {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("Provider endpoint is not a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Provider endpoint must use http or https.");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || isBlockedAddress(hostname)) {
    throw new Error("Provider endpoint is blocked by SSRF guard.");
  }

  const records = await lookup(hostname, {
    all: true,
    verbatim: true
  });

  if (records.some((record) => isBlockedAddress(record.address))) {
    throw new Error("Provider endpoint resolves to a blocked network address.");
  }

  return url;
}

function responseExcerpt(body: string) {
  return body.replace(/\s+/g, " ").trim().slice(0, 500);
}

function shouldRetry(status?: number, networkError?: unknown) {
  if (networkError) {
    return true;
  }

  return typeof status === "number" && status >= 500;
}

function statusHealthError(status?: number, networkError?: unknown) {
  if (networkError instanceof Error) {
    return networkError.message;
  }

  if (typeof status === "number" && status >= 400) {
    return `HTTP ${status}`;
  }

  return undefined;
}

async function providerFetch(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "BRIDLE-resource-executor/1.0"
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function runResourceCall(input: ExecuteInput): Promise<ExecuteResult> {
  const endpoint = input.resource.endpoint;
  const started = Date.now();
  const kind = input.kind || "live_call";

  if (!endpoint) {
    const log = persistExecutionLog({
      id: makeId("exec"),
      resourceId: input.resource.id,
      callerUserId: input.callerUserId,
      providerUserId: input.providerUserId || input.resource.ownerId,
      kind,
      latencyMs: 0,
      attempts: 0,
      ok: false,
      error: "Resource has no provider endpoint.",
      responseExcerpt: "",
      endpointHost: "",
      charged: false,
      createdAt: new Date().toISOString()
    });

    return {
      log,
      billing: {
        charged: false,
        reason: "No charge: provider endpoint missing."
      }
    };
  }

  let url: URL;
  try {
    url = await assertSafeProviderUrl(endpoint);
  } catch (error) {
    const log = persistExecutionLog({
      id: makeId("exec"),
      resourceId: input.resource.id,
      callerUserId: input.callerUserId,
      providerUserId: input.providerUserId || input.resource.ownerId,
      kind,
      latencyMs: Date.now() - started,
      attempts: 0,
      ok: false,
      error: error instanceof Error ? error.message : "Endpoint rejected.",
      responseExcerpt: "",
      endpointHost: endpoint,
      charged: false,
      createdAt: new Date().toISOString()
    });

    return {
      log,
      billing: {
        charged: false,
        reason: "No charge: endpoint blocked before execution."
      }
    };
  }

  let attempts = 0;
  let httpStatus: number | undefined;
  let excerpt = "";
  let error: unknown;

  while (attempts < maxAttempts) {
    attempts += 1;
    error = undefined;

    try {
      const response = await providerFetch(url);
      httpStatus = response.status;
      excerpt = responseExcerpt(await response.text());

      if (!shouldRetry(httpStatus) || attempts >= maxAttempts) {
        break;
      }
    } catch (caught) {
      error = caught;

      if (!shouldRetry(undefined, caught) || attempts >= maxAttempts) {
        break;
      }
    }
  }

  const ok = typeof httpStatus === "number" && httpStatus >= 200 && httpStatus < 300;
  const charged = kind === "live_call" && ok;
  const log = persistExecutionLog({
    id: makeId("exec"),
    resourceId: input.resource.id,
    callerUserId: input.callerUserId,
    providerUserId: input.providerUserId || input.resource.ownerId,
    kind,
    httpStatus,
    latencyMs: Date.now() - started,
    attempts,
    ok,
    error: statusHealthError(httpStatus, error),
    responseExcerpt: excerpt,
    endpointHost: url.host,
    charged,
    createdAt: new Date().toISOString()
  });

  return {
    log,
    billing: {
      charged,
      reason: charged ? "Charged: live provider call succeeded." : "No charge: call failed or was a health probe."
    }
  };
}

function persistExecutionLog(log: ExecutionLog) {
  logsStore().unshift(log);
  globalThis.__bridleExecutionLogs = logsStore().slice(0, 100);
  return log;
}

export async function executeResource(input: ExecuteInput) {
  return runResourceCall({
    ...input,
    kind: "live_call"
  });
}

export async function healthCheckResource(input: ExecuteInput) {
  return runResourceCall({
    ...input,
    kind: "health_probe"
  });
}

export function listExecutionLogsForPrincipal(principalId: string) {
  return logsStore().filter((log) => log.callerUserId === principalId || log.providerUserId === principalId);
}
