import { describe, expect, it } from "vitest";
import { about } from "@/content/about";
import { articles, moreArticlesHref } from "@/content/articles";
import { links } from "@/content/links";
import { projects } from "@/content/projects";

describe("content", () => {
  it("has the three featured projects in order", () => {
    expect(projects.map((project) => project.slug)).toEqual([
      "trainerroad-onboarding",
      "seattle-311",
      "copy-pasta",
    ]);
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

  it("features two articles and three personal links", () => {
    expect(articles).toHaveLength(2);
    expect(links.map((link) => link.label)).toEqual(["github", "linkedin", "medium"]);
  });

  it("has a name, tagline and bio", () => {
    expect(about.name).toBe("Parker T. Lindley");
    expect(about.tagline).not.toBe("");
    expect(about.bio).not.toBe("");
  });
});
