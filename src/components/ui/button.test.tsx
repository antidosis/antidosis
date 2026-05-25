import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button", { name: "Default" });
    expect(button).toHaveClass("bg-[#f5a623]");
    expect(button).toHaveClass("text-[#0a0806]");
    expect(button).toHaveClass("font-bold");
  });

  it("applies secondary variant classes", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button", { name: "Secondary" });
    expect(button).toHaveClass("bg-transparent");
    expect(button).toHaveClass("text-[#e8d5a3]");
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("border-[#2a2420]");
  });

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button", { name: "Ghost" });
    expect(button).toHaveClass("bg-transparent");
    expect(button).toHaveClass("text-[#b8a078]");
  });

  it("applies destructive variant classes", () => {
    render(<Button variant="destructive">Destructive</Button>);
    const button = screen.getByRole("button", { name: "Destructive" });
    expect(button).toHaveClass("bg-transparent");
    expect(button).toHaveClass("text-[#ff5252]");
    expect(button).toHaveClass("border");
  });

  it("applies default size classes", () => {
    render(<Button>Size Default</Button>);
    const button = screen.getByRole("button", { name: "Size Default" });
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("py-2");
  });

  it("applies sm size classes", () => {
    render(<Button size="sm">Size Small</Button>);
    const button = screen.getByRole("button", { name: "Size Small" });
    expect(button).toHaveClass("px-3");
    expect(button).toHaveClass("py-1.5");
    expect(button).toHaveClass("text-xs");
  });

  it("applies lg size classes", () => {
    render(<Button size="lg">Size Large</Button>);
    const button = screen.getByRole("button", { name: "Size Large" });
    expect(button).toHaveClass("px-6");
    expect(button).toHaveClass("py-3");
  });

  it("applies icon size classes", () => {
    render(<Button size="icon">Icon</Button>);
    const button = screen.getByRole("button", { name: "Icon" });
    expect(button).toHaveClass("h-10");
    expect(button).toHaveClass("w-10");
  });

  it("is disabled when disabled prop is passed", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-40");
    expect(button).toHaveClass("disabled:cursor-not-allowed");
  });

  it("fires onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    const button = screen.getByRole("button", { name: "Clickable" });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as a child element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: "Link Button" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });
});
