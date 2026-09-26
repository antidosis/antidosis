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
    expect(badge).toHaveClass("bg-sun");
    expect(badge).toHaveClass("text-onaccent");
    expect(badge).toHaveClass("font-bold");
  });

  it("applies outline variant classes", () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText("Outline");
    expect(badge).toHaveClass("bg-transparent");
    expect(badge).toHaveClass("text-parchment");
    expect(badge).toHaveClass("border");
    expect(badge).toHaveClass("border-line");
  });

  it("applies destructive variant classes", () => {
    render(<Badge variant="destructive">Destructive</Badge>);
    const badge = screen.getByText("Destructive");
    expect(badge).toHaveClass("bg-transparent");
    expect(badge).toHaveClass("text-bad");
    expect(badge).toHaveClass("border");
    expect(badge).toHaveClass("border-bad/30");
  });

  it("applies quintessence variant classes", () => {
    render(<Badge variant="quintessence">Quintessence</Badge>);
    const badge = screen.getByText("Quintessence");
    expect(badge).toHaveClass("bg-transparent");
    expect(badge).toHaveClass("text-quint");
    expect(badge).toHaveClass("border");
    expect(badge).toHaveClass("border-quint/30");
  });
});
