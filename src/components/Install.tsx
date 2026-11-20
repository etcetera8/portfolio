"use client";

import { LineSequence } from "@/components/LineSequence";
import { articles } from "@/content/articles";
import { links } from "@/content/links";
import { projects } from "@/content/projects";

// The "packages" are the site's real content, so the counts stay true as it grows.
const PACKAGES = [
  { name: "projects", count: projects.length },
  { name: "writing", count: articles.length },
  { name: "links", count: links.length },
];

const total = PACKAGES.reduce((sum, item) => sum + item.count, 0);

export const INSTALL_LINES = [
  "access granted.",
  "$ npm install portfolio",
  ...PACKAGES.map((item) => `npm http fetch ${item.name}@${item.count}.0.0 ... 200`),
  `added ${total} packages in 1.2s`,
  "initializing terminal ...",
];

export const INSTALL_INTERVAL = 350;

/** The package-install text shown between a solved gate and the terminal. */
export function Install({ onDone }: { onDone: () => void }) {
  return (
    <LineSequence
      lines={INSTALL_LINES}
      interval={INSTALL_INTERVAL}
      onDone={onDone}
      testId="install"
    />
  );
}
