import { createRef } from "react";

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

describe("Card", () => {
  it("renders Card with children", () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("applies default Card classes", () => {
    render(<Card>Default</Card>);
    const card = screen.getByText("Default");
    expect(card).toHaveClass("vessel");
    expect(card).toHaveClass("text-[#e8d5a3]");
  });

  it("applies custom className to Card", () => {
    render(<Card className="custom-class">Custom</Card>);
    const card = screen.getByText("Custom");
    expect(card).toHaveClass("custom-class");
    expect(card).toHaveClass("vessel");
  });

  it("forwards ref on Card", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>Ref</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("spreads additional props on Card", () => {
    render(<Card data-testid="my-card">Props</Card>);
    expect(screen.getByTestId("my-card")).toBeInTheDocument();
  });
});

describe("CardHeader", () => {
  it("renders with children", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("applies default classes", () => {
    render(<CardHeader>Header</CardHeader>);
    const header = screen.getByText("Header");
    expect(header).toHaveClass("flex");
    expect(header).toHaveClass("flex-col");
    expect(header).toHaveClass("space-y-1.5");
    expect(header).toHaveClass("p-5");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardHeader ref={ref}>Ref</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardTitle", () => {
  it("renders as h3", () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByRole("heading", { level: 3 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("Title");
  });

  it("applies default classes", () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByRole("heading", { level: 3 });
    expect(title).toHaveClass("text-base");
    expect(title).toHaveClass("font-semibold");
    expect(title).toHaveClass("text-[#e8d5a3]");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<CardTitle ref={ref}>Ref</CardTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe("CardDescription", () => {
  it("renders with children", () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("applies default classes", () => {
    render(<CardDescription>Description</CardDescription>);
    const desc = screen.getByText("Description");
    expect(desc).toHaveClass("text-sm");
    expect(desc).toHaveClass("text-[#b8a078]");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<CardDescription ref={ref}>Ref</CardDescription>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe("CardContent", () => {
  it("renders with children", () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("applies default padding classes", () => {
    render(<CardContent>Content</CardContent>);
    const content = screen.getByText("Content");
    expect(content).toHaveClass("p-5");
    expect(content).toHaveClass("pt-0");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardContent ref={ref}>Ref</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardFooter", () => {
  it("renders with children", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("applies default flex classes", () => {
    render(<CardFooter>Footer</CardFooter>);
    const footer = screen.getByText("Footer");
    expect(footer).toHaveClass("flex");
    expect(footer).toHaveClass("items-center");
    expect(footer).toHaveClass("p-5");
    expect(footer).toHaveClass("pt-0");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardFooter ref={ref}>Ref</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
