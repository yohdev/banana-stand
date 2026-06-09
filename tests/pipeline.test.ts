import { describe, it, expect } from "vitest";
import { resolveRequest, ValidationError } from "@/lib/pipeline";

const ok = { prompt: "a cat", width: 800, height: 600 };

describe("resolveRequest — happy path", () => {
  it("normalizes and fills defaults", () => {
    const r = resolveRequest(ok);
    expect(r.prompt).toBe("a cat");
    expect(r.width).toBe(800);
    expect(r.height).toBe(600);
    expect(r.style).toBe("web");
    expect(r.fmt).toBe("webp");
    expect(r.quality).toBe(82);
    expect(r.seed).toBe(0);
    expect(r.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(r.pathname).toBe(`cache/${r.hash}.webp`);
  });

  it("trims the prompt", () => {
    expect(resolveRequest({ ...ok, prompt: "  spaced  " }).prompt).toBe("spaced");
  });

  it("falls back to 'web' for an unknown style", () => {
    expect(resolveRequest({ ...ok, style: "watercolor" }).style).toBe("web");
  });

  it("accepts a valid style", () => {
    expect(resolveRequest({ ...ok, style: "photographic" }).style).toBe("photographic");
  });

  it("clamps quality into 1..100", () => {
    expect(resolveRequest({ ...ok, quality: 0 }).quality).toBe(1);
    expect(resolveRequest({ ...ok, quality: 500 }).quality).toBe(100);
  });

  it("rounds the seed", () => {
    expect(resolveRequest({ ...ok, seed: 3.7 }).seed).toBe(4);
  });

  it("clamps oversized dimensions", () => {
    const r = resolveRequest({ ...ok, width: 9000, height: 9000 });
    expect(r.width * r.height).toBeLessThanOrEqual(4_000_000);
  });
});

describe("resolveRequest — validation errors", () => {
  it("rejects a missing prompt", () => {
    expect(() => resolveRequest({ ...ok, prompt: "" })).toThrow(ValidationError);
    // @ts-expect-error intentionally wrong type
    expect(() => resolveRequest({ ...ok, prompt: undefined })).toThrow(ValidationError);
  });

  it("rejects a whitespace-only prompt", () => {
    expect(() => resolveRequest({ ...ok, prompt: "   " })).toThrow(/empty/);
  });

  it("rejects a prompt over 1000 chars", () => {
    expect(() => resolveRequest({ ...ok, prompt: "x".repeat(1001) })).toThrow(/1000/);
  });

  it("rejects NaN dimensions", () => {
    expect(() => resolveRequest({ ...ok, width: NaN })).toThrow(/invalid dimensions/);
  });

  it("rejects an unsupported format", () => {
    expect(() => resolveRequest({ ...ok, fmt: "gif" })).toThrow(/fmt must be one of/);
  });
});
