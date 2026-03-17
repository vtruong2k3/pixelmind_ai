/**
 * lib/rate-limiter.ts
 * In-memory rate limiter tách riêng từ generate/route.ts để có thể test và tái sử dụng.
 *
 * ⚠️ LIMITATION: In-memory only — trên môi trường serverless/multi-instance (Vercel),
 * mỗi instance có map riêng → rate limit không enforced cross-instance.
 * Để enforce toàn cục, thay bằng Upstash Redis: https://upstash.com/
 */

type RateBucket = {
  count:   number;
  resetAt: number;
};

const store = new Map<string, RateBucket>();

const RATE_LIMIT      = 5;
const RATE_WINDOW_MS  = 60_000; // 1 phút

export interface RateLimitResult {
  allowed:    boolean;
  remaining:  number;
  resetAt:    number; // Unix ms — dùng cho Retry-After header
}

/**
 * Kiểm tra rate limit cho một userId.
 * @returns `allowed: true` nếu request được phép, `false` nếu bị chặn.
 */
export function checkRateLimit(userId: string): RateLimitResult {
  const now    = Date.now();
  const bucket = store.get(userId);

  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + RATE_WINDOW_MS;
    store.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt };
  }

  if (bucket.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count++;
  return { allowed: true, remaining: RATE_LIMIT - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Reset bucket của một user (dùng trong tests hoặc admin override).
 */
export function resetRateLimit(userId: string): void {
  store.delete(userId);
}
