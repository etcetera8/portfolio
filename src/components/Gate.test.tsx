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

/** The visible step counter beside the guide, e.g. "1/3". */
function step() {
  return screen.getByTestId("gate-step");
}

/** The mini pattern that shows what to draw. */
function guide() {
  return screen.getByTestId("pattern-guide");
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
    render(<Gate onUnlock={() => {}} />);
    expect(screen.getByRole("heading", { level: 1, name: "PTL" })).toBeInTheDocument();
    expect(screen.getByText("Draw Pattern to Access Restricted Portfolio")).toBeInTheDocument();
    expect(step()).toHaveTextContent("1/3");
    expect(guide()).toHaveAccessibleName("Pattern 1 of 3: the letter P");
    // The simplified screen has no name banner, hint line or status line.
    expect(screen.queryByText(/PARKER/)).toBeNull();
    expect(screen.queryByText(/identify yourself/)).toBeNull();
    expect(screen.queryByText(/AWAITING INPUT/)).toBeNull();
  });

  it("traces the current letter in the guide: P, then T, then L", () => {
    render(<Gate onUnlock={() => {}} />);
    // P has seven segments; T and L have four each, on different keys.
    expect(guide().querySelectorAll("line")).toHaveLength(7);

    pressKey("p");
    wait(PASS_DELAY);
    expect(step()).toHaveTextContent("2/3");
    expect(guide()).toHaveAccessibleName("Pattern 2 of 3: the letter T");
    expect(guide().querySelectorAll("line")).toHaveLength(4);
    expect(guide().querySelector('[data-key="5"]')).toHaveClass("on");
    expect(guide().querySelector('[data-key="7"]')).not.toHaveClass("on");

    pressKey("t");
    wait(PASS_DELAY);
    expect(step()).toHaveTextContent("3/3");
    expect(guide()).toHaveAccessibleName("Pattern 3 of 3: the letter L");
    expect(guide().querySelectorAll("line")).toHaveLength(4);
    expect(guide().querySelector('[data-key="7"]')).toHaveClass("on");
    expect(guide().querySelector('[data-key="5"]')).not.toHaveClass("on");
  });

  it("ignores auto-repeated keydowns, so a held key from the boot screen does not type", () => {
    render(<Gate onUnlock={() => {}} />);
    fireEvent.keyDown(window, { key: "p", repeat: true });
    expect(live()).toHaveTextContent("Pattern 1 of 3. Draw the letter P, or type it.");
    pressKey("p");
    expect(live()).toHaveTextContent("Pattern 1 of 3 accepted.");
  });

  it("advances when P is drawn", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    expect(live()).toHaveTextContent("Pattern 1 of 3 accepted.");
    // The counter and guide change only once the feedback pause is over.
    expect(step()).toHaveTextContent("1/3");
    wait(PASS_DELAY);
    expect(step()).toHaveTextContent("2/3");
    expect(live()).toHaveTextContent("Pattern 2 of 3. Draw the letter T, or type it.");
  });

  it("unlocks after P, T and L", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.T);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(live()).toHaveTextContent("Access granted.");
    expect(step()).toHaveTextContent("3/3");
    expect(onUnlock).not.toHaveBeenCalled();
    wait(GRANT_DELAY);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("denies a wrong shape without resetting the step", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(live()).toHaveTextContent("Wrong pattern. Try again.");
    expect(pad()).toHaveClass("denied");
    wait(DENY_DELAY);
    expect(step()).toHaveTextContent("2/3");
    expect(live()).toHaveTextContent("Pattern 2 of 3. Draw the letter T, or type it.");
    expect(pad()).not.toHaveClass("denied");
  });

  it("accepts the letter keys as an equivalent, in either case", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} />);
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
    render(<Gate onUnlock={() => {}} />);
    pressKey("x");
    pressKey("t");
    fireEvent.keyDown(window, { key: "p", metaKey: true });
    fireEvent.keyDown(window, { key: "p", ctrlKey: true });
    fireEvent.keyDown(window, { key: "p", altKey: true });
    expect(live()).toHaveTextContent("Pattern 1 of 3. Draw the letter P, or type it.");
    expect(step()).toHaveTextContent("1/3");
    expect(pad()).not.toHaveClass("denied");
  });

  it("advances exactly one step for two matching keys in one act", () => {
    render(<Gate onUnlock={() => {}} />);
    act(() => {
      fireEvent.keyDown(window, { key: "p" });
      fireEvent.keyDown(window, { key: "p" });
    });
    wait(PASS_DELAY);
    expect(step()).toHaveTextContent("2/3");
  });

  it("calls onUnlock once however often the last letter is pressed", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} />);
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
    const { rerender } = render(<Gate onUnlock={first} />);
    pressKey("p");
    wait(PASS_DELAY);
    pressKey("t");
    wait(PASS_DELAY);
    pressKey("l");
    rerender(<Gate onUnlock={second} />);
    wait(GRANT_DELAY);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("ignores a stroke drawn during the feedback window", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(live()).toHaveTextContent("Wrong pattern. Try again.");
    // A correct P now must not pass: the pad is still showing the miss.
    drawPath(pad(), EXAMPLE_PATHS.P);
    expect(live()).toHaveTextContent("Wrong pattern. Try again.");
    wait(DENY_DELAY);
    expect(step()).toHaveTextContent("1/3");
    wait(PASS_DELAY);
    expect(step()).toHaveTextContent("1/3");
  });

  it("does not call onUnlock or warn when unmounted during a delay", () => {
    const onUnlock = vi.fn();
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const stageKeys of [["p"], ["x-deny"], ["p", "t", "l"]]) {
      const { unmount } = render(<Gate onUnlock={onUnlock} />);
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
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.L);
    wait(DENY_DELAY);
    expect(pad().querySelectorAll(".pad-key.on")).toHaveLength(0);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    expect(pad().querySelectorAll(".pad-key.on")).toHaveLength(0);
  });

  it("does not throw on a keydown with no key", () => {
    render(<Gate onUnlock={() => {}} />);
    const event = new Event("keydown");
    expect(() => window.dispatchEvent(event)).not.toThrow();
    expect(step()).toHaveTextContent("1/3");
  });

  describe("queued letters", () => {
    function type(value: string) {
      fireEvent.change(screen.getByRole("textbox"), { target: { value } });
    }

    it("replays typed letters that arrive during feedback", () => {
      const onUnlock = vi.fn();
      render(<Gate onUnlock={onUnlock} />);
      type("p");
      type("t");
      type("l");
      wait(PASS_DELAY);
      expect(step()).toHaveTextContent("2/3");
      expect(live()).toHaveTextContent("Pattern 2 of 3 accepted.");
      wait(PASS_DELAY);
      expect(live()).toHaveTextContent("Access granted.");
      expect(onUnlock).not.toHaveBeenCalled();
      wait(GRANT_DELAY);
      expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it("replays window shortcuts that arrive during feedback", () => {
      const onUnlock = vi.fn();
      render(<Gate onUnlock={onUnlock} />);
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
      render(<Gate onUnlock={() => {}} />);
      type("p");
      type("x");
      type("t");
      wait(PASS_DELAY);
      wait(PASS_DELAY);
      expect(step()).toHaveTextContent("3/3");
      expect(live()).toHaveTextContent("Pattern 3 of 3. Draw the letter L, or type it.");
    });

    it("copes with more letters than the queue holds", () => {
      const onUnlock = vi.fn();
      render(<Gate onUnlock={onUnlock} />);
      for (const letter of "ptlplplpl") type(letter);
      wait(PASS_DELAY * 2);
      wait(GRANT_DELAY * 2);
      expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it("does not queue strokes", () => {
      render(<Gate onUnlock={() => {}} />);
      type("p");
      drawPath(pad(), EXAMPLE_PATHS.T);
      wait(PASS_DELAY);
      expect(step()).toHaveTextContent("2/3");
      expect(live()).toHaveTextContent("Pattern 2 of 3. Draw the letter T, or type it.");
    });
  });

  describe("typed alternative", () => {
    function input() {
      return screen.getByRole("textbox", { name: "Type the letter shown" });
    }

    it("has an input that is not focused on load", () => {
      render(<Gate onUnlock={() => {}} />);
      expect(input()).toBeInTheDocument();
      expect(input()).not.toHaveFocus();
    });

    it("unlocks when P, T and L are typed in any case", () => {
      const onUnlock = vi.fn();
      render(<Gate onUnlock={onUnlock} />);
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
      render(<Gate onUnlock={() => {}} />);
      fireEvent.change(input(), { target: { value: "xp" } });
      expect(live()).toHaveTextContent("Pattern 1 of 3 accepted.");
    });

    it("ignores a wrong character: no step change and no denial", () => {
      render(<Gate onUnlock={() => {}} />);
      fireEvent.change(input(), { target: { value: "x" } });
      fireEvent.change(input(), { target: { value: "t" } });
      fireEvent.change(input(), { target: { value: "x" } });
      expect(live()).toHaveTextContent("Pattern 1 of 3. Draw the letter P, or type it.");
      expect(pad()).not.toHaveClass("denied");
      expect(input()).toHaveValue("");
    });

    it("does not double-advance when typing also reaches the window listener", () => {
      render(<Gate onUnlock={() => {}} />);
      fireEvent.keyDown(input(), { key: "p" });
      fireEvent.change(input(), { target: { value: "p" } });
      wait(PASS_DELAY);
      expect(step()).toHaveTextContent("2/3");
      wait(PASS_DELAY);
      expect(step()).toHaveTextContent("2/3");
    });

    it("is disabled once access is granted", () => {
      render(<Gate onUnlock={() => {}} />);
      pressKey("p");
      wait(PASS_DELAY);
      pressKey("t");
      wait(PASS_DELAY);
      pressKey("l");
      expect(input()).toBeDisabled();
    });
  });
});
