import { z } from "zod";

export const signContractSchema = z.object({
  signature: z.string().min(2).max(200),
});

export type SignContractInput = z.infer<typeof signContractSchema>;

export const requestCancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type RequestCancelInput = z.infer<typeof requestCancelSchema>;

export const respondCancelSchema = z.object({
  accept: z.boolean(),
  response: z.string().max(500).optional(),
});

export type RespondCancelInput = z.infer<typeof respondCancelSchema>;

export const cancelContractSchema = z.object({
  cancelReason: z.string().max(500).optional(),
});

export type CancelContractInput = z.infer<typeof cancelContractSchema>;

export const patchContractSchema = z.object({
  terms: z.string().min(1).max(10000).optional(),
  agree: z.boolean().optional(),
  submitTerms: z.boolean().optional(),
  updatedAt: z.string().optional(),
  partyATerms: z.string().max(5000).optional(),
  partyBTerms: z.string().max(5000).optional(),
  partyAUseMessageTerms: z.boolean().optional(),
  partyBUseMessageTerms: z.boolean().optional(),
});

export type PatchContractInput = z.infer<typeof patchContractSchema>;

export const createDirectContractSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  terms: z.string().trim().min(3).max(5000),
  paymentAmount: z.number().finite().min(0).max(10_000_000).optional(),
  inviteEmail: z.string().trim().email().max(320).optional(),
});

export type CreateDirectContractInput = z.infer<typeof createDirectContractSchema>;
