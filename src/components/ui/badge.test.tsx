import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge).toHaveClass("bg-[#f5a623]");
    expect(badge).toHaveClass("text-[#0a0806]");
    expect(badge).toHaveClass("font-bold");
  });

  it("applies outline variant classes", () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText("Outline");
    expect(badge).toHaveClass("bg-transparent");
    expect(badge).toHaveClass("text-[#b8a078]");
    expect(badge).toHaveClass("border");
    expect(badge).toHaveClass("border-[#2a2420]");
  });

  it("applies destructive variant classes", () => {
    render(<Badge variant="destructive">Destructive</Badge>);
    const badge = screen.getByText("Destructive");
    expect(badge).toHaveClass("bg-transparent");
    expect(badge).toHaveClass("text-[#ff5252]");
    expect(badge).toHaveClass("border");
    expect(badge).toHaveClass("border-[#ff5252]/30");
  });

  it("applies quintessence variant classes", () => {
    render(<Badge variant="quintessence">Quintessence</Badge>);
    const badge = screen.getByText("Quintessence");
    expect(badge).toHaveClass("bg-transparent");
    expect(badge).toHaveClass("text-[#b24bf5]");
    expect(badge).toHaveClass("border");
    expect(badge).toHaveClass("border-[#b24bf5]/30");
  });
});
