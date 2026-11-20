import { ContactLine } from "@/components/ContactLine";
import { ProjectOutput } from "@/components/outputs/ProjectOutput";
import { ResumeOutput } from "@/components/outputs/ResumeOutput";
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
    <main className="static-content">
      <h1 className="banner">{about.name.toUpperCase()}</h1>
      <p className="meta">{about.tagline}</p>
      <ContactLine />

      <h2 className="static-heading">about</h2>
      <AboutOutput />

      {/* Home page only: a project page is about its project. */}
      {!slug && (
        <>
          <h2 className="static-heading">resume</h2>
          <ResumeOutput headingLevel={3} />
        </>
      )}

      <h2 className="static-heading">projects</h2>
      {slug && (
        <p>
          <a href="/">all projects</a>
        </p>
      )}
      {shown.map((project) =>
        // Placeholder copy stays off the indexable home page; its own page carries it.
        project.draft && !slug ? (
          <article key={project.slug} className="project">
            <h3 className="project-title">
              <a href={`/projects/${project.slug}/`}>{project.title}</a>
            </h3>
            <p>{project.summary}</p>
          </article>
        ) : (
          <ProjectOutput
            key={project.slug}
            project={project}
            withMedia={false}
            headingLevel={3}
            titleHref={slug ? undefined : `/projects/${project.slug}/`}
          />
        ),
      )}

      <h2 className="static-heading">writing</h2>
      <WritingOutput />

      <h2 className="static-heading">links</h2>
      <LinksOutput />
    </main>
  );
}
