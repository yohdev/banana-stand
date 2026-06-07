// Pluggable moderation hook. Selected via MODERATION_PROVIDER env var:
//   "none"    (default) — approve everything (self-host friendly)
//   "keyword"           — zero-dependency denylist, configurable via MODERATION_DENYLIST
//   "openai"            — OpenAI Moderation API (free); needs OPENAI_API_KEY
//
// Providers fail OPEN by default (a provider outage should not take the whole
// service down). Set MODERATION_FAIL_CLOSED=true to reject on provider error.

export interface ModerationResult {
  blocked: boolean;
  reason?: string;
}

type Provider = "none" | "keyword" | "openai";

const DEFAULT_DENYLIST = [
  "child",
  "csam",
  "underage",
  "minor",
  "gore",
  "beheading",
  "terrorist",
  "bomb making",
];

function failClosed(): boolean {
  return process.env.MODERATION_FAIL_CLOSED === "true";
}

function denylist(): string[] {
  const custom = process.env.MODERATION_DENYLIST;
  if (custom) {
    return custom
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_DENYLIST;
}

function keywordCheck(prompt: string): ModerationResult {
  const lower = prompt.toLowerCase();
  const hit = denylist().find((term) => term && lower.includes(term));
  return hit ? { blocked: true, reason: "prompt matched denylist" } : { blocked: false };
}

async function openaiCheck(prompt: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Misconfigured: provider requested but no key. Honor fail mode.
    return { blocked: failClosed(), reason: failClosed() ? "moderation misconfigured" : undefined };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: prompt }),
    });

    if (!res.ok) {
      console.error("[moderation] OpenAI returned", res.status);
      return { blocked: failClosed(), reason: failClosed() ? "moderation unavailable" : undefined };
    }

    const data = (await res.json()) as { results?: Array<{ flagged?: boolean; categories?: Record<string, boolean> }> };
    const result = data.results?.[0];
    if (result?.flagged) {
      const cats = result.categories
        ? Object.entries(result.categories)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : [];
      return { blocked: true, reason: `flagged: ${cats.join(", ") || "policy violation"}` };
    }
    return { blocked: false };
  } catch (err) {
    console.error("[moderation] OpenAI error:", err);
    return { blocked: failClosed(), reason: failClosed() ? "moderation error" : undefined };
  }
}

export async function moderatePrompt(prompt: string): Promise<ModerationResult> {
  const provider = (process.env.MODERATION_PROVIDER ?? "none") as Provider;

  switch (provider) {
    case "keyword":
      return keywordCheck(prompt);
    case "openai":
      return openaiCheck(prompt);
    case "none":
    default:
      return { blocked: false };
  }
}
