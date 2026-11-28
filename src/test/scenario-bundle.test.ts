import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The /scenario page is a prebuilt Vite app shipped as static files in
 * public/scenario and served through a next.config rewrite. These checks
 * guard the contract between the two: if someone deletes the bundle,
 * rebuilds it with the wrong base, or drops a referenced asset, the build
 * should fail here rather than 404 in production.
 */
const ROOT = path.resolve(__dirname, "../..");
const BUNDLE = path.join(ROOT, "public", "scenario");

describe("scenario static bundle", () => {
  const indexPath = path.join(BUNDLE, "index.html");

  it("ships an entry document", () => {
    expect(existsSync(indexPath)).toBe(true);
  });

  it("references every hashed asset it loads", () => {
    const html = readFileSync(indexPath, "utf8");
    const refs = [...html.matchAll(/(?:src|href)="(\/scenario\/[^"]+)"/g)].map((m) => m[1]);
    // At minimum the JS bundle, the CSS bundle, and the preloaded font
    expect(refs.length).toBeGreaterThanOrEqual(3);
    for (const ref of refs) {
      const file = path.join(BUNDLE, ref.replace("/scenario/", ""));
      expect(existsSync(file), `missing asset referenced by index.html: ${ref}`).toBe(true);
    }
  });

  it("uses the /scenario/ base so assets resolve without a trailing slash", () => {
    const html = readFileSync(indexPath, "utf8");
    expect(html).toContain('src="/scenario/assets/');
    expect(html).not.toContain('src="./assets/');
  });

  it("ships the geography data and fonts the scene fetches at runtime", () => {
    expect(existsSync(path.join(BUNDLE, "data", "coast.json"))).toBe(true);
    for (const font of [
      "NotoSansDisplay-Regular.woff2",
      "NotoSansDisplay-SemiBold.woff2",
      "NotoSansDisplay-Bold.woff2",
      "NotoSansMono-Regular.woff2",
    ]) {
      expect(existsSync(path.join(BUNDLE, "fonts", font)), `missing font ${font}`).toBe(true);
    }
  });

  it("keeps the honesty notice and attribution with the scenario", () => {
    const html = readFileSync(indexPath, "utf8");
    expect(html).toContain("Not live listings or telemetry");
    expect(existsSync(path.join(BUNDLE, "CREDITS.md"))).toBe(true);
  });

  it("routes /scenario to the static entry via next.config", () => {
    const config = readFileSync(path.join(ROOT, "next.config.mjs"), "utf8");
    expect(config).toContain('source: "/scenario"');
    expect(config).toContain('destination: "/scenario/index.html"');
  });
});
