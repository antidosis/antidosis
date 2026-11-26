import { z } from "zod";

import { EXCHANGE_MODE_VALUES } from "@/lib/categories";

import { offerTypeSchema, uuidSchema } from "./common";

export const postedAsSchema = z.enum(["personal", "business"]);

const needCategoryEnum = z
  .enum(["", ...EXCHANGE_MODE_VALUES] as [string, ...string[]])
  .optional()
  .nullable();

const offerValueField = z.preprocess(
  // Empty number inputs arrive as NaN via RHF's valueAsNumber — treat as unset
  (v) => (typeof v === "number" && Number.isNaN(v) ? undefined : v),
  z.number().min(0).optional().nullable()
);

export const createNeedSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must be under 200 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(5000, "Description must be under 5000 characters"),
    needCategory: needCategoryEnum,
    offerType: offerTypeSchema,
    offerDescription: z
      .string()
      .min(3, "Offer description must be at least 3 characters")
      .max(2000, "Offer description must be under 2000 characters"),
    offerValue: offerValueField,
    isLocal: z.boolean().default(true),
    locationName: z.string().optional().nullable(),
    destinationName: z.string().trim().max(120).optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    urgency: z.number().int().min(0).max(9).default(0),
    allowUrgentContact: z.boolean().optional().default(false),
    deadline: z.string().optional().nullable(),
    timeRange: z
      .string()
      .max(100, "Time estimate must be under 100 characters")
      .optional()
      .nullable(),
    requiredSkills: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    offerImages: z.array(z.string()).default([]),
    requiresContract: z.boolean().optional().default(false),
    // Identity the need is posted under. "business" is verified server-side
    // against the member's directory listing — the schema only carries intent.
    postedAs: postedAsSchema.optional().default("personal"),
  })
  .superRefine((data, ctx) => {
    if (data.allowUrgentContact && data.urgency < 7) {
      ctx.addIssue({
        code: "custom",
        path: ["allowUrgentContact"],
        message: "Direct contact is available only for urgency 7 or higher",
      });
    }
    if (data.needCategory === "rideshare" && !data.destinationName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["destinationName"],
        message: "Add a destination for a rideshare request",
      });
    }
  });

export type CreateNeedInput = z.input<typeof createNeedSchema>;

export const updateNeedSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be under 200 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be under 5000 characters")
    .optional(),
  needCategory: needCategoryEnum,
  offerType: offerTypeSchema.optional(),
  offerDescription: z
    .string()
    .min(3, "Offer description must be at least 3 characters")
    .max(2000, "Offer description must be under 2000 characters")
    .optional(),
  offerValue: offerValueField,
  isLocal: z.boolean().optional(),
  locationName: z.string().optional().nullable(),
  destinationName: z.string().trim().max(120).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  urgency: z.number().int().min(0).max(9).optional(),
  allowUrgentContact: z.boolean().optional(),
  deadline: z.string().optional().nullable(),
  timeRange: z
    .string()
    .max(100, "Time estimate must be under 100 characters")
    .optional()
    .nullable(),
  requiredSkills: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  offerImages: z.array(z.string()).optional(),
  requiresContract: z.boolean().optional(),
  // Switchable only while the need has no acceptances (enforced in the route);
  // the business snapshot is re-taken on every switch.
  postedAs: postedAsSchema.optional(),
  status: z.enum(["open", "archived"]).optional(),
});

export type UpdateNeedInput = z.input<typeof updateNeedSchema>;

export const postNeedMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  acceptanceId: z.string().optional(),
});

export type PostNeedMessageInput = z.infer<typeof postNeedMessageSchema>;

export const needIdParamSchema = z.object({
  id: uuidSchema,
});
