import { createHash } from "crypto";

export interface CacheParams {
  model: string;
  prompt: string;
  width: number;
  height: number;
  style: string;
  seed: number;
  fmt: string;
  quality: number;
}

export function buildCacheKey(params: CacheParams): string {
  const normalized = params.prompt.trim().toLowerCase();
  const input = `${params.model}:${normalized}:${params.width}x${params.height}:${params.style}:${params.seed}:${params.fmt}:${params.quality}`;
  return createHash("sha256").update(input).digest("hex");
}

export function blobPathname(hash: string, fmt: string): string {
  return `cache/${hash}.${fmt}`;
}
