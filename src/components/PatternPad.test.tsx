import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PatternPad } from "@/components/PatternPad";
import { drawPath, mockPadRect } from "@/test/draw";

beforeEach(() => {
  mockPadRect();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function pad() {
  return screen.getByTestId("pattern-pad");
}

describe("PatternPad", () => {
  it("renders ten keys with their digits", () => {
    render(<PatternPad onStroke={() => {}} />);
    expect(pad().querySelectorAll("circle")).toHaveLength(10);
    for (const digit of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) {
      expect(screen.getByText(digit)).toBeInTheDocument();
    }
  });

  it("reports the keys of a finished stroke", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    drawPath(pad(), [1, 4, 7, 8, 9]);
    expect(onStroke).toHaveBeenCalledTimes(1);
    expect(onStroke).toHaveBeenCalledWith([1, 4, 7, 8, 9]);
  });

  it("inserts a key the pointer jumped over", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    drawPath(pad(), [1, 3]);
    expect(onStroke).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("marks visited keys", () => {
    render(<PatternPad onStroke={() => {}} />);
    drawPath(pad(), [1, 4]);
    expect(pad().querySelector('[data-key="1"]')).toHaveClass("on");
    expect(pad().querySelector('[data-key="4"]')).toHaveClass("on");
    expect(pad().querySelector('[data-key="9"]')).not.toHaveClass("on");
  });

  it("ignores a press that never reaches a second key", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(pad(), { clientX: 50, clientY: 50, pointerId: 1 });
    expect(onStroke).not.toHaveBeenCalled();
    expect(pad().querySelector('[data-key="1"]')).not.toHaveClass("on");
  });

  it("ignores a press that starts away from every key", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(pad(), { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(pad(), { clientX: 50, clientY: 150, pointerId: 1 });
    fireEvent.pointerUp(pad(), { clientX: 50, clientY: 150, pointerId: 1 });
    expect(onStroke).not.toHaveBeenCalled();
  });

  it("discards the stroke when the pointer is cancelled", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(pad(), { clientX: 50, clientY: 150, pointerId: 1 });
    fireEvent.pointerCancel(pad(), { pointerId: 1 });
    fireEvent.pointerUp(pad(), { clientX: 50, clientY: 150, pointerId: 1 });
    expect(onStroke).not.toHaveBeenCalled();
    expect(pad().querySelector('[data-key="1"]')).not.toHaveClass("on");
  });

  it("does nothing while disabled", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} disabled />);
    drawPath(pad(), [1, 4, 7]);
    expect(onStroke).not.toHaveBeenCalled();
  });

  it("draws the ghost trace only when given one", () => {
    const { rerender } = render(<PatternPad onStroke={() => {}} />);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();
    rerender(<PatternPad onStroke={() => {}} ghost={[1, 4, 7, 8, 9]} />);
    expect(screen.getByTestId("pad-ghost")).toHaveAttribute(
      "points",
      "50,50 50,150 50,250 150,250 250,250",
    );
  });

  it("adds the denied class when denied", () => {
    render(<PatternPad onStroke={() => {}} denied />);
    expect(pad()).toHaveClass("denied");
  });
});
