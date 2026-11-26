"use client";

import { useState } from "react";

import { Check, Copy, Eye, EyeOff, Trash2, FileCheck, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatCredentialForMessage } from "@/lib/redaction";

export interface CredentialData {
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
  signedUrl?: string | null;
  signedBackUrl?: string | null;
  fileMissing?: boolean;
  backFileMissing?: boolean;
  isPublic: boolean;
  isVerified: boolean;
}

interface CredentialListProps {
  credentials: CredentialData[];
  idSubtypes: { value: string; label: string }[];
  onToggleVisibility: (id: string, current: boolean) => void;
  onEdit: (cred: CredentialData) => void;
  onDelete: (id: string) => void;
}

export function CredentialList({
  credentials,
  idSubtypes,
  onToggleVisibility,
  onEdit,
  onDelete,
}: CredentialListProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyRedactedSummary(cred: CredentialData) {
    const text = formatCredentialForMessage({
      title: cred.title,
      type: cred.type,
      documentNumber: cred.documentNumber,
      issuedBy: cred.issuedBy,
      expiresAt: cred.expiresAt ? new Date(cred.expiresAt) : null,
      isVerified: cred.isVerified,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(cred.id);
      setTimeout(() => setCopiedId((current) => (current === cred.id ? null : current)), 2000);
      toast("Redacted summary copied — paste it into a message", "success");
    } catch {
      toast("Couldn't copy — select the text manually from the document view", "error");
    }
  }
  if (credentials.length === 0) {
    return (
      <div className="py-24 text-center vessel">
        <ShieldCheck className="h-8 w-8 text-ash mx-auto mb-3" />
        <p className="text-sm font-medium text-parchment mb-2">No Credentials Yet</p>
        <p className="text-xs text-ash max-w-sm mx-auto">
          Add your ID to get verified. Qualifications, licenses, WWCC, police checks, and insurance
          also help you get selected for needs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {credentials.map((cred) => (
        <div key={cred.id} className="vessel p-5 hover:bg-raise transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-medium text-gold">{cred.title}</p>
                <Badge variant="outline">
                  {cred.type === "wwcc"
                    ? "WWCC"
                    : cred.type === "criminal_history"
                      ? "Police Check"
                      : cred.subType
                        ? idSubtypes.find((s) => s.value === cred.subType)?.label || cred.subType
                        : cred.type}
                </Badge>
                {cred.isVerified && <Badge variant="quintessence">Verified</Badge>}
              </div>
              <div className="text-xs text-parchment mt-2 space-y-1">
                {cred.documentNumber && (
                  <p>
                    {"*".repeat(Math.max(0, cred.documentNumber.length - 4))}
                    {cred.documentNumber.slice(-4)}
                  </p>
                )}
                {cred.issuedBy && <p>Issued by: {cred.issuedBy}</p>}
                {cred.issuedAt && (
                  <p>
                    Issued:{" "}
                    {new Date(cred.issuedAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
                {cred.expiresAt && (
                  <p>
                    Expires:{" "}
                    {new Date(cred.expiresAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
                {cred.description && <p className="text-ash">{cred.description}</p>}
                {cred.fileUrl &&
                  (cred.fileMissing ? (
                    <p className="inline-flex items-center gap-1 text-bad">
                      <FileCheck className="h-3 w-3" /> Document file unavailable — re-upload it via
                      Edit
                    </p>
                  ) : cred.signedUrl ? (
                    <a
                      href={cred.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sun hover:underline inline-flex items-center gap-1"
                    >
                      <FileCheck className="h-3 w-3" /> View Document
                    </a>
                  ) : null)}
                {cred.backFileUrl &&
                  (cred.backFileMissing ? (
                    <p className="ml-3 inline-flex items-center gap-1 text-bad">
                      <FileCheck className="h-3 w-3" /> Back of document unavailable — re-upload via
                      Edit
                    </p>
                  ) : cred.signedBackUrl ? (
                    <a
                      href={cred.signedBackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sun hover:underline inline-flex items-center gap-1 ml-3"
                    >
                      <FileCheck className="h-3 w-3" /> View Back
                    </a>
                  ) : null)}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyRedactedSummary(cred)}
                title="Copy a redacted text summary to share in messages — the document file stays private"
              >
                {copiedId === cred.id ? (
                  <Check className="mr-1.5 h-4 w-4 text-ok" />
                ) : (
                  <Copy className="mr-1.5 h-4 w-4" />
                )}
                {copiedId === cred.id ? "Copied" : "Share redacted"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleVisibility(cred.id, cred.isPublic)}
                title={
                  cred.isPublic
                    ? "Shown on your public profile as a redacted badge — click to hide"
                    : "Private — click to show a redacted badge on your public profile"
                }
              >
                {cred.isPublic ? (
                  <Eye className="h-4 w-4 text-mercury" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                <span className="ml-1.5 text-xs">{cred.isPublic ? "Public" : "Private"}</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onEdit(cred)} title="Edit">
                <span className="text-xs">Edit</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(cred.id)} title="Delete">
                <Trash2 className="h-4 w-4 text-bad" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
