# API reference (authenticated minting)

Base URL defaults to `https://bananastandai.com`; override with
`BANANA_STAND_BASE_URL`. The hosted instance runs with `GEN_TOKEN` set, so
**new** generations require the secret. Cache hits are always open.

## `POST /api/generate` — mint and get the URL back (preferred in Mode A)

Request body (JSON — note `format`/`quality`, not `fmt`/`q`):

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

Header for a brand-new image: `X-Gen-Token: <GEN_TOKEN>`.

Raw call (the token comes from the env; never hard-code or print it):

```bash
curl -fsS -X POST "$BASE/api/generate" \
  -H "Content-Type: application/json" \
  -H "X-Gen-Token: $GEN_TOKEN" \
  -d '{"prompt":"modern fintech dashboard hero","width":1200,"height":600,"style":"photographic"}'
```

`scripts/generate.sh` wraps exactly this and prints only the `url`.

Response (`200`):

```json
{
  "url": "https://...blob.vercel-storage.com/cache/abc123.webp",
  "cached": false,
  "width": 1200,
  "height": 600,
  "model": "gemini-2.5-flash-image",
  "id": "abc123..."
}
```

`cached: true` means it already existed (no Gemini call, no token needed). The
`url` is the stable CDN URL — that's what you hand to the user. You can also keep
serving via the `/i/...` URL, which 302-redirects to this same blob.

## `GET /i/{width}x{height}` — the source URL (drop straight into `<img>`)

`…/i/1200x600?prompt=…&style=…&seed=…&fmt=webp&q=82`. Returns a **302** redirect
to the cached image. On a cache **miss** it needs `X-Gen-Token` too (browsers
can't send that), which is why Mode A mints via the JSON endpoint first to warm
the cache; afterwards the plain `/i/...` URL serves to everyone.

## `GET /api/health`

```bash
curl "$BASE/api/health"
# → { "ok": true, "model": "gemini-2.5-flash-image" }
```

## Error codes

| Status | Meaning | What to do |
|---|---|---|
| `400` | Invalid JSON, empty/too-long prompt (>1000), or bad dimensions | Fix the prompt/size and retry |
| `401` | `GEN_TOKEN` missing or wrong on a cache miss | Can't mint here; fall back to Mode B (return the URL + warm note) |
| `429` | Upstream quota (the service retries with backoff internally) | Wait a bit and retry once or twice |
| `502` | Generation failed (e.g. blocked by moderation, or upstream error) | Reword the prompt or retry shortly |

Never print, log, or paste the value of `GEN_TOKEN`.
