import { z } from "zod";

import { coordinatesSchema, optionalUrlSchema } from "./common";

/**
 * http(s) URL check shared by the web schema and the mobile app's mirror
 * validation — keep the two implementations in sync.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const socialLinkSchema = z.object({
  // Client-side row identity only — the server recreates links on PATCH and
  // ignores this field. Lets the web editor track removals by stable id.
  id: z.string().optional(),
  platform: z.string().min(1),
  url: z.string().min(1).max(500).refine(isHttpUrl, "Link must be a valid http(s) URL"),
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

/** Permanent unique @handle: 3–20 chars, starts with a letter, then lowercase letters/digits/underscores. */
export const HANDLE_FORMAT_RE = /^[a-z][a-z0-9_]{2,19}$/;

export const claimHandleSchema = z.object({
  handle: z
    .string()
    .min(3, "Handle must be between 3 and 20 characters")
    .max(20, "Handle must be between 3 and 20 characters")
    .transform((value) => value.toLowerCase())
    .pipe(
      z
        .string()
        .regex(
          HANDLE_FORMAT_RE,
          "Handle must start with a letter and contain only letters, digits, and underscores"
        )
    ),
});

export type ClaimHandleInput = z.infer<typeof claimHandleSchema>;
