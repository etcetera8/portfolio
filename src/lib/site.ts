import { about } from "@/content/about";
import { DEV_SITE_URL } from "@/lib/siteUrl";

// next.config.ts validates and normalises NEXT_PUBLIC_SITE_URL and fails a production
// build without it, so the fallback is only reachable in development and tests.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEV_SITE_URL;

export const SITE_NAME = about.name;

export const SITE_DESCRIPTION =
  "Parker T. Lindley. Fullstack developer. A portfolio you unlock like a terminal.";

/** The tab title for a page, e.g. "Seattle 311 // Parker T. Lindley". Shared with the layout. */
export const TITLE_TEMPLATE = `%s // ${SITE_NAME}`;
export function tabTitle(title: string): string {
  return TITLE_TEMPLATE.replace("%s", title);
}

const OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "PARKER T. LINDLEY in green terminal text on a dark background, with a blinking cursor",
};

/**
 * A page's own openGraph replaces the layout's entirely, so every page that sets one
 * builds it here to get the same site name and image.
 */
export function pageOpenGraph(page: {
  title: string;
  description: string;
  type: "website" | "article";
  path: string;
}) {
  return {
    title: page.title,
    description: page.description,
    type: page.type,
    url: page.path,
    siteName: SITE_NAME,
    images: [OG_IMAGE],
  };
}
