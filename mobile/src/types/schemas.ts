// Mirror of src/lib/schemas — keep in sync manually
// These are the request body types validated by the API

export interface CreateNeedInput {
  title: string;
  description: string;
  needCategory?: string | null;
  offerType: "service" | "item" | "money";
  offerDescription: string;
  offerValue?: number;
  isLocal?: boolean;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  deadline?: string;
  timeRange?: string;
  requiredSkills?: string[];
  images?: string[];
  offerImages?: string[];
  requiresContract?: boolean;
}

export interface UpdateNeedInput {
  title?: string;
  description?: string;
  needCategory?: string | null;
  offerType?: "service" | "item" | "money";
  offerDescription?: string;
  offerValue?: number | null;
  isLocal?: boolean;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deadline?: string | null;
  timeRange?: string | null;
  requiredSkills?: string[];
  images?: string[];
  offerImages?: string[];
  requiresContract?: boolean;
  status?: "open" | "archived";
}

export interface CreateProfileInput {
  userId: string;
  email: string;
  fullName?: string;
  mobile?: string;
}

export interface UpdateProfileInput {
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  showInDirectory?: boolean | null;
  publicPhone?: string | null;
  privatePhone?: string | null;
  mobile?: string | null;
  socialLinks?: { platform: string; url: string; isPublic?: boolean }[];
}

export interface SignContractInput {
  signature: string;
}

export interface PatchContractInput {
  terms?: string;
  agree?: boolean;
  submitTerms?: boolean;
  updatedAt?: string;
  partyATerms?: string;
  partyBTerms?: string;
  partyAUseMessageTerms?: boolean;
  partyBUseMessageTerms?: boolean;
}

export interface CreateCredentialInput {
  type:
    | "license"
    | "qualification"
    | "certification"
    | "ticket"
    | "resume"
    | "identification"
    | "insurance"
    | "wwcc"
    | "criminal_history"
    | "business_registration"
    | "other";
  subType?: string;
  title: string;
  description?: string;
  documentNumber?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  fileUrl?: string;
  backFileUrl?: string;
  isPublic?: boolean;
}

export interface UpdateCredentialInput {
  type?:
    | "license"
    | "qualification"
    | "certification"
    | "ticket"
    | "resume"
    | "identification"
    | "insurance"
    | "wwcc"
    | "criminal_history"
    | "business_registration"
    | "other";
  subType?: string;
  title?: string;
  description?: string;
  documentNumber?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  fileUrl?: string;
  backFileUrl?: string;
}

export interface CreateReviewInput {
  contractId?: string;
  acceptanceId?: string;
  receiverId: string;
  rating: number;
  comment?: string;
  privateFeedback?: string;
}

export interface SendTerminalMessageInput {
  channelId: string;
  content: string;
  attachments?: { url: string; type: string; name: string }[];
}

export interface SendDirectMessageInput {
  userId: string;
  content: string;
  attachments?: { url: string; type: string; name: string }[];
}

export interface TerminalReactionInput {
  messageId: string;
  emoji: string;
}

export interface DmReactionInput {
  messageId: string;
  emoji: string;
}
