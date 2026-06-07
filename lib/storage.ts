import { head, put } from "@vercel/blob";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function checkBlob(pathname: string): Promise<string | null> {
  try {
    const blob = await head(pathname);
    return blob.url;
  } catch {
    return null;
  }
}

export async function storeBlob(
  pathname: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const blob = await put(pathname, data, {
    access: "public",
    addRandomSuffix: false,
    cacheControlMaxAge: 31536000,
    contentType,
  });
  void CACHE_CONTROL;
  return blob.url;
}

export function mimeType(fmt: string): string {
  if (fmt === "jpeg") return "image/jpeg";
  if (fmt === "png") return "image/png";
  return "image/webp";
}
