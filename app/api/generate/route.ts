import { NextRequest, NextResponse } from "next/server";
import { runPipeline, ValidationError } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  try {
    const result = await runPipeline({ prompt, width, height, style, seed, fmt, quality });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[/api/generate] error:", err);
    return NextResponse.json({ error: "Image generation failed" }, { status: 502 });
  }
}
