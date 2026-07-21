import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createSignedUrl,
  createSignedUrlOrFallback,
  createCredentialSignedUrls,
  bucketForPath,
  extractStoragePath,
  isPrivatePath,
} from "./storage";

const mockCreateSignedUrl = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    storage: {
      from: (bucket: string) => {
        mockFrom(bucket);
        return {
          createSignedUrl: (...args: unknown[]) => mockCreateSignedUrl(...args),
        };
      },
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isPrivatePath / bucketForPath", () => {
  it("routes credential and contract paths to the private bucket", () => {
    expect(isPrivatePath("credentials/u/abc.jpg")).toBe(true);
    expect(isPrivatePath("contracts/123.pdf")).toBe(true);
    expect(bucketForPath("credentials/u/abc.jpg")).toBe("uploads-private");
    expect(bucketForPath("contracts/123.pdf")).toBe("uploads-private");
  });

  it("routes everything else to the public bucket", () => {
    expect(isPrivatePath("needs/u/abc.jpg")).toBe(false);
    expect(isPrivatePath("general/u/abc.jpg")).toBe(false);
    expect(bucketForPath("needs/u/abc.jpg")).toBe("uploads");
  });
});

describe("extractStoragePath", () => {
  it("extracts the object path from a public URL", () => {
    expect(
      extractStoragePath(
        "https://xxx.supabase.co/storage/v1/object/public/uploads/credentials/123/abc.jpg"
      )
    ).toBe("credentials/123/abc.jpg");
  });

  it("passes through raw object paths", () => {
    expect(extractStoragePath("credentials/123/abc.jpg")).toBe("credentials/123/abc.jpg");
  });

  it("returns null for URLs without a known bucket", () => {
    expect(extractStoragePath("https://example.com/other/path/file.jpg")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(extractStoragePath(null)).toBeNull();
    expect(extractStoragePath(undefined)).toBeNull();
  });
});

describe("createSignedUrl", () => {
  it("returns null for null/undefined input", async () => {
    expect(await createSignedUrl(null)).toBeNull();
    expect(await createSignedUrl(undefined)).toBeNull();
  });

  it("returns null when bucket not found in URL", async () => {
    expect(await createSignedUrl("https://example.com/other/path/file.jpg")).toBeNull();
    expect(mockCreateSignedUrl).not.toHaveBeenCalled();
  });

  it("signs private-bucket objects from uploads-private", async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://signed.example.com/url" },
      error: null,
    });

    const result = await createSignedUrl(
      "https://xxx.supabase.co/storage/v1/object/public/uploads/credentials/123/abc.jpg"
    );

    expect(result).toBe("https://signed.example.com/url");
    expect(mockFrom).toHaveBeenCalledWith("uploads-private");
    expect(mockCreateSignedUrl).toHaveBeenCalledWith("credentials/123/abc.jpg", 3600);
  });

  it("signs public-bucket objects from uploads", async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://signed.example.com/img" },
      error: null,
    });

    const result = await createSignedUrl("needs/u/abc.jpg");

    expect(result).toBe("https://signed.example.com/img");
    expect(mockFrom).toHaveBeenCalledWith("uploads");
    expect(mockCreateSignedUrl).toHaveBeenCalledWith("needs/u/abc.jpg", 3600);
  });

  it("returns null when Supabase returns error", async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });

    const result = await createSignedUrl(
      "https://xxx.supabase.co/storage/v1/object/public/uploads/test.jpg"
    );

    expect(result).toBeNull();
  });

  it("returns null when no signedUrl in response", async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({ data: {}, error: null });

    const result = await createSignedUrl(
      "https://xxx.supabase.co/storage/v1/object/public/uploads/test.jpg"
    );

    expect(result).toBeNull();
  });
});

describe("createSignedUrlOrFallback", () => {
  it("returns the signed URL when signing succeeds", async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://signed.example.com/url" },
      error: null,
    });

    const result = await createSignedUrlOrFallback("credentials/u/abc.jpg");
    expect(result).toBe("https://signed.example.com/url");
  });

  it("falls back to the stored URL when signing fails (pre-migration objects)", async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const stored = "https://xxx.supabase.co/storage/v1/object/public/uploads/credentials/u/abc.jpg";
    const result = await createSignedUrlOrFallback(stored);
    expect(result).toBe(stored);
  });

  it("returns null for empty input", async () => {
    expect(await createSignedUrlOrFallback(null)).toBeNull();
  });
});

describe("createCredentialSignedUrls", () => {
  it("creates signed URLs for both front and back", async () => {
    mockCreateSignedUrl
      .mockResolvedValueOnce({ data: { signedUrl: "https://front.example.com" }, error: null })
      .mockResolvedValueOnce({ data: { signedUrl: "https://back.example.com" }, error: null });

    const result = await createCredentialSignedUrls({
      fileUrl: "https://xxx.supabase.co/storage/v1/object/public/uploads/credentials/123/front.jpg",
      backFileUrl:
        "https://xxx.supabase.co/storage/v1/object/public/uploads/credentials/123/back.jpg",
    });

    expect(result).toEqual({
      signedUrl: "https://front.example.com",
      signedBackUrl: "https://back.example.com",
    });
  });

  it("handles missing back file URL", async () => {
    mockCreateSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://front.example.com" },
      error: null,
    });

    const result = await createCredentialSignedUrls({
      fileUrl: "https://xxx.supabase.co/storage/v1/object/public/uploads/credentials/123/front.jpg",
      backFileUrl: null,
    });

    expect(result).toEqual({
      signedUrl: "https://front.example.com",
      signedBackUrl: null,
    });
  });

  it("handles missing both URLs", async () => {
    const result = await createCredentialSignedUrls({ fileUrl: null, backFileUrl: null });

    expect(result).toEqual({ signedUrl: null, signedBackUrl: null });
  });
});
