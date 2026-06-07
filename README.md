# Banana Stand — AI Placeholder Image API

> "There's always money in the banana stand."

An AI-powered placeholder image service. Write a URL, get an image. Generated once by Gemini, cached forever on a CDN.

```html
<img src="https://your-instance.vercel.app/i/1200x600?prompt=modern+fintech+dashboard+hero&style=photographic" />
```

---

## How it works

1. First request for a given prompt + dimensions → calls Gemini, resizes with `sharp`, stores in Vercel Blob.
2. Every subsequent request → 302 redirect to the cached CDN URL. Gemini is never called again.
3. Same URL always returns the same image. Pages stay stable across reloads and deploys.

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/yourorg/banana-stand
cd banana-stand
npm install
```

### 2. Set environment variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob token (from your Vercel project) |
| `IMAGE_MODEL` | No | Override default model (see below) |
| `GEN_TOKEN` | No | Shared secret to protect cache-miss generation |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL — enables freemium daily quotas |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token |
| `FREE_DAILY_LIMIT` | No | Free-tier daily generation cap (default 5) |
| `PREMIUM_DAILY_LIMIT` | No | Premium-tier daily cap (default 1000) |

### 3. Run locally

```bash
npm run dev
```

### 4. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yohdev/banana-stand&env=GEMINI_API_KEY,BLOB_READ_WRITE_TOKEN&envDescription=Gemini%20API%20key%20and%20Vercel%20Blob%20token)

The deploy flow prompts for `GEMINI_API_KEY` and `BLOB_READ_WRITE_TOKEN` up front — Vercel stores them server-side and never echoes the values back. Vercel Blob is provisioned automatically when you add the Blob storage integration.

---

## API

### `GET /i/{width}x{height}` — source URL (hero feature)

Returns a **302** redirect to the cached image. Use directly in `<img src>`.

| Parameter | Required | Default | Notes |
|---|---|---|---|
| `prompt` | Yes | — | URL-encoded image description (max 1000 chars) |
| `style` | No | `web` | Prompt preset: `web`, `photographic` |
| `seed` | No | `0` | Integer — change to get a different image for the same prompt |
| `fmt` | No | `webp` | `webp`, `jpeg`, or `png` |
| `q` | No | `82` | Quality 1–100 (ignored for png) |

Dimension constraints: 64–2048 per side, max ~4 megapixels total.

### `POST /api/generate` — programmatic

```json
{
  "prompt": "modern fintech dashboard hero",
  "width": 1200,
  "height": 600,
  "style": "photographic",
  "seed": 0,
  "format": "webp",
  "quality": 82
}
```

Response:
```json
{
  "url": "https://blob.vercel-storage.com/cache/abc123.webp",
  "cached": false,
  "width": 1200,
  "height": 600,
  "model": "gemini-2.0-flash-preview-image-generation",
  "id": "abc123..."
}
```

### `GET /api/health`

```json
{ "ok": true, "model": "gemini-2.0-flash-preview-image-generation" }
```

---

## Models

| Model | Use case |
|---|---|
| `gemini-2.0-flash-preview-image-generation` | Default — fast, cheap |

Set `IMAGE_MODEL` env var to override.

---

## Limits

- Dimensions: 64–2048 per side
- Total pixels: ~4 megapixels max
- Prompt length: 1000 characters max
- Cache misses: ~2–10s generation time (Vercel `maxDuration` set to 60s)
- Cache hits: ~150ms (CDN redirect)

---

## Freemium & rate limiting

Optional daily quotas, off by default. To enable, provision a free [Upstash Redis](https://console.upstash.com) database and set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.

- **Free tier** (default 5/day, by IP) — set with `FREE_DAILY_LIMIT`.
- **Premium tier** (default 1000/day, by `x-api-key` header) — set with `PREMIUM_DAILY_LIMIT`.
- **Cache hits are never metered.** Only real Gemini generations (cache misses) count against quota, so already-embedded `<img>` tags on live pages never break.

Every response exposes quota state so a client can render "N images left today":

```
X-Cache: HIT | MISS
X-Usage-Remaining: 3
X-Daily-Limit: 5
X-Reset-At: 2026-06-07T00:00:00Z
X-Tier: free
```

Exceeding the limit returns **429** with a JSON error and reset time. If Upstash is not configured, rate limiting fails open (unlimited).

Tier resolution lives in one stubbed function (`getTier` in `lib/ratelimit.ts`). Wiring in auth + Stripe later is a single-function change — see [`docs/freemium-rollout-spec.md`](docs/freemium-rollout-spec.md).

## Guardrails

- `GEN_TOKEN` — if set, `X-Gen-Token: <secret>` header required for new generations. Cache hits remain open so existing `<img>` tags keep working.
- Moderation hook at `lib/moderation.ts` — pluggable via `MODERATION_PROVIDER`:
  - `none` (default) — approves everything; fine for trusted self-host.
  - `keyword` — zero-dependency denylist, customize with `MODERATION_DENYLIST`.
  - `openai` — OpenAI Moderation API (free), set `OPENAI_API_KEY`.
  - Providers fail **open** by default; set `MODERATION_FAIL_CLOSED=true` to reject on outage. Recommended: `openai` for any public instance.
- Stampede note: two simultaneous cache misses for the same key may both generate. Idempotent by design. Redis lock is a fast-follow.

---

## AI disclosure

All images are generated by Google Gemini and carry an invisible SynthID watermark. Do not present them as authentic photography.

---

## License

MIT
