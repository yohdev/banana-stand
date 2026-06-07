import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const base = process.env.NEXT_PUBLIC_BASE_URL;

export const metadata: Metadata = {
  ...(base ? { metadataBase: new URL(base) } : {}),
  title: "Banana Stand — AI placeholder images from a URL",
  description:
    "Drop a URL into an <img> tag and get a contextually appropriate, web-ready image — generated once by Gemini, cached forever. Built for Claude Code.",
  openGraph: {
    title: "Banana Stand — AI placeholder images from a URL",
    description:
      "Stop shipping gray boxes. Real-looking placeholder images from a single URL, built for Claude Code.",
    siteName: "Banana Stand",
    type: "website",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/banana.svg", type: "image/svg+xml" }],
  },
};

// Set the theme before first paint so there's no flash of the wrong theme.
// Defaults to light; honors a previously saved choice.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('bananastand-theme');if(t!=='dark'&&t!=='light'){t='light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        {children}
      </body>
    </html>
  );
}
