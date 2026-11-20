import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaticContent } from "@/components/StaticContent";
import { about } from "@/content/about";
import { projects } from "@/content/projects";

describe("StaticContent", () => {
  it("contains the bio, every project, the articles and the links", () => {
    render(<StaticContent />);
    expect(screen.getByText(about.bio)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TrainerRoad onboarding" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seattle 311" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Copy Pasta" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Raspberry Pi closeCall Cycling License Plate Recorder/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^github\.com\/etcetera8/ })).toBeInTheDocument();
  });

  it("does not render media, so hidden content never downloads it", () => {
    const { container } = render(<StaticContent />);
    expect(container.querySelector(".media-slot, .media")).toBeNull();
  });

  it("shows only the named project when given a slug", () => {
    render(<StaticContent slug="seattle-311" />);
    expect(screen.getByRole("heading", { name: "Seattle 311" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Copy Pasta" })).toBeNull();
  });

  it("is a main landmark with the class the noscript style reveals", () => {
    const { container } = render(<StaticContent />);
    expect(container.firstElementChild?.tagName).toBe("MAIN");
    expect(container.firstElementChild).toHaveClass("static-content");
  });

  it("has one h1, section headings at h2 and project titles at h3", () => {
    render(<StaticContent />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("PARKER T. LINDLEY");
    for (const name of ["about", "projects", "writing", "links"]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { level: 3, name: "Seattle 311" })).toBeInTheDocument();
  });

  it("links each project title to its page on the home page", () => {
    render(<StaticContent />);
    const heading = screen.getByRole("heading", { level: 3, name: "Seattle 311" });
    const link = within(heading).getByRole("link", { name: "Seattle 311" });
    expect(link).toHaveAttribute("href", "/projects/seattle-311/");
    expect(link).not.toHaveAttribute("target");
  });

  it("links back to all projects from a project page, and does not link the title", () => {
    render(<StaticContent slug="seattle-311" />);
    const back = screen.getByRole("link", { name: "all projects" });
    expect(back).toHaveAttribute("href", "/");
    expect(back).not.toHaveAttribute("target");
    const heading = screen.getByRole("heading", { level: 3, name: "Seattle 311" });
    expect(within(heading).queryByRole("link")).toBeNull();
  });

  it("shows finished projects in full on the home page", () => {
    const { container } = render(<StaticContent />);
    const text = container.textContent ?? "";
    for (const project of projects.filter((candidate) => !candidate.draft)) {
      expect(text).toContain(project.role);
      expect(text).toContain(project.description);
    }
  });

  it("has no back link on the home page", () => {
    render(<StaticContent />);
    expect(screen.queryByRole("link", { name: "all projects" })).toBeNull();
  });
});
