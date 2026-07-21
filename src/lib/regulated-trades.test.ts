import { describe, it, expect } from "vitest";

import { detectRegulatedTrade, detectBuildingWork, hasVerifiedLicence } from "./regulated-trades";

describe("detectRegulatedTrade", () => {
  it("detects electrical work via required skill", () => {
    const trade = detectRegulatedTrade({ title: "Fix my lights", skills: ["Electrician"] });
    expect(trade?.id).toBe("electrical");
  });

  it("detects plumbing via title keywords", () => {
    const trade = detectRegulatedTrade({
      title: "Replace hot water system",
      skills: [],
    });
    expect(trade?.id).toBe("plumbing");
  });

  it("detects gas fitting", () => {
    const trade = detectRegulatedTrade({ title: "Install gas cooktop", skills: [] });
    expect(trade?.id).toBe("gasfitting");
  });

  it("detects air conditioning work", () => {
    const trade = detectRegulatedTrade({ title: "Split system install", skills: [] });
    expect(trade?.id).toBe("aircon");
  });

  it("returns null for unregulated needs", () => {
    expect(
      detectRegulatedTrade({ title: "Help moving furniture", skills: ["Lifting"] })
    ).toBeNull();
    expect(detectRegulatedTrade({ title: "Mow my lawn", skills: [] })).toBeNull();
  });

  it("does not fire on loose substring matches", () => {
    // "gas" alone (e.g. "fill my gas bottle") is not gas fitting
    expect(detectRegulatedTrade({ title: "Pick up gas bottles", skills: [] })).toBeNull();
  });
});

describe("detectBuildingWork", () => {
  it("flags residential building work", () => {
    expect(detectBuildingWork({ title: "Build a deck", skills: [] })).toBe(true);
    expect(detectBuildingWork({ title: "Kitchen renovation", skills: [] })).toBe(true);
  });

  it("ignores everyday tasks", () => {
    expect(detectBuildingWork({ title: "Assemble flatpack", skills: [] })).toBe(false);
  });
});

describe("hasVerifiedLicence", () => {
  const electrical = detectRegulatedTrade({ title: "Rewire shed", skills: [] })!;

  it("passes with a verified licence of matching title", () => {
    expect(
      hasVerifiedLicence(
        [{ type: "license", title: "Electrician - NSW Fair Trading", isVerified: true }],
        electrical
      )
    ).toBe(true);
  });

  it("fails when the licence is unverified", () => {
    expect(
      hasVerifiedLicence([{ type: "license", title: "Electrician", isVerified: false }], electrical)
    ).toBe(false);
  });

  it("fails for non-licence credential types", () => {
    expect(
      hasVerifiedLicence(
        [{ type: "qualification", title: "Electrical Engineering Degree", isVerified: true }],
        electrical
      )
    ).toBe(false);
  });

  it("fails when the licence title is for a different trade", () => {
    expect(
      hasVerifiedLicence([{ type: "license", title: "Plumber", isVerified: true }], electrical)
    ).toBe(false);
  });
});
