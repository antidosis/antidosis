import { describe, expect, it } from "vitest";

import { parseIntent } from "./terminal-agent";

describe("parseIntent", () => {
  it("parses explicit /help command", () => {
    const result = parseIntent("/help");
    expect(result.intent).toBe("HELP");
    expect(result.confidence).toBe(1);
  });

  it("parses explicit /dm command", () => {
    const result = parseIntent("/dm Sarah hey");
    expect(result.intent).toBe("DM");
    expect(result.confidence).toBe(1);
  });

  it("extracts name after preposition", () => {
    const result = parseIntent("/dm to Sarah hey");
    expect(result.args.name).toBe("Sarah");
  });

  it("parses natural language 'I need'", () => {
    const result = parseIntent("I need a plumber");
    expect(result.intent).toBe("CREATE_NEED");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("parses natural language 'search'", () => {
    const result = parseIntent("search for gardening");
    expect(result.intent).toBe("SEARCH");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("parses natural language 'browse'", () => {
    const result = parseIntent("browse needs");
    expect(result.intent).toBe("BROWSE");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("parses natural language 'sign'", () => {
    const result = parseIntent("sign the contract");
    expect(result.intent).toBe("SIGN_CONTRACT");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns UNKNOWN for gibberish", () => {
    const result = parseIntent("xyz123 nonsense");
    expect(result.intent).toBe("UNKNOWN");
    expect(result.confidence).toBe(0);
  });

  it("extracts quoted strings", () => {
    const result = parseIntent('post "fix my roof"');
    expect(result.args.quoted).toBe("fix my roof");
  });

  it("extracts dollar values", () => {
    const result = parseIntent("I need help for $50");
    expect(result.args.value).toBe("50");
  });

  it("is case-insensitive", () => {
    const lower = parseIntent("i need help");
    const upper = parseIntent("I NEED HELP");
    expect(lower.intent).toBe(upper.intent);
  });
});
