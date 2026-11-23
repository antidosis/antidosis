import { describe, it, expect } from "vitest";

import {
  ALL_SKILLS,
  getCategoryLabel,
  getSkillCategory,
  searchSkills,
  SKILL_TAXONOMY,
} from "./skills-taxonomy";

describe("SKILL_TAXONOMY", () => {
  it("has no duplicate skills (search quality depends on it)", () => {
    const lower = ALL_SKILLS.map((s) => s.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("every skill is non-empty and every category has skills", () => {
    for (const cat of SKILL_TAXONOMY) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.skills.length).toBeGreaterThan(0);
      for (const skill of cat.skills) expect(skill.trim()).toBe(skill);
    }
  });

  it("covers the industries members ask for", () => {
    for (const required of [
      "Real Estate Agent",
      "Influencer Marketing",
      "Food Reviewing",
      "Product Reviewing",
      "Security Guard",
      "CCTV Installation",
      "Mortgage Broking",
      "Hairdressing",
      "Barbering",
      "Tattooing",
      "Wedding Celebrant",
      "Horse Care",
      "Apiary & Beekeeping",
      "Phone Repair",
      "Car Detailing",
      "Boat Maintenance",
      "Private Chef",
      "Driving Instruction",
    ]) {
      expect(ALL_SKILLS).toContain(required);
    }
  });

  it("is comprehensive — well beyond the original eight categories", () => {
    expect(SKILL_TAXONOMY.length).toBeGreaterThanOrEqual(15);
    expect(ALL_SKILLS.length).toBeGreaterThanOrEqual(300);
  });
});

describe("searchSkills", () => {
  it("finds skills by substring, case-insensitive", () => {
    expect(searchSkills("real estate")).toContain("Real Estate Agent");
    expect(searchSkills("INFLUENCER")).toContain("Influencer Marketing");
    expect(searchSkills("secur")).toContain("Security Guard");
  });

  it("returns nothing for empty queries", () => {
    expect(searchSkills("")).toEqual([]);
    expect(searchSkills("   ")).toEqual([]);
  });

  it("excludes already-selected skills", () => {
    const results = searchSkills("agent", ["Real Estate Agent"]);
    expect(results).not.toContain("Real Estate Agent");
    expect(results).toContain("Buyer's Agent");
  });

  it("caps results at 12", () => {
    expect(searchSkills("a").length).toBeLessThanOrEqual(12);
  });
});

describe("getSkillCategory / getCategoryLabel", () => {
  it("resolves category for known skills", () => {
    expect(getSkillCategory("Real Estate Agent")).toBe("realestate");
    expect(getSkillCategory("Security Guard")).toBe("security");
    expect(getSkillCategory("nope")).toBeUndefined();
  });

  it("resolves labels", () => {
    expect(getCategoryLabel("realestate")).toBe("Real Estate & Property");
    expect(getCategoryLabel("nope")).toBeUndefined();
  });
});
