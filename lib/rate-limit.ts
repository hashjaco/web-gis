import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import type { UserPlan } from "./auth/plans";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

type RateLimitTier = "guest" | "default" | "strict" | "generous" | "expensive";

const LIMITS: Record<RateLimitTier, { tokens: number; window: string }> = {
  guest:     { tokens: 20,  window: "60 s" },
  strict:    { tokens: 10,  window: "60 s" },
  default:   { tokens: 100, window: "60 s" },
  generous:  { tokens: 500, window: "60 s" },
  expensive: { tokens: 10,  window: "60 s" },
};

/**
 * Maps a user plan to the appropriate default rate limit tier.
 * Callers can override with a specific tier for expensive operations.
 */
export function planToRateTier(plan: UserPlan): RateLimitTier {
  switch (plan) {
    case "guest":
      return "guest";
    case "free":
      return "default";
    case "pro":
    case "team":
    case "enterprise":
    case "admin":
      return "generous";
    default:
      return "default";
  }
}

const limiters = new Map<RateLimitTier, Ratelimit>();

function getLimiter(tier: RateLimitTier): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  if (!limiters.has(tier)) {
    const { tokens, window } = LIMITS[tier];
    limiters.set(
      tier,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(tokens, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
        prefix: `ratelimit:${tier}`,
      }),
    );
  }

  return limiters.get(tier)!;
}

/**
 * Check rate limit for a given identifier (typically userId or IP).
 * Returns a 429 NextResponse if rate-limited, or `null` if allowed.
 * Gracefully passes through if Redis is not configured.
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = "default",
): Promise<NextResponse | null> {
  const limiter = getLimiter(tier);
  if (!limiter) return null;

  const result = await limiter.limit(identifier);

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.reset / 1000 - Date.now() / 1000)),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      },
    );
  }

  return null;
}
