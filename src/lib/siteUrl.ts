export const DEV_SITE_URL = "http://localhost:3000";

const HELP =
  "Set NEXT_PUBLIC_SITE_URL to the site's public origin, for example https://example.com. " +
  "It feeds every canonical link, og:url, og:image, the sitemap and robots.txt.";

/**
 * Validates NEXT_PUBLIC_SITE_URL and returns the origin without a trailing slash.
 * Unset is only allowed outside a production build, where it means localhost.
 * Used by next.config.ts, so a bad value fails before anything compiles.
 */
export function resolveSiteUrl(raw: string | undefined, production: boolean): string {
  const value = raw?.trim() ?? "";
  if (value === "") {
    if (production) {
      throw new Error(`NEXT_PUBLIC_SITE_URL is not set, so the build would publish localhost URLs. ${HELP}`);
    }
    return DEV_SITE_URL;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL ("${value}") is not an absolute http(s) URL. ${HELP}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`NEXT_PUBLIC_SITE_URL ("${value}") is not an absolute http(s) URL. ${HELP}`);
  }
  // One trailing slash is tolerated; anything else after the origin is not.
  const rest = value.slice(value.indexOf("//") + 2).replace(/^[^/?#]*/, "");
  if (rest !== "" && rest !== "/") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL ("${value}") has a path, query or hash. The site only works at a domain root. ${HELP}`,
    );
  }
  return url.origin;
}
