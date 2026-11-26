import type { z } from "zod";

import type { updateProfileSchema } from "@/lib/schemas";

export type ProfileFormData = z.input<typeof updateProfileSchema>;
export type ProfileTab = "public" | "directory" | "trust";

/** Profile shape the editor needs from `/api/v1/profiles/me`. */
export interface EditorProfile {
  id: string;
  fullName: string | null;
  bio: string | null;
  /** Business-facing description for the directory listing only. */
  directoryBio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  publicPhone: string | null;
  privatePhone: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  mobile: string | null;
  abn: string | null;
  accountType: "individual" | "business";
  abnVerified: boolean;
  audienceSize: number | null;
  handle: string | null;
  showInDirectory: boolean;
  mobileVerified: boolean;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  skills: { id: string; name: string; isVerified: boolean }[];
  socialLinks: { id: string; platform: string; url: string; isPublic: boolean }[];
  /** Business web presence — independent from personal socialLinks.
   *  Raw rows may carry the stored JSON string; always normalise via toFormValues. */
  businessSocialLinks?: { platform: string; url: string; isPublic?: boolean }[] | string | null;
}
