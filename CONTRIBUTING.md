# Contributing to Banana Stand

Thanks for your interest in contributing! Banana Stand is an open-source AI
placeholder-image API. Contributions of all kinds are welcome — bug fixes,
features, docs, and ideas.

## Local setup

You'll need **Node 20+** (see `.nvmrc`) and npm.

```bash
git clone https://github.com/yohdev/banana-stand
cd banana-stand
npm install
cp .env.local.example .env.local   # fill in your own credentials
npm run dev                         # http://localhost:3000
```

To generate real images locally you need two credentials in `.env.local`:

- `GOOGLE_CLOUD_CREDENTIALS` — a Google Cloud service-account JSON for Vertex AI.
- `BLOB_READ_WRITE_TOKEN` — a Vercel Blob store token.

Without them the app still runs; the demo images just show their "warming up"
shimmer state. See the [README](README.md#2-set-environment-variables) for the
full list of environment variables.

## Validating your change

Before opening a PR, make sure these pass:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

CI runs the same two steps on every pull request.

## Submitting a PR

1. Fork the repo and create a branch: `git checkout -b fix/short-description`.
2. Make your change; keep it focused and match the surrounding code style.
3. Update docs (`README.md`, `/docs`) if you changed behavior or env vars.
4. Open a PR against `main` using the template, and link any related issue.

## Project layout

- `app/i/[dimensions]/` — the hero `GET /i/{w}x{h}` source-URL endpoint.
- `app/api/generate/` — the JSON `POST /api/generate` endpoint.
- `app/api/health/` — liveness + active model.
- `lib/` — the pipeline: `pipeline.ts` (resolve → cache lookup → generate),
  `generate.ts` (Vertex call + `sharp` resize), `storage.ts` (Vercel Blob),
  `cache-key.ts`, `prompts.ts` (style presets), `moderation.ts`.
- `app/` pages — the marketing site, `/docs`, `/test`, `/contributors`.

## Design notes (intentional behavior)

- **Deterministic cache key.** Identical inputs hash to the same Blob pathname,
  so the same URL always returns the same image. The Blob path *is* the index —
  there's no separate datastore.
- **Stampede.** Two simultaneous cache misses for the same key may both generate.
  This is acceptable and idempotent for now; a lock is a possible future addition.
- **Moderation is pluggable** (`lib/moderation.ts`) and fails *open* by default.
- **Generation is gated by `GEN_TOKEN`** when set; cache hits always stay open.

## Roadmap

Planned work lives on the [`/contributors`](https://bananastandai.com/contributors)
page. Those items are good places to start — open an issue to claim one.

## Reporting security issues

Please **do not** open public issues for vulnerabilities. See [SECURITY.md](SECURITY.md).

By contributing, you agree your contributions are licensed under the project's
[MIT License](LICENSE).
