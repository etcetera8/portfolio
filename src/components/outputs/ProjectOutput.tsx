import { ExtLink } from "@/components/outputs/ExtLink";
import { MediaSlot } from "@/components/outputs/MediaSlot";
import type { Project } from "@/content/types";

type Props = {
  project: Project;
  /** False for the hidden server-rendered copy, so its media is never downloaded. */
  withMedia?: boolean;
};

export function ProjectOutput({ project, withMedia = true }: Props) {
  return (
    <article className="project">
      <h2 className="project-title">{project.title}</h2>
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
