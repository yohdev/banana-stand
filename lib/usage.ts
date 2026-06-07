import { NextRequest } from "next/server";
import type { RateLimitResult } from "./ratelimit";

/**
 * Resolve a stable identity for quota purposes.
 * Premium callers send `x-api-key`; everyone else is keyed by IP.
 */
export function getUserId(req: NextRequest): string {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) return `key:${apiKey}`;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  return `ip:${ip}`;
}

/**
 * Quota state headers attached to every response so clients can render
 * "N images left today".
 */
export function usageHeaders(rl: RateLimitResult, cache: "HIT" | "MISS"): Record<string, string> {
  return {
    "X-Cache": cache,
    "X-Usage-Remaining": String(rl.remaining),
    "X-Daily-Limit": String(rl.limit),
    "X-Reset-At": rl.resetAt,
    "X-Tier": rl.tier,
  };
}
