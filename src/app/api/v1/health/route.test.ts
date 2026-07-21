import { describe, it, expect } from "vitest";

import { GET } from "./route";

describe("GET /api/v1/health", () => {
  it("returns 200 with health status", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.service).toBe("antidosis-api");
    expect(json.version).toBe("0.1.0");
    expect(json.timestamp).toBeDefined();
  });
});
