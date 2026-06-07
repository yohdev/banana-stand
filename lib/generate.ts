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

interface ServiceAccount {
  project_id?: string;
  [key: string]: unknown;
}

function getServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_CLOUD_CREDENTIALS;
  if (!raw) {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS env var is not set");
  }
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS is not valid JSON");
  }
}

/**
 * Build a Vertex AI client via the unified Google Gen AI SDK.
 * Auth uses the service-account JSON (Vertex does not take an API key).
 */
function getClient(): GoogleGenAI {
  const credentials = getServiceAccount();
  const project = process.env.GOOGLE_CLOUD_PROJECT ?? credentials.project_id;
  const location = process.env.VERTEX_LOCATION ?? "us-central1";

  if (!project) {
    throw new Error("No project id (set GOOGLE_CLOUD_PROJECT or include project_id in credentials)");
  }

  return new GoogleGenAI({
    vertexai: true,
    project,
    location,
    googleAuthOptions: { credentials },
  });
}

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 429 || status === 503) return true;
  const msg = (err as { message?: string })?.message ?? "";
  return msg.includes("RESOURCE_EXHAUSTED") || msg.includes("UNAVAILABLE") || msg.includes("429");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateImage(
  prompt: string,
  width: number,
  height: number,
  format: ImageFormat,
  quality: number
): Promise<Buffer> {
  const model = process.env.IMAGE_MODEL ?? "gemini-2.5-flash-image";
  const client = getClient();

  // Vertex Gemini image models use dynamic shared quota; 429s are often
  // transient. Retry with exponential backoff before giving up.
  const maxAttempts = 5;
  let response;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      response = await client.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["IMAGE"],
        },
      });
      break;
    } catch (err) {
      if (attempt < maxAttempts && isRetryable(err)) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000) + Math.random() * 500;
        console.warn(`[generate] retryable error (attempt ${attempt}/${maxAttempts}), waiting ${Math.round(delay)}ms`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }

  if (!response) {
    throw new Error("Image generation failed after retries (quota exhausted)");
  }

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    throw new Error("Vertex AI returned no image data");
  }

  const rawBuffer = Buffer.from(imagePart.inlineData.data, "base64");

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
