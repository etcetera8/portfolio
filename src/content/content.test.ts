import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { about } from "@/content/about";
import { articles, moreArticlesHref } from "@/content/articles";
import { contact, email, links } from "@/content/links";
import { projects } from "@/content/projects";
import { resume } from "@/content/resume";

describe("content", () => {
  it("has at least one project", () => {
    expect(projects.length).toBeGreaterThan(0);
  });

  it("points every project's media at a described file that exists under public/", () => {
    const withMedia = projects.filter((project) => project.media);
    expect(withMedia.length).toBeGreaterThan(0);
    for (const project of withMedia) {
      const media = project.media!;
      expect(media.src).toMatch(/^\/media\/[a-z0-9-]+\.(png|jpe?g|webp|mp4|webm)$/);
      expect(existsSync(join(process.cwd(), "public", media.src))).toBe(true);
      expect(media.alt.trim()).not.toBe("");
    }
  });

  it("lists a project's live site before its other links", () => {
    for (const project of projects) {
      const index = project.links.findIndex((link) => link.label === "live site");
      if (index !== -1) expect(index).toBe(0);
    }
    const live = (slug: string) =>
      projects.find((project) => project.slug === slug)?.links.find((link) => link.label === "live site")?.href;
    expect(live("seattle-311")).toBe("https://etcetera8.github.io/seattle-311/");
    expect(live("copy-pasta")).toBe("https://copypastaformac.com/");
  });

  it("leads with the professional project", () => {
    expect(projects[0].slug).toBe("trainerroad-onboarding");
  });

  it("lists finished projects before drafts", () => {
    const firstDraft = projects.findIndex((project) => project.draft);
    if (firstDraft === -1) return;
    expect(projects.slice(firstDraft).every((project) => project.draft)).toBe(true);
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

  it("offers email first, then LinkedIn and GitHub, as the ways to get in touch", () => {
    expect(contact.map((link) => link.label)).toEqual(["email", "linkedin", "github"]);
    expect(email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
    expect(contact[0].href).toBe(`mailto:${email}`);
    for (const link of contact.slice(1)) expect(link.href).toMatch(/^https:\/\//);
  });

  it("has a résumé with jobs newest first, each with dates and bullet points", () => {
    expect(resume.title).not.toBe("");
    expect(resume.summary).not.toBe("");
    expect(resume.skills.length).toBeGreaterThan(0);
    expect(resume.education.length).toBeGreaterThan(0);
    const started = (date: string) => {
      const [month, year] = date.split("/").map(Number);
      return year * 12 + month;
    };
    for (const job of resume.jobs) {
      expect(job.from).toMatch(/^(0[1-9]|1[0-2])\/\d{4}$/);
      expect(job.to).toMatch(/^((0[1-9]|1[0-2])\/\d{4}|present)$/);
      expect(job.points.length).toBeGreaterThan(0);
    }
    const starts = resume.jobs.map((job) => started(job.from));
    expect(starts).toEqual([...starts].sort((a, b) => b - a));
  });

  it("points the résumé's PDF at a file that exists under public/", () => {
    expect(resume.pdf).toMatch(/^\/[a-z0-9-]+\.pdf$/);
    expect(existsSync(join(process.cwd(), "public", resume.pdf))).toBe(true);
  });

  it("keeps a phone number out of the public résumé", () => {
    expect(JSON.stringify(resume)).not.toMatch(/\d{3}[-.\s]\d{3}[-.\s]\d{4}/);
  });

  it("has a name, tagline and bio", () => {
    expect(about.name).toBe("Parker T. Lindley");
    expect(about.tagline).not.toBe("");
    expect(about.bio).not.toBe("");
  });
});
