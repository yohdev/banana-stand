import { NextRequest, NextResponse } from "next/server";
import { validateFeedback, labelsFor, issueBody, type FeedbackInput } from "@/lib/feedback";
import { logError } from "@/lib/log";

export const runtime = "nodejs";

const REPO = process.env.FEEDBACK_REPO ?? "yohdev/banana-stand";

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_FEEDBACK_TOKEN;
  if (!token) {
    // Fail safe: the form is disabled until a write-scoped token is configured.
    return NextResponse.json(
      { error: "Feedback submission is not configured on this instance." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  const result = validateFeedback(body as FeedbackInput);

  // Honeypot tripped — pretend success so bots get no signal, but create nothing.
  if (!result.ok && "spam" in result) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { title, body: text, type } = result.value;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body: issueBody(text, type),
        labels: labelsFor(type),
      }),
    });

    if (!res.ok) {
      // Surface GitHub's actual reason (server logs only) to make token/scope
      // problems diagnosable instead of an opaque "Unknown error".
      const detail = await res.text().catch(() => "");
      let ghMessage = "";
      try {
        ghMessage = (JSON.parse(detail) as { message?: string }).message ?? "";
      } catch {
        ghMessage = detail.slice(0, 200);
      }
      console.error(
        `[/api/feedback] GitHub issue create failed (status ${res.status}): ${ghMessage || "no message"}`
      );

      // 401/403 almost always means the token lacks issues:write on FEEDBACK_REPO.
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          {
            error:
              "The feedback token isn't authorized to create issues in this repo. Check that GITHUB_FEEDBACK_TOKEN has Issues: write access to " +
              REPO +
              ".",
          },
          { status: 502 }
        );
      }
      return NextResponse.json({ error: "Could not submit feedback right now." }, { status: 502 });
    }

    const issue = (await res.json()) as { html_url?: string; number?: number };
    return NextResponse.json(
      { ok: true, url: issue.html_url, number: issue.number },
      { status: 201 }
    );
  } catch (err) {
    logError("/api/feedback", err);
    return NextResponse.json({ error: "Could not submit feedback right now." }, { status: 502 });
  }
}
