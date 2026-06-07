import { Redis } from "@upstash/redis";

const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 5);
const PREMIUM_DAILY_LIMIT = Number(process.env.PREMIUM_DAILY_LIMIT ?? 1000);

export type Tier = "free" | "premium";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
  tier: Tier;
}

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!_redis) _redis = new Redis({ url, token });
  return _redis;
}

function dayKey(tier: Tier, userId: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `usage:${tier}:${userId}:${today}`;
}

function nextMidnightUTC(): string {
  const resetAt = new Date();
  resetAt.setUTCDate(resetAt.getUTCDate() + 1);
  resetAt.setUTCHours(0, 0, 0, 0);
  return resetAt.toISOString();
}

function limitFor(tier: Tier): number {
  return tier === "premium" ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
}

// Stub — replace with real lookup when auth + Stripe land.
export async function getTier(userId: string): Promise<Tier> {
  if (userId.startsWith("key:")) {
    // TODO: validate API key against user DB / Stripe subscription.
    return "free"; // keep everyone free until billing is live
  }
  return "free";
}

/**
 * Read-only view of current usage. Does NOT increment.
 * Use on the cache-hit path so hits are never metered.
 * Fails open (allowed: true) when Redis is not configured.
 */
export async function peekRateLimit(userId: string): Promise<RateLimitResult> {
  const tier = await getTier(userId);
  const limit = limitFor(tier);
  const redis = getRedis();

  if (!redis) {
    return { allowed: true, remaining: limit, limit, resetAt: nextMidnightUTC(), tier };
  }

  const current = (await redis.get<number>(dayKey(tier, userId))) ?? 0;
  return {
    allowed: current < limit,
    remaining: Math.max(0, limit - current),
    limit,
    resetAt: nextMidnightUTC(),
    tier,
  };
}

/**
 * Increments usage and reports whether this request is within quota.
 * Use on the cache-miss path (a real generation = real cost).
 * Fails open when Redis is not configured.
 */
export async function consumeRateLimit(userId: string): Promise<RateLimitResult> {
  const tier = await getTier(userId);
  const limit = limitFor(tier);
  const redis = getRedis();

  if (!redis) {
    return { allowed: true, remaining: limit, limit, resetAt: nextMidnightUTC(), tier };
  }

  const key = dayKey(tier, userId);
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, 86400); // expire 24h after first use today

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    limit,
    resetAt: nextMidnightUTC(),
    tier,
  };
}
