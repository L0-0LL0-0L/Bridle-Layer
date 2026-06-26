import { describe, expect, it } from "vitest";
import { assertSafeProviderUrl } from "./resource-execution";

describe("assertSafeProviderUrl", () => {
  it.each([
    "http://localhost:3000",
    "http://127.0.0.1/status",
    "http://10.0.0.5/status",
    "http://172.16.0.5/status",
    "http://192.168.1.5/status",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/status",
    "file:///etc/passwd"
  ])("blocks unsafe provider target %s", async (url) => {
    await expect(assertSafeProviderUrl(url)).rejects.toThrow();
  });
});
