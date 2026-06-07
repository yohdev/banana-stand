"use client";

import { useEffect, useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        padding: "4px 10px",
        fontSize: 12,
        background: copied ? "#16a34a" : "#333",
        color: "white",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function Code({ children }: { children: string }) {
  return (
    <div style={{ position: "relative", margin: "0.75rem 0" }}>
      <pre
        style={{
          background: "#1e1e1e",
          color: "#d4d4d4",
          padding: "1rem 1rem 1rem 1rem",
          paddingRight: "5rem",
          borderRadius: 8,
          overflowX: "auto",
          fontSize: "0.85rem",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        <code>{children}</code>
      </pre>
      <CopyButton text={children} />
    </div>
  );
}

export default function DocsPage() {
  const [base, setBase] = useState("https://your-instance.vercel.app");

  useEffect(() => {
    setBase(window.location.origin);
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 820, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
      <a href="/" style={{ color: "#0070f3", textDecoration: "none", fontSize: "0.9rem" }}>
        ← Back home
      </a>

      <h1 style={{ marginTop: "1rem" }}>🍌 Banana Stand — API Docs</h1>
      <p style={{ fontSize: "1.05rem", color: "#444" }}>
        AI placeholder images from a URL. Drop a link into an <code>&lt;img&gt;</code> tag and get a
        contextually appropriate, web-ready image — generated once, cached forever on a CDN.
      </p>

      {/* TOC */}
      <nav
        style={{
          background: "#f6f8fa",
          borderRadius: 8,
          padding: "1rem 1.25rem",
          margin: "1.5rem 0",
          fontSize: "0.95rem",
        }}
      >
        <strong>On this page</strong>
        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.9 }}>
          <li><a href="#quickstart" style={{ color: "#0070f3" }}>Quick start</a></li>
          <li><a href="#url" style={{ color: "#0070f3" }}>The URL pattern</a></li>
          <li><a href="#params" style={{ color: "#0070f3" }}>Parameters</a></li>
          <li><a href="#styles" style={{ color: "#0070f3" }}>Styles</a></li>
          <li><a href="#examples" style={{ color: "#0070f3" }}>Examples</a></li>
          <li><a href="#json" style={{ color: "#0070f3" }}>JSON API</a></li>
          <li><a href="#claude" style={{ color: "#0070f3" }}>Using with Claude Code</a></li>
          <li><a href="#caching" style={{ color: "#0070f3" }}>Caching &amp; limits</a></li>
        </ul>
      </nav>

      {/* Quick start */}
      <section id="quickstart">
        <h2>Quick start</h2>
        <p>Paste this into any HTML page and an image appears — no API key, no JavaScript:</p>
        <Code>{`<img src="${base}/i/1200x600?prompt=modern+fintech+dashboard+hero&style=photographic" />`}</Code>
        <p>That&apos;s the entire integration. The first load generates the image; every load after is an instant CDN cache hit.</p>
      </section>

      {/* URL pattern */}
      <section id="url">
        <h2>The URL pattern</h2>
        <Code>{`${base}/i/{width}x{height}?prompt={description}&style={style}`}</Code>
        <ul style={{ lineHeight: 1.8 }}>
          <li><code>{"{width}x{height}"}</code> — exact pixel dimensions, e.g. <code>1200x600</code></li>
          <li><code>prompt</code> — what the image should show (URL-encode spaces as <code>+</code>)</li>
          <li><code>style</code> — optional visual preset (see below)</li>
        </ul>
      </section>

      {/* Params */}
      <section id="params">
        <h2>Parameters</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "#f0f0f0", textAlign: "left" }}>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Param</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Required</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Default</th>
                <th style={{ padding: 8, border: "1px solid #ddd" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["prompt", "Yes", "—", "Image description, max 1000 chars"],
                ["style", "No", "web", "web | photographic"],
                ["seed", "No", "0", "Change for a different image, same prompt"],
                ["fmt", "No", "webp", "webp | jpeg | png"],
                ["q", "No", "82", "Quality 1–100 (ignored for png)"],
              ].map(([p, r, d, n]) => (
                <tr key={p}>
                  <td style={{ padding: 8, border: "1px solid #ddd" }}><code>{p}</code></td>
                  <td style={{ padding: 8, border: "1px solid #ddd" }}>{r}</td>
                  <td style={{ padding: 8, border: "1px solid #ddd" }}><code>{d}</code></td>
                  <td style={{ padding: 8, border: "1px solid #ddd" }}>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#666" }}>
          Dimensions are clamped to 64–2048 per side, ~4 megapixels max.
        </p>
      </section>

      {/* Styles */}
      <section id="styles">
        <h2>Styles</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li><code>web</code> <em>(default)</em> — neutral, clean, professional. Good behind text.</li>
          <li><code>photographic</code> — realistic photo style, natural lighting.</li>
        </ul>
      </section>

      {/* Examples */}
      <section id="examples">
        <h2>Examples</h2>

        <h3>Hero banner</h3>
        <Code>{`<img src="${base}/i/1600x700?prompt=modern+SaaS+product+hero+dashboard&style=photographic" />`}</Code>

        <h3>Team / about photo</h3>
        <Code>{`<img src="${base}/i/800x600?prompt=diverse+team+collaborating+in+bright+office&style=photographic" />`}</Code>

        <h3>CSS background</h3>
        <Code>{`.hero {
  background-image: url("${base}/i/1920x1080?prompt=abstract+blue+gradient+tech+background");
  background-size: cover;
}`}</Code>

        <h3>Different image, same prompt (seed)</h3>
        <Code>{`${base}/i/600x400?prompt=coffee+shop+interior&seed=2`}</Code>
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
        <Code>{`{
  "url": "https://...blob.vercel-storage.com/cache/abc123.webp",
  "cached": false,
  "width": 1200,
  "height": 600,
  "model": "gemini-2.5-flash-image",
  "id": "abc123..."
}`}</Code>
        <p style={{ fontSize: "0.9rem", color: "#444" }}>
          Health check: <code>GET {base}/api/health</code>
        </p>
      </section>

      {/* Claude Code */}
      <section id="claude">
        <h2>Using with Claude Code</h2>
        <p>
          Drop this snippet into your project&apos;s <code>CLAUDE.md</code> and Claude Code will use
          Banana Stand automatically whenever it adds images to a page:
        </p>
        <Code>{`# Placeholder Images

For placeholder images on this site, use the Banana Stand API.
Write image URLs as:

${base}/i/{width}x{height}?prompt={url-encoded+description}&style=photographic

Place them directly in <img src> or CSS background-image. Choose
dimensions that match the layout slot. Same prompt + size always
returns the same cached image, so reuse URLs for stable pages.

Styles: web (default), photographic.
Tips: encode spaces as +, add &seed=2 for a variant.`}</Code>
        <p style={{ fontSize: "0.9rem", color: "#444" }}>
          No SDK, no MCP, no keys in the page. Claude writes the URL, the page renders, the service
          does the rest.
        </p>
      </section>

      {/* Caching */}
      <section id="caching">
        <h2>Caching &amp; limits</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li><strong>Deterministic:</strong> same params → same image, forever. Pages stay stable across reloads and deploys.</li>
          <li><strong>Cache hits</strong> are instant CDN redirects (~150ms) and don&apos;t count against quota.</li>
          <li><strong>Cache misses</strong> generate in ~2–10s, then are cached.</li>
          <li><strong>Free tier:</strong> 5 new images/day per IP (if rate limiting is enabled). Cache hits are unlimited.</li>
        </ul>
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.85rem",
            color: "#666",
            borderTop: "1px solid #eee",
            paddingTop: "1rem",
          }}
        >
          ⚠️ Images are AI-generated and carry an invisible SynthID watermark. Don&apos;t present them
          as authentic photography.
        </p>
      </section>

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <a href="/test" style={{ color: "#0070f3" }}>🧪 Try the test page →</a>
        <a href="https://github.com/yohdev/banana-stand" style={{ color: "#0070f3" }}>View on GitHub →</a>
      </div>
    </main>
  );
}
