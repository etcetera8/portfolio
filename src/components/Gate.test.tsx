import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DENY_DELAY, GRANT_DELAY, Gate, PASS_DELAY } from "@/components/Gate";
import { EXAMPLE_PATHS } from "@/lib/pattern";
import { drawPath, mockPadRect } from "@/test/draw";

beforeEach(() => {
  vi.useFakeTimers();
  mockPadRect();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function pad() {
  return screen.getByTestId("pattern-pad");
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function pressKey(key: string) {
  fireEvent.keyDown(window, { key });
}

describe("Gate", () => {
  it("shows the name, the instruction and the first stage", () => {
    render(<Gate onUnlock={() => {}} />);
    expect(screen.getByRole("heading", { name: "PARKER T. LINDLEY" })).toBeInTheDocument();
    expect(screen.getByText("identify yourself: draw the initials")).toBeInTheDocument();
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("AWAITING INPUT");
  });

  it("advances when P is drawn", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    expect(screen.getByRole("status")).toHaveTextContent("OK 1/3");
    wait(PASS_DELAY);
    expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("AWAITING INPUT");
  });

  it("unlocks after P, T and L", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.T);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(screen.getByRole("status")).toHaveTextContent("ACCESS GRANTED");
    expect(onUnlock).not.toHaveBeenCalled();
    wait(GRANT_DELAY);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("denies a wrong shape without resetting the stage", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(screen.getByRole("status")).toHaveTextContent("ACCESS DENIED");
    expect(pad()).toHaveClass("denied");
    wait(DENY_DELAY);
    expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("AWAITING INPUT");
    expect(pad()).not.toHaveClass("denied");
  });

  it("shows the ghost trace after two misses on a stage and removes it once passed", () => {
    render(<Gate onUnlock={() => {}} />);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();

    drawPath(pad(), EXAMPLE_PATHS.L);
    wait(DENY_DELAY);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();

    drawPath(pad(), EXAMPLE_PATHS.T);
    wait(DENY_DELAY);
    expect(screen.getByTestId("pad-ghost")).toBeInTheDocument();

    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();
  });

  it("accepts the letter keys as an equivalent, in either case", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} />);
    pressKey("p");
    expect(screen.getByRole("status")).toHaveTextContent("OK 1/3");
    wait(PASS_DELAY);
    pressKey("T");
    wait(PASS_DELAY);
    pressKey("l");
    wait(GRANT_DELAY);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("does not count other keys, or the right key with a modifier, as anything", () => {
    render(<Gate onUnlock={() => {}} />);
    pressKey("x");
    pressKey("t");
    fireEvent.keyDown(window, { key: "p", metaKey: true });
    expect(screen.getByRole("status")).toHaveTextContent("AWAITING INPUT");
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
  });

  it("ignores input while feedback is showing", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.L);
    pressKey("p");
    expect(screen.getByRole("status")).toHaveTextContent("ACCESS DENIED");
    wait(DENY_DELAY);
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
  });

  it("tells screen-reader users about the keyboard equivalent", () => {
    render(<Gate onUnlock={() => {}} />);
    expect(
      screen.getByText("Keyboard alternative: press the P key, then T, then L."),
    ).toBeInTheDocument();
  });
});
