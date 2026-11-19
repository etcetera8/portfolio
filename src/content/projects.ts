import type { Project } from "@/content/types";

export const projects: readonly Project[] = [
  {
    slug: "seattle-311",
    title: "Seattle 311",
    summary: "map of seattle-area 311 data",
    role: "Solo project",
    stack: ["TypeScript"],
    description: "A map displaying Seattle area 311 data.",
    // The live site goes first when a project has one.
    links: [
      { label: "live site", href: "https://etcetera8.github.io/seattle-311/" },
      { label: "source on github", href: "https://github.com/etcetera8/seattle-311" },
    ],
    media: {
      kind: "image",
      src: "/media/seattle-311.jpg",
      alt: "The Seattle 311 map: service requests drawn as 3D hexagonal columns over the city, tallest and reddest downtown, with category and year filters and a time slider.",
    },
  },
  {
    slug: "copy-pasta",
    title: "Copy Pasta",
    summary: "clipboard history utility with search",
    role: "Solo project",
    stack: ["TypeScript"],
    description:
      "A clipboard utility app. Save copy history for up to seven days and search it. Click a history item to put it back on your clipboard.",
    links: [
      { label: "live site", href: "https://copypastaformac.com/" },
      { label: "source on github", href: "https://github.com/etcetera8/copy-pasta" },
    ],
    media: {
      kind: "image",
      src: "/media/copy-pasta.png",
      alt: "The Copy Pasta website: a noodle-bowl logo, the line \"Your clipboard, remembered\", and a download button for macOS.",
    },
  },
  {
    slug: "trainerroad-onboarding",
    draft: true,
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
];
