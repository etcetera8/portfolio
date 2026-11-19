import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, VT323 } from "next/font/google";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const bodyFont = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  fallback: ["Menlo", "Consolas", "monospace"],
});

const displayFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  fallback: ["Menlo", "Consolas", "monospace"],
});

const description =
  "Parker T. Lindley. Fullstack developer. A portfolio you unlock like a terminal.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s // ${SITE_NAME}` },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description,
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#020502",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <noscript>
          <style>{".static-content{display:block!important}.app-root{display:none!important}"}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
