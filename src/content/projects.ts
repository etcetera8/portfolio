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
    title: "TrainerRoad onboarding",
    summary: "shipped onboarding flow",
    role: "Project lead and primary developer",
    stack: ["React", "TypeScript", "MobX", "C#", ".NET"],
    description:
      "The onboarding flow for TrainerRoad, a cycling training platform. It takes a rider from connecting their training platforms, through importing and analysing their ride history, to choosing how they want to train. I led the project and wrote almost all of it: a React and TypeScript front end with MobX for state management, served by a C#/.NET API.",
    links: [],
    media: {
      kind: "video",
      src: "/media/trainerroad-onboarding.mp4",
      alt: "Screen recording of the TrainerRoad onboarding flow: a welcome screen, profile and preferences, connecting Strava, Garmin and Zwift, importing ride history, a power profile chart, a power ranking, AI FTP detection, choosing a training path, and the finished Career page.",
    },
  },
];
