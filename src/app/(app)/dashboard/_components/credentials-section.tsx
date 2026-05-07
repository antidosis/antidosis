"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Plus, X, Eye, EyeOff, Trash2, FileCheck, ShieldCheck, Info } from "lucide-react";

type CredentialData = {
  id: string;
  type: string;
  subType: string | null;
  title: string;
  description: string | null;
  documentNumber: string | null;
  issuedBy: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  backFileUrl: string | null;
  isPublic: boolean;
  isVerified: boolean;
};

interface CredentialsSectionProps {
  initialCredentials: CredentialData[];
  onUpdate: (creds: CredentialData[]) => void;
}

/* ─── Type config ─── */
const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "identification", label: "Identification" },
  { value: "qualification", label: "Qualification" },
  { value: "license", label: "License" },
  { value: "certification", label: "Certification" },
  { value: "ticket", label: "Ticket / Permit" },
  { value: "resume", label: "Resume / CV" },
  { value: "insurance", label: "Insurance" },
  { value: "wwcc", label: "Working With Children Check (WWCC)" },
  { value: "criminal_history", label: "Criminal History Check" },
  { value: "business_registration", label: "Business Registration (ABN/ACN)" },
  { value: "other", label: "Other" },
];

const ID_SUBTYPES = [
  { value: "drivers_licence", label: "Driver's Licence" },
  { value: "passport", label: "Passport" },
  { value: "photo_id", label: "Photo ID Card" },
  { value: "proof_of_age", label: "Proof of Age Card" },
  { value: "medicare", label: "Medicare Card" },
  { value: "other", label: "Other ID" },
];

interface FieldConfig {
  titleLabel: string;
  titlePlaceholder: string;
  titleRequired: boolean;
  showDescription: boolean;
  docNumLabel: string;
  docNumPlaceholder: string;
  showDocNum: boolean;
  issuedByLabel: string;
  issuedByPlaceholder: string;
  showIssuedBy: boolean;
  showIssuedAt: boolean;
  showExpiresAt: boolean;
  expiresLabel: string;
  fileRequired: boolean;
  showBackFile: boolean;
  forcePrivate: boolean;
}

