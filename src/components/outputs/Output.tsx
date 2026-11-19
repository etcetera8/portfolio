import { HelpOutput } from "@/components/outputs/HelpOutput";
import { ProjectOutput } from "@/components/outputs/ProjectOutput";
import { ProjectsOutput } from "@/components/outputs/ProjectsOutput";
import {
  AboutOutput,
  LinksOutput,
  NotFoundOutput,
  OpenUsageOutput,
  WritingOutput,
} from "@/components/outputs/TextOutputs";
import { projects } from "@/content/projects";
import type { CommandResult } from "@/lib/commands";

type Props = {
  result: CommandResult;
  onRun: (command: string) => void;
};

export function Output({ result, onRun }: Props) {
  switch (result.kind) {
    case "help":
      return <HelpOutput onRun={onRun} />;
    case "about":
      return <AboutOutput />;
    case "projects":
      return <ProjectsOutput onRun={onRun} />;
    case "project": {
      const project = projects.find((candidate) => candidate.slug === result.slug);
      return project ? <ProjectOutput project={project} /> : <OpenUsageOutput arg={result.slug} />;
    }
    case "openUsage":
      return <OpenUsageOutput arg={result.arg} />;
    case "writing":
      return <WritingOutput />;
    case "links":
      return <LinksOutput />;
    case "notFound":
      return <NotFoundOutput input={result.input} />;
    case "empty":
    case "clear":
    case "logout":
      // Handled by Terminal; they never reach the transcript.
      return null;
  }
}
