import { type NextRequest } from "next/server";

import { vi } from "vitest";

// ─── Shared mock function references ───
// Import these in test files to configure return values.
// The corresponding vi.mock() factories should reference the same instances.

export const mockGetUser = vi.fn();
export const mockRateLimit = vi.fn();

// ─── Request builders ───

export function makeRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(url, options) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
}

export function makePostRequest(url: string, body: unknown, overrides?: RequestInit): NextRequest {
  return makeRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...overrides,
  });
}

// ─── Auth helpers ───

export function makeAuthUser(
  overrides?: Partial<{
    id: string;
    email: string;
    email_confirmed_at?: string | null;
  }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── Async utilities ───

export function flushPromises(ms = 10): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Common beforeEach setup ───

export function setupApiMocks(): void {
  vi.clearAllMocks();
  mockRateLimit.mockResolvedValue({
    allowed: true,
    remaining: 10,
    resetAt: Date.now() + 60_000,
  });
}

// ─── Well-known test UUIDs ───

export const TEST_USER_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
export const TEST_PROFILE_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_PROFILE_ID_2 = "22222222-2222-2222-2222-222222222222";
export const TEST_PROFILE_ID_3 = "33333333-3333-3333-3333-333333333333";
