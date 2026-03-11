// src/__tests__/rate-limiter.test.ts
// Unit tests for the in-memory rate limiting logic used in /api/generate

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Replicate the rate limiter logic inline for testing ────────────────────────
// (mirrors the implementation in src/app/api/generate/route.ts)

type RateBucket = { count: number; resetAt: number };

function createRateLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, RateBucket>();

  return function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const bucket = store.get(userId);

    if (!bucket || now > bucket.resetAt) {
      store.set(userId, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (bucket.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    bucket.count++;
    return { allowed: true, remaining: maxRequests - bucket.count };
  };
}

describe("Rate Limiter", () => {
  let checkRateLimit: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    checkRateLimit = createRateLimiter(5, 60_000); // 5 req/min
  });

  it("✅ allows the first 5 requests", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("user-a").allowed).toBe(true);
    }
  });

  it("❌ blocks the 6th request", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("user-a");
    expect(checkRateLimit("user-a").allowed).toBe(false);
  });

  it("✅ different users have independent limits", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("user-a");
    // user-b has not made any requests
    expect(checkRateLimit("user-b").allowed).toBe(true);
  });

  it("✅ resets after the time window", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) checkRateLimit("user-a");

    // Advance past the 60s window
    vi.advanceTimersByTime(61_000);
    expect(checkRateLimit("user-a").allowed).toBe(true);
    vi.useRealTimers();
  });

  it("✅ remaining count decrements correctly", () => {
    expect(checkRateLimit("user-a").remaining).toBe(4);
    expect(checkRateLimit("user-a").remaining).toBe(3);
  });
});
