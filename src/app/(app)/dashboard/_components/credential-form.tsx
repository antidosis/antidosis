"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { getFieldConfig, ID_SUBTYPES, TYPE_OPTIONS } from "./credential-config";
import type { CredentialData } from "./credential-list";

export interface CredentialFormProps {
  isOpen: boolean;
  editingId: string | null;
  initialData?: CredentialData | null;
  onSave: (data: CredentialSavePayload, editingId: string | null) => Promise<void>;
  onCancel: () => void;
}

export interface CredentialSavePayload {
  type: string;
  subType?: string;
  title: string;
  description?: string;
  documentNumber?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  fileUrl?: string;
  backFileUrl?: string;
  isPublic: boolean;
}

function buildInitialForm(data?: CredentialData | null) {
  if (!data) {
    return {
      type: "qualification",
      subType: "",
      title: "",
      description: "",
      documentNumber: "",
      issuedBy: "",
      issuedAt: "",
      expiresAt: "",
      fileUrl: "",
      backFileUrl: "",
      isPublic: false,
    };
  }
  return {
    type: data.type,
    subType: data.subType || "",
    title: data.title,
    description: data.description || "",
    documentNumber: data.documentNumber || "",
    issuedBy: data.issuedBy || "",
    issuedAt: data.issuedAt ? data.issuedAt.split("T")[0] : "",
    expiresAt: data.expiresAt ? data.expiresAt.split("T")[0] : "",
    fileUrl: data.fileUrl || "",
    backFileUrl: data.backFileUrl || "",
    isPublic: data.isPublic,
  };
}

function defaultTitleForType(type: string): string {
  if (type === "wwcc") return "Working With Children Check";
  if (type === "criminal_history") return "National Police Check";
  return "";
}

function defaultTitleForSubType(subType: string): string {
  switch (subType) {
    case "drivers_licence":
      return "Driver's Licence";
    case "passport":
      return "Passport";
    case "photo_id":
      return "Photo ID Card";
    case "proof_of_age":
      return "Proof of Age Card";
    case "medicare":
      return "Medicare Card";
    default:
      return "Identification";
  }
}

