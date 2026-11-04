import type { z } from "zod";

import type { updateProfileSchema } from "@/lib/schemas";

export type ProfileFormData = z.input<typeof updateProfileSchema>;

/** Profile shape the editor needs from `/api/v1/profiles/me`. */
export interface EditorProfile {
  id: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  publicPhone: string | null;
  privatePhone: string | null;
  mobile: string | null;
  abn: string | null;
  handle: string | null;
  showInDirectory: boolean;
  mobileVerified: boolean;
  isVerified: boolean;
  socialLinks: { id: string; platform: string; url: string; isPublic: boolean }[];
}
