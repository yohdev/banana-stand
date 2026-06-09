import { describe, it, expect } from "vitest";
import { buildPrompt, isValidStyle } from "@/lib/prompts";

describe("isValidStyle", () => {
  it("accepts every known preset", () => {
    for (const s of ["web", "photographic", "illustration", "abstract", "3d", "minimal"]) {
      expect(isValidStyle(s)).toBe(true);
    }
  });

  it("rejects unknown styles", () => {
    expect(isValidStyle("watercolor")).toBe(false);
    expect(isValidStyle("")).toBe(false);
    expect(isValidStyle("WEB")).toBe(false); // case-sensitive
  });
});

describe("buildPrompt", () => {
  it("includes the user subject and an aspect-ratio hint", () => {
    const out = buildPrompt("a red bicycle", "web", 1200, 600);
    expect(out).toContain("Subject: a red bicycle");
    expect(out).toContain("Aspect ratio: 1200:600.");
  });

  it("prepends the preset text for the chosen style", () => {
    const web = buildPrompt("x", "web", 100, 100);
    const photo = buildPrompt("x", "photographic", 100, 100);
    expect(web).not.toBe(photo);
    expect(photo.toLowerCase()).toContain("photographic");
  });
});
