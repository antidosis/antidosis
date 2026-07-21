import { supabase } from "@mobile/lib/supabase";
import type {
  Profile,
  Need,
  NeedsListResponse,
  NeedDetailResponse,
  Notification,
  NotificationsResponse,
  Acceptance,
} from "@mobile/types/api";
import type { CreateNeedInput } from "@/lib/schemas/needs";
import type { UpdateProfileInput } from "@/lib/schemas/profiles";
import type {
  SendTerminalMessageInput,
  SendDirectMessageInput,
  TerminalReactionInput,
  DmReactionInput,
} from "@/lib/schemas/terminal";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function getToken(): Promise<string | undefined> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
}

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const url = `${API_BASE}${path}`;

  const isJsonBody =
    options.body &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof Blob) &&
    !(options.body instanceof URLSearchParams);

  const res = await fetchWithTimeout(url, {
    ...options,
    headers: {
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = typeof body.error === "string" ? body.error : JSON.stringify(body.error ?? body);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── Profile ──────────────────────────────────────────────────────────

export function getProfile() {
  return fetchApi<Profile>("/profiles/me");
}

// ── Need Messages ────────────────────────────────────────────────────

export interface NeedMessage {
  id: string;
  content: string;
  createdAt: string;
  acceptanceId: string | null;
  sender: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export function getNeedMessages(id: string) {
  return fetchApi<{ messages: NeedMessage[] }>(`/needs/${id}/messages`);
}

export function sendNeedMessage(id: string, content: string, acceptanceId?: string) {
  return fetchApi<{ message: NeedMessage }>(`/needs/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, acceptanceId }),
  });
}

// ── Needs ────────────────────────────────────────────────────────────

export interface NeedsQuery {
  q?: string;
  type?: string;
  location?: string;
  category?: string;
  skill?: string;
  page?: number;
  limit?: number;
}

export function getNeeds(query: NeedsQuery = {}) {
  const sp = new URLSearchParams();
  if (query.q) sp.set("q", query.q);
  if (query.type) sp.set("type", query.type);
  if (query.location) sp.set("location", query.location);
  if (query.category) sp.set("category", query.category);
  if (query.skill) sp.set("skill", query.skill);
  sp.set("page", String(query.page ?? 1));
  sp.set("limit", String(query.limit ?? 20));
  return fetchApi<NeedsListResponse>(`/needs?${sp.toString()}`);
}

export function getNeed(id: string) {
  return fetchApi<NeedDetailResponse>(`/needs/${id}`);
}

export function createNeed(data: CreateNeedInput) {
  return fetchApi<{ need: Need }>("/needs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyNeeds() {
  return fetchApi<Need[]>("/needs/mine");
}

// ── Acceptances (Deals) ──────────────────────────────────────────────

export function getMyAcceptances() {
  return fetchApi<Acceptance[]>("/acceptances/mine");
}

export function createAcceptance(needId: string, message?: string) {
  return fetchApi<{ acceptance: Acceptance }>("/acceptances", {
    method: "POST",
    body: JSON.stringify({ needId, message: message || "" }),
  });
}

// ── Notifications ────────────────────────────────────────────────────

export function getNotifications(unreadOnly = false) {
  return fetchApi<NotificationsResponse>(`/notifications?unreadOnly=${unreadOnly}`);
}

export function markNotificationRead(id: string) {
  return fetchApi<Notification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return fetchApi<{ success: boolean }>("/notifications/read-all", {
    method: "PATCH",
  });
}

// ── Terminal Channels ────────────────────────────────────────────────

export function getTerminalChannels() {
  return fetchApi<{ channels: import("@mobile/types/api").TerminalChannel[] }>(
    "/terminal/channels"
  );
}

export function getTerminalMessages(channelId: string, skip = 0, limit = 100) {
  return fetchApi<{ messages: import("@mobile/types/api").TerminalMessage[] }>(
    `/terminal/messages?channelId=${channelId}&skip=${skip}&limit=${limit}`
  );
}

export function postTerminalMessage(
  channelId: string,
  content: string,
  attachments?: SendTerminalMessageInput["attachments"]
) {
  const body: SendTerminalMessageInput = { channelId, content, attachments };
  return fetchApi<{ message: import("@mobile/types/api").TerminalMessage }>("/terminal/messages", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postTerminalReaction(messageId: string, emoji: string) {
  const body: TerminalReactionInput = { messageId, emoji };
  return fetchApi<import("@mobile/types/api").ReactionResponse>("/terminal/reactions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Direct Messages ──────────────────────────────────────────────────

export function getDmThreads() {
  return fetchApi<{ threads: import("@mobile/types/api").DirectMessageThread[] }>(
    "/terminal/dm/threads"
  );
}

export function getDmMessages(threadId?: string, userId?: string, skip = 0, limit = 100) {
  if (threadId) {
    return fetchApi<{
      threadId: string;
      messages: import("@mobile/types/api").DirectMessage[];
    }>(`/terminal/dm/messages?threadId=${threadId}&skip=${skip}&limit=${limit}`);
  }
  return fetchApi<{
    threadId: string;
    messages: import("@mobile/types/api").DirectMessage[];
  }>(`/terminal/dm/messages?userId=${userId}&skip=${skip}&limit=${limit}`);
}

export function postDmMessage(
  userId: string,
  content: string,
  attachments?: SendDirectMessageInput["attachments"]
) {
  const body: SendDirectMessageInput = { userId, content, attachments };
  return fetchApi<{
    message: import("@mobile/types/api").DirectMessage;
    threadId: string;
  }>("/terminal/dm/messages", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postDmReaction(messageId: string, emoji: string) {
  const body: DmReactionInput = { messageId, emoji };
  return fetchApi<import("@mobile/types/api").ReactionResponse>("/terminal/dm/reactions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Pros / Search ────────────────────────────────────────────────────

export function getPros(q?: string) {
  const sp = q ? `?q=${encodeURIComponent(q)}` : "";
  return fetchApi<import("@mobile/types/api").ProProfile[]>(`/pros${sp}`);
}

export function searchAll(query: string) {
  return fetchApi<import("@mobile/types/api").SearchResult>(
    `/search?q=${encodeURIComponent(query)}`
  );
}

// ── Contracts ────────────────────────────────────────────────────────

export function getMyContracts() {
  return fetchApi<import("@mobile/types/api").ContractSummary[]>("/contracts/mine");
}

export function getContract(id: string) {
  return fetchApi<{ contract: import("@mobile/types/api").ContractDetail }>(`/contracts/${id}`);
}

export function signContract(id: string, signature: string) {
  return fetchApi<{ contract: import("@mobile/types/api").ContractDetail }>(
    `/contracts/${id}/sign`,
    {
      method: "POST",
      body: JSON.stringify({ signature }),
    }
  );
}

export function completeContract(id: string) {
  return fetchApi<{ contract: import("@mobile/types/api").ContractDetail }>(
    `/contracts/${id}/complete`,
    { method: "POST" }
  );
}

export function remindSign(id: string) {
  return fetchApi<{ message: string }>(`/contracts/${id}/remind-sign`, {
    method: "POST",
  });
}

export function generateContractPdf(id: string) {
  return fetchApi<{ contract: import("@mobile/types/api").ContractDetail }>(
    `/contracts/${id}/pdf`,
    { method: "POST" }
  );
}

export function sendContractMessage(contractId: string, content: string) {
  return fetchApi<{
    message: {
      id: string;
      content: string;
      createdAt: string;
      sender: { id: string; fullName: string | null; avatarUrl: string | null };
    };
  }>("/messages", {
    method: "POST",
    body: JSON.stringify({ contractId, content }),
  });
}

// ── Profile ──────────────────────────────────────────────────────────

export function getPublicProfile(id: string) {
  return fetchApi<import("@mobile/types/api").PublicProfile>(`/profiles/${id}`);
}

export function updateProfile(data: UpdateProfileInput) {
  return fetchApi<import("@mobile/types/api").Profile>("/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAccount() {
  return fetchApi<{ success: boolean }>("/profiles/me", {
    method: "DELETE",
  });
}

// ── Skills ───────────────────────────────────────────────────────────

export function addSkill(name: string, category?: string) {
  return fetchApi<import("@mobile/types/api").Skill>("/profiles/me/skills", {
    method: "POST",
    body: JSON.stringify({ name, category }),
  });
}

export function removeSkill(name: string) {
  return fetchApi<{ success: boolean }>(`/profiles/me/skills?name=${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

// ── Acceptances ──────────────────────────────────────────────────────

export function updateAcceptance(id: string, status: string) {
  return fetchApi<{
    acceptance: import("@mobile/types/api").Acceptance;
    contract?: import("@mobile/types/api").ContractSummary;
  }>(`/acceptances/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function markAcceptanceComplete(id: string) {
  return fetchApi<{ acceptance: import("@mobile/types/api").Acceptance; bothComplete: boolean }>(
    `/acceptances/${id}/complete`,
    { method: "POST" }
  );
}

// ── Reviews ──────────────────────────────────────────────────────────

export function createReview(data: import("@mobile/types/api").ReviewInput) {
  return fetchApi<{ review: { id: string } }>("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Contracts ────────────────────────────────────────────────────────

export function updateContract(
  id: string,
  data: {
    terms?: string;
    agree?: boolean;
    submitTerms?: boolean;
    updatedAt?: string;
    partyATerms?: string | null;
    partyBTerms?: string | null;
    partyAUseMessageTerms?: boolean;
    partyBUseMessageTerms?: boolean;
  }
) {
  return fetchApi<import("@mobile/types/api").ContractDetail>(`/contracts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Contract Cancellation ────────────────────────────────────────────

export function cancelContract(id: string, reason?: string) {
  return fetchApi<{ contract: import("@mobile/types/api").ContractDetail }>(
    `/contracts/${id}/cancel`,
    { method: "POST", body: JSON.stringify({ reason }) }
  );
}

export function requestContractCancel(id: string, reason: string) {
  return fetchApi<{ contract: import("@mobile/types/api").ContractDetail }>(
    `/contracts/${id}/request-cancel`,
    { method: "POST", body: JSON.stringify({ reason }) }
  );
}

export function respondContractCancel(id: string, agree: boolean, response?: string) {
  return fetchApi<{ contract: import("@mobile/types/api").ContractDetail }>(
    `/contracts/${id}/respond-cancel`,
    { method: "POST", body: JSON.stringify({ agree, response }) }
  );
}

export function escalateContractCancel(id: string, reason: string) {
  return fetchApi<{ contract: import("@mobile/types/api").ContractDetail }>(
    `/contracts/${id}/escalate-cancel`,
    { method: "POST", body: JSON.stringify({ reason }) }
  );
}

// ── Needs Management ─────────────────────────────────────────────────

export function updateNeed(id: string, data: Partial<CreateNeedInput>) {
  return fetchApi<{ need: import("@mobile/types/api").Need }>(`/needs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteNeed(id: string) {
  return fetchApi<{ success: boolean }>(`/needs/${id}`, { method: "DELETE" });
}

export function repostNeed(id: string) {
  return fetchApi<{ need: import("@mobile/types/api").Need }>(`/needs/${id}/repost`, {
    method: "POST",
  });
}

// ── Terminal Reactions ───────────────────────────────────────────────

export function reactToChannelMessage(messageId: string, emoji: string) {
  return fetchApi<{ action: "added" | "removed" }>("/terminal/reactions", {
    method: "POST",
    body: JSON.stringify({ messageId, emoji }),
  });
}

export function reactToDmMessage(messageId: string, emoji: string) {
  return fetchApi<{ action: "added" | "removed" }>("/terminal/dm/reactions", {
    method: "POST",
    body: JSON.stringify({ messageId, emoji }),
  });
}

// ── Upload ───────────────────────────────────────────────────────────

export async function uploadFile(
  file: File | Blob,
  folder = "general"
): Promise<{ url: string; path: string }> {
  const token = await getToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetchWithTimeout(
    `${API_BASE}/upload`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    },
    60000
  ); // 60s timeout for uploads

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json();
}

// ── Play Store Billing ───────────────────────────────────────────────

export async function verifyPlayStorePurchase(
  productId: string,
  purchaseToken: string
): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>("/billing/play-store/verify", {
    method: "POST",
    body: JSON.stringify({ productId, purchaseToken }),
  });
}

export async function claimFreePro(): Promise<{ success: boolean; message: string }> {
  return fetchApi<{ success: boolean; message: string }>("/pro/claim", { method: "POST" });
}
