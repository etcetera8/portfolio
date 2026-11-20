import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StaticContent } from "@/components/StaticContent";
import { draftProject as draft } from "@/test/draftProject";

// The real content plus one draft, listed last as drafts are.
vi.mock("@/content/projects", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/content/projects")>();
  const { draftProject } = await import("@/test/draftProject");
  return { projects: [...actual.projects, draftProject] };
});

describe("StaticContent with a draft project", () => {
  it("shows a draft on the home page as only its linked title and summary", () => {
    const { container } = render(<StaticContent />);
    const heading = screen.getByRole("heading", { level: 3, name: draft.title });
    expect(within(heading).getByRole("link")).toHaveAttribute("href", `/projects/${draft.slug}/`);
    expect(screen.getByText(draft.summary)).toBeInTheDocument();
    const text = container.textContent ?? "";
    expect(text).not.toContain(draft.role);
    expect(text).not.toContain(draft.description);
    expect(text).not.toContain(draft.stack.join(", "));
  });

  it("keeps the full block on the draft's own page", () => {
    const { container } = render(<StaticContent slug={draft.slug} />);
    const text = container.textContent ?? "";
    expect(text).toContain(draft.role);
    expect(text).toContain(draft.description);
  });

  it("still shows finished projects in full beside it", () => {
    const { container } = render(<StaticContent />);
    const text = container.textContent ?? "";
    expect(text).toContain("An interactive 3D map of Seattle's 311 service requests.");
  });
});
