export type Style = "web" | "photographic" | "illustration" | "abstract" | "3d" | "minimal";

const PRESETS: Record<Style, string> = {
  web: "Clean, modern, professional composition suitable as a website placeholder image. Generous negative space and a clear focal point. No embedded text, logos, watermarks, or UI chrome. Avoid uncanny faces and distorted hands. Lighting and color that read well behind overlaid copy. High quality, web-ready.",
  photographic:
    "Realistic photographic style, natural lighting, sharp focus, professional photography composition. No text overlays, logos, or watermarks. Suitable for use as a website hero or section background.",
  illustration:
    "Clean digital illustration style, flat or semi-flat design, bold shapes, vibrant but professional color palette. No text or logos. Suitable as a website section illustration.",
  abstract:
    "Abstract art composition, flowing shapes, harmonious color palette, visually interesting but not distracting. No text, logos, or recognizable faces. Suitable as a background or decorative image.",
  "3d": "High-quality 3D render, studio lighting, clean background, photorealistic materials. No text overlays or UI elements. Professional and polished, suitable for a modern website.",
  minimal:
    "Minimalist composition, ample white space, subtle subject matter, muted or monochromatic palette. Clean and elegant. No text, logos, or busy elements.",
};

export function buildPrompt(
  userPrompt: string,
  style: Style,
  width: number,
  height: number
): string {
  const preset = PRESETS[style];
  const aspectHint = `Aspect ratio: ${width}:${height}.`;
  return `${preset}\n\nSubject: ${userPrompt}\n\n${aspectHint}`;
}

export function isValidStyle(s: string): s is Style {
  return s in PRESETS;
}
