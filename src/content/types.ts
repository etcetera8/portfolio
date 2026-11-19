export type Media = {
  kind: "video" | "image";
  src: string;
  alt: string;
};

export type Link = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  title: string;
  /** One line, shown in the project list. */
  summary: string;
  role: string;
  stack: string[];
  description: string;
  links: Link[];
  /** Omit until real media exists; a placeholder slot is shown instead. */
  media?: Media;
};

export type Article = {
  title: string;
  year: number;
  href: string;
};
