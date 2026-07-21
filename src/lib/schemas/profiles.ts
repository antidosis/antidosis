import { z } from "zod";

import { coordinatesSchema, optionalUrlSchema } from "./common";

export const socialLinkSchema = z.object({
  platform: z.string().min(1),
  url: z.string().min(1).max(500),
  isPublic: z.boolean().optional(),
});

export const createProfileSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).optional(),
  mobile: z.string().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().max(100).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  avatarUrl: optionalUrlSchema,
  locationName: z.string().max(200).optional().nullable(),
  ...coordinatesSchema.shape,
  showInDirectory: z.boolean().optional().nullable(),
  publicPhone: z.string().max(50).optional().nullable(),
  privatePhone: z.string().max(50).optional().nullable(),
  mobile: z.string().max(20).optional().nullable(),
  abn: z
    .string()
    .max(20)
    .regex(/^[\d ]*$/, "ABN must contain only digits and spaces")
    .optional()
    .nullable(),
  socialLinks: z.array(socialLinkSchema).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
