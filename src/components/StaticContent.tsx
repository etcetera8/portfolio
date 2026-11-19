import { ProjectOutput } from "@/components/outputs/ProjectOutput";
import { AboutOutput, LinksOutput, WritingOutput } from "@/components/outputs/TextOutputs";
import { about } from "@/content/about";
import { projects } from "@/content/projects";

/**
 * The site's content as plain HTML, for crawlers and visitors without JavaScript.
 * Hidden by default in globals.css; a <noscript> style in layout.tsx reveals it.
 */
export function StaticContent({ slug }: { slug?: string }) {
  const shown = slug ? projects.filter((project) => project.slug === slug) : projects;

  return (
    <div className="static-content">
      <p className="banner">{about.name.toUpperCase()}</p>
      <p className="meta">{about.tagline}</p>

      <h2 className="static-heading">about</h2>
      <AboutOutput />

      <h2 className="static-heading">projects</h2>
      {shown.map((project) => (
        <ProjectOutput key={project.slug} project={project} withMedia={false} />
      ))}

      <h2 className="static-heading">writing</h2>
      <WritingOutput />

      <h2 className="static-heading">links</h2>
      <LinksOutput />
    </div>
  );
}
