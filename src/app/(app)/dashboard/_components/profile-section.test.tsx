import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/ui/toast";

import type { EditorProfile } from "./profile-editor/types";
import { ProfileSection } from "./profile-section";

vi.mock("swr", () => ({ mutate: vi.fn() }));

const profile: EditorProfile = {
  id: "profile-1",
  fullName: "Original Name",
  bio: null,
  avatarUrl: null,
  locationName: "terrigal_2260",
  publicPhone: null,
  privatePhone: null,
  businessPhone: null,
  businessEmail: null,
  mobile: null,
  abn: null,
  accountType: "individual",
  abnVerified: false,
  audienceSize: null,
  handle: "original-name",
  showInDirectory: false,
  mobileVerified: false,
  isVerified: false,
  ratingAvg: 0,
  ratingCount: 0,
  jobsCompleted: 0,
  skills: [],
  socialLinks: [],
};

function renderProfile(onUpdate = vi.fn(), overrides: Partial<EditorProfile> = {}) {
  const initial = { ...profile, ...overrides };
  render(
    <ToastProvider>
      <ProfileSection
        initialProfile={initial}
        credentials={[]}
        onCredentialsUpdate={vi.fn()}
        onUpdate={onUpdate}
        activeTab="public"
        onTabChange={vi.fn()}
      />
    </ToastProvider>
  );
  return onUpdate;
}

describe("ProfileSection save controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows the controls only after an edit and dismisses them on cancel", async () => {
    renderProfile();
    expect(screen.queryByRole("button", { name: "Save profile" })).not.toBeInTheDocument();

    const name = screen.getByLabelText("Full name");
    fireEvent.change(name, { target: { value: "Updated Name" } });
    expect(screen.getByRole("button", { name: "Save profile" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Save profile" })).not.toBeInTheDocument()
    );
    expect(name).toHaveValue("Original Name");
  });

  it("resets the saved values and dismisses the controls after a successful save", async () => {
    const updated = { ...profile, fullName: "Updated Name" };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(updated),
    } as unknown as Response);
    const onUpdate = renderProfile();

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Updated Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(updated));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Save profile" })).not.toBeInTheDocument()
    );
    expect(screen.getByLabelText("Full name")).toHaveValue("Updated Name");
  });
});

describe("public phone visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows a hidden-state toggle for the verified mobile", () => {
    renderProfile(vi.fn(), { mobile: "0400123456", mobileVerified: true });
    expect(screen.getByText("Public phone")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /verified mobile/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle.textContent).toContain("0400123456");
  });

  it("prompts to verify instead of offering a phone input when unverified", () => {
    renderProfile();
    expect(screen.getByText("Public phone")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /verified mobile/i })).not.toBeInTheDocument();
    const prompt = screen.getByRole("link", { name: /settings & security/i });
    expect(prompt).toHaveAttribute("href", "/dashboard?tab=settings");
  });
});
