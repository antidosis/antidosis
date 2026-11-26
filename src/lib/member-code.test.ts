import { describe, it, expect } from "vitest";

import { generateMemberCode, generateOrderRef } from "./member-code";

describe("member codes", () => {
  it("generates ANT-XXXXXX codes from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateMemberCode();
      expect(code).toMatch(/^ANT-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
      // No visually ambiguous characters
      expect(code).not.toMatch(/[ILO01]/);
    }
  });

  it("generates MESH-XXXXXX order refs", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOrderRef()).toMatch(/^MESH-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it("does not repeat codes across a sample", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateMemberCode()));
    expect(codes.size).toBe(500);
  });
});
