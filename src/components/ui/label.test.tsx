import { createRef } from "react";

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { Label } from "./label";

describe("Label", () => {
  it("renders children", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("associates with an input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" type="email" />
      </>
    );
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
  });

  it("applies default classes", () => {
    render(<Label>Default</Label>);
    const label = screen.getByText("Default");
    expect(label).toHaveClass("text-xs");
    expect(label).toHaveClass("font-medium");
    expect(label).toHaveClass("uppercase");
    expect(label).toHaveClass("tracking-wide");
    expect(label).toHaveClass("text-[#b8a078]");
  });

  it("applies custom className", () => {
    render(<Label className="custom-label">Custom</Label>);
    const label = screen.getByText("Custom");
    expect(label).toHaveClass("custom-label");
    expect(label).toHaveClass("text-[#b8a078]");
  });

  it("forwards ref correctly", () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Ref</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("fires click event", () => {
    const handleClick = vi.fn();
    render(<Label onClick={handleClick}>Clickable</Label>);
    const label = screen.getByText("Clickable");
    fireEvent.click(label);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("spreads additional props", () => {
    render(
      <Label data-testid="my-label" aria-describedby="hint">
        Props
      </Label>
    );
    const label = screen.getByText("Props");
    expect(label).toHaveAttribute("data-testid", "my-label");
    expect(label).toHaveAttribute("aria-describedby", "hint");
  });
});
