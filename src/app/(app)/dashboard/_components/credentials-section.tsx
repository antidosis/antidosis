"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Plus, X, Eye, EyeOff, Trash2, FileCheck } from "lucide-react";

type CredentialData = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  documentNumber: string | null;
  issuedBy: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  isPublic: boolean;
  isVerified: boolean;
};

interface CredentialsSectionProps {
  initialCredentials: CredentialData[];
  onUpdate: (creds: CredentialData[]) => void;
}

export function CredentialsSection({ initialCredentials, onUpdate }: CredentialsSectionProps) {
  const [credentials, setCredentials] = useState<CredentialData[]>(initialCredentials);
  const [credFormOpen, setCredFormOpen] = useState(false);
  const [credSaving, setCredSaving] = useState(false);
  const [editingCred, setEditingCred] = useState<string | null>(null);
  const [credForm, setCredForm] = useState({
    type: "qualification",
    title: "",
    description: "",
    documentNumber: "",
    issuedBy: "",
    issuedAt: "",
    expiresAt: "",
    fileUrl: "",
    isPublic: false,
  });

  function closeCredForm() {
    setCredFormOpen(false);
    setEditingCred(null);
    setCredForm({
      type: "qualification", title: "", description: "", documentNumber: "",
      issuedBy: "", issuedAt: "", expiresAt: "", fileUrl: "", isPublic: false,
    });
  }

  async function saveCredential(e: React.FormEvent) {
    e.preventDefault();
    setCredSaving(true);
    const payload = {
      type: credForm.type,
      title: credForm.title,
      description: credForm.description || undefined,
      documentNumber: credForm.documentNumber || undefined,
      issuedBy: credForm.issuedBy || undefined,
      issuedAt: credForm.issuedAt || undefined,
      expiresAt: credForm.expiresAt || undefined,
      fileUrl: credForm.fileUrl || undefined,
      isPublic: credForm.isPublic,
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
      title: cred.title,
      description: cred.description || "",
      documentNumber: cred.documentNumber || "",
      issuedBy: cred.issuedBy || "",
      issuedAt: cred.issuedAt ? cred.issuedAt.split("T")[0] : "",
      expiresAt: cred.expiresAt ? cred.expiresAt.split("T")[0] : "",
      fileUrl: cred.fileUrl || "",
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

      {credFormOpen && (
        <div className="vessel p-6 mb-8">
          <p className="text-xs text-[#f5a623] mb-4">{editingCred ? "Edit Credential" : "Add Credential"}</p>
          <form onSubmit={saveCredential} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>Type</Label>
              <select value={credForm.type} onChange={(e) => setCredForm({ ...credForm, type: e.target.value })} className="w-full bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-sm px-3 py-2 outline-none focus:border-[#f5a623] rounded">
                {["qualification", "license", "certification", "ticket", "resume", "identification", "insurance", "business_registration", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Title</Label><Input value={credForm.title} onChange={(e) => setCredForm({ ...credForm, title: e.target.value })} placeholder="e.g. White Card, First Aid Certificate" required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={credForm.description} onChange={(e) => setCredForm({ ...credForm, description: e.target.value })} placeholder="Additional details..." rows={2} /></div>
            <div className="space-y-2"><Label>Document Number</Label><Input value={credForm.documentNumber} onChange={(e) => setCredForm({ ...credForm, documentNumber: e.target.value })} placeholder="Will be auto-redacted (last 4 shown)" /></div>
            <div className="space-y-2"><Label>Issued By</Label><Input value={credForm.issuedBy} onChange={(e) => setCredForm({ ...credForm, issuedBy: e.target.value })} placeholder="Issuing organisation" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Issued At</Label><Input type="date" value={credForm.issuedAt} onChange={(e) => setCredForm({ ...credForm, issuedAt: e.target.value })} /></div>
              <div className="space-y-2"><Label>Expires At</Label><Input type="date" value={credForm.expiresAt} onChange={(e) => setCredForm({ ...credForm, expiresAt: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Document File</Label>
              <FileUpload folder="credentials" onUpload={(url) => setCredForm({ ...credForm, fileUrl: url })}>{credForm.fileUrl ? "Change File" : "Upload File"}</FileUpload>
              {credForm.fileUrl && <p className="text-xs text-[#7a6b5a] truncate">{credForm.fileUrl}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPublic" checked={credForm.isPublic} onChange={(e) => setCredForm({ ...credForm, isPublic: e.target.checked })} className="accent-[#f5a623]" />
              <Label htmlFor="isPublic" className="cursor-pointer">Public (visible on profile)</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={credSaving}>{credSaving ? "Saving..." : "Save"}</Button>
              <Button type="button" variant="ghost" onClick={closeCredForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {credentials.length === 0 ? (
        <div className="py-24 text-center vessel">
          <p className="text-sm font-medium text-[#b8a078] mb-2">No Credentials Yet</p>
          <p className="text-xs text-[#7a6b5a]">Add qualifications, licenses, tickets, insurance, or resumes to build trust.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {credentials.map((cred) => (
            <div key={cred.id} className="vessel p-5 hover:bg-[#1a1714] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-medium text-[#e8d5a3]">{cred.title}</p>
                    <Badge variant="outline">{cred.type}</Badge>
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
