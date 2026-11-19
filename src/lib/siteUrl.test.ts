import { describe, expect, it } from "vitest";
import { DEV_SITE_URL, resolveSiteUrl } from "@/lib/siteUrl";

describe("resolveSiteUrl", () => {
  it("falls back to localhost outside a production build", () => {
    expect(resolveSiteUrl(undefined, false)).toBe(DEV_SITE_URL);
    expect(resolveSiteUrl("", false)).toBe(DEV_SITE_URL);
  });

  it("fails a production build when the variable is unset or blank", () => {
    expect(() => resolveSiteUrl(undefined, true)).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => resolveSiteUrl("  ", true)).toThrow(/canonical/);
  });

  it("accepts an absolute http or https origin and strips one trailing slash", () => {
    expect(resolveSiteUrl("https://example.com", true)).toBe("https://example.com");
    expect(resolveSiteUrl("https://example.com/", true)).toBe("https://example.com");
    expect(resolveSiteUrl("http://localhost:3101", true)).toBe("http://localhost:3101");
  });

  it("rejects values that are not absolute http(s) URLs", () => {
    for (const bad of ["example.com", "/relative", "ftp://example.com", "not a url"]) {
      expect(() => resolveSiteUrl(bad, true)).toThrow(/absolute http/);
    }
  });

  it("rejects a path, query or hash, since the site only works at a domain root", () => {
    for (const bad of [
      "https://example.com/portfolio",
      "https://example.com/portfolio/",
      "https://example.com//",
      "https://example.com?a=1",
      "https://example.com/#top",
    ]) {
      expect(() => resolveSiteUrl(bad, true)).toThrow(/domain root/);
    }
  });

  it("validates a supplied value even in development", () => {
    expect(() => resolveSiteUrl("https://example.com/x", false)).toThrow(/domain root/);
  });
});
