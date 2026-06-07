"use client";

import { useEffect, useRef, useState } from "react";

type Status = "loading" | "ok" | "error";

/**
 * Renders a Banana Stand image with reserved dimensions (no layout shift),
 * a shimmer while it loads, and a graceful "warming up" tile on failure —
 * never a broken-image icon. A cold cache miss can 502/429 on first load;
 * we surface that as a friendly state instead of a broken asset.
 */
export default function DemoImage({
  src,
  alt,
  width,
  height,
  rounded = true,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  rounded?: boolean;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const imgRef = useRef<HTMLImageElement>(null);

  // If the image was already cached and finished before hydration, the
  // onLoad event won't fire — detect that on mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete) {
      setStatus(img.naturalWidth > 0 ? "ok" : "error");
    }
  }, []);

  return (
    <div
      className="shot"
      style={{
        aspectRatio: `${width} / ${height}`,
        borderRadius: rounded ? undefined : 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus("ok")}
        onError={() => setStatus("error")}
        style={{ opacity: status === "ok" ? 1 : 0, transition: "opacity 0.3s ease" }}
      />
      {status === "loading" && <div className="shot-shimmer" aria-hidden="true" />}
      {status === "error" && (
        <div className="shot-warming">
          <span aria-hidden="true" style={{ fontSize: "1.4rem" }}>🍌</span>
          <span>Warming up — generated on first load. Refresh in a moment.</span>
        </div>
      )}
    </div>
  );
}
