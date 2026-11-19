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

  it("shows the ghost trace after two misses on a stage, not while denied, and removes it once passed", () => {
    render(<Gate onUnlock={() => {}} />);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();

    drawPath(pad(), EXAMPLE_PATHS.L);
    wait(DENY_DELAY);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();

    drawPath(pad(), EXAMPLE_PATHS.T);
    expect(screen.getByRole("status")).toHaveTextContent("ACCESS DENIED");
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
      expect(screen.getByRole("status")).toHaveTextContent("OK 1/3");
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
      expect(screen.getByRole("status")).toHaveTextContent("OK 1/3");
    });

    it("ignores a wrong character without counting a miss", () => {
      render(<Gate onUnlock={() => {}} />);
      fireEvent.change(input(), { target: { value: "x" } });
      fireEvent.change(input(), { target: { value: "t" } });
      fireEvent.change(input(), { target: { value: "x" } });
      expect(screen.getByRole("status")).toHaveTextContent("AWAITING INPUT");
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
      expect(screen.getByRole("status")).toHaveTextContent("ACCESS DENIED");
      wait(DENY_DELAY);
      expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
    });
  });
});
