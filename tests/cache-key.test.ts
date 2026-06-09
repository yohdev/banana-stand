import { describe, it, expect } from "vitest";
import { buildCacheKey, blobPathname, type CacheParams } from "@/lib/cache-key";

const base: CacheParams = {
  model: "gemini-2.5-flash-image",
  prompt: "mountain lake at sunset",
  width: 1200,
  height: 600,
  style: "web",
  seed: 0,
  fmt: "webp",
  quality: 82,
};

describe("buildCacheKey", () => {
  it("returns a 64-char hex sha256 digest", () => {
    const key = buildCacheKey(base);
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic for identical params", () => {
    expect(buildCacheKey(base)).toBe(buildCacheKey({ ...base }));
  });

  it("normalizes prompt: trim + lowercase produce the same key", () => {
    const a = buildCacheKey(base);
    const b = buildCacheKey({ ...base, prompt: "  MOUNTAIN Lake at Sunset  " });
    expect(b).toBe(a);
  });

  it("changes when the seed changes", () => {
    expect(buildCacheKey({ ...base, seed: 1 })).not.toBe(buildCacheKey(base));
  });

  it("changes when any dimension changes", () => {
    expect(buildCacheKey({ ...base, width: 1201 })).not.toBe(buildCacheKey(base));
    expect(buildCacheKey({ ...base, height: 601 })).not.toBe(buildCacheKey(base));
  });

  it("changes when style, format, quality, or model change", () => {
    expect(buildCacheKey({ ...base, style: "photographic" })).not.toBe(buildCacheKey(base));
    expect(buildCacheKey({ ...base, fmt: "png" })).not.toBe(buildCacheKey(base));
    expect(buildCacheKey({ ...base, quality: 90 })).not.toBe(buildCacheKey(base));
    expect(buildCacheKey({ ...base, model: "other-model" })).not.toBe(buildCacheKey(base));
  });
});

describe("blobPathname", () => {
  it("builds cache/{hash}.{fmt}", () => {
    expect(blobPathname("abc123", "webp")).toBe("cache/abc123.webp");
    expect(blobPathname("abc123", "png")).toBe("cache/abc123.png");
  });
});
