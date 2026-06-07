"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import CopyButton from "../components/CopyButton";

const GITHUB_URL = "https://github.com/yohdev/banana-stand";

function Code({ children, label = "Copy" }: { children: string; label?: string }) {
  return (
    <div className="codeblock" style={{ margin: "12px 0" }}>
      <div className="copy-affordance">
        <CopyButton text={children} label={label} />
      </div>
      <pre>{children}</pre>
    </div>
  );
}

const NAV = [
  {
    label: "Getting started",
    links: [
      { href: "#quickstart", text: "Quick start" },
      { href: "#url", text: "The URL pattern" },
    ],
  },
  {
    label: "Reference",
    links: [
      { href: "#params", text: "Parameters" },
      { href: "#styles", text: "Styles" },
      { href: "#json", text: "JSON API" },
      { href: "#health", text: "Health" },
    ],
  },
  {
    label: "Guides",
    links: [
      { href: "#claude", text: "Using with Claude Code" },
      { href: "#access", text: "Access control" },
      { href: "#caching", text: "Caching & limits" },
    ],
  },
];

const PARAMS: [string, string, string, string][] = [
  ["prompt", "yes", "—", "Image description, max 1000 chars"],
  ["style", "no", "web", "Visual preset — see Styles"],
  ["seed", "no", "0", "Change for a different image, same prompt"],
  ["fmt", "no", "webp", "webp | jpeg | png"],
  ["q", "no", "82", "Quality 1–100 (ignored for png)"],
];

const STYLES: [string, string][] = [
  ["web", "Default — neutral, clean, professional. Reads well behind text."],
  ["photographic", "Realistic photo style, natural lighting."],
  ["illustration", "Flat / semi-flat digital illustration."],
  ["abstract", "Flowing shapes, decorative backgrounds."],
  ["3d", "Photoreal 3D render, studio lighting."],
  ["minimal", "Ample white space, muted palette."],
];

