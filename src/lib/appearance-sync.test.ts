import { beforeEach, describe, expect, it } from "vitest";

import {
  applyAccountPreferences,
  pairFromPreferences,
  parseAppearancePreferences,
} from "./appearance-sync";

describe("parseAppearancePreferences", () => {
  it("parses valid JSON and rejects garbage", () => {
    expect(parseAppearancePreferences('{"light":"porcelain","dark":"chrome"}')).toEqual({
      light: "porcelain",
      dark: "chrome",
    });
    expect(parseAppearancePreferences("not json")).toBeNull();
    expect(parseAppearancePreferences('"just a string"')).toBeNull();
    expect(parseAppearancePreferences(null)).toBeNull();
    expect(parseAppearancePreferences(undefined)).toBeNull();
  });
});

describe("pairFromPreferences", () => {
  it("reads explicit light/dark slots", () => {
    expect(pairFromPreferences({ light: "sage", dark: "ember" })).toEqual({
      light: "sage",
      dark: "ember",
    });
  });

  it("maps the legacy single-theme shape onto its brightness slot", () => {
    expect(pairFromPreferences({ theme: "glacier" })).toEqual({ light: "light", dark: "glacier" });
    expect(pairFromPreferences({ theme: "linen" })).toEqual({ light: "linen", dark: "chrome" });
  });

  it("prefers explicit slots over the legacy theme", () => {
    expect(pairFromPreferences({ theme: "rose", light: "skyline", dark: "regal" })).toEqual({
      light: "skyline",
      dark: "regal",
    });
  });

  it("rejects unknown or wrong-brightness ids and empty prefs", () => {
    expect(pairFromPreferences({ light: "hacked" })).toBeNull();
    expect(pairFromPreferences({ light: "ember" })).toBeNull(); // dark theme in light slot
    expect(pairFromPreferences({})).toBeNull();
    expect(pairFromPreferences(null)).toBeNull();
  });
});

describe("applyAccountPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  it("adopts the pair on a fresh device using the OS preference", () => {
    window.matchMedia = window.matchMedia || (() => ({ matches: false }) as MediaQueryList);
    const original = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({ matches: !query.includes("light"), media: query }) as MediaQueryList) as typeof matchMedia;

    const applied = applyAccountPreferences(
      '{"light":"porcelain","dark":"chrome","font":"system"}'
    );
    expect(applied).toBe(true);
    // matchMedia mocked dark → chrome active
    expect(document.documentElement.dataset.theme).toBe("chrome");
    expect(JSON.parse(localStorage.getItem("antidosis-pair")!)).toEqual({
      light: "porcelain",
      dark: "chrome",
    });
    expect(localStorage.getItem("antidosis-font")).toBe("system");

    window.matchMedia = original;
  });

  it("does not override an existing local choice", () => {
    localStorage.setItem("antidosis-theme", "rose");
    localStorage.setItem("antidosis-pair", JSON.stringify({ dark: "rose", light: "light" }));
    document.documentElement.dataset.theme = "rose";

    const applied = applyAccountPreferences('{"light":"porcelain","dark":"chrome"}');
    expect(applied).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("rose");
    expect(JSON.parse(localStorage.getItem("antidosis-pair")!)).toEqual({
      dark: "rose",
      light: "light",
    });
  });

  it("returns false for malformed account prefs", () => {
    expect(applyAccountPreferences("{oops")).toBe(false);
  });
});
