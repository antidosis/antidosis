import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActionProgress } from "./action-progress";

describe("ActionProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing while idle", () => {
    render(<ActionProgress active={false} stages={["Working"]} />);
    expect(screen.queryByTestId("action-progress")).not.toBeInTheDocument();
  });

  it("shows the first stage and a live percentage while active", () => {
    render(<ActionProgress active stages={["Checking details", "Publishing"]} />);
    expect(screen.getByTestId("action-progress")).toBeInTheDocument();
    expect(screen.getByText(/Checking details/)).toBeInTheDocument();
    expect(screen.getByText(/%$/)).toBeInTheDocument();
  });

  it("rotates through the stages while active", () => {
    render(<ActionProgress active stages={["One", "Two", "Three"]} />);
    expect(screen.getByText(/One/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText(/Two/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText(/Three/)).toBeInTheDocument();
  });

  it("closes out at 100% with a Done state, then hides", () => {
    const { rerender } = render(<ActionProgress active stages={["Working"]} />);
    rerender(<ActionProgress active={false} stages={["Working"]} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.queryByTestId("action-progress")).not.toBeInTheDocument();
  });

  it("progress advances over time but never passes 90% before completion", () => {
    render(<ActionProgress active stages={["Working"]} />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    const pct = Number(screen.getByText(/%$/).textContent?.replace("%", ""));
    expect(pct).toBeGreaterThan(50);
    expect(pct).toBeLessThanOrEqual(90);
  });
});
