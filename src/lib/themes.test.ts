import { describe, it, expect } from "vitest";

import {
  applySiteTheme,
  currentSiteTheme,
  FONT_PACKS,
  getThemePair,
  isFontPackId,
  isLightThemeId,
  isSiteThemeId,
  SITE_THEMES,
} from "./themes";

describe("SITE_THEMES", () => {
  it("ships 8 dark and 8 light themes", () => {
    expect(SITE_THEMES.filter((t) => t.brightness === "dark")).toHaveLength(8);
    expect(SITE_THEMES.filter((t) => t.brightness === "light")).toHaveLength(8);
  });

  it("has unique ids, labels, and complete metadata", () => {
    const ids = SITE_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const theme of SITE_THEMES) {
      expect(theme.label).toBeTruthy();
      expect(theme.description).toBeTruthy();
      expect(theme.swatch[0]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.swatch[1]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("classifies light themes correctly", () => {
    for (const id of [
      "light",
      "porcelain",
      "sage",
      "linen",
      "skyline",
      "rosewater",
      "lavender",
      "citrus",
    ]) {
      expect(isLightThemeId(id)).toBe(true);
    }
    for (const id of ["dark", "chrome", "ember", "phosphor", "rose"]) {
      expect(isLightThemeId(id)).toBe(false);
    }
  });

  it("isSiteThemeId validates every shipped id and rejects junk", () => {
    for (const theme of SITE_THEMES) expect(isSiteThemeId(theme.id)).toBe(true);
    expect(isSiteThemeId("hacked")).toBe(false);
    expect(isSiteThemeId(null)).toBe(false);
  });
});

describe("FONT_PACKS", () => {
  it("has unique ids with stacks", () => {
    const ids = FONT_PACKS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const pack of FONT_PACKS) {
      expect(pack.stack).toContain(",");
      expect(isFontPackId(pack.id)).toBe(true);
    }
    expect(isFontPackId("comic-sans")).toBe(false);
  });
});

describe("applySiteTheme", () => {
  it("sets data-theme, persists, and broadcasts", () => {
    const events: string[] = [];
    window.addEventListener("antidosis-theme", (e) => events.push((e as CustomEvent).detail));

    applySiteTheme("porcelain");
    expect(document.documentElement.dataset.theme).toBe("porcelain");
    expect(localStorage.getItem("antidosis-theme")).toBe("porcelain");
    expect(events).toContain("porcelain");
    expect(currentSiteTheme()).toBe("porcelain");

    applySiteTheme("ember");
    expect(currentSiteTheme()).toBe("ember");
  });

  it("claims the brightness slot in the saved pair", () => {
    applySiteTheme("ultraviolet");
    expect(getThemePair().dark).toBe("ultraviolet");

    applySiteTheme("sage");
    expect(getThemePair().light).toBe("sage");
    expect(getThemePair().dark).toBe("ultraviolet"); // other slot untouched
  });
});

describe("getThemePair", () => {
  it("defaults to Chrome + Daybreak", () => {
    localStorage.removeItem("antidosis-pair");
    expect(getThemePair()).toEqual({ dark: "chrome", light: "light" });
  });

  it("repairs invalid or wrong-brightness slots", () => {
    localStorage.setItem("antidosis-pair", JSON.stringify({ dark: "porcelain", light: "ember" }));
    expect(getThemePair()).toEqual({ dark: "chrome", light: "light" });

    localStorage.setItem("antidosis-pair", JSON.stringify({ dark: "chrome", light: "bogus" }));
    expect(getThemePair()).toEqual({ dark: "chrome", light: "light" });
  });
});
