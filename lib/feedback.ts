// Pure validation shared by the feedback API route. No I/O, easy to unit test.

export const FEEDBACK_TYPES = ["bug", "feature", "other"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const BODY_MIN = 10;
export const BODY_MAX = 4000;

export interface FeedbackInput {
  title: string;
  body: string;
  type: string;
  /** Honeypot — must be empty for a real submission. */
  website?: string;
}

export interface ValidFeedback {
  title: string;
  body: string;
  type: FeedbackType;
}

export type FeedbackValidation =
  | { ok: true; value: ValidFeedback }
  | { ok: false; error: string }
  | { ok: false; spam: true };

export function isFeedbackType(s: string): s is FeedbackType {
  return (FEEDBACK_TYPES as readonly string[]).includes(s);
}

export function validateFeedback(input: FeedbackInput): FeedbackValidation {
  // Honeypot: a filled hidden field means a bot. Signal silent-drop.
  if (input.website && input.website.trim().length > 0) {
    return { ok: false, spam: true };
  }

  const title = (input.title ?? "").trim();
  const body = (input.body ?? "").trim();
  const type = (input.type ?? "").trim();

  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return { ok: false, error: `Title must be ${TITLE_MIN}–${TITLE_MAX} characters` };
  }
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return { ok: false, error: `Description must be ${BODY_MIN}–${BODY_MAX} characters` };
  }
  if (!isFeedbackType(type)) {
    return { ok: false, error: `Type must be one of: ${FEEDBACK_TYPES.join(", ")}` };
  }

  return { ok: true, value: { title, body, type } };
}

/** Map a feedback type to the GitHub labels applied to the created issue. */
export function labelsFor(type: FeedbackType): string[] {
  const byType: Record<FeedbackType, string> = {
    bug: "bug",
    feature: "enhancement",
    other: "question",
  };
  return ["feedback", byType[type]];
}

/** Build the issue body, appending a provenance footer. */
export function issueBody(body: string, type: FeedbackType): string {
  return `${body}\n\n---\n_Submitted via the in-app feedback form (type: ${type})._`;
}
