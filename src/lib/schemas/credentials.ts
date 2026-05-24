import { z } from "zod";

export const credentialTypes = [
  "license",
  "qualification",
  "certification",
  "ticket",
  "resume",
  "identification",
  "insurance",
  "wwcc",
  "criminal_history",
  "business_registration",
  "other",
] as const;

export const createCredentialSchema = z.object({
  type: z.enum(credentialTypes),
  subType: z.string().max(100).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  documentNumber: z.string().max(100).optional(),
  issuedBy: z.string().max(200).optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  fileUrl: z.string().max(500).optional(),
  backFileUrl: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;

export const updateCredentialSchema = z.object({
  type: z.enum(credentialTypes).optional(),
  subType: z.string().max(100).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  documentNumber: z.string().max(100).optional(),
  issuedBy: z.string().max(200).optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  fileUrl: z.string().max(500).optional(),
  backFileUrl: z.string().max(500).optional(),
});

export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;
