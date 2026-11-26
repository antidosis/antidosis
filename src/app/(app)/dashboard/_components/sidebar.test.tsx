import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "./sidebar";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function renderSidebar(nodeMode: "business" | "member", onSelect = vi.fn()) {
  render(
    <Sidebar
      activeTab="profile"
      onSelect={onSelect}
      counts={{}}
      isBusiness={nodeMode === "business"}
      nodeMode={nodeMode}
      mobileOpen
      onCloseMobile={() => {}}
    />
  );
  return onSelect;
}

afterEach(cleanup);

describe("Sidebar node badge", () => {
  it("shows member node outside the directory, even for business accounts", () => {
    renderSidebar("member");
    expect(screen.getByText("member node")).toBeTruthy();
    expect(screen.queryByText("business node")).toBeNull();
  });

  it("shows business node while the directory section is active", () => {
    renderSidebar("business");
    expect(screen.getByText("business node")).toBeTruthy();
    expect(screen.queryByText("member node")).toBeNull();
  });

  it("switches live when the mode prop changes", () => {
    const { rerender } = render(
      <Sidebar
        activeTab="profile"
        onSelect={vi.fn()}
        counts={{}}
        isBusiness
        nodeMode="business"
        mobileOpen
        onCloseMobile={() => {}}
      />
    );
    expect(screen.getByText("business node")).toBeTruthy();
    rerender(
      <Sidebar
        activeTab="needs"
        onSelect={vi.fn()}
        counts={{}}
        isBusiness
        nodeMode="member"
        mobileOpen
        onCloseMobile={() => {}}
      />
    );
    expect(screen.getByText("member node")).toBeTruthy();
    expect(screen.queryByText("business node")).toBeNull();
  });

  it("tapping the badge jumps to the matching profile section", () => {
    const onSelect = renderSidebar("business");
    fireEvent.click(screen.getByText("business node"));
    expect(onSelect).toHaveBeenCalledWith("profile", "directory");
  });
});
