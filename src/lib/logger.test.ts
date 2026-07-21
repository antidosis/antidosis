import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.unmock("@/lib/logger");

import { logger } from "./logger";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs info in development format", () => {
    logger.info("Test message", { userId: "123" });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const call = logSpy.mock.calls[0][0] as string;
    expect(call).toContain("INFO: Test message");
    expect(call).toContain('"userId":"123"');
  });

  it("logs info without context", () => {
    logger.info("Simple message");
    expect(logSpy).toHaveBeenCalledTimes(1);
    const call = logSpy.mock.calls[0][0] as string;
    expect(call).toContain("INFO: Simple message");
  });

  it("logs warn", () => {
    logger.warn("Warning message", { count: 5 });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const call = warnSpy.mock.calls[0][0] as string;
    expect(call).toContain("WARN: Warning message");
  });

  it("logs error with error object", () => {
    const err = new Error("Something broke");
    logger.error("Failed", err, { requestId: "abc" });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const call = errorSpy.mock.calls[0][0] as string;
    expect(call).toContain("ERROR: Failed");
    expect(call).toContain("Something broke");
  });

  it("logs error without error object", () => {
    logger.error("Just a message");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const call = errorSpy.mock.calls[0][0] as string;
    expect(call).toContain("ERROR: Just a message");
  });

  it("debug logs in development", () => {
    logger.debug("Debug info", { detail: "extra" });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const call = logSpy.mock.calls[0][0] as string;
    expect(call).toContain("DEBUG: Debug info");
  });
});
