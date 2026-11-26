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
export const meshProductCategories = [
  "node",
  "kit",
  "gateway",
  "board",
  "antenna",
  "power",
  "enclosure",
  "accessory",
] as const;
export const meshProductStockStatuses = ["in_stock", "made_to_order", "out_of_stock"] as const;
export const meshPaymentTerms = [
  "bank_transfer",
  "payid",
  "cash_on_pickup",
  "card_checkout",
] as const;

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

export const createMeshProductSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    category: z.enum(meshProductCategories),
    description: z.string().trim().min(20).max(1500),
    specs: optionalTrimmed(1000),
    // Dollars in the form, cents at the API boundary; null = price on application
    priceAud: z.number().min(0).max(100_000).nullable().optional(),
    stockStatus: z.enum(meshProductStockStatuses).default("in_stock"),
    buyUrl: optionalTrimmed(500),
    // Delivery: postage and/or local pickup — at least one is required
    offerPostage: z.boolean().default(false),
    // Flat postage in dollars: 0 = free postage, null = worked out in chat
    postageAud: z.number().min(0).max(1_000).nullable().optional(),
    localPickup: z.boolean().default(false),
    postageNote: optionalTrimmed(300),
    paymentTerms: z.array(z.enum(meshPaymentTerms)).min(1).max(4),
    paymentNote: optionalTrimmed(300),
    // Optional seller-defined chips: "7-day battery", "5 km range", …
    highlights: z.array(z.string().trim().min(1).max(40)).max(6).default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.offerPostage && !value.localPickup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Offer postage, local pickup, or both — buyers need a way to receive it",
      });
    }
    if (!value.offerPostage && value.postageAud != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A postage cost only makes sense when postage is offered",
      });
    }
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
  offerPostage: z.boolean().optional(),
  postageAud: z.number().min(0).max(1_000).nullable().optional(),
  localPickup: z.boolean().optional(),
  postageNote: z.string().trim().max(300).nullable().optional(),
  paymentTerms: z.array(z.enum(meshPaymentTerms)).min(1).max(4).optional(),
  paymentNote: z.string().trim().max(300).nullable().optional(),
  highlights: z.array(z.string().trim().min(1).max(40)).max(6).optional(),
});

export const reviewMeshBuilderSchema = z
  .object({
    status: z.enum(["approved", "rejected", "suspended"]).optional(),
    reviewNote: optionalTrimmed(1000),
    // Pilot: admin grants extra product slots by hand; later the rental
    // purchase flow increments this automatically.
    extraSlots: z.number().int().min(0).max(60).optional(),
  })
  .refine((value) => value.status !== undefined || value.extraSlots !== undefined, {
    message: "Nothing to update",
  });

export type MeshBuilderStatus = (typeof meshBuilderStatuses)[number];
export type MeshProductCategory = (typeof meshProductCategories)[number];
export type MeshPaymentTerm = (typeof meshPaymentTerms)[number];
export type ApplyMeshBuilderInput = z.infer<typeof applyMeshBuilderSchema>;
export type CreateMeshProductInput = z.infer<typeof createMeshProductSchema>;
export type UpdateMeshProductInput = z.infer<typeof updateMeshProductSchema>;
export type ReviewMeshBuilderInput = z.infer<typeof reviewMeshBuilderSchema>;

// ─── First-party orders: members buy Antidosis-stocked items on-site ───

export const meshOrderStatuses = [
  "placed",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const createMeshOrderSchema = z.object({
  productId: z.string().uuid(),
  // The name/callsign flashed onto the device before dispatch
  meshName: z.string().trim().min(2).max(40),
  deliveryName: z.string().trim().min(2).max(120),
  deliveryAddress: z.string().trim().min(10).max(500),
  buyerNote: optionalTrimmed(500),
});

export const updateMeshOrderSchema = z.object({
  status: z.enum(meshOrderStatuses),
  adminNote: optionalTrimmed(1000),
});

export type MeshOrderStatus = (typeof meshOrderStatuses)[number];
export type CreateMeshOrderInput = z.infer<typeof createMeshOrderSchema>;
export type UpdateMeshOrderInput = z.infer<typeof updateMeshOrderSchema>;

// ─── Mesh identities: cryptographic device keys bound to member accounts ───

export const meshIdentityTypes = ["meshcore_ed25519"] as const;
export const meshIdentityStatuses = ["active", "revoked"] as const;

export const bindMeshIdentitySchema = z.object({
  // The first-party order the device was flashed for — buyer and mesh name
  // are derived from it, so the binding always matches a real fulfilment.
  orderId: z.string().uuid(),
  // Ed25519 public key as printed by the flasher: 64 hex chars
  publicKey: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[0-9a-f]{64}$/, "A device public key is 64 hex characters"),
});

export const updateMeshIdentitySchema = z.object({
  status: z.enum(meshIdentityStatuses),
});

export type BindMeshIdentityInput = z.infer<typeof bindMeshIdentitySchema>;
export type UpdateMeshIdentityInput = z.infer<typeof updateMeshIdentitySchema>;
