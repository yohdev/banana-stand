"use client";

import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import CopyButton from "../components/CopyButton";

const GITHUB_URL = "https://github.com/yohdev/banana-stand";

interface GeneratedImage {
  prompt: string;
  url: string;
  cached: boolean;
  width: number;
  height: number;
  cacheHeader: string;
  error?: string;
}

const TEST_PROMPTS = [
  { prompt: "serene mountain lake at sunset", width: 800, height: 500, style: "photographic" },
  { prompt: "modern tech startup office", width: 600, height: 600, style: "web" },
  { prompt: "abstract flowing digital waves", width: 1000, height: 400, style: "abstract" },
];

export default function TestPage() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [genToken, setGenToken] = useState("");

  async function generate() {
    setLoading(true);
    setImages([]);

    for (let idx = 0; idx < TEST_PROMPTS.length; idx++) {
      const { prompt, width, height, style } = TEST_PROMPTS[idx];
      setStatus(`Generating ${idx + 1} of ${TEST_PROMPTS.length}…`);

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (genToken) headers["x-gen-token"] = genToken;

        const res = await fetch("/api/generate", {
          method: "POST",
          headers,
          body: JSON.stringify({ prompt, width, height, style, format: "webp", quality: 82 }),
        });
        const data = (await res.json()) as Record<string, unknown>;

        setImages((prev) => [
          ...prev,
          {
            prompt,
            url: (data.url as string) ?? "",
            cached: (data.cached as boolean) ?? false,
            width: (data.width as number) ?? width,
            height: (data.height as number) ?? height,
            cacheHeader: res.headers.get("x-cache") ?? ((data.cached as boolean) ? "HIT" : "MISS"),
            error: !res.ok ? ((data.error as string) ?? `HTTP ${res.status}`) : undefined,
          },
        ]);

        if (idx < TEST_PROMPTS.length - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err) {
        setImages((prev) => [
          ...prev,
          {
            prompt,
            url: "",
            cached: false,
            width,
            height,
            cacheHeader: "",
            error: err instanceof Error ? err.message : "Unknown error",
          },
        ]);
      }
    }

    setLoading(false);
    setStatus("");
  }

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
            <a className="navlink" href="/docs">
              Docs
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container section-tight">
        <span className="eyebrow">MVP test</span>
        <h1 className="display" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", marginBottom: 12 }}>
          Test the API.
        </h1>
        <p className="lede" style={{ marginBottom: 28 }}>
          Generate three images, inspect the responses, and watch caching work.
        </p>

        {/* Controls */}
        <div className="card" style={{ padding: 20, marginBottom: 36, maxWidth: 560 }}>
          <div className="field" style={{ marginTop: 0 }}>
            <label htmlFor="gentoken">
              GEN_TOKEN <span className="muted">(if your instance requires it)</span>
            </label>
            <div className="field-row">
              <input
                id="gentoken"
                className="mono"
                type="password"
                autoComplete="off"
                value={genToken}
                onChange={(e) => setGenToken(e.target.value)}
                placeholder="Leave empty if not set on server"
              />
            </div>
          </div>
          <button
            type="button"
            className="btn btn-accent"
            onClick={generate}
            disabled={loading}
            style={{ marginTop: 16 }}
          >
            {loading ? status || "Generating…" : "Generate 3 test images"}
          </button>
          {loading && (
            <p className="muted" style={{ marginTop: 10, fontSize: "0.88rem" }}>
              Cache misses call Gemini and take a few seconds each.
            </p>
          )}
        </div>

        {/* Results */}
        {images.length > 0 && (
          <>
            <h2 style={{ marginBottom: 20 }}>Results</h2>
            <div
              className="people"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}
            >
              {images.map((img, idx) => (
                <div key={idx} className="card" style={{ padding: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <strong>Image {idx + 1}</strong>
                    <span className="tag">
                      {img.error ? "error" : img.cached ? "cached" : "new"}
                    </span>
                  </div>

                  {img.error ? (
                    <div className="disclosure" style={{ marginBottom: 0 }}>
                      ❌ {img.error}
                    </div>
                  ) : (
                    <>
                      <div
                        className="shot"
                        style={{ aspectRatio: `${img.width} / ${img.height}`, marginBottom: 12 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.prompt} />
                      </div>
                      <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                        <strong style={{ color: "var(--text)" }}>Prompt:</strong> {img.prompt}
                      </p>
                      <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 12 }}>
                        <strong style={{ color: "var(--text)" }}>
                          {img.width}×{img.height}
                        </strong>{" "}
                        · X-Cache: {img.cacheHeader}
                      </p>
                      <div className="codeblock">
                        <div className="copy-affordance">
                          <CopyButton text={img.url} label="Copy URL" />
                        </div>
                        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {`<img src="${img.url}" />`}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Info */}
        <div className="card feature" style={{ marginTop: 40, maxWidth: 680 }}>
          <h3 style={{ marginBottom: 10 }}>How it behaves</h3>
          <ul
            className="muted"
            style={{ paddingLeft: "1.1rem", lineHeight: 1.8, fontSize: "0.95rem" }}
          >
            <li>
              <strong style={{ color: "var(--text)" }}>Cache hits</strong> are instant and free —
              generate the same prompt twice to see <code>X-Cache: HIT</code>.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Cache misses</strong> call Gemini and take
              ~2–10s.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>GEN_TOKEN</strong> — if the server requires
              it and you don&apos;t supply it above, new generations return <code>401</code>.
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Moderation</strong> — blocked prompts return{" "}
              <code>400</code> before any Gemini call.
            </li>
          </ul>
        </div>
      </main>

      <footer className="footer" style={{ marginTop: 40 }}>
        <div className="container">
          <span style={{ display: "flex", gap: 18 }}>
            <a href="/">Home</a>
            <a href="/docs">Docs</a>
            <a href={GITHUB_URL}>GitHub</a>
          </span>
        </div>
      </footer>
    </>
  );
}
