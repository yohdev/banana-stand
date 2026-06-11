# Banana Stand — AI Placeholder Image API

> "There's always money in the banana stand."

An open-source, AI-powered placeholder image service. Write a URL, get an image — generated once by Google Gemini (via Vertex AI), cached forever on a CDN.

```html
<img src="https://bananastandai.com/i/1200x600?prompt=modern+fintech+dashboard+hero&style=photographic" />
```

No SDK, no API keys in your page, no JavaScript. Just a URL in an `<img>` tag.

**Live instance:** [bananastandai.com](https://bananastandai.com) · **Docs:** [bananastandai.com/docs](https://bananastandai.com/docs) · **Contributors & roadmap:** [bananastandai.com/contributors](https://bananastandai.com/contributors)

---

## How it works

1. First request for a given prompt + dimensions → calls Gemini, resizes with `sharp`, stores in Vercel Blob.
2. Every subsequent request → **302** redirect to the cached CDN URL. Gemini is never called again.
3. Same URL always returns the same image. Pages stay stable across reloads and deploys.

The Blob pathname is a deterministic hash of the inputs, so it doubles as the cache index — no separate datastore.

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/yohdev/banana-stand
cd banana-stand
npm install
```

### 2. Set environment variables

Copy `.env.local.example` to `.env.local` and fill it in:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CLOUD_CREDENTIALS` | **Yes** | Service-account JSON (one line) for Vertex AI. Console → IAM & Admin → Service Accounts → Keys → Add Key → JSON. Vertex bills through standard Google Cloud billing. |
| `BLOB_READ_WRITE_TOKEN` | **Yes** | Vercel Blob token (from your Vercel project's Blob store). |
| `GOOGLE_CLOUD_PROJECT` | No | GCP project id. Defaults to the `project_id` in the credentials JSON. |
| `VERTEX_LOCATION` | No | Vertex region. Default `us-central1` (widest image-model capacity). |
| `IMAGE_MODEL` | No | Override the image model. Default `gemini-2.5-flash-image`. |
| `GEN_TOKEN` | No | Shared secret that gates **new** image generation. See [Access control](#access-control). |
| `MODERATION_PROVIDER` | No | `none` (default), `keyword`, or `openai`. See [Moderation](#moderation). |
| `MODERATION_FAIL_CLOSED` | No | `true` to reject generation when the moderation provider errors. Default fails open. |
| `MODERATION_DENYLIST` | No | Comma-separated terms for the `keyword` provider (overrides the built-in list). |
| `OPENAI_API_KEY` | No | Required only when `MODERATION_PROVIDER=openai`. |
| `NEXT_PUBLIC_BASE_URL` | No | Public base URL of your deploy. Sets Open Graph metadata and the default host shown in copy-paste snippets. |
| `GITHUB_TOKEN` | No | Raises the GitHub API rate limit for the `/contributors` page. Unauthenticated works (60 req/hr/IP). |

> Auth is **Vertex AI via a service account** — there is no `GEMINI_API_KEY`. The Google Gen AI SDK handles auth from the credentials JSON.

### 3. Run locally

```bash
npm run dev
```

> Without `GOOGLE_CLOUD_CREDENTIALS` + `BLOB_READ_WRITE_TOKEN`, the app still runs — the demo images just show their "warming up" shimmer state instead of generating. That's expected. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full dev setup.

### 4. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yohdev/banana-stand&env=GOOGLE_CLOUD_CREDENTIALS,BLOB_READ_WRITE_TOKEN,GEN_TOKEN&envDescription=Vertex%20AI%20service-account%20JSON%2C%20Vercel%20Blob%20token%2C%20and%20a%20GEN_TOKEN%20secret%20to%20gate%20generation&envLink=https://github.com/yohdev/banana-stand#access-control)

> **Set `GEN_TOKEN` to a strong secret for any public deploy.** Without it, anyone can run up generation cost against your instance — see [Access control](#access-control). The deploy prompt includes it; you can leave it blank for a private/self-host instance.

The deploy flow prompts for `GOOGLE_CLOUD_CREDENTIALS` and `BLOB_READ_WRITE_TOKEN` — Vercel stores them server-side and never echoes the values back. Add a Vercel Blob store to provision `BLOB_READ_WRITE_TOKEN`.

---

## API

### `GET /i/{width}x{height}` — source URL (the hero feature)

Returns a **302** redirect to the cached image. Use directly in `<img src>` or CSS `background-image`.

| Parameter | Required | Default | Notes |
|---|---|---|---|
| `prompt` | Yes | — | URL-encoded image description (max 1000 chars) |
| `style` | No | `web` | Prompt preset (see [Styles](#styles)) |
| `seed` | No | `0` | Integer — change to get a different image for the same prompt |
| `fmt` | No | `webp` | `webp`, `jpeg`, or `png` |
| `q` | No | `82` | Quality 1–100 (ignored for png) |

Dimension constraints: 64–2048 per side, ~4 megapixels max.

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
  "model": "gemini-2.5-flash-image",
  "id": "abc123..."
}
```

### `GET /api/health`

```json
{ "ok": true, "model": "gemini-2.5-flash-image" }
```

---

## Styles

A server-side prompt layer turns terse prompts into clean web imagery. Select with `style=`:

| Style | Description |
|---|---|
| `web` | _(default)_ Clean, modern, neutral. Reads well behind overlaid copy. |
| `photographic` | Realistic photo style, natural lighting. |
| `illustration` | Flat / semi-flat digital illustration. |
| `abstract` | Flowing shapes, decorative backgrounds. |
| `3d` | Photoreal 3D render, studio lighting. |
| `minimal` | Ample white space, muted palette. |

Presets live in `lib/prompts.ts` — one file, easy to tune.

---

## Access control

New image generation (a cache **miss**) calls Gemini and costs money. To stop others from running up that cost on your instance, set `GEN_TOKEN`:

- **`GEN_TOKEN` unset** _(default, self-host)_ — anyone can generate. Fine for a private/local instance.
- **`GEN_TOKEN` set** _(recommended for any public instance)_ — a cache miss requires a matching `X-Gen-Token` header, or it returns **401**. **Cache hits stay open** with no token, so images you've already generated keep serving to everyone.

```bash
# Generate a new image (only works with the secret)
curl -H "X-Gen-Token: $GEN_TOKEN" \
  "https://bananastandai.com/i/1200x600?prompt=team+in+a+bright+office"
```

Because cache hits are open, the workflow for a public instance is: **you** pre-warm the URLs you want public (once, with the token); everyone else gets fast cache hits. Uncached prompts from other visitors return 401 instead of generating.

> The hosted instance at **bananastandai.com** runs with `GEN_TOKEN` set, so only the maintainer can trigger new generations. To generate your own images freely, deploy your own instance (one click above).

---

## Moderation

A pluggable hook runs before every generation (`lib/moderation.ts`), selected via `MODERATION_PROVIDER`:

- `none` _(default)_ — approve everything; fine for a trusted self-host.
- `keyword` — zero-dependency denylist, customize with `MODERATION_DENYLIST`.
- `openai` — OpenAI Moderation API (free); set `OPENAI_API_KEY`.

Providers fail **open** by default. Set `MODERATION_FAIL_CLOSED=true` to reject on a provider outage. Recommended: `openai` for any public instance.

---

## Limits

- Dimensions: 64–2048 per side, ~4 megapixels max
- Prompt length: 1000 characters max
- Cache misses: ~2–10s generation time (Vercel `maxDuration` set to 60s)
- Cache hits: ~150ms (CDN redirect)
- Stampede note: two simultaneous misses for the same key may both generate. Idempotent by design.

---

## AI disclosure

All images are generated by Google Gemini and carry an invisible SynthID watermark. They make great placeholders — **do not present them as authentic photography.**

---

## Contributing

Banana Stand is open source and contributions are welcome. The current contributors and roadmap live at [`/contributors`](https://bananastandai.com/contributors). Open an issue or a PR on [GitHub](https://github.com/yohdev/banana-stand) — the roadmap items are great places to start.

### In-app feedback form

`/feedback` lets users open a GitHub issue (labeled `feedback`) directly from the site. It's **disabled by default** — `POST /api/feedback` returns `503` until you provide a write-scoped token. A honeypot field and length/type validation guard against spam.

**Enabling it (token setup):**

1. Generate a GitHub token with permission to create issues in `FEEDBACK_REPO` (defaults to `yohdev/banana-stand`):
   - **Fine-grained PAT** (recommended) — [github.com/settings/tokens?type=beta](https://github.com/settings/personal-access-tokens/new): set **Resource owner** to the org/user that owns the repo, **Repository access → Only select repositories → `banana-stand`**, and under **Repository permissions** set **Issues → Read and write**. (That permission implies the required `metadata: read`.)
   - **Classic PAT** alternative — [github.com/settings/tokens/new](https://github.com/settings/tokens/new): scope `public_repo` for a public repo, or `repo` for a private one.
2. Add it to your deploy as `GITHUB_FEEDBACK_TOKEN` (mark it **Sensitive** in Vercel → Settings → Environment Variables → Production), then redeploy.
3. Keep this **separate** from the read-only `GITHUB_TOKEN` used by `/contributors` — the feedback token needs write access, so it shouldn't be reused for read-only calls.

To open issues in a different repo, set `FEEDBACK_REPO=owner/repo` and ensure the token has access to it.

---

## License

MIT
