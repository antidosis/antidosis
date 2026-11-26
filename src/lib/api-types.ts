/**
 * Structural types for the JSON shapes returned by the /api/v1 REST routes.
 *
 * These describe only the fields the client actually consumes — they are not
 * the Prisma models and not the full API responses. When a route adds a field
 * the UI reads, add it here so terminal handlers, pages, and tests share one
 * source of truth instead of `any`.
 */

/** Contract summary as returned by /api/v1/contracts/mine and /api/v1/contracts/[id]. */
export interface ApiContract {
  id: string;
  status:
    | "draft"
    | "pending_terms"
    | "pending_signatures"
    | "active"
    | "completed"
    | "cancelled"
    | "cancel_requested"
    | "disputed"
    | string;
  partyAId: string;
  partyBId: string;
  partyASigned: boolean;
  partyBSigned: boolean;
  aMarkedComplete: boolean;
  bMarkedComplete: boolean;
  termsLocked: boolean;
  need?: { id: string; title: string } | null;
  partyA?: { id: string; fullName: string | null } | null;
  partyB?: { id: string; fullName: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string | null;
}

/** Need summary as returned by /api/v1/needs and /api/v1/needs/mine. */
export interface ApiNeed {
  id: string;
  title: string;
  description?: string;
  status: string;
  offerType?: string;
  exchangeMode?: string;
  needCategory?: string | null;
  offerDescription?: string | null;
  offerValue?: string | null;
  deadline?: string | null;
  timeRange?: string | null;
  requiresContract?: boolean;
  locationName?: string | null;
  urgency?: number;
  createdAt?: string;
  posterId?: string;
  poster?: { id: string; fullName: string | null } | null;
  _count?: { acceptances?: number };
  acceptances?: ApiAcceptance[];
}

/** Acceptance summary as returned by /api/v1/acceptances/mine. */
export interface ApiAcceptance {
  id: string;
  needId?: string;
  userId?: string;
  status: string;
  message?: string | null;
  user?: { id: string; fullName: string | null } | null;
  need?: { id: string; title: string } | null;
}

/** Notification item as returned by /api/v1/notifications. */
export interface ApiNotification {
  id: string;
  read: boolean;
  readAt?: string | null;
  title?: string;
  type?: string;
  message?: string | null;
  link?: string | null;
  createdAt?: string;
}

/** Activity feed item as returned by /api/v1/terminal/activity. */
export interface ApiActivityItem {
  id?: string;
  type: string;
  description: string;
  createdAt: string;
}

/** Compact user summary used by terminal user search and friends/blocks. */
export interface ApiUserSummary {
  id: string;
  fullName: string | null;
  locationName: string | null;
  avatarUrl?: string | null;
}

export interface ApiFriendEntry {
  id: string;
  user: ApiUserSummary;
}

export interface ApiBlockEntry {
  id: string;
  user: ApiUserSummary;
}

/** Directory/search pro summary (terminal rendering shape). */
export interface ApiProSummary {
  id: string;
  fullName: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  locationName: string | null;
  skills?: { name: string }[];
}

/* ─── Response envelopes ─────────────────────────────────────────────── */

export interface ApiNeedsResponse {
  needs: ApiNeed[];
  total?: number;
}

export interface ApiSearchResponse {
  needs?: ApiNeed[];
  users?: ApiUserSummary[];
  pros?: ApiProSummary[];
}

export interface ApiUsersSearchResponse {
  users?: ApiUserSummary[];
}

export interface ApiFriendsResponse {
  friends?: ApiFriendEntry[];
}

export interface ApiBlocksResponse {
  blocks?: ApiBlockEntry[];
}

export interface ApiNotificationsResponse {
  notifications?: ApiNotification[];
}

/** Credential item as returned by /api/v1/profiles/me/credentials. */
export interface ApiCredentialItem {
  id: string;
  type: string;
  title: string;
  isVerified: boolean;
  createdAt?: string;
}

export interface ApiSocialLink {
  platform: string;
  url: string;
  isPublic?: boolean;
}

/** The subset of the own-profile response the terminal mutates. */
export interface ApiMyProfile {
  socialLinks?: ApiSocialLink[];
  businessSocialLinks?: string | ApiSocialLink[] | null;
}

export interface ApiActivityResponse {
  items?: ApiActivityItem[];
}

/** Review item as returned by /api/v1/reviews. */
export interface ApiReview {
  id: string;
  reviewerId: string;
  contractId: string;
  rating?: number;
  comment?: string | null;
  createdAt?: string;
}

/** JSON envelope helpers — routes return either a bare array or { key: [...] }. */
export function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  return [];
}

export function asKeyedArray<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const value = (data as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}
