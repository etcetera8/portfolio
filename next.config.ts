import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NextConfig } from "next";
import { resolveSiteUrl } from "./src/lib/siteUrl";

export default function config(phase: string): NextConfig {
  // Validated here so a bad or missing value fails before anything compiles.
  const siteUrl = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, phase === PHASE_PRODUCTION_BUILD);
  return {
    output: "export",
    trailingSlash: true,
    env: { NEXT_PUBLIC_SITE_URL: siteUrl },
  };
}
