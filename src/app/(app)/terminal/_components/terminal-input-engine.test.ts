import { describe, expect, it } from "vitest";

import {
  parsePipeline,
  parseStructuredQuery,
  buildQueryUrl,
  reverseISearch,
  getExpectedArgType,
} from "./terminal-input-engine";

describe("parsePipeline", () => {
  it("returns null for non-pipeline input", () => {
    expect(parsePipeline("/needs")).toBeNull();
  });

  it("parses simple pipeline", () => {
    const result = parsePipeline("/needs | /count");
    expect(result).toEqual([
      { cmd: "needs", args: [] },
      { cmd: "count", args: [] },
    ]);
  });

  it("parses pipeline with args", () => {
    const result = parsePipeline("/needs mine | /sort recent | /limit 5");
    expect(result).toEqual([
      { cmd: "needs", args: ["mine"] },
      { cmd: "sort", args: ["recent"] },
      { cmd: "limit", args: ["5"] },
    ]);
  });

  it("ignores malformed segments", () => {
    const result = parsePipeline("/needs | not-a-command | /count");
    expect(result).toEqual([
      { cmd: "needs", args: [] },
      { cmd: "count", args: [] },
    ]);
  });
});

describe("parseStructuredQuery", () => {
  it("returns null for plain text", () => {
    expect(parseStructuredQuery("gardening help")).toBeNull();
  });

  it("parses status filter", () => {
    const result = parseStructuredQuery("status:open");
    expect(result?.filters).toEqual({ status: "open" });
  });

  it("parses multiple filters", () => {
    const result = parseStructuredQuery('status:open skill:gardening location:"Woy Woy"');
    expect(result?.filters).toEqual({ status: "open", skill: "gardening", location: "Woy Woy" });
  });

  it("parses sort directive", () => {
    const result = parseStructuredQuery("skill:gardening recent");
    expect(result?.filters).toEqual({ skill: "gardening" });
    expect(result?.sort).toBe("recent");
    expect(result?.order).toBe("desc");
  });

  it("parses oldest sort as asc", () => {
    const result = parseStructuredQuery("oldest");
    expect(result?.sort).toBe("oldest");
    expect(result?.order).toBe("asc");
  });

  it("parses limit filter", () => {
    const result = parseStructuredQuery("limit:10");
    expect(result?.limit).toBe(10);
  });
});

describe("buildQueryUrl", () => {
  it("builds basic url", () => {
    const query = parseStructuredQuery("status:open")!;
    expect(buildQueryUrl("/api/v1/needs", query)).toBe("/api/v1/needs?status=open");
  });

  it("builds complex url", () => {
    const query = parseStructuredQuery("skill:gardening status:open recent limit:5")!;
    expect(buildQueryUrl("/api/v1/needs", query)).toContain("skill=gardening");
    expect(buildQueryUrl("/api/v1/needs", query)).toContain("status=open");
    expect(buildQueryUrl("/api/v1/needs", query)).toContain("sortBy=createdAt");
    expect(buildQueryUrl("/api/v1/needs", query)).toContain("order=desc");
    expect(buildQueryUrl("/api/v1/needs", query)).toContain("limit=5");
  });
});

describe("reverseISearch", () => {
  it("finds matching command", () => {
    const history = ["/help", "/needs", "/dm Alice", "/status"];
    const result = reverseISearch(history, "dm", history.length - 1);
    expect(result.match?.command).toBe("/dm Alice");
    expect(result.match?.highlightIndex).toBe(1);
  });

  it("wraps around", () => {
    const history = ["/help", "/needs", "/dm Alice"];
    const result = reverseISearch(history, "help", 1);
    expect(result.match?.command).toBe("/help");
  });

  it("returns null for no match", () => {
    const history = ["/help", "/needs"];
    const result = reverseISearch(history, "zzz", history.length - 1);
    expect(result.match).toBeNull();
  });
});

describe("getExpectedArgType", () => {
  it("returns users for dm", () => {
    expect(getExpectedArgType("dm", 0)).toBe("users");
  });

  it("returns channels for chat", () => {
    expect(getExpectedArgType("chat", 0)).toBe("channels");
  });

  it("returns null for unknown command", () => {
    expect(getExpectedArgType("unknown", 0)).toBeNull();
  });
});
