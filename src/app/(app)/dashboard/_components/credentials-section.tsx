"use client";

import { useState } from "react";

import { Info, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CredentialForm } from "./credential-form";
import type { CredentialSavePayload } from "./credential-form";
import { CredentialList } from "./credential-list";
import type { CredentialData } from "./credential-list";

export interface CredentialsSectionProps {
  initialCredentials: CredentialData[];
  onUpdate: (credentials: CredentialData[]) => void;
}

export function CredentialsSection({ initialCredentials, onUpdate }: CredentialsSectionProps) {
  const [credentials, setCredentials] = useState<CredentialData[]>(initialCredentials);
  const [credFormOpen, setCredFormOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<CredentialData | null>(null);

  function closeCredForm() {
    setCredFormOpen(false);
    setEditingCred(null);
    setEditingData(null);
  }

  async function handleSave(payload: CredentialSavePayload, editingId: string | null) {
    const res = await fetch(
      editingId ? `/api/v1/credentials/${editingId}` : "/api/v1/credentials",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (res.ok) {
      closeCredForm();
      const credsRes = await fetch("/api/v1/credentials");
      if (credsRes.ok) {
        const data = await credsRes.json();
        setCredentials(data.credentials || []);
        onUpdate(data.credentials || []);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this credential? This cannot be undone.")) return;
    const res = await fetch(`/api/v1/credentials/${id}`, { method: "DELETE" });
    if (res.ok) {
      const next = credentials.filter((c) => c.id !== id);
      setCredentials(next);
      onUpdate(next);
    }
  }

  async function handleToggleVisibility(id: string, current: boolean) {
    const res = await fetch(`/api/v1/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !current }),
    });
    if (res.ok) {
      setCredentials((prev) => prev.map((c) => (c.id === id ? { ...c, isPublic: !current } : c)));
    }
  }

  function handleEdit(cred: CredentialData) {
    setEditingCred(cred.id);
    setEditingData(cred);
    setCredFormOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-[#7a6b5a]">$ ls ~/credentials/</p>
        <Button size="sm" variant="secondary" onClick={() => setCredFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Credential
        </Button>
      </div>

      <div className="bg-[#00e5ff]/5 border border-[#00e5ff]/20 p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-[#00e5ff] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#7a6b5a] space-y-1">
            <p className="text-[#e8d5a3] font-medium">How identity verification works</p>
            <p>
              Upload a government-issued ID (driver&apos;s licence, passport, etc.) as an{" "}
              <strong>&ldquo;identification&rdquo;</strong> type credential. Our team reviews and
              approves it within 24 hours. Once approved, your profile is verified and you can claim{" "}
              <strong>free Pro</strong> for life.
            </p>
            <p>
              You can also add qualifications, licenses, certifications, WWCC, police checks, and
              insurance to build extra trust.
            </p>
          </div>
        </div>
      </div>

      <CredentialForm
        isOpen={credFormOpen}
        editingId={editingCred}
        initialData={editingData}
        onSave={handleSave}
        onCancel={closeCredForm}
      />

      <CredentialList
        credentials={credentials}
        idSubtypes={[
          { value: "drivers_licence", label: "Driver's Licence" },
          { value: "passport", label: "Passport" },
          { value: "photo_id", label: "Photo ID Card" },
          { value: "proof_of_age", label: "Proof of Age Card" },
          { value: "medicare", label: "Medicare Card" },
          { value: "other", label: "Other ID" },
        ]}
        onToggleVisibility={handleToggleVisibility}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
