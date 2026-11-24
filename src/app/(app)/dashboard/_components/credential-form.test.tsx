import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CredentialForm } from "./credential-form";
import type { CredentialData } from "./credential-list";

vi.mock("@/components/ui/file-upload", () => ({
  FileUpload: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

const credential: CredentialData = {
  id: "credential-1",
  type: "qualification",
  subType: null,
  title: "Bachelor of Nursing",
  description: null,
  documentNumber: null,
  issuedBy: "University of Newcastle",
  issuedAt: null,
  expiresAt: null,
  fileUrl: null,
  backFileUrl: null,
  isPublic: true,
  isVerified: false,
};

describe("CredentialForm", () => {
  it("resets cleanly when switching between new and existing credentials", () => {
    const onSave = vi.fn(async () => {});
    const onCancel = vi.fn();
    const { rerender } = render(
      <CredentialForm isOpen editingId={null} onSave={onSave} onCancel={onCancel} />
    );

    const title = screen.getByLabelText("Qualification Name");
    fireEvent.change(title, { target: { value: "Unsaved draft" } });
    expect(title).toHaveValue("Unsaved draft");

    rerender(
      <CredentialForm
        isOpen
        editingId={credential.id}
        initialData={credential}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
    expect(screen.getByLabelText("Qualification Name")).toHaveValue("Bachelor of Nursing");

    rerender(<CredentialForm isOpen editingId={null} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByLabelText("Qualification Name")).toHaveValue("");
  });
});
