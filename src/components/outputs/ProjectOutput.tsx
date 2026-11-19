import { ExtLink } from "@/components/outputs/ExtLink";
import { MediaSlot } from "@/components/outputs/MediaSlot";
import type { Project } from "@/content/types";

type Props = {
  project: Project;
  /** False for the hidden server-rendered copy, so its media is never downloaded. */
  withMedia?: boolean;
  /** Heading level for the title; 3 when the project sits under an h2. */
  headingLevel?: 2 | 3;
  /** When given, the title is a (same-tab) link to this path. */
  titleHref?: string;
};

export function ProjectOutput({ project, withMedia = true, headingLevel = 2, titleHref }: Props) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <article className="project">
      <Heading className="project-title">
        {titleHref ? <a href={titleHref}>{project.title}</a> : project.title}
      </Heading>
      <dl className="facts">
        <div>
          <dt>role</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>stack</dt>
          <dd>{project.stack.join(", ")}</dd>
        </div>
      </dl>
      <p>{project.description}</p>
      {withMedia && <MediaSlot project={project} />}
      {project.links.length > 0 && (
        <p className="project-links">
          {project.links.map((link) => (
            <ExtLink key={link.href} href={link.href}>
              {link.label}
            </ExtLink>
          ))}
        </p>
      )}
    </article>
  );
}
