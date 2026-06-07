import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const model = process.env.IMAGE_MODEL ?? "gemini-2.5-flash-image";
  return NextResponse.json({ ok: true, model });
}
