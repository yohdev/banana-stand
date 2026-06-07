"use client";

import { useState } from "react";

interface GeneratedImage {
  prompt: string;
  url: string;
  cached: boolean;
  width: number;
  height: number;
  remaining: number;
  limit: number;
  resetAt: string;
  tier: string;
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
  const [loadingStatus, setLoadingStatus] = useState("");
  const [genToken, setGenToken] = useState("");

  async function generateImages() {
    setLoading(true);
    setImages([]);

    for (let i = 0; i < TEST_PROMPTS.length; i++) {
      const { prompt, width, height, style } = TEST_PROMPTS[i];
      setLoadingStatus(`Generating image ${i + 1} of ${TEST_PROMPTS.length}...`);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (genToken) headers["x-gen-token"] = genToken;

        const res = await fetch("/api/generate", {
          method: "POST",
          headers,
          body: JSON.stringify({ prompt, width, height, style, format: "webp", quality: 82 }),
        });

        const data = (await res.json()) as Record<string, unknown>;

        const img: GeneratedImage = {
          prompt,
          url: (data.url as string) ?? "",
          cached: (data.cached as boolean) ?? false,
          width: (data.width as number) ?? width,
          height: (data.height as number) ?? height,
          remaining: parseInt(res.headers.get("x-usage-remaining") ?? "0", 10),
          limit: parseInt(res.headers.get("x-daily-limit") ?? "0", 10),
          resetAt: res.headers.get("x-reset-at") ?? "",
          tier: res.headers.get("x-tier") ?? "free",
          error: !res.ok ? (data.error as string) : undefined,
        };

        setImages((prev) => [...prev, img]);

        // Wait 2 seconds between requests to avoid rate limits
        if (i < TEST_PROMPTS.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (err) {
        const img: GeneratedImage = {
          prompt,
          url: "",
          cached: false,
          width,
          height,
          remaining: 0,
          limit: 0,
          resetAt: "",
          tier: "free",
          error: err instanceof Error ? err.message : "Unknown error",
        };
        setImages((prev) => [...prev, img]);
      }
    }

    setLoading(false);
    setLoadingStatus("");
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      <h1>🧪 Banana Stand MVP Test</h1>
      <p>Generate 3 test images, inspect the API responses, and verify cache behavior.</p>

      <section style={{ background: "#f9f9f9", padding: "1rem", borderRadius: 8, marginBottom: "2rem" }}>
        <h2>Test Controls</h2>

        <label>
          <div style={{ marginBottom: 8 }}>
            <strong>GEN_TOKEN (optional)</strong>
          </div>
          <input
            type="password"
            value={genToken}
            onChange={(e) => setGenToken(e.target.value)}
            placeholder="Leave empty if not set on server"
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={generateImages}
            disabled={loading}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              background: loading ? "#ccc" : "#0070f3",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading && (
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  border: "3px solid rgba(255,255,255,0.3)",
                  borderTop: "3px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
            {loading ? loadingStatus : "Generate 3 Test Images"}
          </button>
          {loading && (
            <p style={{ marginTop: 8, fontSize: "0.9rem", color: "#666" }}>
              Requests are spaced out to avoid rate limits. Please wait...
            </p>
          )}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </section>

      {images.length > 0 && (
        <section>
          <h2>Results ({images.length})</h2>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            <strong>Quota info from last request:</strong> {images[images.length - 1].remaining} / {images[images.length - 1].limit} remaining, resets {new Date(images[images.length - 1].resetAt).toLocaleString()}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
              gap: "2rem",
            }}
          >
            {images.map((img, idx) => (
              <div key={idx} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", background: "#fafafa" }}>
                <h3 style={{ marginTop: 0 }}>
                  Image {idx + 1} {img.cached ? "🔄 (cached)" : "✨ (new)"}
                </h3>

                <p>
                  <strong>Prompt:</strong> {img.prompt}
                </p>
                <p>
                  <strong>Dimensions:</strong> {img.width}×{img.height}
                </p>

                {img.error ? (
                  <div style={{ background: "#fee", padding: 8, borderRadius: 4, color: "#c33" }}>
                    <strong>❌ Error:</strong> {img.error}
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        padding: 8,
                        marginBottom: "1rem",
                        maxHeight: 300,
                        overflow: "auto",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.prompt}
                        style={{ width: "100%", height: "auto", borderRadius: 4 }}
                      />
                    </div>

                    <details style={{ fontSize: "0.85rem" }}>
                      <summary style={{ cursor: "pointer", marginBottom: 8, fontWeight: "bold" }}>
                        API Response (click to expand)
                      </summary>
                      <pre
                        style={{
                          background: "#222",
                          color: "#0f0",
                          padding: "0.75rem",
                          borderRadius: 4,
                          overflow: "auto",
                          fontSize: "0.8rem",
                        }}
                      >
                        {JSON.stringify(
                          {
                            url: img.url,
                            cached: img.cached,
                            width: img.width,
                            height: img.height,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </details>

                    <details style={{ fontSize: "0.85rem", marginTop: 8 }}>
                      <summary style={{ cursor: "pointer", marginBottom: 8, fontWeight: "bold" }}>
                        Response Headers
                      </summary>
                      <pre
                        style={{
                          background: "#f5f5f5",
                          padding: "0.75rem",
                          borderRadius: 4,
                          overflow: "auto",
                          fontSize: "0.8rem",
                        }}
                      >
                        {[
                          `X-Cache: ${img.cached ? "HIT" : "MISS"}`,
                          `X-Usage-Remaining: ${img.remaining}`,
                          `X-Daily-Limit: ${img.limit}`,
                          `X-Reset-At: ${img.resetAt}`,
                          `X-Tier: ${img.tier}`,
                        ].join("\n")}
                      </pre>
                    </details>

                    <div style={{ marginTop: "1rem", background: "#efe", padding: "0.75rem", borderRadius: 4, fontSize: "0.9rem" }}>
                      <strong>✅ For Claude Code:</strong>
                      <code
                        style={{
                          display: "block",
                          background: "#fff",
                          padding: "0.5rem",
                          borderRadius: 2,
                          marginTop: 4,
                          wordBreak: "break-all",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                        }}
                      >
                        {img.url}
                      </code>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <section style={{ marginTop: "2rem", background: "#f0f8ff", padding: "1rem", borderRadius: 8 }}>
            <h3>🎯 How to use these URLs in Claude Code</h3>
            <p>Drop the URLs directly into your `&lt;img src&gt;` or CSS `background-image`. Same URL = same image (cached).</p>
            <p>
              <strong>Example:</strong>
            </p>
            <pre
              style={{
                background: "#fff",
                padding: "0.75rem",
                borderRadius: 4,
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
            >
              {`<img src="${images[0]?.url || "PLACEHOLDER_URL"}" alt="generated" />`}
            </pre>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              Try generating again — second requests for the same prompt will be cache hits (notice the `X-Cache: HIT` header and instant response).
            </p>
          </section>
        </section>
      )}

      <hr style={{ margin: "3rem 0", border: "none", borderTop: "1px solid #ddd" }} />

      <section style={{ fontSize: "0.9rem", color: "#666" }}>
        <h3>ℹ️ Test Info</h3>
        <ul>
          <li>
            <strong>Cache hits:</strong> Instant, count as 0 cost. Try the same prompt twice.
          </li>
          <li>
            <strong>Cache misses:</strong> Calls Gemini, takes 2–10 seconds.
          </li>
          <li>
            <strong>GEN_TOKEN:</strong> If set on the server and you don't provide it, you'll get 401 Unauthorized.
          </li>
          <li>
            <strong>Moderation:</strong> Blocked prompts return 400 before any Gemini call.
          </li>
          <li>
            <strong>Rate limits:</strong> Exceed your daily quota (free: 5/day by IP) → 429 Too Many Requests.
          </li>
        </ul>
      </section>
    </main>
  );
}
