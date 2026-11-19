import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PatternPad } from "@/components/PatternPad";
import { drawPath, mockPadRect, mouse } from "@/test/draw";

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
    fireEvent.pointerDown(pad(), mouse(50, 50));
    fireEvent.pointerUp(pad(), mouse(50, 50));
    expect(onStroke).not.toHaveBeenCalled();
    expect(pad().querySelector('[data-key="1"]')).not.toHaveClass("on");
  });

  it("ignores a press that starts away from every key", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), mouse(100, 100));
    fireEvent.pointerMove(pad(), mouse(50, 50));
    fireEvent.pointerMove(pad(), mouse(50, 150));
    fireEvent.pointerUp(pad(), mouse(50, 150));
    expect(onStroke).not.toHaveBeenCalled();
  });

  it("discards the stroke when the pointer is cancelled", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), mouse(50, 50));
    fireEvent.pointerMove(pad(), mouse(50, 150));
    fireEvent.pointerCancel(pad(), { pointerId: 1 });
    fireEvent.pointerUp(pad(), mouse(50, 150));
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
    expect(screen.getByTestId("pad-ghost").querySelectorAll("line")).toHaveLength(4);
  });

  it("draws each segment of the ghost once, even when the path retraces one", () => {
    render(<PatternPad onStroke={() => {}} ghost={[1, 2, 3, 2, 5, 8]} />);
    expect(screen.getByTestId("pad-ghost").querySelectorAll("line")).toHaveLength(4);
  });

  it("adds the denied class when denied", () => {
    render(<PatternPad onStroke={() => {}} denied />);
    expect(pad()).toHaveClass("denied");
  });

  it("maps client coordinates through the pad's rect", () => {
    vi.restoreAllMocks();
    mockPadRect({ left: 20, top: 100, width: 150, height: 200 });
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    const client = (x: number, y: number) => mouse(20 + x / 2, 100 + y / 2);
    fireEvent.pointerDown(pad(), client(50, 50));
    fireEvent.pointerMove(pad(), client(50, 150));
    fireEvent.pointerMove(pad(), client(50, 250));
    fireEvent.pointerMove(pad(), client(150, 250));
    fireEvent.pointerMove(pad(), client(250, 250));
    fireEvent.pointerUp(pad(), { ...client(250, 250), buttons: 0 });
    expect(onStroke).toHaveBeenCalledWith([1, 4, 7, 8, 9]);
  });

  it("lets a second pointer neither end, restart nor submit the stroke", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), mouse(50, 50));
    fireEvent.pointerMove(pad(), mouse(50, 150));
    const other = { ...mouse(250, 250), pointerId: 2, isPrimary: false };
    fireEvent.pointerDown(pad(), other);
    fireEvent.pointerMove(pad(), other);
    fireEvent.pointerUp(pad(), { ...other, buttons: 0 });
    expect(onStroke).not.toHaveBeenCalled();
    expect(pad().querySelector('[data-key="9"]')).not.toHaveClass("on");
    fireEvent.pointerMove(pad(), mouse(50, 250));
    fireEvent.pointerUp(pad(), mouse(50, 250, 0));
    expect(onStroke).toHaveBeenCalledWith([1, 4, 7]);
  });

  it("does not start a stroke from a non-primary button", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), { ...mouse(50, 50, 2), button: 2 });
    fireEvent.pointerMove(pad(), mouse(50, 150, 2));
    fireEvent.pointerUp(pad(), { ...mouse(50, 150, 0), button: 2 });
    expect(onStroke).not.toHaveBeenCalled();
    expect(pad().querySelector('[data-key="1"]')).not.toHaveClass("on");
  });

  it("discards the stroke when a mouse moves with no button held", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), mouse(50, 50));
    fireEvent.pointerMove(pad(), mouse(50, 150));
    fireEvent.pointerMove(pad(), mouse(50, 250, 0));
    fireEvent.pointerUp(pad(), mouse(50, 250, 0));
    expect(onStroke).not.toHaveBeenCalled();
    expect(pad().querySelector('[data-key="1"]')).not.toHaveClass("on");
  });

  it("discards the stroke when pointer capture is lost mid-stroke", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), mouse(50, 50));
    fireEvent.pointerMove(pad(), mouse(50, 150));
    fireEvent.lostPointerCapture(pad(), { pointerId: 1 });
    fireEvent.pointerUp(pad(), mouse(50, 150, 0));
    expect(onStroke).not.toHaveBeenCalled();
    expect(pad().querySelector('[data-key="1"]')).not.toHaveClass("on");
  });

  it("still reports the stroke when lostpointercapture follows a normal release", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    drawPath(pad(), [1, 4]);
    fireEvent.lostPointerCapture(pad(), { pointerId: 1 });
    expect(onStroke).toHaveBeenCalledTimes(1);
    expect(pad().querySelector('[data-key="4"]')).toHaveClass("on");
  });

  it("places each digit beside its key, off the vertical line between keys", () => {
    render(<PatternPad onStroke={() => {}} />);
    const digit = screen.getByText("1");
    expect(digit).toHaveAttribute("x", "66");
    expect(digit).toHaveAttribute("y", "72");
  });
});
