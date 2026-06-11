"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import { FEEDBACK_TYPES, TITLE_MAX, BODY_MAX, type FeedbackType } from "../../lib/feedback";

const GITHUB_URL = "https://github.com/yohdev/banana-stand";

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Bug report",
  feature: "Feature request",
  other: "Other",
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; url?: string; number?: number }
  | { kind: "error"; message: string };

export default function FeedbackPage() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<FeedbackType>("bug");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, body, website }),
      });
      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        setStatus({ kind: "error", message: (data.error as string) ?? `HTTP ${res.status}` });
        return;
      }

      setStatus({ kind: "success", url: data.url as string, number: data.number as number });
      setTitle("");
      setBody("");
      setType("bug");
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Network error" });
    }
  }

  const submitting = status.kind === "submitting";

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <span aria-hidden="true">🍌</span> Banana Stand
          </Link>
          <nav className="nav-links">
            <Link className="navlink" href="/">
              Home
            </Link>
            <Link className="navlink" href="/docs">
              Docs
            </Link>
            <a className="navlink" href={GITHUB_URL}>
              GitHub
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container section-tight">
        <span className="eyebrow">Feedback</span>
        <h1 className="display" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", marginBottom: 12 }}>
          Send feedback.
        </h1>
        <p className="lede" style={{ marginBottom: 28 }}>
          Found a bug or have an idea? This opens a public issue in the project&apos;s GitHub repo.
        </p>

        {status.kind === "success" ? (
          <div className="card" style={{ padding: 24, maxWidth: 560 }}>
            <h2 style={{ marginTop: 0 }}>Thanks! 🎉</h2>
            <p>Your feedback was submitted.</p>
            {status.url && (
              <p>
                <a href={status.url} target="_blank" rel="noreferrer">
                  View issue #{status.number} on GitHub →
                </a>
              </p>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => setStatus({ kind: "idle" })}
              style={{ marginTop: 8 }}
            >
              Submit another
            </button>
          </div>
        ) : (
          <form className="card" style={{ padding: 24, maxWidth: 560 }} onSubmit={submit}>
            <div className="field" style={{ marginTop: 0 }}>
              <label htmlFor="type">Type</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as FeedbackType)}
                disabled={submitting}
              >
                {FEEDBACK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary"
                disabled={submitting}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="body">Description</label>
              <textarea
                id="body"
                value={body}
                maxLength={BODY_MAX}
                rows={6}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What happened, or what would you like to see?"
                disabled={submitting}
                required
              />
            </div>

            {/* Honeypot — hidden from humans, catches bots. */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {status.kind === "error" && (
              <div className="disclosure" style={{ marginTop: 12 }}>
                ❌ {status.message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-accent"
              disabled={submitting}
              style={{ marginTop: 16 }}
            >
              {submitting ? "Submitting…" : "Submit feedback"}
            </button>
          </form>
        )}

        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 20, maxWidth: 560 }}>
          Submissions are public and create a labeled issue in{" "}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            the GitHub repo
          </a>
          . Don&apos;t include sensitive information.
        </p>
      </main>
    </>
  );
}
