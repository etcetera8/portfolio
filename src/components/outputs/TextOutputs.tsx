import { ExtLink } from "@/components/outputs/ExtLink";
import { about } from "@/content/about";
import { articles, moreArticlesHref } from "@/content/articles";
import { links } from "@/content/links";
import { projects } from "@/content/projects";

/** "https://www.example.com/path/" -> "example.com/path" */
function displayUrl(href: string): string {
  return href.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export function AboutOutput() {
  return <p className="out">{about.bio}</p>;
}

export function WritingOutput() {
  return (
    <>
      <ul className="rows">
        {articles.map((article) => (
          <li key={article.href} className="article">
            <span className="year">{article.year}</span>
            <ExtLink href={article.href}>{article.title}</ExtLink>
          </li>
        ))}
      </ul>
      <p className="out">
        <ExtLink href={moreArticlesHref}>more on medium</ExtLink>
      </p>
    </>
  );
}

export function LinksOutput() {
  return (
    <ul className="rows">
      {links.map((link) => (
        <li key={link.href} className="row">
          <span>{link.label}</span>
          <ExtLink href={link.href}>{displayUrl(link.href)}</ExtLink>
        </li>
      ))}
    </ul>
  );
}

export function OpenUsageOutput({ arg }: { arg: string | null }) {
  return (
    <>
      {arg !== null && <p className="out error">{`no project matches "${arg}".`}</p>}
      <p className="out">{"usage: open <name or number>"}</p>
      <p className="out">{`projects: ${projects.map((project) => project.slug).join(", ")}`}</p>
    </>
  );
}

export function NotFoundOutput({ input }: { input: string }) {
  return <p className="out error">{`command not found: ${input}. type help`}</p>;
}
