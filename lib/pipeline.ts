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

/** Validated, normalized request parameters plus the derived cache location. */
export interface ResolvedRequest {
  prompt: string;
  width: number;
  height: number;
  style: Style;
  seed: number;
  fmt: ImageFormat;
  quality: number;
  model: string;
  hash: string;
  pathname: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const MODEL = () => process.env.IMAGE_MODEL ?? "gemini-2.0-flash-preview-image-generation";

/**
 * Validate + normalize inputs and compute the deterministic cache key.
 * Throws ValidationError on bad input. Does no I/O.
 */
export function resolveRequest(params: PipelineParams): ResolvedRequest {
  if (!params.prompt || typeof params.prompt !== "string") {
    throw new ValidationError("prompt is required");
  }
  const prompt = params.prompt.trim();
  if (prompt.length === 0) throw new ValidationError("prompt cannot be empty");
  if (prompt.length > 1000) throw new ValidationError("prompt exceeds 1000 character limit");

  if (isNaN(params.width) || isNaN(params.height)) {
    throw new ValidationError("invalid dimensions");
  }
  const { width, height } = clampDimensions(params.width, params.height);

  const style: Style = params.style && isValidStyle(params.style) ? params.style : "web";

  const fmtRaw = params.fmt ?? "webp";
  if (!ALLOWED_FORMATS.includes(fmtRaw as ImageFormat)) {
    throw new ValidationError(`fmt must be one of: ${ALLOWED_FORMATS.join(", ")}`);
  }
  const fmt = fmtRaw as ImageFormat;

  const quality = Math.max(1, Math.min(100, Math.round(params.quality ?? 82)));
  const seed = typeof params.seed === "number" && !isNaN(params.seed) ? Math.round(params.seed) : 0;
  const model = MODEL();

  const hash = buildCacheKey({ model, prompt, width, height, style, seed, fmt, quality });
  const pathname = blobPathname(hash, fmt);

  return { prompt, width, height, style, seed, fmt, quality, model, hash, pathname };
}

/** Returns the cached Blob URL if it exists, else null. */
export async function lookupCache(req: ResolvedRequest): Promise<string | null> {
  return checkBlob(req.pathname);
}

/** Moderate, generate via Gemini, store to Blob. Cache-miss path only. */
export async function generateAndStore(req: ResolvedRequest): Promise<PipelineResult> {
  const mod = await moderatePrompt(req.prompt);
  if (mod.blocked) {
    throw new ValidationError(`Prompt blocked: ${mod.reason ?? "policy violation"}`);
  }

  const fullPrompt = buildPrompt(req.prompt, req.style, req.width, req.height);
  const imageBuffer = await generateImage(fullPrompt, req.width, req.height, req.fmt, req.quality);
  const url = await storeBlob(req.pathname, imageBuffer, mimeType(req.fmt));

  return { url, cached: false, width: req.width, height: req.height, model: req.model, id: req.hash };
}

/**
 * Full pipeline: resolve → cache lookup → generate on miss.
 * Convenience wrapper; routes that need to meter the miss path
 * should call the stages directly.
 */
export async function runPipeline(params: PipelineParams): Promise<PipelineResult> {
  const req = resolveRequest(params);

  const cachedUrl = await lookupCache(req);
  if (cachedUrl) {
    return { url: cachedUrl, cached: true, width: req.width, height: req.height, model: req.model, id: req.hash };
  }

  return generateAndStore(req);
}
