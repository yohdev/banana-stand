import { buildCacheKey, blobPathname } from "./cache-key";
import { checkBlob, storeBlob, mimeType } from "./storage";
import { generateImage, clampDimensions, ALLOWED_FORMATS, type ImageFormat } from "./generate";
import { buildPrompt, isValidStyle, type Style } from "./prompts";
import { moderatePrompt } from "./moderation";

export interface PipelineParams {
  prompt: string;
  width: number;
  height: number;
  style?: string;
  seed?: number;
  fmt?: string;
  quality?: number;
}

export interface PipelineResult {
  url: string;
  cached: boolean;
  width: number;
  height: number;
  model: string;
  id: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export async function runPipeline(params: PipelineParams): Promise<PipelineResult> {
  // Validate prompt
  if (!params.prompt || typeof params.prompt !== "string") {
    throw new ValidationError("prompt is required");
  }
  const trimmedPrompt = params.prompt.trim();
  if (trimmedPrompt.length === 0) throw new ValidationError("prompt cannot be empty");
  if (trimmedPrompt.length > 1000) throw new ValidationError("prompt exceeds 1000 character limit");

  // Validate dimensions
  if (isNaN(params.width) || isNaN(params.height)) {
    throw new ValidationError("invalid dimensions");
  }
  const { width, height } = clampDimensions(params.width, params.height);

  // Validate style
  const style: Style = params.style && isValidStyle(params.style) ? params.style : "web";

  // Validate format
  const fmtRaw = params.fmt ?? "webp";
  if (!ALLOWED_FORMATS.includes(fmtRaw as ImageFormat)) {
    throw new ValidationError(`fmt must be one of: ${ALLOWED_FORMATS.join(", ")}`);
  }
  const fmt = fmtRaw as ImageFormat;

  // Validate quality
  const quality = Math.max(1, Math.min(100, Math.round(params.quality ?? 82)));

  // Seed
  const seed = typeof params.seed === "number" && !isNaN(params.seed) ? Math.round(params.seed) : 0;

  const model = process.env.IMAGE_MODEL ?? "gemini-2.0-flash-preview-image-generation";

  const hash = buildCacheKey({ model, prompt: trimmedPrompt, width, height, style, seed, fmt, quality });
  const pathname = blobPathname(hash, fmt);

  // Cache hit
  const existingUrl = await checkBlob(pathname);
  if (existingUrl) {
    return { url: existingUrl, cached: true, width, height, model, id: hash };
  }

  // Moderation
  const mod = await moderatePrompt(trimmedPrompt);
  if (mod.blocked) {
    throw new ValidationError(`Prompt blocked: ${mod.reason ?? "policy violation"}`);
  }

  // Optional generation token check (cache misses only)
  // Checked by the route handler before calling pipeline when GEN_TOKEN is set.

  const fullPrompt = buildPrompt(trimmedPrompt, style, width, height);
  const imageBuffer = await generateImage(fullPrompt, width, height, fmt, quality);
  const url = await storeBlob(pathname, imageBuffer, mimeType(fmt));

  return { url, cached: false, width, height, model, id: hash };
}
