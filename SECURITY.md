# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Describe the issue, steps to reproduce, and potential impact.

We'll acknowledge your report as soon as we can and keep you updated on the fix.
Please give us a reasonable window to address the issue before any public
disclosure.

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |

## Operational security notes

Banana Stand is self-hosted — each deployer is responsible for their own
instance. A few things to keep safe:

- **`GEN_TOKEN`** — if set, it gates all new (paid) image generation. Treat it as
  a secret. **Rotate it immediately if it's ever exposed** (e.g. pasted into a
  chat or commit) by updating the env var in your host and redeploying.
- **`GOOGLE_CLOUD_CREDENTIALS` / `BLOB_READ_WRITE_TOKEN`** — server-only secrets.
  Never commit them; `.env*` is gitignored. They are never exposed to the client.
- **Billing** — watch your Vertex AI and Vercel Blob usage. Cache hits are free;
  cache misses call Gemini. `GEN_TOKEN` is your main lever against cost abuse on a
  public instance.
