// Shared helpers for the "use your own instance" feature.
// Pure functions so both the server (defaults) and client islands can use them.

export const INSTANCE_KEY = "bananastand-instance";
export const PLACEHOLDER_INSTANCE = "https://your-instance.vercel.app";

/**
 * Normalize a user-pasted instance URL: trim, add https:// if no scheme,
 * drop trailing slashes. Returns "" for empty/whitespace input.
 */
export function normalizeInstance(value: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  let url = trimmed.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

export function buildClaudePrompt(base: string): string {
  return `Build a simple, modern landing page for a small coffee-roastery startup.

For every image, use the Banana Stand API as a plain <img> tag:
${base}/i/{width}x{height}?prompt={url-encoded+description}&style=photographic

Use exactly three images — a wide hero, a product close-up, and a team photo.
Keep it to one HTML file. No gray placeholder boxes.`;
}

export function buildClaudeMdSnippet(base: string): string {
  return `For placeholder images on this site, use the Banana Stand API. Write image URLs as
${base}/i/{width}x{height}?prompt={url-encoded+description}&style=photographic
directly in <img src> or CSS background-image. Choose dimensions that match the
layout slot. Same prompt and size always returns the same image, so reuse URLs.`;
}

export function buildExampleUrl(base: string): string {
  return `${base}/i/1600x900?prompt=team+collaborating+in+a+bright+modern+office&style=photographic`;
}

export function buildUrlAnatomy(base: string): string {
  return `${base}/i/{width}x{height}
   ?prompt=team+collaborating+in+a+bright+modern+office
   &style=photographic   # web (default) | photographic
   &seed=2               # change for a different image, same prompt
   &fmt=webp&q=82        # webp | jpeg | png`;
}
