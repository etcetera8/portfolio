import type { Project } from "@/content/types";

export const projects: readonly Project[] = [
  {
    slug: "trainerroad-onboarding",
    title: "TrainerRoad onboarding",
    summary: "shipped onboarding flow",
    role: "Project lead and primary developer",
    stack: ["React", "TypeScript", "MobX", "C#", ".NET"],
    description:
      "The onboarding flow for TrainerRoad, a cycling training platform. A rider confirms their profile and preferences, connects the platforms they train with (Strava, Garmin, Zwift and others), and watches their ride history import and analyse with live progress for each source. The flow then walks them through what the analysis found: a power profile, a ranking against other athletes and an AI-detected FTP. It ends with a choice between a custom training plan and on-demand workouts. I led the project and wrote almost all of it, from technical design to release: the React and TypeScript front end with MobX for state management, the C#/.NET REST endpoints behind it, tests and admin tools, then Datadog dashboards and Hotjar session review after launch.",
    links: [],
    media: {
      kind: "video",
      src: "/media/trainerroad-onboarding.mp4",
      alt: "Screen recording of the TrainerRoad onboarding flow, cut to its highlights: a welcome screen, connecting training platforms such as Zwift and Garmin, ride history importing from Strava and Garmin, a power profile chart, a power ranking, AI FTP detection, choosing a training path, and the finished Career page.",
    },
  },
  {
    slug: "seattle-311",
    title: "Seattle 311",
    summary: "3d map of seattle 311 service requests",
    role: "Solo project",
    stack: ["React", "TypeScript", "MapLibre GL", "deck.gl", "MobX"],
    description:
      "An interactive 3D map of Seattle's 311 service requests. deck.gl groups the requests into 200-metre hexagons over a MapLibre GL map and draws each one as a column, taller where there are more. You can filter by request type and year, click a column for its count, and play a time-lapse that builds the map up from the first request to the latest. A MobX view model holds the filters and the time-lapse, and a Node script boils the city's 67 MB CSV export down to a compact file the browser can load.",
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
    summary: "clipboard history app for the mac menu bar",
    role: "Solo project",
    stack: ["Electron", "React", "TypeScript", "MobX", "SCSS"],
    description:
      "A clipboard history app for macOS that lives in the menu bar. It keeps what you copy for seven days, opens with Cmd+Shift+V, and lets you search your history and click an item to put it back on your clipboard. Items you pin never expire. It is built with Electron, React and MobX: the main process watches the clipboard and saves the history to disk, and the window handles search and pinning. Pushing a version tag builds and publishes installers for Apple Silicon and Intel through GitHub Actions.",
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
];
