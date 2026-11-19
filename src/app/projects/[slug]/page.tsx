import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { App } from "@/components/App";
import { StaticContent } from "@/components/StaticContent";
import { projects } from "@/content/projects";
import { SITE_NAME } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

// Only the slugs below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((candidate) => candidate.slug === slug);
  if (!project) return {};
  const path = `/projects/${slug}/`;
  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: path },
    // A page's own openGraph replaces the root one entirely, so the image is repeated here.
    openGraph: {
      title: project.title,
      description: project.description,
      type: "article",
      url: path,
      siteName: SITE_NAME,
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    },
    // Placeholder copy stays out of search results until it is written.
    ...(project.draft ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (!projects.some((project) => project.slug === slug)) notFound();

  return (
    <>
      <StaticContent slug={slug} />
      <App initialCommand={`open ${slug}`} />
    </>
  );
}
