import { z } from "zod";

// ─── Mesh store: buyer interest (email-only, no account needed) ───

export const meshInterestKinds = ["node", "byo_device", "updates"] as const;
export const meshInterestStatuses = ["new", "contacted", "closed"] as const;

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const createMeshInterestSchema = z.object({
  kind: z.enum(meshInterestKinds),
  email: z.string().trim().toLowerCase().email().max(254),
  name: optionalTrimmed(120),
  suburb: optionalTrimmed(120),
  deviceModel: optionalTrimmed(120),
  message: optionalTrimmed(2000),
  // Honeypot: real users never see or fill this field. Anything here means bot.
  company: z.string().max(0).optional(),
});

export const updateMeshInterestSchema = z.object({
  status: z.enum(meshInterestStatuses),
});

export type MeshInterestKind = (typeof meshInterestKinds)[number];
export type CreateMeshInterestInput = z.infer<typeof createMeshInterestSchema>;
export type UpdateMeshInterestInput = z.infer<typeof updateMeshInterestSchema>;

// ─── Mesh builders: account-bound applications and product listings ───

export const meshBuilderStatuses = ["pending", "approved", "rejected", "suspended"] as const;
export const meshProductCategories = ["node", "kit", "gateway", "accessory"] as const;
export const meshProductStockStatuses = ["in_stock", "made_to_order", "out_of_stock"] as const;

export const applyMeshBuilderSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  suburb: optionalTrimmed(120),
  website: optionalTrimmed(500),
  description: z.string().trim().min(40).max(2000),
});

export const updateMeshBuilderSchema = z.object({
  businessName: z.string().trim().min(2).max(160).optional(),
  // null (or empty string) clears the field
  suburb: z.string().trim().max(120).nullable().optional(),
  website: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().min(40).max(2000).optional(),
});

export const createMeshProductSchema = z.object({
  name: z.string().trim().min(3).max(120),
  category: z.enum(meshProductCategories),
  description: z.string().trim().min(20).max(1500),
  specs: optionalTrimmed(1000),
  // Dollars in the form, cents at the API boundary; null = price on application
  priceAud: z.number().min(0).max(100_000).nullable().optional(),
  stockStatus: z.enum(meshProductStockStatuses).default("in_stock"),
  buyUrl: optionalTrimmed(500),
});

export const updateMeshProductSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  category: z.enum(meshProductCategories).optional(),
  description: z.string().trim().min(20).max(1500).optional(),
  // null clears the field
  specs: z.string().trim().max(1000).nullable().optional(),
  priceAud: z.number().min(0).max(100_000).nullable().optional(),
  stockStatus: z.enum(meshProductStockStatuses).optional(),
  buyUrl: z.string().trim().max(500).nullable().optional(),
});

export const reviewMeshBuilderSchema = z.object({
  status: z.enum(["approved", "rejected", "suspended"]),
  reviewNote: optionalTrimmed(1000),
});

export type MeshBuilderStatus = (typeof meshBuilderStatuses)[number];
export type MeshProductCategory = (typeof meshProductCategories)[number];
export type ApplyMeshBuilderInput = z.infer<typeof applyMeshBuilderSchema>;
export type CreateMeshProductInput = z.infer<typeof createMeshProductSchema>;
export type UpdateMeshProductInput = z.infer<typeof updateMeshProductSchema>;
export type ReviewMeshBuilderInput = z.infer<typeof reviewMeshBuilderSchema>;
