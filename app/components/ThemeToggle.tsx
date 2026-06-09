"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bananastand-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync from whatever the no-flash bootstrap already put on <html>. This DOM
  // value is client-only (unknown at SSR), so reading it after mount and
  // setting state is the correct pattern.
  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — fall back to in-session only */
    }
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost keep"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      style={{ minWidth: 44, padding: "0 12px" }}
    >
      <span aria-hidden="true" style={{ fontSize: "1rem", lineHeight: 1 }}>
        {isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
