import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, VT323 } from "next/font/google";
import type { ReactNode } from "react";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, TITLE_TEMPLATE } from "@/lib/site";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: TITLE_TEMPLATE },
  description: SITE_DESCRIPTION,
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
