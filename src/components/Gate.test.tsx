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
    expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
  });

  it("ignores auto-repeated keydowns, so a held key from the boot screen does not type", () => {
    render(<Gate onUnlock={() => {}} />);
    fireEvent.keyDown(window, { key: "p", repeat: true });
    expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
    pressKey("p");
    expect(screen.getByTestId("gate-status")).toHaveTextContent("OK 1/3");
  });

  it("advances when P is drawn", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    expect(screen.getByTestId("gate-status")).toHaveTextContent("OK 1/3");
    wait(PASS_DELAY);
    expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
    expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
  });

  it("unlocks after P, T and L", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.T);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(screen.getByTestId("gate-status")).toHaveTextContent("ACCESS GRANTED");
    expect(onUnlock).not.toHaveBeenCalled();
    wait(GRANT_DELAY);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("denies a wrong shape without resetting the stage", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(screen.getByTestId("gate-status")).toHaveTextContent("ACCESS DENIED");
    expect(pad()).toHaveClass("denied");
    wait(DENY_DELAY);
    expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
    expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
    expect(pad()).not.toHaveClass("denied");
  });

  it("shows the ghost trace after two misses on a stage, not while denied, and removes it once passed", () => {
    render(<Gate onUnlock={() => {}} />);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();

    drawPath(pad(), EXAMPLE_PATHS.L);
    wait(DENY_DELAY);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();

    drawPath(pad(), EXAMPLE_PATHS.T);
    expect(screen.getByTestId("gate-status")).toHaveTextContent("ACCESS DENIED");
    expect(screen.queryByTestId("pad-ghost")).toBeNull();
    wait(DENY_DELAY);
    // Stage P: seven unique segments.
    expect(screen.getByTestId("pad-ghost").querySelectorAll("line")).toHaveLength(7);

    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();
  });

  it("shows the ghost for the current stage", () => {
    render(<Gate onUnlock={() => {}} />);
    pressKey("p");
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    wait(DENY_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    wait(DENY_DELAY);
    // Stage T: four unique segments, not the seven of P.
    expect(screen.getByTestId("pad-ghost").querySelectorAll("line")).toHaveLength(4);
  });

  it("accepts the letter keys as an equivalent, in either case", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} />);
    pressKey("p");
    expect(screen.getByTestId("gate-status")).toHaveTextContent("OK 1/3");
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
    expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
  });

  it("ignores input while feedback is showing", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.L);
    pressKey("p");
    expect(screen.getByTestId("gate-status")).toHaveTextContent("ACCESS DENIED");
    wait(DENY_DELAY);
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
  });

  it("advances exactly one stage for two matching keys in one act", () => {
    render(<Gate onUnlock={() => {}} />);
    act(() => {
      fireEvent.keyDown(window, { key: "p" });
      fireEvent.keyDown(window, { key: "p" });
    });
    wait(PASS_DELAY);
    expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
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

  it("announces the hint when idle and the result after a miss, through the live region", () => {
    render(<Gate onUnlock={() => {}} />);
    const live = screen.getByRole("status");
    expect(live).toHaveTextContent("draw the first initial");
    expect(live).not.toHaveTextContent(">");
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(live).toHaveTextContent("ACCESS DENIED");
    expect(screen.getByTestId("gate-status").closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("ignores a stroke drawn during the feedback window", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(screen.getByTestId("gate-status")).toHaveTextContent("ACCESS DENIED");
    drawPath(pad(), EXAMPLE_PATHS.P);
    expect(screen.getByTestId("gate-status")).toHaveTextContent("ACCESS DENIED");
    wait(DENY_DELAY);
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
    // One miss only (the P stroke was ignored, not a second miss): the ghost needs two.
    expect(screen.queryByTestId("pad-ghost")).toBeNull();
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

  it("does nothing for the right key with ctrl or alt held", () => {
    render(<Gate onUnlock={() => {}} />);
    fireEvent.keyDown(window, { key: "p", ctrlKey: true });
    fireEvent.keyDown(window, { key: "p", altKey: true });
    expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
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
    expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
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
      expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
      expect(screen.getByTestId("gate-status")).toHaveTextContent("OK 2/3");
      wait(PASS_DELAY);
      expect(screen.getByTestId("gate-status")).toHaveTextContent("ACCESS GRANTED");
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
      expect(screen.getByTestId("gate-status")).toHaveTextContent("ACCESS GRANTED");
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
      expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
      expect(screen.getByText("AUTH 3/3")).toBeInTheDocument();
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
      expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
      expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
    });
  });

  describe("typed alternative", () => {
    function input() {
      return screen.getByRole("textbox", { name: "Type the initials, one letter at a time" });
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
      expect(screen.getByTestId("gate-status")).toHaveTextContent("OK 1/3");
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
      expect(screen.getByTestId("gate-status")).toHaveTextContent("OK 1/3");
    });

    it("ignores a wrong character without counting a miss", () => {
      render(<Gate onUnlock={() => {}} />);
      fireEvent.change(input(), { target: { value: "x" } });
      fireEvent.change(input(), { target: { value: "t" } });
      fireEvent.change(input(), { target: { value: "x" } });
      expect(screen.getByTestId("gate-status")).toHaveTextContent("AWAITING INPUT");
      expect(input()).toHaveValue("");
      drawPath(pad(), EXAMPLE_PATHS.L);
      wait(DENY_DELAY);
      // One miss only: the ghost needs two.
      expect(screen.queryByTestId("pad-ghost")).toBeNull();
    });

    it("does not double-advance when typing also reaches the window listener", () => {
      render(<Gate onUnlock={() => {}} />);
      fireEvent.keyDown(input(), { key: "p" });
      fireEvent.change(input(), { target: { value: "p" } });
      wait(PASS_DELAY);
      expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
    });

    it("ignores typing while feedback is showing", () => {
      render(<Gate onUnlock={() => {}} />);
      drawPath(pad(), EXAMPLE_PATHS.L);
      fireEvent.change(input(), { target: { value: "p" } });
      expect(screen.getByTestId("gate-status")).toHaveTextContent("ACCESS DENIED");
      wait(DENY_DELAY);
      expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
    });
  });
});
