import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TerminalPreview } from "./terminal-preview";

describe("TerminalPreview", () => {
  let intersectionCallback: IntersectionObserverCallback;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    disconnectMock = vi.fn();
    global.IntersectionObserver = vi.fn(function (callback: IntersectionObserverCallback) {
      intersectionCallback = callback;
      return {
        observe: vi.fn(),
        disconnect: disconnectMock,
        unobserve: vi.fn(),
        takeRecords: vi.fn(() => []),
        root: null,
        rootMargin: "100px 0px",
        thresholds: [0],
      };
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function setIntersecting(target: Element, isIntersecting: boolean) {
    act(() => {
      intersectionCallback(
        [{ isIntersecting, target } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
  }

  it("pauses typing off-screen and resumes from the same character", () => {
    const { container } = render(<TerminalPreview />);
    const command = () => container.querySelector(".text-gold")?.textContent;

    act(() => vi.advanceTimersByTime(500));
    expect(command()).toBe("");

    setIntersecting(container.firstElementChild!, true);
    for (let character = 0; character < 3; character += 1) {
      act(() => vi.advanceTimersByTime(55));
    }
    expect(command()).toBe("/he");

    setIntersecting(container.firstElementChild!, false);
    act(() => vi.advanceTimersByTime(500));
    expect(command()).toBe("/he");

    setIntersecting(container.firstElementChild!, true);
    act(() => vi.advanceTimersByTime(55));
    expect(command()).toBe("/hel");
  });

  it("disconnects its visibility observer on unmount", () => {
    const { unmount } = render(<TerminalPreview />);
    unmount();
    expect(disconnectMock).toHaveBeenCalledOnce();
  });
});
