import type { Metadata } from "next";
import ThemeToggle from "../components/ThemeToggle";

// Pull live from GitHub on request (no network needed at build time).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contributors — Banana Stand",
  description: "The people building Banana Stand, and what's on the roadmap.",
};

const REPO = "yohdev/banana-stand";
const GITHUB_URL = `https://github.com/${REPO}`;

type GHContributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
};

type Person = {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "banana-stand-site",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

// Contributors to always feature, even before they've landed a commit.
const ENSURE_INCLUDED = ["furiouzzwill"];
// Contributors pinned to the end of the list, regardless of commit count.
const PIN_LAST = ["claude"];

async function fetchProfile(login: string): Promise<{
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
} | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${login}`, {
      headers: ghHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const u = (await res.json()) as {
      name?: string;
      bio?: string;
      avatar_url?: string;
      html_url?: string;
    };
    return {
      name: u.name ?? null,
      bio: u.bio ?? null,
      avatar_url: u.avatar_url ?? "",
      html_url: u.html_url ?? `https://github.com/${login}`,
    };
  } catch {
    return null;
  }
}

async function getContributors(): Promise<Person[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contributors?per_page=100`, {
      headers: ghHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const list = (await res.json()) as GHContributor[];
    const humans = list.filter((c) => c.type !== "Bot" && !c.login.endsWith("[bot]")).slice(0, 24);

    // Make sure featured contributors appear even if they're not committers yet.
    const present = new Set(humans.map((c) => c.login.toLowerCase()));
    const extras: GHContributor[] = ENSURE_INCLUDED.filter(
      (login) => !present.has(login.toLowerCase())
    ).map((login) => ({
      login,
      avatar_url: "",
      html_url: `https://github.com/${login}`,
      contributions: 0,
      type: "User",
    }));

    // Enrich everyone with name + bio (and avatar/url for manual extras).
    const people = await Promise.all(
      [...humans, ...extras].map(async (c): Promise<Person> => {
        const profile = await fetchProfile(c.login);
        return {
          login: c.login,
          name: profile?.name ?? null,
          bio: profile?.bio ?? null,
          avatar_url: c.avatar_url || profile?.avatar_url || "",
          html_url: c.html_url,
          contributions: c.contributions,
        };
      })
    );

    // Pin certain logins to the end; everyone else keeps contribution order.
    const isPinned = (p: Person) => PIN_LAST.some((l) => l.toLowerCase() === p.login.toLowerCase());
    const head = people.filter((p) => !isPinned(p));
    const tail = PIN_LAST.map((l) =>
      people.find((p) => p.login.toLowerCase() === l.toLowerCase())
    ).filter((p): p is Person => Boolean(p));

    return [...head, ...tail];
  } catch {
    return [];
  }
}

const ROADMAP = [
  {
    title: "User feedback → GitHub issues",
    body: "A lightweight intake so feedback from users lands as triaged GitHub issues instead of getting lost in a thread.",
  },
  {
    title: "Containerization & local dev",
    body: "A Docker setup and a documented local workflow so contributors can run Banana Stand end-to-end in minutes.",
  },
  {
    title: "Automated testing pipeline",
    body: "CI on the public repo that runs the test suite on every PR, keeping main green and releases trustworthy.",
  },
  {
    title: "MCP server",
    body: "A Model Context Protocol server so Claude can generate and pull Banana Stand images straight into chat, Cowork, or Code sessions from your input — it handles the API calls for you.",
  },
];

export default async function ContributorsPage() {
  const people = await getContributors();

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
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        {/* ---------- contributors ---------- */}
        <section className="section container">
          <span className="eyebrow">Contributors</span>
          <h1 className="display" style={{ marginBottom: 16 }}>
            Built by these humans.
          </h1>
          <p className="lede" style={{ marginBottom: 36 }}>
            Banana Stand is open source. This list is pulled live from the{" "}
            <a
              href={`${GITHUB_URL}/graphs/contributors`}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              GitHub repo
            </a>
            — every merged contribution shows up here.
          </p>

          {people.length === 0 ? (
            <div className="card feature" style={{ maxWidth: 560 }}>
              <h3 style={{ marginBottom: 6 }}>Couldn&apos;t load contributors right now</h3>
              <p className="muted">
                GitHub didn&apos;t respond (or rate-limited us). Refresh in a moment, or see the
                full list on{" "}
                <a
                  href={`${GITHUB_URL}/graphs/contributors`}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  GitHub
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="people">
              {people.map((p) => (
                <div key={p.login} className="card person">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="avatar"
                    src={`${p.avatar_url}${p.avatar_url.includes("?") ? "&" : "?"}s=112`}
                    alt={`${p.name ?? p.login} avatar`}
                    width={56}
                    height={56}
                    loading="lazy"
                  />
                  <div style={{ minWidth: 0 }}>
                    <div className="pname">{p.name ?? p.login}</div>
                    <div className="plogin">@{p.login}</div>
                    {p.bio && <p className="pbio">{p.bio}</p>}
                    <a className="pgh" href={p.html_url}>
                      GitHub profile →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------- roadmap ---------- */}
        <section className="section" style={{ background: "var(--surface-2)" }}>
          <div className="container">
            <span className="eyebrow">Roadmap</span>
            <h2 style={{ marginBottom: 10 }}>What&apos;s next.</h2>
            <p className="muted" style={{ maxWidth: "54ch", marginBottom: 32 }}>
              Where the project is headed. Want to take one on? Open an issue or a PR — these are
              great places to start.
            </p>
            <div className="grid-2">
              {ROADMAP.map((item) => (
                <div key={item.title} className="card roadmap-item">
                  <span className="tag">Planned</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="container">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                <span aria-hidden="true">🍌</span> Banana Stand — MIT licensed
              </span>
              <span style={{ display: "flex", gap: 18 }}>
                <a href="/">Home</a>
                <a href={GITHUB_URL}>GitHub</a>
                <a href="/docs">Docs</a>
              </span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
