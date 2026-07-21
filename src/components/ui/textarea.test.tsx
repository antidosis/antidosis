import { createRef } from "react";

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<Textarea placeholder="Enter text…" />);
    const textarea = screen.getByPlaceholderText("Enter text…");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "Enter text…");
  });

  it("forwards ref correctly", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("applies default classes", () => {
    render(<Textarea />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("min-h-[100px]");
    expect(textarea).toHaveClass("w-full");
    expect(textarea).toHaveClass("bg-[#0f0c0a]");
    expect(textarea).toHaveClass("border");
    expect(textarea).toHaveClass("border-[#2a2420]");
    expect(textarea).toHaveClass("text-[#e8d5a3]");
    expect(textarea).toHaveClass("resize-y");
  });

  it("applies disabled state", () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass("disabled:cursor-not-allowed");
    expect(textarea).toHaveClass("disabled:opacity-50");
  });

  it("fires onChange when value changes", () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "hello world" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    render(<Textarea className="my-class" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("my-class");
    expect(textarea).toHaveClass("bg-[#0f0c0a]");
  });

  it("spreads additional props", () => {
    render(<Textarea data-testid="my-textarea" aria-label="Bio" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("data-testid", "my-textarea");
    expect(textarea).toHaveAttribute("aria-label", "Bio");
  });

  it("renders with a default value", () => {
    render(<Textarea defaultValue="Default text" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Default text");
  });

  it("renders as read-only", () => {
    render(<Textarea readOnly />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("readOnly");
  });
});
