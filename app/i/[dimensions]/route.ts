import { NextRequest, NextResponse } from "next/server";
import { resolveRequest, lookupCache, generateAndStore, ValidationError } from "@/lib/pipeline";
import { peekRateLimit, consumeRateLimit } from "@/lib/ratelimit";
import { getUserId, usageHeaders } from "@/lib/usage";

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

  const userId = getUserId(req);

  try {
    const resolved = resolveRequest({ prompt, width, height, style, seed, fmt, quality });

    // Cache hit — never metered, always served.
    const cachedUrl = await lookupCache(resolved);
    if (cachedUrl) {
      const rl = await peekRateLimit(userId);
      return NextResponse.redirect(cachedUrl, {
        status: 302,
        headers: {
          ...usageHeaders(rl, "HIT"),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Cache miss — a real generation. Gate on shared secret + quota.
    if (!checkGenToken(req)) {
      return jsonError("X-Gen-Token header required for new image generation", 401);
    }

    const rl = await consumeRateLimit(userId);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Daily limit (${rl.limit}) exceeded. Resets at ${rl.resetAt}` },
        { status: 429, headers: usageHeaders(rl, "MISS") }
      );
    }

    const result = await generateAndStore(resolved);

    return NextResponse.redirect(result.url, {
      status: 302,
      headers: {
        ...usageHeaders(rl, "MISS"),
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
