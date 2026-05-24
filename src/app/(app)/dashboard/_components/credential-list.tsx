"use client";

import { Eye, EyeOff, Trash2, FileCheck, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  if (credentials.length === 0) {
    return (
      <div className="py-24 text-center vessel">
        <ShieldCheck className="h-8 w-8 text-[#7a6b5a] mx-auto mb-3" />
        <p className="text-sm font-medium text-[#b8a078] mb-2">No Credentials Yet</p>
        <p className="text-xs text-[#7a6b5a] max-w-sm mx-auto">
          Add your ID to get verified. Qualifications, licenses, WWCC, police checks, and insurance
          also help you get selected for needs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {credentials.map((cred) => (
        <div key={cred.id} className="vessel p-5 hover:bg-[#1a1714] transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-medium text-[#e8d5a3]">{cred.title}</p>
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
                {!cred.isPublic && <EyeOff className="h-3.5 w-3.5 text-[#7a6b5a]" />}
                {cred.isPublic && <Eye className="h-3.5 w-3.5 text-[#00e5ff]" />}
              </div>
              <div className="text-xs text-[#b8a078] mt-2 space-y-1">
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
                {cred.description && <p className="text-[#7a6b5a]">{cred.description}</p>}
                {cred.fileUrl && (
                  <a
                    href={cred.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f5a623] hover:underline inline-flex items-center gap-1"
                  >
                    <FileCheck className="h-3 w-3" /> View Document
                  </a>
                )}
                {cred.backFileUrl && (
                  <a
                    href={cred.backFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f5a623] hover:underline inline-flex items-center gap-1 ml-3"
                  >
                    <FileCheck className="h-3 w-3" /> View Back
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleVisibility(cred.id, cred.isPublic)}
                title={cred.isPublic ? "Make private" : "Make public"}
              >
                {cred.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onEdit(cred)} title="Edit">
                <span className="text-xs">Edit</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(cred.id)} title="Delete">
                <Trash2 className="h-4 w-4 text-[#ff5252]" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
