import { describe, it, expect } from "vitest";
import { validateFeedback, labelsFor, issueBody, isFeedbackType } from "@/lib/feedback";

const ok = { title: "Broken link on docs", body: "The /docs page footer link 404s.", type: "bug" };

describe("isFeedbackType", () => {
  it("accepts known types and rejects others", () => {
    expect(isFeedbackType("bug")).toBe(true);
    expect(isFeedbackType("feature")).toBe(true);
    expect(isFeedbackType("other")).toBe(true);
    expect(isFeedbackType("spam")).toBe(false);
    expect(isFeedbackType("")).toBe(false);
  });
});

describe("validateFeedback", () => {
  it("accepts a well-formed submission and trims", () => {
    const r = validateFeedback({ ...ok, title: "  hello there  " });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.title).toBe("hello there");
      expect(r.value.type).toBe("bug");
    }
  });

  it("flags a filled honeypot as spam (silent drop)", () => {
    const r = validateFeedback({ ...ok, website: "http://spam.example" });
    expect(r).toEqual({ ok: false, spam: true });
  });

  it("rejects a too-short title", () => {
    const r = validateFeedback({ ...ok, title: "ab" });
    expect(r.ok).toBe(false);
    if (!r.ok && "error" in r) expect(r.error).toMatch(/Title/);
  });

  it("rejects a too-short body", () => {
    const r = validateFeedback({ ...ok, body: "short" });
    expect(r.ok).toBe(false);
    if (!r.ok && "error" in r) expect(r.error).toMatch(/Description/);
  });

  it("rejects an unknown type", () => {
    const r = validateFeedback({ ...ok, type: "rant" });
    expect(r.ok).toBe(false);
    if (!r.ok && "error" in r) expect(r.error).toMatch(/Type/);
  });

  it("rejects an over-long title", () => {
    const r = validateFeedback({ ...ok, title: "x".repeat(121) });
    expect(r.ok).toBe(false);
  });
});

describe("labelsFor / issueBody", () => {
  it("maps types to labels", () => {
    expect(labelsFor("bug")).toEqual(["feedback", "bug"]);
    expect(labelsFor("feature")).toEqual(["feedback", "enhancement"]);
    expect(labelsFor("other")).toEqual(["feedback", "question"]);
  });

  it("appends a provenance footer to the body", () => {
    const out = issueBody("the actual report", "bug");
    expect(out).toContain("the actual report");
    expect(out).toContain("feedback form");
  });
});
