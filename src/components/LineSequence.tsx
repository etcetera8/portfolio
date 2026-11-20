"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  /** Lines of terminal output, revealed top to bottom. Each must be unique. */
  lines: readonly string[];
  /** Milliseconds between lines. */
  interval: number;
  /** Called once, when the last line has had its turn or the visitor skips. */
  onDone: () => void;
  testId: string;
};

/**
 * Terminal-style text that appears one line at a time. Any key, click or tap
 * skips to the end.
 */
export function LineSequence({ lines, interval, onDone, testId }: Props) {
  // Number of lines showing. One past the end means the sequence is over.
  const [count, setCount] = useState(1);
  const finished = count > lines.length;

  useEffect(() => {
    const skip = () => setCount(lines.length + 1);

    const timer = window.setInterval(() => setCount((current) => current + 1), interval);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [lines.length, interval]);

  // `finished` flips to true exactly once, so onDone runs exactly once.
  // onDone is left out of the dependencies on purpose: a new callback identity
  // from the parent must not fire it again.
  useEffect(() => {
    if (finished) onDone();
  }, [finished]);

  return (
    <main className="boot" data-testid={testId}>
      {/* min-height (see .boot-lines) reserves room for every line, so the hint stays put. */}
      <div className="boot-lines" style={{ "--boot-lines": lines.length } as CSSProperties}>
        {lines.slice(0, count).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className="boot-skip">tap or press any key to skip</p>
    </main>
  );
}
