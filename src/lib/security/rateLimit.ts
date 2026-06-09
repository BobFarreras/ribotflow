/**
 * Creation/modification date: 09/06/2026
 * Path: src/lib/security/rateLimit.ts
 * Description: In-memory rate limiter for Server Actions.
 *              Uses sliding window counter per IP/key.
 *              Resets on server restart (acceptable for this use case).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment rate limit for a given key (typically IP + action).
 *
 * @param key - Unique identifier (e.g., "register:192.168.1.1")
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and metadata
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request or window expired — start new window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= config.maxRequests) {
    // Limit exceeded
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment counter
  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract client IP from request headers or fallback to "unknown".
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
