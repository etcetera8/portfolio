import type { Project } from "@/content/types";

export const projects: Project[] = [
  {
    slug: "trainerroad-onboarding",
    title: "TrainerRoad onboarding",
    summary: "shipped onboarding flow",
    // Placeholder copy below. Replace role, stack and description with final text,
    // then add `media` once the recording exists.
    role: "role to be added",
    stack: ["stack to be added"],
    description:
      "Placeholder. A short write-up of the onboarding flow, what I owned, and what it changed will go here.",
    links: [],
  },
  {
    slug: "seattle-311",
    title: "Seattle 311",
    summary: "map of seattle-area 311 data",
    role: "Solo project",
    stack: ["TypeScript"],
    description: "A map displaying Seattle area 311 data.",
    links: [{ label: "source on github", href: "https://github.com/etcetera8/seattle-311" }],
  },
  {
    slug: "copy-pasta",
    title: "Copy Pasta",
    summary: "clipboard history utility with search",
    role: "Solo project",
    stack: ["TypeScript"],
    description:
      "A clipboard utility app. Save copy history for up to seven days and search it. Click a history item to put it back on your clipboard.",
    links: [{ label: "source on github", href: "https://github.com/etcetera8/copy-pasta" }],
  },
];
