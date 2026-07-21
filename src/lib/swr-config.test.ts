import { describe, it, expect, vi } from "vitest";

import { fetcher, defaultConfig } from "./swr-config";

describe("fetcher", () => {
  it("returns JSON on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "123" }),
    } as Response);

    const result = await fetcher("/api/test");
    expect(result).toEqual({ id: "123" });
  });

  it("throws on non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    } as Response);

    await expect(fetcher("/api/test")).rejects.toThrow("Not found");
  });

  it("throws with status code when no error message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(fetcher("/api/test")).rejects.toThrow("HTTP 500");
  });

  it("throws with status code when json fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("Bad JSON")),
    } as Response);

    await expect(fetcher("/api/test")).rejects.toThrow("HTTP 502");
  });
});

describe("defaultConfig", () => {
  it("has correct defaults", () => {
    expect(defaultConfig.fetcher).toBe(fetcher);
    expect(defaultConfig.revalidateOnFocus).toBe(true);
    expect(defaultConfig.revalidateOnReconnect).toBe(true);
    expect(defaultConfig.dedupingInterval).toBe(5000);
    expect(defaultConfig.keepPreviousData).toBe(true);
    expect(defaultConfig.errorRetryCount).toBe(2);
  });
});
