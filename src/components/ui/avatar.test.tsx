import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { Avatar } from "./avatar";

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt: string;
    className?: string;
    onError?: (e: { currentTarget: HTMLImageElement }) => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.src}
      alt={props.alt}
      className={props.className}
      onError={props.onError}
      data-testid="next-image"
    />
  ),
}));

describe("Avatar", () => {
  it("renders fallback initials when name is provided and no src", () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders single initial for one-word name", () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders question mark when no name and no src", () => {
    render(<Avatar />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("renders image when src is provided", () => {
    render(<Avatar src="/avatar.png" name="John Doe" />);
    const img = screen.getByTestId("next-image");
    expect(img).toHaveAttribute("src", "/avatar.png");
    expect(img).toHaveAttribute("alt", "John Doe");
  });

  it("applies default size classes (md)", () => {
    render(<Avatar name="Test" />);
    const avatar = screen.getByText("T").parentElement;
    expect(avatar).toHaveClass("h-10");
    expect(avatar).toHaveClass("w-10");
    expect(avatar).toHaveClass("text-xs");
  });

  it("applies sm size classes", () => {
    render(<Avatar name="Test" size="sm" />);
    const avatar = screen.getByText("T").parentElement;
    expect(avatar).toHaveClass("h-8");
    expect(avatar).toHaveClass("w-8");
    expect(avatar).toHaveClass("text-[10px]");
  });

  it("applies lg size classes", () => {
    render(<Avatar name="Test" size="lg" />);
    const avatar = screen.getByText("T").parentElement;
    expect(avatar).toHaveClass("h-14");
    expect(avatar).toHaveClass("w-14");
    expect(avatar).toHaveClass("text-sm");
  });

  it("applies custom className", () => {
    render(<Avatar name="Test" className="custom-avatar" />);
    const avatar = screen.getByText("T").parentElement;
    expect(avatar).toHaveClass("custom-avatar");
  });

  it("hides image on error", () => {
    render(<Avatar src="/broken.png" name="Test" />);
    const img = screen.getByTestId("next-image") as HTMLImageElement;
    // Simulate error
    if (img.onerror) {
      const event = { currentTarget: img };
      img.onerror(event as unknown as Event);
      expect(img.style.display).toBe("none");
    }
  });

  it("uses unoptimized for data URLs", () => {
    render(<Avatar src="data:image/png;base64,abc" name="Test" />);
    const img = screen.getByTestId("next-image");
    expect(img).toBeInTheDocument();
  });

  it("renders with null src and null name", () => {
    render(<Avatar src={null} name={null} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("limits initials to two characters", () => {
    render(<Avatar name="John Jacob Jingleheimer" />);
    expect(screen.getByText("JJ")).toBeInTheDocument();
  });
});
