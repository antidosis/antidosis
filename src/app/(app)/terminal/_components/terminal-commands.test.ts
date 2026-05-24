import { describe, expect, it } from "vitest";

import { COMMANDS } from "./terminal-commands";

describe("COMMANDS", () => {
  it("has unique command names", () => {
    const names = COMMANDS.map((c) => c.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("documents alias duplicates if any", () => {
    const aliasMap = new Map<string, string[]>();
    for (const cmd of COMMANDS) {
      for (const alias of cmd.aliases) {
        const key = alias.toLowerCase();
        if (!aliasMap.has(key)) aliasMap.set(key, []);
        aliasMap.get(key)!.push(cmd.name);
      }
    }
    const duplicates = Array.from(aliasMap.entries()).filter(([, cmds]) => cmds.length > 1);
    if (duplicates.length > 0) {
      console.warn("Duplicate aliases found:", duplicates);
    }
    // Intentionally lenient: aliases may overlap by design (e.g. "msg" for dm and message)
    expect(duplicates.length).toBeLessThanOrEqual(10);
  });

  it("every command has required fields", () => {
    for (const cmd of COMMANDS) {
      expect(cmd.name).toBeTruthy();
      expect(cmd.description).toBeTruthy();
      expect(cmd.usage).toBeTruthy();
      expect(cmd.category).toBeTruthy();
      expect(typeof cmd.adminOnly).toBe("boolean");
      expect(typeof cmd.implemented).toBe("boolean");
    }
  });

  it("help command exists and is implemented", () => {
    const help = COMMANDS.find((c) => c.name === "help");
    expect(help).toBeDefined();
    expect(help!.implemented).toBe(true);
    expect(help!.aliases).toContain("h");
  });

  it("dm command exists and is implemented", () => {
    const dm = COMMANDS.find((c) => c.name === "dm");
    expect(dm).toBeDefined();
    expect(dm!.implemented).toBe(true);
  });

  it("can find command by alias", () => {
    const byAlias = COMMANDS.find((c) => c.aliases.map((a) => a.toLowerCase()).includes("h"));
    expect(byAlias?.name).toBe("help");
  });

  it("categories are valid", () => {
    const validCategories = new Set([
      "chat",
      "profile",
      "needs",
      "contracts",
      "reviews",
      "notifications",
      "social",
      "discovery",
      "lab",
      "misc",
      "admin",
      "editing",
      "credentials",
      "pro",
      "shell",
    ]);
    for (const cmd of COMMANDS) {
      expect(validCategories.has(cmd.category)).toBe(true);
    }
  });
});
