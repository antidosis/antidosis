import { describe, it, expect } from "vitest";

import {
  sendTerminalMessageSchema,
  terminalReactionSchema,
  sendDirectMessageSchema,
  dmReactionSchema,
} from "./terminal";

describe("sendTerminalMessageSchema", () => {
  it("accepts valid message", () => {
    const result = sendTerminalMessageSchema.safeParse({
      channelId: "550e8400-e29b-41d4-a716-446655440000",
      content: "Hello everyone!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts message with attachments", () => {
    const result = sendTerminalMessageSchema.safeParse({
      channelId: "550e8400-e29b-41d4-a716-446655440000",
      content: "Check this out",
      attachments: [{ url: "https://example.com/img.jpg", type: "image/jpeg", name: "img.jpg" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid channelId", () => {
    const result = sendTerminalMessageSchema.safeParse({
      channelId: "not-a-uuid",
      content: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = sendTerminalMessageSchema.safeParse({
      channelId: "550e8400-e29b-41d4-a716-446655440000",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content over 2000 chars", () => {
    const result = sendTerminalMessageSchema.safeParse({
      channelId: "550e8400-e29b-41d4-a716-446655440000",
      content: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing channelId", () => {
    const result = sendTerminalMessageSchema.safeParse({ content: "Hello" });
    expect(result.success).toBe(false);
  });
});

describe("terminalReactionSchema", () => {
  it("accepts valid reaction", () => {
    const result = terminalReactionSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
      emoji: "👍",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid messageId", () => {
    const result = terminalReactionSchema.safeParse({
      messageId: "bad-id",
      emoji: "👍",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty emoji", () => {
    const result = terminalReactionSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
      emoji: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects emoji over 10 chars", () => {
    const result = terminalReactionSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
      emoji: "👍".repeat(11),
    });
    expect(result.success).toBe(false);
  });
});

describe("sendDirectMessageSchema", () => {
  it("accepts valid DM", () => {
    const result = sendDirectMessageSchema.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      content: "Hey there",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid userId", () => {
    const result = sendDirectMessageSchema.safeParse({
      userId: "not-uuid",
      content: "Hey",
    });
    expect(result.success).toBe(false);
  });
});

describe("dmReactionSchema", () => {
  it("accepts valid DM reaction", () => {
    const result = dmReactionSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
      emoji: "❤️",
    });
    expect(result.success).toBe(true);
  });
});
