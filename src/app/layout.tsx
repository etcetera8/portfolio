import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, VT323 } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const bodyFont = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const description =
  "Parker T. Lindley. Fullstack developer. A portfolio you unlock like a terminal.";

export const metadata: Metadata = {
  title: { default: "Parker T. Lindley", template: "%s // Parker T. Lindley" },
  description,
  openGraph: { title: "Parker T. Lindley", description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#020502",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <noscript>
          <style>{".static-content{display:block}.app-root{display:none}"}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
