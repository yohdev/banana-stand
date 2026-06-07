import { NextRequest, NextResponse } from "next/server";
import { runPipeline, ValidationError } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function checkGenToken(req: NextRequest): boolean {
  const secret = process.env.GEN_TOKEN;
  if (!secret) return true;
  return req.headers.get("x-gen-token") === secret;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dimensions: string }> }
) {
  const { dimensions } = await params;

  const match = dimensions.match(/^(\d+)x(\d+)$/i);
  if (!match) {
    return jsonError("Path must be {width}x{height}, e.g. /i/1200x600", 400);
  }

  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);

  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt") ?? "";
  const style = searchParams.get("style") ?? "web";
  const seed = parseInt(searchParams.get("seed") ?? "0", 10);
  const fmt = searchParams.get("fmt") ?? "webp";
  const quality = parseInt(searchParams.get("q") ?? "82", 10);

  if (!prompt) {
    return jsonError("prompt query parameter is required", 400);
  }

  try {
    // For cache misses, require gen token if configured
    // We attempt pipeline first; if it's a miss and token invalid, reject.
    // To avoid generating before checking: we do a quick cache check here.
    const { buildCacheKey, blobPathname } = await import("@/lib/cache-key");
    const { checkBlob } = await import("@/lib/storage");
    const { clampDimensions } = await import("@/lib/generate");
    const { isValidStyle } = await import("@/lib/prompts");

    const { width: w, height: h } = clampDimensions(width, height);
    const s = isValidStyle(style) ? style : "web";
    const q = Math.max(1, Math.min(100, Math.round(isNaN(quality) ? 82 : quality)));
    const sd = isNaN(seed) ? 0 : Math.round(seed);
    const model = process.env.IMAGE_MODEL ?? "gemini-2.0-flash-preview-image-generation";

    const hash = buildCacheKey({ model, prompt: prompt.trim(), width: w, height: h, style: s, seed: sd, fmt, quality: q });
    const pathname = blobPathname(hash, fmt);
    const existingUrl = await checkBlob(pathname);

    if (!existingUrl && !checkGenToken(req)) {
      return jsonError("X-Gen-Token header required for new image generation", 401);
    }

    const result = await runPipeline({ prompt, width, height, style, seed: sd, fmt, quality: q });

    return NextResponse.redirect(result.url, {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Cache": result.cached ? "HIT" : "MISS",
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return jsonError(err.message, 400);
    }
    console.error("[/i] generation error:", err);
    return jsonError("Image generation failed", 502);
  }
}
