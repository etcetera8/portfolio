import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PatternGuide } from "@/components/PatternGuide";
import { EXAMPLE_PATHS } from "@/lib/pattern";

function guide() {
  return screen.getByTestId("pattern-guide");
}

describe("PatternGuide", () => {
  it("is a labelled picture of all nine keys", () => {
    render(<PatternGuide path={EXAMPLE_PATHS.L} label="Pattern 3 of 3: the letter L" />);
    expect(screen.getByRole("img", { name: "Pattern 3 of 3: the letter L" })).toBe(guide());
    expect(guide().querySelectorAll("circle")).toHaveLength(9);
  });

  it("highlights exactly the keys the pattern passes through", () => {
    render(<PatternGuide path={EXAMPLE_PATHS.L} label="L" />);
    const on = [...guide().querySelectorAll("circle.on")].map((key) => key.getAttribute("data-key"));
    expect(on.sort()).toEqual(["1", "4", "7", "8", "9"]);
  });

  it("joins the keys with one line per segment, at the keys' positions", () => {
    render(<PatternGuide path={[1, 4]} label="demo" />);
    const lines = guide().querySelectorAll("line");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveAttribute("x1", "50");
    expect(lines[0]).toHaveAttribute("y1", "50");
    expect(lines[0]).toHaveAttribute("x2", "50");
    expect(lines[0]).toHaveAttribute("y2", "150");
  });

  it("draws a retraced segment once", () => {
    render(<PatternGuide path={EXAMPLE_PATHS.T} label="T" />);
    expect(guide().querySelectorAll("line")).toHaveLength(4);
  });

  it("takes no pointer input: it has no handlers and is not focusable", () => {
    render(<PatternGuide path={EXAMPLE_PATHS.P} label="P" />);
    expect(guide()).not.toHaveAttribute("tabindex");
  });
});
