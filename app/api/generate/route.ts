import { NextRequest, NextResponse } from "next/server";
import { resolveRequest, lookupCache, generateAndStore, ValidationError } from "@/lib/pipeline";
import { peekRateLimit, consumeRateLimit } from "@/lib/ratelimit";
import { getUserId, usageHeaders } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

function checkGenToken(req: NextRequest): boolean {
  const secret = process.env.GEN_TOKEN;
  if (!secret) return true;
  return req.headers.get("x-gen-token") === secret;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const prompt = typeof b.prompt === "string" ? b.prompt : "";
  const width = typeof b.width === "number" ? b.width : parseInt(String(b.width ?? ""), 10);
  const height = typeof b.height === "number" ? b.height : parseInt(String(b.height ?? ""), 10);
  const style = typeof b.style === "string" ? b.style : "web";
  const seed = typeof b.seed === "number" ? b.seed : 0;
  const fmt = typeof b.format === "string" ? b.format : "webp";
  const quality = typeof b.quality === "number" ? b.quality : 82;

  const userId = getUserId(req);

  try {
    const resolved = resolveRequest({ prompt, width, height, style, seed, fmt, quality });

    // Cache hit — never metered.
    const cachedUrl = await lookupCache(resolved);
    if (cachedUrl) {
      const rl = await peekRateLimit(userId);
      return NextResponse.json(
        {
          url: cachedUrl,
          cached: true,
          width: resolved.width,
          height: resolved.height,
          model: resolved.model,
          id: resolved.hash,
        },
        { status: 200, headers: usageHeaders(rl, "HIT") }
      );
    }

    // Cache miss — gate on shared secret + quota.
    if (!checkGenToken(req)) {
      return NextResponse.json(
        { error: "X-Gen-Token header required for new image generation" },
        { status: 401 }
      );
    }

    const rl = await consumeRateLimit(userId);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Daily limit (${rl.limit}) exceeded. Resets at ${rl.resetAt}` },
        { status: 429, headers: usageHeaders(rl, "MISS") }
      );
    }

    const result = await generateAndStore(resolved);
    return NextResponse.json(result, { status: 200, headers: usageHeaders(rl, "MISS") });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[/api/generate] error:", err);
    return NextResponse.json({ error: "Image generation failed" }, { status: 502 });
  }
}
