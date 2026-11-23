import { describe, expect, it } from "vitest";

import { safeInternalPath } from "./navigation";

describe("safeInternalPath", () => {
  it("preserves internal invitation paths", () => {
    expect(safeInternalPath("/contracts/join/abc?x=1")).toBe("/contracts/join/abc?x=1");
  });

  it.each([
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\r\nlocation:evil",
  ])("rejects unsafe destination %s", (value) => {
    expect(safeInternalPath(value)).toBe("/exchange");
  });
});
