import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOT_LINES, Boot, LINE_INTERVAL } from "@/components/Boot";

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

describe("Boot", () => {
  it("reveals one line at a time, then finishes once", () => {
    const onDone = vi.fn();
    render(<Boot onDone={onDone} />);
    expect(screen.getByText(BOOT_LINES[0])).toBeInTheDocument();
    expect(screen.queryByText(BOOT_LINES[1])).toBeNull();

    wait(LINE_INTERVAL);
    expect(screen.getByText(BOOT_LINES[1])).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    wait(LINE_INTERVAL * BOOT_LINES.length);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("finishes in about two seconds", () => {
    expect(LINE_INTERVAL * BOOT_LINES.length).toBe(2100);
  });

  it("tells touch visitors they can tap to skip", () => {
    render(<Boot onDone={() => {}} />);
    expect(screen.getByText("tap or press any key to skip")).toBeInTheDocument();
  });

  it("reserves the height of every line so the hint does not move", () => {
    const { container } = render(<Boot onDone={() => {}} />);
    const lines = container.querySelector(".boot-lines") as HTMLElement;
    expect(lines.style.getPropertyValue("--boot-lines")).toBe(String(BOOT_LINES.length));
  });

  it("skips on a key press", () => {
    const onDone = vi.fn();
    render(<Boot onDone={onDone} />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("skips on a click or tap", () => {
    const onDone = vi.fn();
    render(<Boot onDone={onDone} />);
    fireEvent.pointerDown(window);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
