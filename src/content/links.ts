import type { Link } from "@/content/types";

export const links: readonly Link[] = [
  { label: "github", href: "https://github.com/etcetera8" },
  { label: "linkedin", href: "https://www.linkedin.com/in/parker-lindley/" },
  { label: "medium", href: "https://medium.com/@parkerthomas_2392" },
];

export const email = "parker.t.lindley@gmail.com";

function profile(label: string): Link {
  const link = links.find((candidate) => candidate.label === label);
  if (!link) throw new Error(`no ${label} link`);
  return link;
}

/** Ways to reach Parker directly: the `contact` command and the line under the name banner. */
export const contact: readonly Link[] = [
  { label: "email", href: `mailto:${email}` },
  profile("linkedin"),
  profile("github"),
];
