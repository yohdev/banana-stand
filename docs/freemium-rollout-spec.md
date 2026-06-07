# Banana Stand: Open-Source Safety & Freemium Rollout Spec

**Status:** Planning / rollout
**Audience:** Build owner
**Depends on:** Existing Banana Stand MVP (`/i/{w}x{h}`, `/api/generate`, `/api/health`)

This spec covers two related goals:

1. Ship Banana Stand as a **safe open-source project** where users bring their own API keys without leaking them.
2. Layer a **freemium model** on top (daily free quota per user, paid tiers later) so a public hosted instance can be monetized without a rewrite.

---

## Part 1 — Safe Open Source (BYO Key)

### 1.1 What's already safe (MVP)

| Safeguard | Status |
|---|---|
| `.env.local.example` documents vars, contains no real secrets | ✅ |
| `.env.local` is `.gitignore`'d — keys never committed | ✅ |
| `GEMINI_API_KEY` / `BLOB_READ_WRITE_TOKEN` are server-side only, never sent to client | ✅ |
| `GEN_TOKEN` shared secret gates cache-miss generation (cache hits stay open) | ✅ |

**Golden rule:** Keys live in environment variables, never in code. Vercel injects them at deploy time.

### 1.2 One-click deploy with env prompts

Add to README so users are prompted for keys at deploy time (Vercel never echoes values back):

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/furiouzzwill/banana-stand&env=GEMINI_API_KEY,BLOB_READ_WRITE_TOKEN&envDescription=Gemini%20API%20key%20and%20Vercel%20Blob%20token)
```

### 1.3 Key provisioning guidance (document in README)

- **Gemini key:** Users create one at https://aistudio.google.com — free tier available. Stays in their `.env.local` / Vercel project settings only.
- **Blob token:** Automatic — when a user adds the Vercel Blob integration to their project, `BLOB_READ_WRITE_TOKEN` is injected. No manual copy/paste.

### 1.4 Prevent accidental secret commits

Optional pre-commit guard:

```bash
# .git/hooks/pre-commit
#!/bin/bash
if git diff --cached | grep -E 'GEMINI_API_KEY=|BLOB.*TOKEN=' ; then
  echo "❌ Looks like you tried to commit a secret. Aborting."
  exit 1
fi
```

Or adopt `detect-secrets` / `gitleaks` in CI for stronger coverage.

### 1.5 AI disclosure (already in README)

All output carries an invisible SynthID watermark. Document that images are AI-generated and must not be passed off as authentic photography.

---

## Part 2 — Freemium Rollout

### 2.1 Tier model

| Tier | Daily generation limit | Cache hits | Identity |
|---|---|---|---|
| **Free** | 5 (configurable) | Unlimited (never counted) | IP address |
| **Premium** (later) | 1000 (stub) | Unlimited | API key |

**Key principle:** Only **cache misses** (real Gemini calls = real cost) count against quota. Cache hits are always free and unmetered, so already-embedded `<img>` tags on live pages never break.

### 2.2 Storage: Upstash Redis (serverless, free tier)

```bash
npm install @upstash/redis
```

Free tier ≈ 10k commands/day. Serverless, no connection pooling headaches on Vercel.

Env vars:

```bash
# .env.local.example additions
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Get both from https://console.upstash.com.

### 2.3 Rate limit module

```typescript
// lib/ratelimit.ts
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 5);
const PREMIUM_DAILY_LIMIT = Number(process.env.PREMIUM_DAILY_LIMIT ?? 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
  tier: "free" | "premium";
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const tier = await getTier(userId);
  const limit = tier === "premium" ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

  const today = new Date().toISOString().split("T")[0];
  const key = `usage:${tier}:${userId}:${today}`;

  const current = (await redis.incr(key)) || 0;
  if (current === 1) await redis.expire(key, 86400); // expire after 24h

  const resetAt = new Date();
  resetAt.setDate(resetAt.getDate() + 1);
  resetAt.setHours(0, 0, 0, 0);

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    limit,
    resetAt: resetAt.toISOString(),
    tier,
  };
}

// Stub — replace with real lookup when auth + Stripe land.
async function getTier(userId: string): Promise<"free" | "premium"> {
  if (userId.startsWith("key:")) {
    // TODO: validate API key against user DB / Stripe subscription
    return "free"; // keep everyone free until billing is live
  }
  return "free";
}
```

