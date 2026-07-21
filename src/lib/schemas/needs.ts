import { z } from "zod";

import { EXCHANGE_MODE_VALUES } from "@/lib/categories";

import { offerTypeSchema, uuidSchema } from "./common";

const needCategoryEnum = z
  .enum(["", ...EXCHANGE_MODE_VALUES] as [string, ...string[]])
  .optional()
  .nullable();

export const createNeedSchema = z.object({
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
  offerValue: z.number().min(0).optional().nullable(),
  isLocal: z.boolean().default(true),
  locationName: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
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
  offerValue: z.number().min(0).optional().nullable(),
  isLocal: z.boolean().optional(),
  locationName: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
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
