import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const urlSchema = z.string().url().max(500);

export const optionalUrlSchema = z.string().max(500).optional().nullable();

export const sanitizedStringSchema = (max: number) => z.string().min(1).max(max);

export const optionalSanitizedStringSchema = (max: number) =>
  z.string().max(max).optional().nullable();

export const coordinatesSchema = z.object({
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const attachmentSchema = z.object({
  url: z.string(),
  type: z.string(),
  name: z.string(),
});

export const offerTypeSchema = z.enum(["service", "item", "money"]);

export const needStatusSchema = z.enum(["open", "archived"]);

export const contractStatusSchema = z.enum([
  "draft",
  "pending_terms",
  "active",
  "completed",
  "cancelled",
]);
