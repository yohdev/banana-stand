import { GoogleAuth } from "google-auth-library";
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

function getCredentials(): Record<string, unknown> {
  const credStr = process.env.GOOGLE_CLOUD_CREDENTIALS;
  if (!credStr) {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS env var is not set");
  }

  try {
    return JSON.parse(credStr) as Record<string, unknown>;
  } catch (err) {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS is not valid JSON");
  }
}

async function getAccessToken(): Promise<string> {
  const credStr = process.env.GOOGLE_CLOUD_CREDENTIALS;
  if (!credStr) {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS env var is not set");
  }

  const auth = new GoogleAuth({
    credentials: JSON.parse(credStr) as Record<string, unknown>,
    scopes: ["https://www.googleapis.com/auth/generative-language"],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  if (!token.token) {
    throw new Error("Failed to obtain access token from service account");
  }

  return token.token;
}

export async function generateImage(
  prompt: string,
  width: number,
  height: number,
  format: ImageFormat,
  quality: number
): Promise<Buffer> {
  const model = process.env.IMAGE_MODEL ?? "gemini-2.5-flash-preview-image";
  const projectId = getCredentials().project_id as string;

  const accessToken = await getAccessToken();

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/projects/${projectId}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${error}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const candidates = data.candidates as unknown[];
  const candidate = candidates?.[0] as Record<string, unknown>;
  const parts = candidate?.content as Record<string, unknown>;
  const partArray = parts?.parts as unknown[];
  const part = partArray?.[0] as Record<string, unknown>;
  const inlineData = part?.inlineData as Record<string, unknown>;

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
