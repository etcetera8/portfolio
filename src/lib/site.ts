import { about } from "@/content/about";
import { DEV_SITE_URL } from "@/lib/siteUrl";

// next.config.ts validates and normalises NEXT_PUBLIC_SITE_URL and fails a production
// build without it, so the fallback is only reachable in development and tests.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEV_SITE_URL;

export const SITE_NAME = about.name;
