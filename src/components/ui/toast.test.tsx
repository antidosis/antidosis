import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ToastProvider, useToast } from "./toast";

function TestComponent() {
  const { toast, dismiss } = useToast();
  return (
    <div>
      <button onClick={() => toast("Hello", "info")}>Show Info</button>
      <button onClick={() => toast("Success!", "success")}>Show Success</button>
      <button onClick={() => toast("Error!", "error")}>Show Error</button>
      <button onClick={() => dismiss("manual")}>Dismiss Manual</button>
    </div>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children", () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child</div>
      </ToastProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("useToast throws when used outside ToastProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    function BadComponent() {
      useToast();
      return null;
    }
    expect(() => render(<BadComponent />)).toThrow("useToast must be used within ToastProvider");
    consoleError.mockRestore();
  });

  it("shows a toast when toast() is called", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Info" }));
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("dismisses toast manually", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Info" }));
    expect(screen.getByText("Hello")).toBeInTheDocument();

    const dismissBtn = screen.getByRole("button", { name: "" });
    fireEvent.click(dismissBtn);
    expect(screen.queryByText("Hello")).not.toBeInTheDocument();
  });

  it("auto-dismisses after 5 seconds", async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Info" }));
    expect(screen.getByText("Hello")).toBeInTheDocument();

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText("Hello")).not.toBeInTheDocument();
    });
  });

  it("shows success toast with success border", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Success" }));
    const toast = screen.getByText("Success!").closest("div[class*='border-']");
    expect(toast).toHaveClass("border-[#00e676]/30");
  });

  it("shows error toast with error border", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Error" }));
    const toast = screen.getByText("Error!").closest("div[class*='border-']");
    expect(toast).toHaveClass("border-[#ff5252]/30");
  });

  it("shows info toast with info border", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Info" }));
    const toast = screen.getByText("Hello").closest("div[class*='border-']");
    expect(toast).toHaveClass("border-[#00e5ff]/30");
  });

  it("renders multiple toasts", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Info" }));
    fireEvent.click(screen.getByRole("button", { name: "Show Success" }));
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Success!")).toBeInTheDocument();
  });
});
