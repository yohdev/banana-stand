import { NextRequest, NextResponse } from "next/server";
import { resolveRequest, lookupCache, generateAndStore, ValidationError } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Cache-miss generation is gated by GEN_TOKEN. If the env var is set, callers
 * must send a matching `X-Gen-Token` header to generate a new image. Cache
 * hits stay open so already-generated images keep serving to everyone.
 */
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
    const resolved = resolveRequest({ prompt, width, height, style, seed, fmt, quality });

    // Cache hit — open to everyone, always served from the CDN.
    const cachedUrl = await lookupCache(resolved);
    if (cachedUrl) {
      return NextResponse.redirect(cachedUrl, {
        status: 302,
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Cache miss — a real generation. Gate on the shared secret.
    if (!checkGenToken(req)) {
      return jsonError("X-Gen-Token header required for new image generation", 401);
    }

    const result = await generateAndStore(resolved);

    return NextResponse.redirect(result.url, {
      status: 302,
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=31536000, immutable",
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
