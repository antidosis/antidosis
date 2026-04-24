import { Redis } from "@upstash/redis";

// In-memory fallback for local dev (when Upstash isn't configured)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of Array.from(memoryStore.entries())) {
      if (entry.resetAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 60_000);
}

// Initialize Redis if credentials are available
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

async function redisRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(options.windowMs / 1000);
  const now = Date.now();

  const current = await redis!.incr(key);
  if (current === 1) {
    await redis!.expire(key, windowSeconds);
  }

  const ttl = await redis!.ttl(key);
  const resetAt = now + ttl * 1000;
  const allowed = current <= options.maxRequests;
  const remaining = Math.max(0, options.maxRequests - current);

  return { allowed, remaining, resetAt };
}

function memoryRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    memoryStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 30 }
): Promise<RateLimitResult> {
  const key = `ratelimit:v1:${identifier}`;

  if (redis) {
    return redisRateLimit(key, options);
  }

  return memoryRateLimit(key, options);
}

/**
 * Extract a rate-limit identifier from a request.
 * Prefers authenticated user ID, falls back to IP address.
 */
export function getRateLimitIdentifier(
  req: Request,
  userId?: string | null
): string {
  if (userId) return `user:${userId}`;

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}
