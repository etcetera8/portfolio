import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/site";

describe("sitemap and robots", () => {
  it("lists the home page and every project, with trailing slashes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/`);
    expect(urls).toContain(`${SITE_URL}/projects/seattle-311/`);
    expect(urls).toContain(`${SITE_URL}/projects/trainerroad-onboarding/`);
    for (const url of urls) expect(url.endsWith("/")).toBe(true);
  });

  it("allows everything and points at the sitemap", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("builds the site URL without a trailing slash", () => {
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});
