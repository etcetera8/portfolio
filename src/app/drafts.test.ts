import { describe, expect, it, vi } from "vitest";
import { generateMetadata } from "@/app/projects/[slug]/page";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/site";
import { draftProject as draft } from "@/test/draftProject";

// The real content plus one draft.
vi.mock("@/content/projects", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/content/projects")>();
  const { draftProject } = await import("@/test/draftProject");
  return { projects: [...actual.projects, draftProject] };
});

function metadataFor(slug: string) {
  return generateMetadata({ params: Promise.resolve({ slug }) });
}

describe("a draft project", () => {
  it("is left out of the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/projects/seattle-311/`);
    expect(urls).not.toContain(`${SITE_URL}/projects/${draft.slug}/`);
  });

  it("has a noindex page that describes itself with the summary, not the placeholder text", async () => {
    const metadata = await metadataFor(draft.slug);
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.description).toBe(draft.summary);
    expect(metadata.openGraph?.description).toBe(draft.summary);
  });

  it("leaves a finished project's page indexable, with its real description", async () => {
    const metadata = await metadataFor("trainerroad-onboarding");
    expect(metadata.robots).toBeUndefined();
    expect(metadata.description).toMatch(/^The onboarding flow for TrainerRoad/);
  });
});
