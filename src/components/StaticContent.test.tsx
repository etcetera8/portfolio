import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaticContent } from "@/components/StaticContent";

describe("StaticContent", () => {
  it("contains the bio, every project, the articles and the links", () => {
    render(<StaticContent />);
    expect(
      screen.getByText(
        "Parker T. Lindley. Fullstack dev. Rides bikes. Writing code since the dial-up days.",
      ),
    ).toBeInTheDocument();
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

  it("carries the class the noscript style reveals", () => {
    const { container } = render(<StaticContent />);
    expect(container.firstElementChild).toHaveClass("static-content");
  });
});
