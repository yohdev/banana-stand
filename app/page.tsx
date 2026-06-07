export default function Home() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <h1>🍌 Banana Stand</h1>
      <p>
        AI placeholder image API. Drop a URL into an <code>&lt;img src&gt;</code> and get a
        contextually appropriate, web-ready image — generated once, cached forever.
      </p>

      <h2>Usage</h2>
      <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: 6, overflowX: "auto" }}>
        {`<img src="${base}/i/1200x600?prompt=modern+fintech+dashboard+hero&style=photographic" />`}
      </pre>

      <h2>Demo images</h2>
      <p>Generated on first request, served from CDN cache thereafter.</p>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <figure style={{ margin: 0 }}>
          <figcaption style={{ marginBottom: 4 }}>
            <strong>1200×600 — fintech hero (photographic)</strong>
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${base}/i/1200x600?prompt=modern+fintech+dashboard+hero&style=photographic`}
            alt="fintech hero placeholder"
            width={1200}
            height={600}
            style={{ width: "100%", height: "auto", borderRadius: 8 }}
          />
        </figure>

        <figure style={{ margin: 0 }}>
          <figcaption style={{ marginBottom: 4 }}>
            <strong>800×800 — team collaboration (web)</strong>
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${base}/i/800x800?prompt=team+collaborating+in+bright+modern+office`}
            alt="team collaboration placeholder"
            width={800}
            height={800}
            style={{ width: "100%", maxWidth: 400, height: "auto", borderRadius: 8 }}
          />
        </figure>

        <figure style={{ margin: 0 }}>
          <figcaption style={{ marginBottom: 4 }}>
            <strong>1600×900 — abstract tech background</strong>
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${base}/i/1600x900?prompt=abstract+gradient+tech+background&style=abstract`}
            alt="abstract background placeholder"
            width={1600}
            height={900}
            style={{ width: "100%", height: "auto", borderRadius: 8 }}
          />
        </figure>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <a href="/docs" style={{ flex: 1, minWidth: 220, background: "#0070f3", color: "white", padding: "1rem", borderRadius: 8, textDecoration: "none" }}>
          <strong>📖 Read the Docs</strong>
          <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: 4 }}>
            URL pattern, parameters, examples, Claude Code setup.
          </div>
        </a>
        <a href="/test" style={{ flex: 1, minWidth: 220, background: "#e8f4ff", color: "#0a3", padding: "1rem", borderRadius: 8, textDecoration: "none" }}>
          <strong style={{ color: "#0070f3" }}>🧪 Test the MVP</strong>
          <div style={{ fontSize: "0.85rem", color: "#444", marginTop: 4 }}>
            Generate 3 images, inspect API responses and caching.
          </div>
        </a>
      </div>

      <h2>API reference</h2>
      <ul>
        <li>
          <code>GET /i/&#123;width&#125;x&#123;height&#125;?prompt=...&amp;style=...&amp;fmt=...&amp;q=...&amp;seed=...</code>
          — returns 302 to cached image
        </li>
        <li>
          <code>POST /api/generate</code> — JSON body, returns{" "}
          <code>{"{ url, cached, width, height, model, id }"}</code>
        </li>
        <li>
          <code>GET /api/health</code> — liveness + active model
        </li>
      </ul>

      <p style={{ marginTop: "2rem", fontSize: "0.85rem", color: "#666" }}>
        ⚠️ Images are AI-generated and carry an invisible SynthID watermark. Do not present them as
        authentic photography.
      </p>
    </main>
  );
}
