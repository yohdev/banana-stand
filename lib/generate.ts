import { GoogleGenAI } from "@google/genai";
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

  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData?.data) {
    throw new Error("Gemini returned no image data");
  }

  const rawBuffer = Buffer.from(part.inlineData.data, "base64");

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
