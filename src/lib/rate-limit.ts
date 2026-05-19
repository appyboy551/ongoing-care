// Simple in-process rate limiter for auth-sensitive endpoints.
// Good enough for a single-region Vercel deployment with low traffic.
// For multi-region or higher load, swap this for an Upstash / Redis counter.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Allow up to `limit` events per `windowSeconds` per key.
 * key should combine the route name with an identifying value (IP, email).
 */
export function checkRateLimit(args: {
  key: string;
  limit: number;
  windowSeconds: number;
}): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(args.key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(args.key, { count: 1, resetAt: now + args.windowSeconds * 1000 });
    return { allowed: true, remaining: args.limit - 1, retryAfterSeconds: 0 };
  }
  if (bucket.count >= args.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, args.limit - bucket.count),
    retryAfterSeconds: 0,
  };
}

/** Extract a reasonable identifier from a request: forwarded IP, falling back to a generic marker. */
export function rateLimitIdFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
