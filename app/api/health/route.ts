import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const model = process.env.IMAGE_MODEL ?? "gemini-2.0-flash-preview-image-generation";
  return NextResponse.json({ ok: true, model });
}
