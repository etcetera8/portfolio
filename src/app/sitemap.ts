import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { SITE_URL } from "@/lib/site";

// Required for the static export.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/` },
    ...projects
      .filter((project) => !project.draft)
      .map((project) => ({ url: `${SITE_URL}/projects/${project.slug}/` })),
  ];
}
