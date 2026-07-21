// Types matching the Next.js API responses

export interface Profile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  publicPhone: string | null;
  privatePhone: string | null;
  mobile: string | null;
  mobileVerified: boolean;
  isVerified: boolean;
  isPro: boolean;
  proActivatedAt: string | null;
  proSource: string | null;
  proExpiresAt: string | null;
  showInDirectory: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  createdAt: string;
  updatedAt: string;
  skills: Skill[];
  socialLinks: SocialLink[];
  credentials: Credential[];
  reviewsReceived: {
    id: string;
    rating: number;
    comment: string | null;
    giver: { id: string; fullName: string | null; avatarUrl: string | null };
    contract: { need: { title: string } } | null;
    createdAt: string;
  }[];
}

export interface Skill {
  id: string;
  profileId: string;
  name: string;
  category: string | null;
  isVerified: boolean;
}

export interface SocialLink {
  id: string;
  profileId: string;
  platform: string;
  url: string;
  isPublic: boolean;
}

export interface Credential {
  id: string;
  profileId: string;
  type: string;
  subType: string | null;
  title: string;
  description: string | null;
  documentNumber: string | null;
  issuedBy: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  backFileUrl: string | null;
  isPublic: boolean;
  isVerified: boolean;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Need {
  id: string;
  posterId: string;
  title: string;
  description: string;
  needCategory: string | null;
  category?: { name: string; slug: string } | null;
  offerType: "service" | "item" | "money";
  offerDescription: string;
  offerValue: number | null;
  isLocal: boolean;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  requiresContract: boolean;
  deadline: string | null;
  timeRange: string | null;
  images: string[];
  offerImages: string[];
  createdAt: string;
  updatedAt: string;
  poster?: NeedPoster;
  requiredSkills?: NeedSkill[];
  _count?: { acceptances: number };
  acceptances?: Acceptance[];
  contracts?: Contract[];
}

export interface NeedPoster {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  ratingAvg: number;
  ratingCount: number;
  locationName: string | null;
  isVerified: boolean;
  isPro: boolean;
  jobsCompleted: number;
  skills: Skill[];
  socialLinks: SocialLink[];
  credentials?: Credential[];
}

export interface NeedSkill {
  id: string;
  needId: string;
  name: string;
}

export interface Acceptance {
  id: string;
  needId: string;
  userId: string;
  message: string | null;
  status: string;
  posterMarkedComplete: boolean;
  fulfillerMarkedComplete: boolean;
  createdAt: string;
  updatedAt: string;
  need?: { id: string; title: string };
  user?: AcceptanceUser;
}

export interface AcceptanceUser {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locationName: string | null;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  skills: Skill[];
  credentials: Pick<Credential, "id" | "title" | "issuedBy" | "isVerified">[];
}

export interface Contract {
  id: string;
  needId: string;
  acceptanceId: string | null;
  partyAId: string;
  partyBId: string;
  terms: string;
  status: string;
  partyA: { id: string; fullName: string | null };
  partyB: { id: string; fullName: string | null };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NeedsListResponse {
  needs: Need[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  availableFilters: {
    offerTypes: string[];
    categories: string[];
    skills: string[];
  };
}

export interface NeedDetailResponse {
  need: Need;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ── Terminal Chat ────────────────────────────────────────────────────

export interface TerminalChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  order: number;
}

export interface TerminalMessage {
  id: string;
  content: string;
  attachments: { url: string; type: string; name: string }[] | null;
  createdAt: string;
  sender: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  reactions: {
    id: string;
    emoji: string;
    userId: string;
  }[];
}

export interface DirectMessageThread {
  id: string;
  otherUser: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  content: string;
  attachments: { url: string; type: string; name: string }[] | null;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  reactions: {
    id: string;
    emoji: string;
    userId: string;
  }[];
}

export interface ReactionResponse {
  action: "added" | "removed";
}

// ── Pros / Search ────────────────────────────────────────────────────

export interface ProProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locationName: string | null;
  publicPhone: string | null;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  isVerified: boolean;
  skills: { name: string }[];
  credentials: { id: string }[];
}

export interface SearchResult {
  needs: {
    id: string;
    title: string;
    status: string;
    locationName: string | null;
    offerValue: number | null;
  }[];
  users: {
    id: string;
    fullName: string | null;
    locationName: string | null;
    ratingAvg: number;
    ratingCount: number;
  }[];
  pros: {
    id: string;
    fullName: string | null;
    locationName: string | null;
    ratingAvg: number;
    ratingCount: number;
  }[];
}

// ── Contracts ────────────────────────────────────────────────────────

export interface ContractSummary {
  id: string;
  status: string;
  completedAt: string | null;
  partyAId: string;
  partyBId: string;
  need: { title: string };
  partyASignedAt: string | null;
  partyBSignedAt: string | null;
  partyA: { id: string; fullName: string | null };
  partyB: { id: string; fullName: string | null };
}

export interface ContractDetail {
  id: string;
  needId: string;
  acceptanceId: string | null;
  partyAId: string;
  partyBId: string;
  terms: string;
  partyATerms: string | null;
  partyBTerms: string | null;
  deadlineTerms: string | null;
  completionMethodTerms: string | null;
  additionalTerms: string | null;
  partyAUseMessageTerms: boolean;
  partyBUseMessageTerms: boolean;
  negotiationMessages: unknown;
  pdfUrl: string | null;
  partyASubmittedAt: string | null;
  partyBSubmittedAt: string | null;
  partyAAgreedAt: string | null;
  partyBAgreedAt: string | null;
  termsLockedAt: string | null;
  partyASignedAt: string | null;
  partyBSignedAt: string | null;
  partyASignature: string | null;
  partyBSignature: string | null;
  status: string;
  aMarkedComplete: boolean;
  bMarkedComplete: boolean;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledById: string | null;
  cancelReason: string | null;
  cancelRequestedById: string | null;
  cancelRequestedAt: string | null;
  cancelResponse: string | null;
  cancelResponseAt: string | null;
  cancelEscalatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  need: Need & { poster: NeedPoster; requiredSkills: NeedSkill[] };
  partyA: NeedPoster;
  partyB: NeedPoster;
  messages: {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; fullName: string | null; avatarUrl: string | null };
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    giverId: string;
    receiverId: string;
    createdAt: string;
  }[];
}

export interface PublicProfile {
  id: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  publicPhone: string | null;
  mobileVerified: boolean;
  isVerified: boolean;
  isPro: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  createdAt: string;
  skills: Skill[];
  socialLinks: SocialLink[];
  credentials: Credential[];
  needsPosted: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    offerType: string;
    createdAt: string;
  }[];
  reviewsReceived: {
    id: string;
    rating: number;
    comment: string | null;
    giver: { id: string; fullName: string | null; avatarUrl: string | null };
    createdAt: string;
  }[];
}

// ── Reviews ──────────────────────────────────────────────────────────

export interface ReviewInput {
  contractId?: string;
  acceptanceId?: string;
  receiverId: string;
  rating: number;
  comment: string;
  privateFeedback?: string;
}
