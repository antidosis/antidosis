import { describe, expect, it } from "vitest";

import {
  sparkline,
  barChart,
  progressBar,
  contractPipeline,
  getThemeColors,
  THEMES,
} from "./terminal-render";

describe("sparkline", () => {
  it("returns sparkline for data", () => {
    const result = sparkline([1, 2, 3, 4, 5]);
    expect(result).toContain("▁");
    expect(result).toContain("█");
  });

  it("handles single value", () => {
    // With one value, ratio is 0/1 = 0, so lowest block
    expect(sparkline([5])).toBe("▁");
  });

  it("returns (no data) for empty array", () => {
    expect(sparkline([])).toBe("(no data)");
  });
});

describe("barChart", () => {
  it("renders a bar", () => {
    const result = barChart("Test", 50, 100);
    expect(result).toContain("Test");
    expect(result).toContain("█");
    expect(result).toContain("░");
    expect(result).toContain("50");
  });

  it("handles zero max", () => {
    const result = barChart("Zero", 0, 0);
    expect(result).toContain("Zero");
  });
});

describe("progressBar", () => {
  it("renders 0%", () => {
    expect(progressBar(0)).toBe("[" + "░".repeat(40) + "]");
  });

  it("renders 100%", () => {
    expect(progressBar(100)).toBe("[" + "█".repeat(40) + "]");
  });

  it("renders 50%", () => {
    const result = progressBar(50);
    expect(result).toContain("█");
    expect(result).toContain("░");
  });
});

describe("contractPipeline", () => {
  it("renders draft stage", () => {
    const result = contractPipeline("draft", true, false, false, false, false);
    expect(result).toContain("DRAFT");
    expect(result).toContain("🔄");
    expect(result).toContain("You are here");
  });

  it("renders active stage with signatures", () => {
    const result = contractPipeline("active", true, true, true, false, false);
    expect(result).toContain("ACTIVE");
    expect(result).toContain("✅ Signed");
  });

  it("renders completed stage", () => {
    const result = contractPipeline("completed", true, true, true, true, true);
    expect(result).toContain("DONE");
    // Completed contracts don't show the completion section
    expect(result).not.toContain("Completion:");
  });
});

describe("getThemeColors", () => {
  it("returns default theme for unknown name", () => {
    expect(getThemeColors("nonexistent")).toEqual(THEMES.default);
  });

  it("returns cyberpunk theme", () => {
    expect(getThemeColors("cyberpunk").accent).toBe("#ff00ff");
  });

  it("returns matrix theme", () => {
    expect(getThemeColors("matrix").accent).toBe("#00ff41");
  });
});
