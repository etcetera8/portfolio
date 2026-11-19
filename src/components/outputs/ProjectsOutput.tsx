import { Chip } from "@/components/outputs/Chip";
import { projects } from "@/content/projects";

export function ProjectsOutput({ onRun }: { onRun: (command: string) => void }) {
  return (
    <ol className="rows">
      {projects.map((project, index) => (
        <li key={project.slug} className="proj">
          <span className="num">{String(index + 1).padStart(2, "0")}</span>
          {/* A larger tap target only. The open chip is the accessible control. */}
          <button
            type="button"
            className="proj-name"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => onRun(`open ${project.slug}`)}
          >
            {project.slug}
          </button>
          <span className="proj-desc">
            {project.summary} <span className="tag">{`[${project.stack.join(", ")}]`}</span>
          </span>
          <Chip command={`open ${project.slug}`} onRun={onRun}>
            open
          </Chip>
        </li>
      ))}
    </ol>
  );
}
