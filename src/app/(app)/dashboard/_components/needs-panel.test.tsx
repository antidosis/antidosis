import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NeedsPanel } from "./needs-panel";

const need = {
  id: "need-1",
  title: "Garden help",
  status: "open",
  createdAt: "2026-01-01T00:00:00.000Z",
  _count: { views: 8, watches: 3, acceptances: 2 },
  acceptances: [{ id: "acceptance-1" }],
};

describe("NeedsPanel", () => {
  it("keeps views, watchers and interest attached to each post", () => {
    render(<NeedsPanel isBusiness={false} needs={[need]} />);

    expect(screen.getByRole("link", { name: "Garden help" })).toBeInTheDocument();
    expect(screen.getByText("Views")).toBeInTheDocument();
    expect(screen.getByText("Watching")).toBeInTheDocument();
    expect(screen.getByText("Interested")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Post performance/i }));
    expect(screen.getByText("View → interest")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("Ready to contract")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage responses" })).toHaveAttribute(
      "href",
      "/needs/need-1"
    );
  });

  it("separates active and archived posts", () => {
    render(
      <NeedsPanel
        isBusiness={false}
        needs={[need, { ...need, id: "need-2", title: "Old task", status: "archived" }]}
      />
    );

    expect(screen.queryByText("Old task")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "archived (1)" }));
    expect(screen.getByText("Old task")).toBeInTheDocument();
    expect(screen.queryByText("Garden help")).not.toBeInTheDocument();
  });
});