**Note on counting:** `checkRateLimit` increments on every call. Because we only call it on the **cache-miss path** (see below), cache hits never increment. If you prefer to call it once per request, split into a separate `peekRateLimit` (read-only) for hits and `consumeRateLimit` (incr) for misses.

### 2.4 Identity resolution

```typescript
function getUserId(req: NextRequest): string {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) return `key:${apiKey}`;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  return `ip:${ip}`;
}
```

### 2.5 Route integration (`app/i/[dimensions]/route.ts`)

Order of operations on a request:

1. Resolve `userId`.
2. Compute cache key → HEAD Blob.
3. **Cache HIT** → 302 immediately, attach usage headers (read-only peek), **do not** consume quota.
4. **Cache MISS** → `checkRateLimit` (consumes). If `!allowed` → `429`. Else generate, store, 302.

```typescript
// Cache hit — no quota charge
if (existingUrl) {
  return NextResponse.redirect(existingUrl, {
    status: 302,
    headers: usageHeaders(rateLimitPeek, "HIT"),
  });
}

// Cache miss — enforce quota
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: `Daily limit (${rateLimit.limit}) exceeded. Resets at ${rateLimit.resetAt}` },
    { status: 429, headers: usageHeaders(rateLimit, "MISS") }
  );
}
// ...generate, store, redirect with usageHeaders(rateLimit, "MISS")
```

### 2.6 Response headers (client visibility)

Every response exposes quota state so a UI can render "2 images left today":

```
X-Cache: HIT | MISS
X-Usage-Remaining: 3
X-Daily-Limit: 5
X-Reset-At: 2026-06-07T00:00:00Z
```

### 2.7 Env additions summary

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
FREE_DAILY_LIMIT=5          # optional override
PREMIUM_DAILY_LIMIT=1000    # optional override
```

---

## Part 3 — Monetization Hooks (deferred, no rewrite)

The freemium code above is intentionally payment-ready. When user growth justifies it:

1. **Auth** — users sign up, receive an API key (`x-api-key` header already supported).
2. **Billing** — Stripe or Lemonsqueezy. Charge per **generated** image (misses), never on hits.
3. **Flip the switch** — implement `getTier()` to look up subscription status in your user DB / Stripe. No route changes needed.
4. **Premium perks** — higher daily cap, concurrency, priority generation, extra style presets.
5. **Usage analytics** — fire a webhook when a user crosses 80% of quota (upsell trigger).

Because tier resolution is one stubbed function, going from free-only to paid tiers is a **single-function change**, not an architecture change.

---

## Part 4 — Rollout Checklist

- [x] Add Vercel deploy button with `env=` prompts to README.
- [x] Document Gemini + Blob key provisioning in README.
- [ ] (Optional) Add pre-commit secret guard / gitleaks CI.
- [ ] Provision Upstash Redis, add 4 env vars. *(infra step — code reads them, fails open if unset)*
- [x] Add `lib/ratelimit.ts`. *(split into `peekRateLimit` / `consumeRateLimit`)*
- [x] Wire `getUserId` + cache-hit-free / miss-metered logic into `/i` and `/api/generate`.
- [x] Add usage response headers.
- [ ] Deploy public free instance (5/day) at a controlled domain.
- [ ] Publish ToS: AI-generated, no authentic-photo representation, fair-use limits.
- [ ] (Deferred) Auth → Stripe → implement `getTier()`.

> **Implementation note:** the pipeline was refactored into composable stages
> (`resolveRequest` → `lookupCache` → `generateAndStore`) so routes can meter the
> miss path *between* the cache check and generation. `runPipeline` remains as a
> convenience wrapper. Rate limiting fails open when Upstash env vars are absent.

---

## Acceptance Criteria

- **AC1.** A cache hit never decrements a user's daily quota and always succeeds (so live pages never break).
- **AC2.** A cache miss decrements quota; exceeding the limit returns `429` with a JSON error and reset time.
- **AC3.** Every response carries `X-Cache`, `X-Usage-Remaining`, `X-Daily-Limit`, `X-Reset-At`.
- **AC4.** No API key (Gemini, Blob, Upstash) is ever exposed to the client or committed to git.
- **AC5.** Switching a user from free to premium requires changing only `getTier()`, no route or schema changes.