export default function DocsPage() {
  const [base, setBase] = useState("https://your-instance.vercel.app");

  useEffect(() => {
    setBase(window.location.origin);
  }, []);

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <a href="/" className="brand">
            <span aria-hidden="true">🍌</span> Banana Stand
          </a>
          <nav className="nav-links">
            <a className="navlink" href="/">
              Home
            </a>
            <a className="navlink" href={GITHUB_URL}>
              GitHub
            </a>
            <a className="btn btn-accent keep" href="/contributors">
              Contributors
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="docs">
        {/* sidebar */}
        <aside className="docs-side" aria-label="Docs navigation">
          {NAV.map((group) => (
            <div key={group.label}>
              <div className="group-label">{group.label}</div>
              {group.links.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.text}
                </a>
              ))}
            </div>
          ))}
        </aside>

        {/* content */}
        <main className="docs-content">
          <div className="docs-hero">
            <span className="eyebrow">Documentation</span>
            <h1 className="display" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", marginBottom: 12 }}>
              API reference
            </h1>
            <p className="lede" style={{ maxWidth: "60ch" }}>
              AI placeholder images from a URL. Drop a link into an{" "}
              <code>&lt;img&gt;</code> tag and get a contextually appropriate,
              web-ready image — generated once, cached forever on a CDN.
            </p>
            <div className="callout" style={{ marginTop: 20 }}>
              <span aria-hidden="true">🔗</span>
              <span>
                Base URL for this instance: <code>{base}</code>
              </span>
            </div>
          </div>

          {/* Quick start */}
          <section id="quickstart">
            <h2>Quick start</h2>
            <p>Paste this into any HTML page and an image appears — no API key, no JavaScript:</p>
            <Code>{`<img src="${base}/i/1200x600?prompt=modern+fintech+dashboard+hero&style=photographic" />`}</Code>
            <p>
              That&apos;s the entire integration. The first load generates the image; every load
              after is an instant CDN cache hit.
            </p>
          </section>

          {/* URL pattern */}
          <section id="url">
            <h2>The URL pattern</h2>
            <Code>{`${base}/i/{width}x{height}?prompt={description}&style={style}`}</Code>
            <ul>
              <li>
                <code>{"{width}x{height}"}</code> — exact pixel dimensions, e.g. <code>1200x600</code>
              </li>
              <li>
                <code>prompt</code> — what the image should show (URL-encode spaces as <code>+</code>)
              </li>
              <li>
                <code>style</code> — optional visual preset (see below)
              </li>
            </ul>
          </section>

          {/* Parameters */}
          <section id="params">
            <h2>Parameters</h2>
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Param</th>
                    <th>Required</th>
                    <th>Default</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {PARAMS.map(([p, r, d, n]) => (
                    <tr key={p}>
                      <td><code>{p}</code></td>
                      <td>{r === "yes" ? <span className="tag">required</span> : "no"}</td>
                      <td><code>{d}</code></td>
                      <td>{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: "0.9rem", marginTop: 12 }}>
              Dimensions are clamped to 64–2048 per side, ~4 megapixels max.
            </p>
          </section>

          {/* Styles */}
          <section id="styles">
            <h2>Styles</h2>
            <p>
              A server-side prompt layer turns terse prompts into clean web imagery. Select with{" "}
              <code>style=</code>:
            </p>
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Style</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {STYLES.map(([s, d]) => (
                    <tr key={s}>
                      <td><code>{s}</code></td>
                      <td>{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Examples</h3>
            <Code>{`<!-- Hero banner -->
<img src="${base}/i/1600x700?prompt=modern+SaaS+product+hero+dashboard&style=photographic" />

<!-- Team / about photo -->
<img src="${base}/i/800x600?prompt=diverse+team+collaborating+in+bright+office&style=photographic" />

<!-- CSS background -->
.hero {
  background-image: url("${base}/i/1920x1080?prompt=abstract+blue+gradient+tech+background&style=abstract");
  background-size: cover;
}

<!-- Different image, same prompt -->
${base}/i/600x400?prompt=coffee+shop+interior&seed=2`}</Code>
          </section>

          {/* JSON API */}
          <section id="json">
            <h2>JSON API</h2>
            <p>When you want the URL handed back instead of generating on load:</p>
            <Code>{`curl -X POST ${base}/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "modern fintech dashboard hero",
    "width": 1200,
    "height": 600,
    "style": "photographic"
  }'`}</Code>
            <p>Response:</p>
            <Code label="Copy">{`{
  "url": "https://...blob.vercel-storage.com/cache/abc123.webp",
  "cached": false,
  "width": 1200,
  "height": 600,
  "model": "gemini-2.5-flash-image",
  "id": "abc123..."
}`}</Code>
          </section>

          {/* Health */}
          <section id="health">
            <h2>Health</h2>
            <p>Liveness check and the active model:</p>
            <Code>{`curl ${base}/api/health
# → { "ok": true, "model": "gemini-2.5-flash-image" }`}</Code>
          </section>

          {/* Claude Code */}
          <section id="claude">
            <h2>Using with Claude Code</h2>
            <p>
              Drop this into your project&apos;s <code>CLAUDE.md</code> and Claude Code uses Banana
              Stand automatically whenever it adds images:
            </p>
            <Code label="Copy snippet">{`# Placeholder Images

For placeholder images on this site, use the Banana Stand API.
Write image URLs as:

${base}/i/{width}x{height}?prompt={url-encoded+description}&style=photographic

Place them directly in <img src> or CSS background-image. Choose
dimensions that match the layout slot. Same prompt + size always
returns the same cached image, so reuse URLs for stable pages.

Styles: web (default), photographic, illustration, abstract, 3d, minimal.
Tips: encode spaces as +, add &seed=2 for a variant.`}</Code>
            <p className="muted" style={{ fontSize: "0.92rem" }}>
              No SDK, no keys in the page. Claude writes the URL, the page renders, the service does
              the rest.
            </p>
          </section>

          {/* Access control */}
          <section id="access">
            <h2>Access control</h2>
            <p>
              Generating a new image calls Gemini and costs money. Set a <code>GEN_TOKEN</code> env
              var on your instance to gate new generations:
            </p>
            <ul>
              <li>
                <strong>Cache hits</strong> are always open — already-generated URLs serve to
                anyone, no token. Embedded <code>&lt;img&gt;</code> tags never break.
              </li>
              <li>
                <strong>Cache misses</strong> require a matching <code>X-Gen-Token</code> header
                when <code>GEN_TOKEN</code> is set, otherwise they return <code>401</code>.
              </li>
            </ul>
            <Code>{`# Generating a new image only works with the secret
curl -H "X-Gen-Token: YOUR_SECRET" \\
  "${base}/i/1200x600?prompt=team+in+a+bright+office"`}</Code>
            <div className="callout">
              <span aria-hidden="true">🔒</span>
              <span>
                Set <code>GEN_TOKEN</code> in your Vercel project (Production scope) and redeploy.
                Leave it unset for a private/self-host instance where anyone may generate.
              </span>
            </div>
          </section>

          {/* Caching & limits */}
          <section id="caching">
            <h2>Caching &amp; limits</h2>
            <ul>
              <li>
                <strong>Deterministic:</strong> same params → same image, forever. Pages stay
                stable across reloads and deploys.
              </li>
              <li>
                <strong>Cache hits</strong> are instant CDN redirects (~150ms) and don&apos;t call
                Gemini.
              </li>
              <li>
                <strong>Cache misses</strong> generate in ~2–10s, then are cached.
              </li>
              <li>
                <strong>Generation control:</strong> set <code>GEN_TOKEN</code> to require{" "}
                <code>X-Gen-Token</code> on new generations (see{" "}
                <a href="#access" style={{ borderBottom: "1px solid var(--border)" }}>
                  Access control
                </a>
                ). Cache hits are always open.
              </li>
            </ul>
            <div className="disclosure" style={{ marginTop: 16 }}>
              ⚠️ Images are AI-generated and carry an invisible SynthID watermark. Don&apos;t present
              them as authentic photography.
            </div>
          </section>

          <p className="muted" style={{ marginTop: 48, display: "flex", gap: 18 }}>
            <a href="/test" style={{ borderBottom: "1px solid var(--border)" }}>
              Try the test page →
            </a>
            <a href={GITHUB_URL} style={{ borderBottom: "1px solid var(--border)" }}>
              View on GitHub →
            </a>
          </p>
        </main>
      </div>
    </>
  );
}
