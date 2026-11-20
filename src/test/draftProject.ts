import type { Project } from "@/content/types";

/**
 * A placeholder project for tests. The real content has no drafts at the moment,
 * so tests of the draft rules add this one to it.
 */
export const draftProject: Project = {
  slug: "work-in-progress",
  draft: true,
  title: "Work in progress",
  summary: "not written up yet",
  role: "role to be added",
  stack: ["stack to be added"],
  description: "Placeholder. The write-up will go here.",
  links: [],
};
