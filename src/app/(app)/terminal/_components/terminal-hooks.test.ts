import { renderHook, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useThemeStyles, useNotificationSound, useSwipeGesture } from "./terminal-hooks";

describe("useThemeStyles", () => {
  it("returns default theme variables", () => {
    const { result } = renderHook(() => useThemeStyles("default"));
    expect((result.current.vars as Record<string, string>)["--term-bg"]).toBe("#0a0806");
    expect((result.current.vars as Record<string, string>)["--term-accent"]).toBe("#f5a623");
    expect(result.current.t.accent).toBe("#f5a623");
  });

  it("returns cyberpunk theme variables", () => {
    const { result } = renderHook(() => useThemeStyles("cyberpunk"));
    expect((result.current.vars as Record<string, string>)["--term-bg"]).toBe("#0a0014");
    expect((result.current.vars as Record<string, string>)["--term-accent"]).toBe("#ff00ff");
  });

  it("returns matrix theme variables", () => {
    const { result } = renderHook(() => useThemeStyles("matrix"));
    expect((result.current.vars as Record<string, string>)["--term-bg"]).toBe("#000000");
    expect((result.current.vars as Record<string, string>)["--term-accent"]).toBe("#00ff41");
  });

  it("returns ocean theme variables", () => {
    const { result } = renderHook(() => useThemeStyles("ocean"));
    expect((result.current.vars as Record<string, string>)["--term-bg"]).toBe("#001520");
    expect((result.current.vars as Record<string, string>)["--term-accent"]).toBe("#00d4aa");
  });

  it("returns minimal theme variables", () => {
    const { result } = renderHook(() => useThemeStyles("minimal"));
    expect((result.current.vars as Record<string, string>)["--term-bg"]).toBe("#111111");
    expect((result.current.vars as Record<string, string>)["--term-accent"]).toBe("#e5e5e5");
  });

  it("falls back to default for unknown theme", () => {
    const { result } = renderHook(() => useThemeStyles("nonexistent"));
    expect((result.current.vars as Record<string, string>)["--term-bg"]).toBe("#0a0806");
  });

  it("memoizes inner theme colors", () => {
    const { result, rerender } = renderHook(({ theme }) => useThemeStyles(theme), {
      initialProps: { theme: "default" },
    });
    const first = result.current.t;
    rerender({ theme: "default" });
    expect(result.current.t).toBe(first);
  });

  it("updates when theme changes", () => {
    const { result, rerender } = renderHook(({ theme }) => useThemeStyles(theme), {
      initialProps: { theme: "default" },
    });
    expect((result.current.vars as Record<string, string>)["--term-accent"]).toBe("#f5a623");
    rerender({ theme: "cyberpunk" });
    expect((result.current.vars as Record<string, string>)["--term-accent"]).toBe("#ff00ff");
  });
});

describe("useNotificationSound", () => {
  let audioCtxMock: any;
  let oscillatorMock: any;
  let gainMock: any;

  beforeEach(() => {
    oscillatorMock = {
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      type: "",
    };
    gainMock = {
      connect: vi.fn().mockReturnThis(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
    audioCtxMock = {
      createOscillator: vi.fn(() => oscillatorMock),
      createGain: vi.fn(() => gainMock),
      currentTime: 0,
      destination: {},
    };
    vi.stubGlobal(
      "AudioContext",
      vi.fn(() => audioCtxMock)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not play when disabled", () => {
    const { result } = renderHook(() => useNotificationSound(false));
    result.current();
    expect(audioCtxMock.createOscillator).not.toHaveBeenCalled();
  });

  it("plays sound when enabled", () => {
    const { result } = renderHook(() => useNotificationSound(true));
    result.current();
    expect(audioCtxMock.createOscillator).toHaveBeenCalled();
    expect(oscillatorMock.start).toHaveBeenCalled();
    expect(oscillatorMock.stop).toHaveBeenCalledWith(0.15);
  });

  it("creates AudioContext lazily", () => {
    const { result } = renderHook(() => useNotificationSound(true));
    expect(AudioContext).not.toHaveBeenCalled();
    result.current();
    expect(AudioContext).toHaveBeenCalledOnce();
  });

  it("reuses AudioContext instance", () => {
    const { result } = renderHook(() => useNotificationSound(true));
    result.current();
    result.current();
    expect(AudioContext).toHaveBeenCalledOnce();
  });

  it("configures sine oscillator", () => {
    const { result } = renderHook(() => useNotificationSound(true));
    result.current();
    expect(oscillatorMock.type).toBe("sine");
    expect(oscillatorMock.frequency.setValueAtTime).toHaveBeenCalledWith(880, 0);
  });

  it("ramps frequency down", () => {
    const { result } = renderHook(() => useNotificationSound(true));
    result.current();
    expect(oscillatorMock.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(440, 0.1);
  });

  it("ramps gain down", () => {
    const { result } = renderHook(() => useNotificationSound(true));
    result.current();
    expect(gainMock.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.15);
  });

  it("handles AudioContext creation error gracefully", () => {
    vi.stubGlobal(
      "AudioContext",
      vi.fn(() => {
        throw new Error("Not allowed");
      })
    );
    const { result } = renderHook(() => useNotificationSound(true));
    expect(() => result.current()).not.toThrow();
  });
});

describe("useSwipeGesture", () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    cleanup();
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    });
    cleanup();
  });

  function fireTouch(startX: number, startY: number, endX: number, endY: number) {
    const touchStart = { clientX: startX, clientY: startY };
    const touchEnd = { clientX: endX, clientY: endY };

    const startEvent = new Event("touchstart", { bubbles: true }) as any;
    startEvent.touches = [touchStart];
    startEvent.changedTouches = [touchStart];
    document.dispatchEvent(startEvent);

    const endEvent = new Event("touchend", { bubbles: true }) as any;
    endEvent.touches = [];
    endEvent.changedTouches = [touchEnd];
    document.dispatchEvent(endEvent);
  }

  it("triggers onOpen for right swipe from edge on mobile", () => {
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true, configurable: true });
    const onOpen = vi.fn();
    const onClose = vi.fn();
    renderHook(() => useSwipeGesture(onOpen, onClose));

    fireTouch(10, 100, 100, 100);

    expect(onOpen).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("triggers onClose for left swipe on mobile", () => {
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true, configurable: true });
    const onOpen = vi.fn();
    const onClose = vi.fn();
    renderHook(() => useSwipeGesture(onOpen, onClose));

    fireTouch(200, 100, 100, 100);

    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("does not trigger on desktop", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
      configurable: true,
    });
    const onOpen = vi.fn();
    const onClose = vi.fn();
    renderHook(() => useSwipeGesture(onOpen, onClose));

    fireTouch(10, 100, 150, 100);

    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores short right swipe", () => {
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true, configurable: true });
    const onOpen = vi.fn();
    const onClose = vi.fn();
    renderHook(() => useSwipeGesture(onOpen, onClose));

    fireTouch(10, 100, 50, 100);

    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores vertical swipe", () => {
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true, configurable: true });
    const onOpen = vi.fn();
    const onClose = vi.fn();
    renderHook(() => useSwipeGesture(onOpen, onClose));

    fireTouch(10, 100, 100, 300);

    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not trigger onOpen when start is not near edge", () => {
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true, configurable: true });
    const onOpen = vi.fn();
    const onClose = vi.fn();
    renderHook(() => useSwipeGesture(onOpen, onClose));

    fireTouch(100, 100, 200, 100);

    expect(onOpen).not.toHaveBeenCalled();
  });
});
