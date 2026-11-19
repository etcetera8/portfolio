import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { App } from "@/components/App";
import { StaticContent } from "@/components/StaticContent";
import { projects } from "@/content/projects";

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
  return {
    title: project.title,
    description: project.description,
    openGraph: { title: project.title, description: project.description, type: "article" },
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