function getFieldConfig(type: string, subType?: string | null): FieldConfig {
  switch (type) {
    case "identification":
      switch (subType) {
        case "drivers_licence":
          return {
            titleLabel: "ID Type",
            titlePlaceholder: "Driver's Licence",
            titleRequired: false,
            showDescription: false,
            docNumLabel: "Licence Number",
            docNumPlaceholder: "e.g. 12345678",
            showDocNum: true,
            issuedByLabel: "State / Territory",
            issuedByPlaceholder: "e.g. NSW, VIC, QLD",
            showIssuedBy: true,
            showIssuedAt: false,
            showExpiresAt: true,
            expiresLabel: "Expiry Date",
            fileRequired: true,
            showBackFile: true,
            forcePrivate: true,
          };
        case "passport":
          return {
            titleLabel: "ID Type",
            titlePlaceholder: "Passport",
            titleRequired: false,
            showDescription: false,
            docNumLabel: "Passport Number",
            docNumPlaceholder: "e.g. PA1234567",
            showDocNum: true,
            issuedByLabel: "Country",
            issuedByPlaceholder: "e.g. Australia",
            showIssuedBy: true,
            showIssuedAt: false,
            showExpiresAt: true,
            expiresLabel: "Expiry Date",
            fileRequired: true,
            showBackFile: false,
            forcePrivate: true,
          };
        case "photo_id":
        case "proof_of_age":
        case "medicare":
        default:
          return {
            titleLabel: "ID Type",
            titlePlaceholder: subType === "photo_id" ? "Photo ID Card" : subType === "proof_of_age" ? "Proof of Age Card" : subType === "medicare" ? "Medicare Card" : "Identification",
            titleRequired: false,
            showDescription: false,
            docNumLabel: "Card Number",
            docNumPlaceholder: "e.g. 1234 5678 9012",
            showDocNum: true,
            issuedByLabel: "Issuing State / Organisation",
            issuedByPlaceholder: "e.g. NSW, Services Australia",
            showIssuedBy: true,
            showIssuedAt: false,
            showExpiresAt: true,
            expiresLabel: "Expiry Date",
            fileRequired: true,
            showBackFile: subType === "drivers_licence" || subType === "medicare",
            forcePrivate: true,
          };
      }
    case "qualification":
      return {
        titleLabel: "Qualification Name",
        titlePlaceholder: "e.g. Bachelor of Nursing",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "Document Number",
        docNumPlaceholder: "Transcript or certificate number",
        showDocNum: false,
        issuedByLabel: "Institution",
        issuedByPlaceholder: "e.g. University of Sydney",
        showIssuedBy: true,
        showIssuedAt: true,
        showExpiresAt: false,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    case "license":
      return {
        titleLabel: "Licence Name",
        titlePlaceholder: "e.g. Builder's Licence",
        titleRequired: true,
        showDescription: false,
        docNumLabel: "Licence Number",
        docNumPlaceholder: "e.g. BL-123456",
        showDocNum: true,
        issuedByLabel: "Issuing Authority",
        issuedByPlaceholder: "e.g. NSW Fair Trading",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: true,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: true,
        forcePrivate: false,
      };
    case "certification":
      return {
        titleLabel: "Certification Name",
        titlePlaceholder: "e.g. First Aid Certificate",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "Certificate Number",
        docNumPlaceholder: "e.g. FA-2024-001",
        showDocNum: false,
        issuedByLabel: "Issuing Organisation",
        issuedByPlaceholder: "e.g. St John Ambulance",
        showIssuedBy: true,
        showIssuedAt: true,
        showExpiresAt: true,
        expiresLabel: "Expiry / Renewal Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    case "ticket":
      return {
        titleLabel: "Ticket Name",
        titlePlaceholder: "e.g. White Card, Forklift Ticket",
        titleRequired: true,
        showDescription: false,
        docNumLabel: "Ticket Number",
        docNumPlaceholder: "e.g. WC-987654",
        showDocNum: true,
        issuedByLabel: "Registered Training Organisation",
        issuedByPlaceholder: "e.g. SafeWork NSW",
        showIssuedBy: true,
        showIssuedAt: true,
        showExpiresAt: true,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    case "resume":
      return {
        titleLabel: "Resume Title",
        titlePlaceholder: "e.g. CV 2024",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "Document Number",
        docNumPlaceholder: "",
        showDocNum: false,
        issuedByLabel: "Issued By",
        issuedByPlaceholder: "",
        showIssuedBy: false,
        showIssuedAt: false,
        showExpiresAt: false,
        expiresLabel: "Expiry Date",
        fileRequired: true,
        showBackFile: false,
        forcePrivate: false,
      };
    case "insurance":
      return {
        titleLabel: "Insurance Type",
        titlePlaceholder: "e.g. Public Liability, Professional Indemnity",
        titleRequired: true,
        showDescription: false,
        docNumLabel: "Policy Number",
        docNumPlaceholder: "e.g. POL-12345678",
        showDocNum: true,
        issuedByLabel: "Insurer",
        issuedByPlaceholder: "e.g. QBE Insurance",
        showIssuedBy: true,
        showIssuedAt: true,
        showExpiresAt: true,
        expiresLabel: "Policy Expiry",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    case "wwcc":
      return {
        titleLabel: "WWCC",
        titlePlaceholder: "Working With Children Check",
        titleRequired: false,
        showDescription: false,
        docNumLabel: "WWCC Number",
        docNumPlaceholder: "e.g. WWC1234567E",
        showDocNum: true,
        issuedByLabel: "State / Territory",
        issuedByPlaceholder: "e.g. NSW, VIC, QLD",
        showIssuedBy: true,
        showIssuedAt: false,
        showExpiresAt: true,
        expiresLabel: "Expiry Date",
        fileRequired: true,
        showBackFile: false,
        forcePrivate: false,
      };
    case "criminal_history":
      return {
        titleLabel: "Check Type",
        titlePlaceholder: "e.g. National Police Check",
        titleRequired: false,
        showDescription: false,
        docNumLabel: "Reference Number",
        docNumPlaceholder: "e.g. NPC-2024-001",
        showDocNum: true,
        issuedByLabel: "Provider",
        issuedByPlaceholder: "e.g. Australian Federal Police",
        showIssuedBy: true,
        showIssuedAt: true,
        showExpiresAt: true,
        expiresLabel: "Valid Until",
        fileRequired: true,
        showBackFile: false,
        forcePrivate: true,
      };
    case "business_registration":
      return {
        titleLabel: "Business Name",
        titlePlaceholder: "e.g. Smith Plumbing Pty Ltd",
        titleRequired: true,
        showDescription: false,
        docNumLabel: "ABN / ACN",
        docNumPlaceholder: "e.g. 12 345 678 901",
        showDocNum: true,
        issuedByLabel: "Registered In",
        issuedByPlaceholder: "e.g. ASIC, NSW",
        showIssuedBy: true,
        showIssuedAt: true,
        showExpiresAt: false,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
    default: // other
      return {
        titleLabel: "Document Title",
        titlePlaceholder: "e.g. Reference Letter",
        titleRequired: true,
        showDescription: true,
        docNumLabel: "Document Number",
        docNumPlaceholder: "",
        showDocNum: false,
        issuedByLabel: "Issued By",
        issuedByPlaceholder: "",
        showIssuedBy: true,
        showIssuedAt: true,
        showExpiresAt: false,
        expiresLabel: "Expiry Date",
        fileRequired: false,
        showBackFile: false,
        forcePrivate: false,
      };
  }
}

export function CredentialsSection({ initialCredentials, onUpdate }: CredentialsSectionProps) {
  const [credentials, setCredentials] = useState<CredentialData[]>(initialCredentials);
  const [credFormOpen, setCredFormOpen] = useState(false);
  const [credSaving, setCredSaving] = useState(false);
  const [editingCred, setEditingCred] = useState<string | null>(null);
  const [credForm, setCredForm] = useState({
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
  });

  const config = useMemo(() => getFieldConfig(credForm.type, credForm.subType), [credForm.type, credForm.subType]);

  function closeCredForm() {
    setCredFormOpen(false);
    setEditingCred(null);
    setCredForm({
      type: "qualification", subType: "", title: "", description: "", documentNumber: "",
      issuedBy: "", issuedAt: "", expiresAt: "", fileUrl: "", backFileUrl: "", isPublic: false,
    });
  }

  function handleTypeChange(type: string) {
    const newConfig = getFieldConfig(type, "");
    setCredForm((prev) => ({
      ...prev,
      type,
      subType: type === "identification" ? "drivers_licence" : "",
      title: type === "wwcc" ? "Working With Children Check" : type === "criminal_history" ? "National Police Check" : newConfig.titlePlaceholder,
      isPublic: newConfig.forcePrivate ? false : prev.isPublic,
    }));
  }

  function handleSubTypeChange(subType: string) {
    const newConfig = getFieldConfig("identification", subType);
    setCredForm((prev) => ({
      ...prev,
      subType,
      title: subType === "drivers_licence" ? "Driver's Licence" : subType === "passport" ? "Passport" : subType === "photo_id" ? "Photo ID Card" : subType === "proof_of_age" ? "Proof of Age Card" : subType === "medicare" ? "Medicare Card" : "Identification",
      isPublic: newConfig.forcePrivate ? false : prev.isPublic,
    }));
  }

  async function saveCredential(e: React.FormEvent) {
    e.preventDefault();
    setCredSaving(true);
    const payload = {
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
    const res = await fetch(editingCred ? `/api/v1/credentials/${editingCred}` : "/api/v1/credentials", {
      method: editingCred ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      closeCredForm();
      const credsRes = await fetch("/api/v1/credentials");
      if (credsRes.ok) {
        const data = await credsRes.json();
        setCredentials(data.credentials || []);
        onUpdate(data.credentials || []);
      }
    }
    setCredSaving(false);
  }

  async function deleteCredential(id: string) {
    if (!confirm("Delete this credential? This cannot be undone.")) return;
    const res = await fetch(`/api/v1/credentials/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCredentials((prev) => prev.filter((c) => c.id !== id));
      onUpdate(credentials.filter((c) => c.id !== id));
    }
  }

  async function toggleVisibility(id: string, current: boolean) {
    const res = await fetch(`/api/v1/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !current }),
    });
    if (res.ok) {
      setCredentials((prev) => prev.map((c) => (c.id === id ? { ...c, isPublic: !current } : c)));
    }
  }

  function startEdit(cred: CredentialData) {
    setEditingCred(cred.id);
    setCredForm({
      type: cred.type,
      subType: cred.subType || "",
      title: cred.title,
      description: cred.description || "",
      documentNumber: cred.documentNumber || "",
      issuedBy: cred.issuedBy || "",
      issuedAt: cred.issuedAt ? cred.issuedAt.split("T")[0] : "",
      expiresAt: cred.expiresAt ? cred.expiresAt.split("T")[0] : "",
      fileUrl: cred.fileUrl || "",
      backFileUrl: cred.backFileUrl || "",
      isPublic: cred.isPublic,
    });
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
            <p>Upload a government-issued ID (driver&apos;s licence, passport, etc.) as an <strong>&ldquo;identification&rdquo;</strong> type credential. Our team reviews and approves it within 24 hours. Once approved, your profile is verified and you can claim <strong>free Pro</strong> for life.</p>
            <p>You can also add qualifications, licenses, certifications, WWCC, police checks, and insurance to build extra trust.</p>
          </div>
        </div>
      </div>

      {credFormOpen && (
        <div className="vessel p-6 mb-8">
          <p className="text-xs text-[#f5a623] mb-4">{editingCred ? "Edit Credential" : "Add Credential"}</p>
          <form onSubmit={saveCredential} className="space-y-4 max-w-lg">
            {/* Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={credForm.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-sm px-3 py-2 outline-none focus:border-[#f5a623] rounded"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
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
                    <option key={t.value} value={t.value}>{t.label}</option>
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
                  <Input type="date" value={credForm.issuedAt} onChange={(e) => setCredForm({ ...credForm, issuedAt: e.target.value })} />
                </div>
              )}
              {config.showExpiresAt && (
                <div className="space-y-2">
                  <Label>{config.expiresLabel}</Label>
                  <Input type="date" value={credForm.expiresAt} onChange={(e) => setCredForm({ ...credForm, expiresAt: e.target.value })} />
                </div>
              )}
            </div>

            {/* File Upload(s) */}
            <div className="space-y-2">
              <Label>Document File {config.fileRequired && <span className="text-[#ff5252]">*</span>}</Label>
              <FileUpload folder="credentials" onUpload={(url) => setCredForm({ ...credForm, fileUrl: url })}>
                {credForm.fileUrl ? "Change File" : config.showBackFile ? "Upload Front" : "Upload File"}
              </FileUpload>
              {credForm.fileUrl && <p className="text-xs text-[#7a6b5a] truncate">{credForm.fileUrl}</p>}
            </div>

            {config.showBackFile && (
              <div className="space-y-2">
                <Label>Back of Document</Label>
                <FileUpload folder="credentials" onUpload={(url) => setCredForm({ ...credForm, backFileUrl: url })}>
                  {credForm.backFileUrl ? "Change File" : "Upload Back"}
                </FileUpload>
                {credForm.backFileUrl && <p className="text-xs text-[#7a6b5a] truncate">{credForm.backFileUrl}</p>}
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
                <Label htmlFor="isPublic" className="cursor-pointer">Public (visible on profile)</Label>
              </div>
            )}
            {config.forcePrivate && (
              <p className="text-xs text-[#7a6b5a]">
                This credential type is always kept private for your security.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={credSaving}>{credSaving ? "Saving..." : "Save"}</Button>
              <Button type="button" variant="ghost" onClick={closeCredForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {credentials.length === 0 ? (
        <div className="py-24 text-center vessel">
          <ShieldCheck className="h-8 w-8 text-[#7a6b5a] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#b8a078] mb-2">No Credentials Yet</p>
          <p className="text-xs text-[#7a6b5a] max-w-sm mx-auto">Add your ID to get verified. Qualifications, licenses, WWCC, police checks, and insurance also help you get selected for needs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {credentials.map((cred) => (
            <div key={cred.id} className="vessel p-5 hover:bg-[#1a1714] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-medium text-[#e8d5a3]">{cred.title}</p>
                    <Badge variant="outline">
                      {cred.type === "wwcc" ? "WWCC" : cred.type === "criminal_history" ? "Police Check" : cred.subType ? ID_SUBTYPES.find(s => s.value === cred.subType)?.label || cred.subType : cred.type}
                    </Badge>
                    {cred.isVerified && (
                      <Badge variant="quintessence">Verified</Badge>
                    )}
                    {!cred.isPublic && <EyeOff className="h-3.5 w-3.5 text-[#7a6b5a]" />}
                    {cred.isPublic && <Eye className="h-3.5 w-3.5 text-[#00e5ff]" />}
                  </div>
                  <div className="text-xs text-[#b8a078] mt-2 space-y-1">
                    {cred.documentNumber && <p>Number: {"*".repeat(Math.max(0, cred.documentNumber.length - 4))}{cred.documentNumber.slice(-4)}</p>}
                    {cred.issuedBy && <p>Issued by: {cred.issuedBy}</p>}
                    {cred.issuedAt && <p>Issued: {new Date(cred.issuedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>}
                    {cred.expiresAt && <p>Expires: {new Date(cred.expiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>}
                    {cred.description && <p className="text-[#7a6b5a]">{cred.description}</p>}
                    {cred.fileUrl && (
                      <a href={cred.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#f5a623] hover:underline inline-flex items-center gap-1">
                        <FileCheck className="h-3 w-3" /> View Document
                      </a>
                    )}
                    {cred.backFileUrl && (
                      <a href={cred.backFileUrl} target="_blank" rel="noopener noreferrer" className="text-[#f5a623] hover:underline inline-flex items-center gap-1 ml-3">
                        <FileCheck className="h-3 w-3" /> View Back
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button size="sm" variant="ghost" onClick={() => toggleVisibility(cred.id, cred.isPublic)} title={cred.isPublic ? "Make private" : "Make public"}>
                    {cred.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(cred)} title="Edit"><span className="text-xs">Edit</span></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteCredential(cred.id)} title="Delete"><Trash2 className="h-4 w-4 text-[#ff5252]" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
