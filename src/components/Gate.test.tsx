import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLOCKS_PER_STAGE, DENY_DELAY, GRANT_DELAY, Gate, PASS_DELAY } from "@/components/Gate";
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

/** The mini pattern that shows what to draw. */
function guide() {
  return screen.getByTestId("pattern-guide");
}

/** Which pattern the gate is waiting for, read from the guide's label. */
function expectStep(step: number) {
  expect(guide()).toHaveAccessibleName(new RegExp(`^Pattern ${step} of 3:`));
}

/** The bar that fills a third for each accepted pattern. */
function progress() {
  return screen.getByTestId("gate-progress");
}

function expectProgress(done: number) {
  expect(progress()).toHaveAttribute("aria-valuenow", String(done));
  expect(progress().querySelectorAll(".gate-bar-block.on")).toHaveLength(done * BLOCKS_PER_STAGE);
}

/** The screen-reader status line; its text tracks the gate's state. */
function live() {
  return screen.getByRole("status");
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
  it("shows only the initials, the instruction, the guide and the first step", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    expect(screen.getByRole("heading", { level: 1, name: "PTL" })).toBeInTheDocument();
    expect(screen.getByText("Draw Pattern to Access Restricted Portfolio")).toBeInTheDocument();
    expectStep(1);
    expect(guide()).toHaveAccessibleName("Pattern 1 of 3: the letter P");
    // The simplified screen has no name banner, hint line or status line.
    expect(screen.queryByText(/PARKER/)).toBeNull();
    expect(screen.queryByText(/identify yourself/)).toBeNull();
    expect(screen.queryByText(/AWAITING INPUT/)).toBeNull();
  });

  it("traces the current letter in the guide: P, then T, then L", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    // P has seven segments; T and L have four each, on different keys.
    expect(guide().querySelectorAll("line")).toHaveLength(7);

    pressKey("p");
    wait(PASS_DELAY);
    expectStep(2);
    expect(guide()).toHaveAccessibleName("Pattern 2 of 3: the letter T");
    expect(guide().querySelectorAll("line")).toHaveLength(4);
    expect(guide().querySelector('[data-key="5"]')).toHaveClass("on");
    expect(guide().querySelector('[data-key="7"]')).not.toHaveClass("on");

    pressKey("t");
    wait(PASS_DELAY);
    expectStep(3);
    expect(guide()).toHaveAccessibleName("Pattern 3 of 3: the letter L");
    expect(guide().querySelectorAll("line")).toHaveLength(4);
    expect(guide().querySelector('[data-key="7"]')).toHaveClass("on");
    expect(guide().querySelector('[data-key="5"]')).not.toHaveClass("on");
  });

  it("offers a visible way to skip the lock, which does not count as unlocking", () => {
    const onUnlock = vi.fn();
    const onSkip = vi.fn();
    render(<Gate onUnlock={onUnlock} onSkip={onSkip} />);
    const skip = screen.getByRole("button", { name: "Skip the lock screen" });
    expect(skip).toHaveTextContent("skip");
    fireEvent.click(skip);
    expect(onSkip).toHaveBeenCalledTimes(1);
    wait(GRANT_DELAY * 2);
    expect(onUnlock).not.toHaveBeenCalled();
  });

  it("fills a third of the progress bar as soon as each pattern is accepted", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    expect(progress()).toHaveAttribute("aria-valuemax", "3");
    expect(progress().querySelectorAll(".gate-bar-block")).toHaveLength(3 * BLOCKS_PER_STAGE);
    expectProgress(0);
    expect(screen.getByText("0%")).toBeInTheDocument();

    drawPath(pad(), EXAMPLE_PATHS.P);
    // No waiting for the feedback pause: the bar starts filling at once.
    expectProgress(1);
    expect(screen.getByText("33%")).toBeInTheDocument();
    wait(PASS_DELAY);
    expectProgress(1);

    drawPath(pad(), EXAMPLE_PATHS.T);
    expectProgress(2);
    expect(screen.getByText("67%")).toBeInTheDocument();
    wait(PASS_DELAY);

    drawPath(pad(), EXAMPLE_PATHS.L);
    expectProgress(3);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows a working indicator until access is granted", () => {
    const { container } = render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    expect(screen.getByText(/^authenticating/)).toBeInTheDocument();
    expect(container.querySelector(".ellipsis")).toHaveTextContent("...");

    pressKey("p");
    wait(PASS_DELAY);
    pressKey("t");
    wait(PASS_DELAY);
    expect(container.querySelector(".ellipsis")).not.toBeNull();

    pressKey("l");
    expect(screen.getByText("identity confirmed")).toBeInTheDocument();
    expect(container.querySelector(".ellipsis")).toBeNull();
  });

  it("leaves the progress bar alone after a wrong pattern", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    pressKey("p");
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expectProgress(1);
    wait(DENY_DELAY);
    expectProgress(1);
  });

  it("ignores auto-repeated keydowns, so a held key from the boot screen does not type", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    fireEvent.keyDown(window, { key: "p", repeat: true });
    expect(live()).toHaveTextContent("Pattern 1 of 3. Draw the letter P, or type it.");
    pressKey("p");
    expect(live()).toHaveTextContent("Pattern 1 of 3 accepted.");
  });

  it("advances when P is drawn", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    expect(live()).toHaveTextContent("Pattern 1 of 3 accepted.");
    // The guide changes only once the feedback pause is over.
    expectStep(1);
    wait(PASS_DELAY);
    expectStep(2);
    expect(live()).toHaveTextContent("Pattern 2 of 3. Draw the letter T, or type it.");
  });

  it("unlocks after P, T and L", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} onSkip={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.T);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(live()).toHaveTextContent("Access granted.");
    expectStep(3);
    expect(onUnlock).not.toHaveBeenCalled();
    wait(GRANT_DELAY);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("denies a wrong shape without resetting the step", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(live()).toHaveTextContent("Wrong pattern. Try again.");
    expect(pad()).toHaveClass("denied");
    wait(DENY_DELAY);
    expectStep(2);
    expect(live()).toHaveTextContent("Pattern 2 of 3. Draw the letter T, or type it.");
    expect(pad()).not.toHaveClass("denied");
  });

  it("accepts the letter keys as an equivalent, in either case", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} onSkip={() => {}} />);
    pressKey("p");
    expect(live()).toHaveTextContent("Pattern 1 of 3 accepted.");
    wait(PASS_DELAY);
    pressKey("T");
    wait(PASS_DELAY);
    pressKey("l");
    wait(GRANT_DELAY);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("does not count other keys, or the right key with a modifier, as anything", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    pressKey("x");
    pressKey("t");
    fireEvent.keyDown(window, { key: "p", metaKey: true });
    fireEvent.keyDown(window, { key: "p", ctrlKey: true });
    fireEvent.keyDown(window, { key: "p", altKey: true });
    expect(live()).toHaveTextContent("Pattern 1 of 3. Draw the letter P, or type it.");
    expectStep(1);
    expect(pad()).not.toHaveClass("denied");
  });

  it("advances exactly one step for two matching keys in one act", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    act(() => {
      fireEvent.keyDown(window, { key: "p" });
      fireEvent.keyDown(window, { key: "p" });
    });
    wait(PASS_DELAY);
    expectStep(2);
  });

  it("calls onUnlock once however often the last letter is pressed", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} onSkip={() => {}} />);
    pressKey("p");
    wait(PASS_DELAY);
    pressKey("t");
    wait(PASS_DELAY);
    act(() => {
      pressKey("l");
      pressKey("l");
      pressKey("l");
    });
    wait(GRANT_DELAY * 2);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("calls the latest onUnlock", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Gate onUnlock={first} onSkip={() => {}} />);
    pressKey("p");
    wait(PASS_DELAY);
    pressKey("t");
    wait(PASS_DELAY);
    pressKey("l");
    rerender(<Gate onUnlock={second} onSkip={() => {}} />);
    wait(GRANT_DELAY);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("ignores a stroke drawn during the feedback window", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(live()).toHaveTextContent("Wrong pattern. Try again.");
    // A correct P now must not pass: the pad is still showing the miss.
    drawPath(pad(), EXAMPLE_PATHS.P);
    expect(live()).toHaveTextContent("Wrong pattern. Try again.");
    wait(DENY_DELAY);
    expectStep(1);
    wait(PASS_DELAY);
    expectStep(1);
  });

  it("does not call onUnlock or warn when unmounted during a delay", () => {
    const onUnlock = vi.fn();
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const stageKeys of [["p"], ["x-deny"], ["p", "t", "l"]]) {
      const { unmount } = render(<Gate onUnlock={onUnlock} onSkip={() => {}} />);
      for (const key of stageKeys) {
        if (key === "x-deny") drawPath(pad(), EXAMPLE_PATHS.L);
        else {
          pressKey(key);
          if (key !== stageKeys[stageKeys.length - 1]) wait(PASS_DELAY);
        }
      }
      unmount();
      expect(() => wait(GRANT_DELAY * 2)).not.toThrow();
    }
    expect(onUnlock).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("clears the pad after a deny and after a pass", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.L);
    wait(DENY_DELAY);
    expect(pad().querySelectorAll(".pad-key.on")).toHaveLength(0);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    expect(pad().querySelectorAll(".pad-key.on")).toHaveLength(0);
  });

  it("does not throw on a keydown with no key", () => {
    render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
    const event = new Event("keydown");
    expect(() => window.dispatchEvent(event)).not.toThrow();
    expectStep(1);
  });

  describe("queued letters", () => {
    function type(value: string) {
      fireEvent.change(screen.getByRole("textbox"), { target: { value } });
    }

    it("replays typed letters that arrive during feedback", () => {
      const onUnlock = vi.fn();
      render(<Gate onUnlock={onUnlock} onSkip={() => {}} />);
      type("p");
      type("t");
      type("l");
      wait(PASS_DELAY);
      expectStep(2);
      expect(live()).toHaveTextContent("Pattern 2 of 3 accepted.");
      wait(PASS_DELAY);
      expect(live()).toHaveTextContent("Access granted.");
      expect(onUnlock).not.toHaveBeenCalled();
      wait(GRANT_DELAY);
      expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it("replays window shortcuts that arrive during feedback", () => {
      const onUnlock = vi.fn();
      render(<Gate onUnlock={onUnlock} onSkip={() => {}} />);
      pressKey("p");
      pressKey("t");
      pressKey("l");
      wait(PASS_DELAY);
      wait(PASS_DELAY);
      expect(live()).toHaveTextContent("Access granted.");
      wait(GRANT_DELAY);
      expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it("skips a queued wrong letter", () => {
      render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
      type("p");
      type("x");
      type("t");
      wait(PASS_DELAY);
      wait(PASS_DELAY);
      expectStep(3);
      expect(live()).toHaveTextContent("Pattern 3 of 3. Draw the letter L, or type it.");
    });

    it("copes with more letters than the queue holds", () => {
      const onUnlock = vi.fn();
      render(<Gate onUnlock={onUnlock} onSkip={() => {}} />);
      for (const letter of "ptlplplpl") type(letter);
      wait(PASS_DELAY * 2);
      wait(GRANT_DELAY * 2);
      expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it("does not queue strokes", () => {
      render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
      type("p");
      drawPath(pad(), EXAMPLE_PATHS.T);
      wait(PASS_DELAY);
      expectStep(2);
      expect(live()).toHaveTextContent("Pattern 2 of 3. Draw the letter T, or type it.");
    });
  });

  describe("typed alternative", () => {
    function input() {
      return screen.getByRole("textbox", { name: "Type the letter shown" });
    }

    it("has an input that is not focused on load", () => {
      render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
      expect(input()).toBeInTheDocument();
      expect(input()).not.toHaveFocus();
    });

    it("unlocks when P, T and L are typed in any case", () => {
      const onUnlock = vi.fn();
      render(<Gate onUnlock={onUnlock} onSkip={() => {}} />);
      fireEvent.change(input(), { target: { value: "p" } });
      expect(live()).toHaveTextContent("Pattern 1 of 3 accepted.");
      expect(input()).toHaveValue("");
      wait(PASS_DELAY);
      fireEvent.change(input(), { target: { value: "T" } });
      wait(PASS_DELAY);
      fireEvent.change(input(), { target: { value: "l" } });
      wait(GRANT_DELAY);
      expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it("uses the last character typed", () => {
      render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
      fireEvent.change(input(), { target: { value: "xp" } });
      expect(live()).toHaveTextContent("Pattern 1 of 3 accepted.");
    });

    it("ignores a wrong character: no step change and no denial", () => {
      render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
      fireEvent.change(input(), { target: { value: "x" } });
      fireEvent.change(input(), { target: { value: "t" } });
      fireEvent.change(input(), { target: { value: "x" } });
      expect(live()).toHaveTextContent("Pattern 1 of 3. Draw the letter P, or type it.");
      expect(pad()).not.toHaveClass("denied");
      expect(input()).toHaveValue("");
    });

    it("does not double-advance when typing also reaches the window listener", () => {
      render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
      fireEvent.keyDown(input(), { key: "p" });
      fireEvent.change(input(), { target: { value: "p" } });
      wait(PASS_DELAY);
      expectStep(2);
      wait(PASS_DELAY);
      expectStep(2);
    });

    it("is disabled once access is granted", () => {
      render(<Gate onUnlock={() => {}} onSkip={() => {}} />);
      pressKey("p");
      wait(PASS_DELAY);
      pressKey("t");
      wait(PASS_DELAY);
      pressKey("l");
      expect(input()).toBeDisabled();
    });
  });
});
