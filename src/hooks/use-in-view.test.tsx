import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useInView } from "./use-in-view";

function TestComponent({ options }: { options?: IntersectionObserverInit }) {
  const { ref, isInView } = useInView(options);
  return (
    <div>
      <div ref={ref} data-testid="target">
        Target
      </div>
      <span data-testid="status">{isInView ? "visible" : "hidden"}</span>
    </div>
  );
}

describe("useInView", () => {
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;
  let unobserveMock: ReturnType<typeof vi.fn>;
  let intersectionCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null;

  beforeEach(() => {
    observeMock = vi.fn();
    disconnectMock = vi.fn();
    unobserveMock = vi.fn();

    global.IntersectionObserver = vi.fn((callback) => {
      intersectionCallback = callback;
      return {
        observe: observeMock,
        disconnect: disconnectMock,
        unobserve: unobserveMock,
        takeRecords: vi.fn(() => []),
        root: null,
        rootMargin: "",
        thresholds: [],
      };
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    intersectionCallback = null;
  });

  it("returns initial isInView as false", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("status")).toHaveTextContent("hidden");
  });

  it("observes element on mount", () => {
    render(<TestComponent />);
    const target = screen.getByTestId("target");
    expect(observeMock).toHaveBeenCalledWith(target);
  });

  it("sets isInView to true when element intersects", async () => {
    render(<TestComponent />);
    const target = screen.getByTestId("target");

    expect(intersectionCallback).not.toBeNull();

    intersectionCallback!([
      { isIntersecting: true, target } as unknown as IntersectionObserverEntry,
    ]);

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("visible");
    });
  });

  it("does not set isInView when element does not intersect", async () => {
    render(<TestComponent />);
    const target = screen.getByTestId("target");

    intersectionCallback!([
      { isIntersecting: false, target } as unknown as IntersectionObserverEntry,
    ]);

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("hidden");
    });
  });

  it("disconnects observer on unmount", () => {
    const { unmount } = render(<TestComponent />);
    unmount();
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });

  it("passes custom options to IntersectionObserver", () => {
    const options: IntersectionObserverInit = { threshold: 0.5, rootMargin: "10px" };
    render(<TestComponent options={options} />);
    expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: 0.5,
      rootMargin: "10px",
    });
  });

  it("unobserves element after intersection", () => {
    render(<TestComponent />);
    const target = screen.getByTestId("target");

    intersectionCallback!([
      { isIntersecting: true, target } as unknown as IntersectionObserverEntry,
    ]);

    expect(unobserveMock).toHaveBeenCalledWith(target);
  });
});
