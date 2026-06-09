import { describe, it, expect } from "vitest";
import { normalizeInstance } from "@/app/instance";

describe("normalizeInstance", () => {
  it("returns empty string for empty/whitespace input", () => {
    expect(normalizeInstance("")).toBe("");
    expect(normalizeInstance("   ")).toBe("");
  });

  it("adds https:// when no scheme is present", () => {
    expect(normalizeInstance("example.com")).toBe("https://example.com");
  });

  it("preserves an existing http:// or https:// scheme", () => {
    expect(normalizeInstance("http://localhost:3000")).toBe("http://localhost:3000");
    expect(normalizeInstance("https://my.app")).toBe("https://my.app");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeInstance("  example.com  ")).toBe("https://example.com");
  });

  it("strips trailing slashes", () => {
    expect(normalizeInstance("https://my.app/")).toBe("https://my.app");
    expect(normalizeInstance("https://my.app///")).toBe("https://my.app");
  });
});
