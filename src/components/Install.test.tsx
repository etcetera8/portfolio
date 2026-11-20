import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INSTALL_INTERVAL, INSTALL_LINES, Install } from "@/components/Install";
import { articles } from "@/content/articles";
import { links } from "@/content/links";
import { projects } from "@/content/projects";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("Install", () => {
  it("reads like a package install of the site's own content", () => {
    expect(INSTALL_LINES[0]).toBe("access granted.");
    expect(INSTALL_LINES).toContain("$ npm install portfolio");
    expect(INSTALL_LINES).toContain(`npm http fetch projects@${projects.length}.0.0 ... 200`);
    expect(INSTALL_LINES).toContain(`npm http fetch writing@${articles.length}.0.0 ... 200`);
    expect(INSTALL_LINES).toContain(`npm http fetch links@${links.length}.0.0 ... 200`);
    expect(INSTALL_LINES).toContain(
      `added ${projects.length + articles.length + links.length} packages in 1.2s`,
    );
    expect(INSTALL_LINES.at(-1)).toBe("initializing terminal ...");
  });

  it("has no repeated lines (each line is also its React key)", () => {
    expect(new Set(INSTALL_LINES).size).toBe(INSTALL_LINES.length);
  });

  it("lasts between one and two and a half seconds", () => {
    const duration = INSTALL_INTERVAL * INSTALL_LINES.length;
    expect(duration).toBeGreaterThanOrEqual(1000);
    expect(duration).toBeLessThanOrEqual(2500);
  });

  it("reveals one line at a time, then finishes once", () => {
    const onDone = vi.fn();
    render(<Install onDone={onDone} />);
    expect(screen.getByTestId("install")).toBeInTheDocument();
    expect(screen.getByText(INSTALL_LINES[0])).toBeInTheDocument();
    expect(screen.queryByText(INSTALL_LINES[1])).toBeNull();

    wait(INSTALL_INTERVAL);
    expect(screen.getByText(INSTALL_LINES[1])).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    wait(INSTALL_INTERVAL * INSTALL_LINES.length);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("skips on a key press or a tap", () => {
    const byKey = vi.fn();
    const first = render(<Install onDone={byKey} />);
    fireEvent.keyDown(window, { key: " " });
    expect(byKey).toHaveBeenCalledTimes(1);
    first.unmount();

    const byTap = vi.fn();
    render(<Install onDone={byTap} />);
    fireEvent.pointerDown(window);
    expect(byTap).toHaveBeenCalledTimes(1);
  });
});