export function CredentialForm({
  isOpen,
  editingId,
  initialData,
  onSave,
  onCancel,
}: CredentialFormProps) {
  const [credForm, setCredForm] = useState(() => buildInitialForm(initialData));
  const [saving, setSaving] = useState(false);

  // Reset form when initialData changes
  const formKey = `${editingId ?? "new"}-${initialData?.id ?? "none"}`;
  useMemo(() => {
    setCredForm(buildInitialForm(initialData));
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

  const config = useMemo(
    () => getFieldConfig(credForm.type, credForm.subType),
    [credForm.type, credForm.subType]
  );

  function handleTypeChange(type: string) {
    const newConfig = getFieldConfig(type, "");
    setCredForm((prev) => ({
      ...prev,
      type,
      subType: type === "identification" ? "drivers_licence" : "",
      title: defaultTitleForType(type) || newConfig.titlePlaceholder,
      isPublic: newConfig.forcePrivate ? false : prev.isPublic,
    }));
  }

  function handleSubTypeChange(subType: string) {
    const newConfig = getFieldConfig("identification", subType);
    setCredForm((prev) => ({
      ...prev,
      subType,
      title: defaultTitleForSubType(subType),
      isPublic: newConfig.forcePrivate ? false : prev.isPublic,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: CredentialSavePayload = {
      type: credForm.type,
      subType: credForm.subType || undefined,
      title: credForm.title,
      description: credForm.description || undefined,
      documentNumber: credForm.documentNumber || undefined,
      issuedBy: credForm.issuedBy || undefined,
      issuedAt: credForm.issuedAt || undefined,
      expiresAt: credForm.expiresAt || undefined,
      fileUrl: credForm.fileUrl || undefined,
      backFileUrl: credForm.backFileUrl || undefined,
      isPublic: config.forcePrivate ? false : credForm.isPublic,
    };
    await onSave(payload, editingId);
    setSaving(false);
  }

  if (!isOpen) return null;

  return (
    <div className="vessel p-6 mb-8">
      <p className="text-xs text-[#f5a623] mb-4">
        {editingId ? "Edit Credential" : "Add Credential"}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {/* Type */}
        <div className="space-y-2">
          <Label>Type</Label>
          <select
            value={credForm.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-sm px-3 py-2 outline-none focus:border-[#f5a623] rounded"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Identification sub-type */}
        {credForm.type === "identification" && (
          <div className="space-y-2">
            <Label>ID Document Type</Label>
            <select
              value={credForm.subType}
              onChange={(e) => handleSubTypeChange(e.target.value)}
              className="w-full bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-sm px-3 py-2 outline-none focus:border-[#f5a623] rounded"
            >
              {ID_SUBTYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label>{config.titleLabel}</Label>
          <Input
            value={credForm.title}
            onChange={(e) => setCredForm({ ...credForm, title: e.target.value })}
            placeholder={config.titlePlaceholder}
            required={config.titleRequired}
          />
        </div>

        {/* Description */}
        {config.showDescription && (
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={credForm.description}
              onChange={(e) => setCredForm({ ...credForm, description: e.target.value })}
              placeholder="Additional details..."
              rows={2}
            />
          </div>
        )}

        {/* Document Number */}
        {config.showDocNum && (
          <div className="space-y-2">
            <Label>{config.docNumLabel}</Label>
            <Input
              value={credForm.documentNumber}
              onChange={(e) => setCredForm({ ...credForm, documentNumber: e.target.value })}
              placeholder={config.docNumPlaceholder}
            />
          </div>
        )}

        {/* Issued By */}
        {config.showIssuedBy && (
          <div className="space-y-2">
            <Label>{config.issuedByLabel}</Label>
            <Input
              value={credForm.issuedBy}
              onChange={(e) => setCredForm({ ...credForm, issuedBy: e.target.value })}
              placeholder={config.issuedByPlaceholder}
            />
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          {config.showIssuedAt && (
            <div className="space-y-2">
              <Label>Issued At</Label>
              <Input
                type="date"
                value={credForm.issuedAt}
                onChange={(e) => setCredForm({ ...credForm, issuedAt: e.target.value })}
              />
            </div>
          )}
          {config.showExpiresAt && (
            <div className="space-y-2">
              <Label>{config.expiresLabel}</Label>
              <Input
                type="date"
                value={credForm.expiresAt}
                onChange={(e) => setCredForm({ ...credForm, expiresAt: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* File Upload(s) */}
        <div className="space-y-2">
          <Label>
            Document File {config.fileRequired && <span className="text-[#ff5252]">*</span>}
          </Label>
          <FileUpload
            folder="credentials"
            onUpload={(url) => setCredForm({ ...credForm, fileUrl: url })}
          >
            {credForm.fileUrl
              ? "Change File"
              : config.showBackFile
                ? "Upload Front"
                : "Upload File"}
          </FileUpload>
          {credForm.fileUrl && (
            <p className="text-xs text-[#7a6b5a] truncate">{credForm.fileUrl}</p>
          )}
        </div>

        {config.showBackFile && (
          <div className="space-y-2">
            <Label>Back of Document</Label>
            <FileUpload
              folder="credentials"
              onUpload={(url) => setCredForm({ ...credForm, backFileUrl: url })}
            >
              {credForm.backFileUrl ? "Change File" : "Upload Back"}
            </FileUpload>
            {credForm.backFileUrl && (
              <p className="text-xs text-[#7a6b5a] truncate">{credForm.backFileUrl}</p>
            )}
          </div>
        )}

        {/* Public toggle */}
        {!config.forcePrivate && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={credForm.isPublic}
              onChange={(e) => setCredForm({ ...credForm, isPublic: e.target.checked })}
              className="accent-[#f5a623]"
            />
            <Label htmlFor="isPublic" className="cursor-pointer">
              Public (visible on profile)
            </Label>
          </div>
        )}
        {config.forcePrivate && (
          <p className="text-xs text-[#7a6b5a]">
            This credential type is always kept private for your security.
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
