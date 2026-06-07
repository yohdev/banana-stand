import sharp from "sharp";

const MAX_MEGAPIXELS = 4_000_000;
const MAX_DIM = 2048;
const MIN_DIM = 64;

export const ALLOWED_FORMATS = ["webp", "jpeg", "png"] as const;
export type ImageFormat = (typeof ALLOWED_FORMATS)[number];

export function clampDimensions(w: number, h: number): { width: number; height: number } {
  let width = Math.max(MIN_DIM, Math.min(MAX_DIM, Math.round(w)));
  let height = Math.max(MIN_DIM, Math.min(MAX_DIM, Math.round(h)));

  if (width * height > MAX_MEGAPIXELS) {
    const ratio = Math.sqrt(MAX_MEGAPIXELS / (width * height));
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
}

export async function generateImage(
  prompt: string,
  width: number,
  height: number,
  format: ImageFormat,
  quality: number
): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const model = process.env.IMAGE_MODEL ?? "gemini-2.5-flash-preview-image";

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const candidates = data.candidates as unknown[];
  const candidate = candidates?.[0] as Record<string, unknown>;
  const content = candidate?.content as Record<string, unknown>;
  const partArray = content?.parts as unknown[];

  // Find the part that actually carries image bytes.
  let inlineData: Record<string, unknown> | undefined;
  for (const p of partArray ?? []) {
    const candidatePart = (p as Record<string, unknown>)?.inlineData as Record<string, unknown>;
    if (candidatePart?.data) {
      inlineData = candidatePart;
      break;
    }
  }

  if (!inlineData?.data) {
    throw new Error("Gemini returned no image data");
  }

  const rawBuffer = Buffer.from(inlineData.data as string, "base64");

  let pipeline = sharp(rawBuffer).resize(width, height, { fit: "cover", position: "centre" });

  if (format === "webp") {
    pipeline = pipeline.webp({ quality });
  } else if (format === "jpeg") {
    pipeline = pipeline.jpeg({ quality });
  } else {
    pipeline = pipeline.png();
  }

  return pipeline.toBuffer();
}
