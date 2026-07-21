import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Supabase mocks ───
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ─── Service client mock ───
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: (...args: unknown[]) => mockGetPublicUrl(...args),
      }),
    },
  }),
}));

// ─── Rate limit mocks ───
const mockRateLimit = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test-id",
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Helpers ───
function makeFormRequest(file?: File, folder?: string): NextRequest {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (folder) formData.append("folder", folder);
  const req = new Request("http://localhost/api/v1/upload", {
    method: "POST",
  }) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL("http://localhost/api/v1/upload"),
    writable: true,
    configurable: true,
  });
  req.formData = async () => formData;
  return req;
}

function makeAuthUser(
  overrides?: Partial<{ id: string; email: string; email_confirmed_at: string }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeMockFile(content: string | Uint8Array, name: string, type: string): File {
  let bytes: ArrayBuffer;
  if (typeof content === "string") {
    bytes = new TextEncoder().encode(content).buffer;
  } else {
    bytes = content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength
    ) as ArrayBuffer;
  }
  const file = new File([content as BlobPart], name, { type }) as File & {
    arrayBuffer(): Promise<ArrayBuffer>;
  };
  file.arrayBuffer = async () => bytes;
  return file;
}

function makePngFile(): File {
  // PNG signature: 89 50 4E 47
  const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return makeMockFile(buffer, "test.png", "image/png");
}

describe("POST /api/v1/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
    mockUpload.mockResolvedValue({ data: { path: "general/user-1/test.png" }, error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.com/general/user-1/test.png" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makeFormRequest(makePngFile()));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await POST(makeFormRequest(makePngFile()));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(makeFormRequest(makePngFile()));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toContain("Rate limit exceeded");
  });

  it("returns 400 when no file provided", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await POST(makeFormRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("No file provided");
  });

  it("returns 400 when file too large", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const bigBuffer = new Uint8Array(11 * 1024 * 1024);
    const bigFile = makeMockFile(bigBuffer, "big.png", "image/png");

    const res = await POST(makeFormRequest(bigFile));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("too large");
  });

  it("returns 400 for invalid file type", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const badFile = makeMockFile("not an image", "test.txt", "text/plain");
    const res = await POST(makeFormRequest(badFile));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Invalid file type");
  });

  it("returns 200 on successful upload", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await POST(makeFormRequest(makePngFile(), "avatars"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe("https://example.com/general/user-1/test.png");
    expect(mockUpload).toHaveBeenCalled();
  });

  it("returns 500 when upload fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockUpload.mockResolvedValue({ data: null, error: new Error("Storage error") });

    const res = await POST(makeFormRequest(makePngFile()));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("Upload failed");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await POST(makeFormRequest(makePngFile()));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
