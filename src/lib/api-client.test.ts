import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, apiGet, apiPost } from "./api-client";

describe("ApiError", () => {
  it("stores status and data", () => {
    const err = new ApiError("Not found", 404, { detail: "missing" });
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.data).toEqual({ detail: "missing" });
  });
});

describe("apiGet", () => {
  it("returns parsed JSON on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ id: "123" }),
    } as unknown as Response);

    const result = await apiGet("/api/test");
    expect(result).toEqual({ id: "123" });
  });

  it("validates response with schema", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ id: "123" }),
    } as unknown as Response);

    const schema = z.object({ id: z.string() });
    const result = await apiGet("/api/test", { schema });
    expect(result).toEqual({ id: "123" });
  });

  it("throws ApiError on non-ok status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ error: "Not found" }),
    } as unknown as Response);

    await expect(apiGet("/api/test")).rejects.toBeInstanceOf(ApiError);
  });

  it("throws ApiError on schema mismatch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ id: 123 }),
    } as unknown as Response);

    const schema = z.object({ id: z.string() });
    await expect(apiGet("/api/test", { schema })).rejects.toBeInstanceOf(ApiError);
  });
});

describe("apiPost", () => {
  it("returns parsed JSON on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ created: true }),
    } as unknown as Response);

    const result = await apiPost("/api/test", { name: "foo" });
    expect(result).toEqual({ created: true });
  });

  it("throws ApiError on non-ok status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Map([["content-type", "application/json"]]),
      json: () => Promise.resolve({ error: "Bad request" }),
    } as unknown as Response);

    await expect(apiPost("/api/test", {})).rejects.toBeInstanceOf(ApiError);
  });
});
