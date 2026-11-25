import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/ui/toast";

import { SettingsPanel } from "./settings-panel";

vi.mock("swr", () => ({ mutate: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const profile = {
  id: "profile-1",
  fullName: "Test User",
  email: "test@example.com",
  accountType: "individual" as const,
  abn: null,
  abnVerified: false,
  showInDirectory: false,
  mobile: "0412345678",
  mobileVerified: true,
  isVerified: false,
};

function renderSettings() {
  render(
    <ToastProvider>
      <SettingsPanel profile={profile} onNavigate={vi.fn()} />
    </ToastProvider>
  );
}

describe("SettingsPanel views", () => {
  it("shows Appearance by default and switches to Security", () => {
    renderSettings();
    expect(screen.getByRole("tab", { name: /Appearance/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    fireEvent.click(screen.getByRole("tab", { name: /Security/i }));
    expect(screen.getByLabelText("Account mobile")).toHaveValue("0412345678");
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByText(/Two-step verification & passkeys/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /^Account$/i }));
    expect(screen.getByText("Account summary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete account/i })).toBeInTheDocument();
  });
});
