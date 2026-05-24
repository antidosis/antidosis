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
