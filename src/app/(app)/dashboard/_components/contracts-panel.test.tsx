import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ContractsPanel } from "./contracts-panel";
import type { DashboardContract } from "./dashboard-types";

vi.mock("swr", () => ({ mutate: vi.fn() }));

vi.mock("./direct-contract-form", () => ({
  DirectContractForm: () => <div data-testid="direct-form" />,
}));

function makeContract(overrides: Partial<DashboardContract> & { id: string }): DashboardContract {
  return {
    kind: "direct",
    title: "Agreement",
    status: "active",
    partyAId: "profile-1",
    partyBId: "profile-2",
    partyBSignedAt: null,
    need: null,
    ...overrides,
  } as DashboardContract;
}

const contracts: DashboardContract[] = [
  makeContract({ id: "c-active", status: "active", title: "Lawn mowing deal" }),
  makeContract({ id: "c-draft", status: "draft", title: "Draft agreement" }),
  makeContract({ id: "c-done", status: "completed", title: "Completed job" }),
  makeContract({ id: "c-cancelled", status: "cancelled", title: "Cancelled job" }),
];

describe("ContractsPanel folders", () => {
  it("groups agreements into in-progress, completed and cancelled folders", () => {
    render(<ContractsPanel profileId="profile-1" contracts={contracts} />);

    expect(screen.getByRole("region", { name: "In progress" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Completed" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Cancelled" })).toBeTruthy();

    const inProgress = screen.getByRole("region", { name: "In progress" });
    expect(inProgress.textContent).toContain("Lawn mowing deal");
    expect(inProgress.textContent).toContain("Draft agreement");
    expect(inProgress.textContent).not.toContain("Completed job");
    expect(inProgress.textContent).not.toContain("Cancelled job");
  });

  it("omits folders that have no agreements", () => {
    render(
      <ContractsPanel
        profileId="profile-1"
        contracts={[makeContract({ id: "c1", status: "completed" })]}
      />
    );
    expect(screen.queryByRole("region", { name: "In progress" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Cancelled" })).toBeNull();
    expect(screen.getByRole("region", { name: "Completed" })).toBeTruthy();
  });

  it("shows the empty state when there are no agreements at all", () => {
    render(<ContractsPanel profileId="profile-1" contracts={[]} />);
    expect(screen.getByText("No contracts yet")).toBeTruthy();
  });
});
