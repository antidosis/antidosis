import { describe, expect, it, beforeEach } from "vitest";

import {
  pushUndo,
  popUndo,
  peekUndo,
  getUndoStack,
  clearUndoStack,
  formatUndoDescription,
} from "./terminal-undo";

describe("undo stack", () => {
  beforeEach(() => {
    clearUndoStack();
  });

  it("pushes and pops actions", () => {
    pushUndo({ type: "clear_messages", description: "Cleared terminal", payload: {} });
    const action = popUndo();
    expect(action?.type).toBe("clear_messages");
    expect(action?.description).toBe("Cleared terminal");
  });

  it("peeks without removing", () => {
    pushUndo({ type: "delete_need", description: "Deleted need", payload: { id: "n1" } });
    const peeked = peekUndo();
    const popped = popUndo();
    expect(peeked?.id).toBe(popped?.id);
  });

  it("returns null when empty", () => {
    expect(popUndo()).toBeNull();
    expect(peekUndo()).toBeNull();
  });

  it("limits stack size", () => {
    for (let i = 0; i < 60; i++) {
      pushUndo({ type: "set_env", description: `Set env ${i}`, payload: {} });
    }
    expect(getUndoStack().length).toBeLessThanOrEqual(50);
  });

  it("expires old actions", () => {
    pushUndo({ type: "clear_messages", description: "Old action", payload: {} });
    // Manually set timestamp to 6 minutes ago
    const stack = getUndoStack();
    if (stack[0]) stack[0].timestamp = Date.now() - 6 * 60 * 1000;
    expect(popUndo()).toBeNull();
  });

  it("formats description with time", () => {
    pushUndo({ type: "clear_messages", description: "Cleared", payload: {} });
    const formatted = formatUndoDescription(getUndoStack()[0]);
    expect(formatted).toContain("Cleared");
    expect(formatted).toMatch(/\(\d+s? ago\)/);
  });
});
