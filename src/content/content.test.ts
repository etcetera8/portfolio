import { describe, expect, it } from "vitest";
import { about } from "@/content/about";
import { articles, moreArticlesHref } from "@/content/articles";
import { links } from "@/content/links";
import { projects } from "@/content/projects";

describe("content", () => {
  it("has at least one project", () => {
    expect(projects.length).toBeGreaterThan(0);
  });

  it("uses unique lowercase kebab-case slugs", () => {
    const slugs = projects.map((project) => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("gives every project the text the shell needs", () => {
    for (const project of projects) {
      expect(project.title).not.toBe("");
      expect(project.summary).not.toBe("");
      expect(project.role).not.toBe("");
      expect(project.description).not.toBe("");
      expect(project.stack.length).toBeGreaterThan(0);
    }
  });

  it("marks drafts with a boolean, or not at all", () => {
    for (const project of projects) {
      expect([undefined, true, false]).toContain(project.draft);
    }
    expect(projects.find((project) => project.slug === "trainerroad-onboarding")?.draft).toBe(true);
  });

  it("only links to https URLs", () => {
    const hrefs = [
      ...projects.flatMap((project) => project.links.map((link) => link.href)),
      ...articles.map((article) => article.href),
      ...links.map((link) => link.href),
      moreArticlesHref,
    ];
    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\//);
    }
  });

  it("features articles and the three personal links", () => {
    expect(articles.length).toBeGreaterThan(0);
    expect(links.map((link) => link.label)).toEqual(["github", "linkedin", "medium"]);
  });

  it("has a name, tagline and bio", () => {
    expect(about.name).toBe("Parker T. Lindley");
    expect(about.tagline).not.toBe("");
    expect(about.bio).not.toBe("");
  });
});
