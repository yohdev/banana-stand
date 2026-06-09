import { describe, it, expect } from "vitest";
import { clampDimensions } from "@/lib/generate";

describe("clampDimensions", () => {
  it("passes through valid dimensions unchanged", () => {
    expect(clampDimensions(1200, 600)).toEqual({ width: 1200, height: 600 });
  });

  it("clamps below the minimum (64) per side", () => {
    expect(clampDimensions(10, 10)).toEqual({ width: 64, height: 64 });
  });

  it("clamps each side to at most 2048", () => {
    // A 2048-wide square is 4.19MP, so the MP cap scales it down further;
    // the invariant is simply that neither side exceeds the max.
    const { width, height } = clampDimensions(5000, 9000);
    expect(width).toBeLessThanOrEqual(2048);
    expect(height).toBeLessThanOrEqual(2048);
  });

  it("never exceeds the ~4MP cap even for huge inputs", () => {
    const { width, height } = clampDimensions(5000, 9000);
    expect(width * height).toBeLessThanOrEqual(4_000_000);
  });

  it("rounds fractional inputs", () => {
    expect(clampDimensions(100.4, 200.6)).toEqual({ width: 100, height: 201 });
  });

  it("scales down to respect the ~4MP cap while preserving aspect ratio", () => {
    const { width, height } = clampDimensions(2048, 2048);
    expect(width * height).toBeLessThanOrEqual(4_000_000);
    // square in, square out
    expect(width).toBe(height);
  });

  it("keeps total pixels under the cap for wide inputs", () => {
    const { width, height } = clampDimensions(2048, 2000);
    expect(width * height).toBeLessThanOrEqual(4_000_000);
    // aspect ratio roughly preserved
    expect(width / height).toBeCloseTo(2048 / 2000, 1);
  });
});
