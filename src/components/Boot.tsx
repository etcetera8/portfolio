"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

export const BOOT_LINES = [
  "PTL-BIOS v2.0.26",
  "memory check ............ 640K OK",
  "loading kernel .......... OK",
  "mounting /home/parker ... OK",
  "starting authd .......... OK",
  "identity required.",
];

export const LINE_INTERVAL = 250;

export function Boot({ onDone }: { onDone: () => void }) {
  // Number of lines showing. One past the end means the sequence is over.
  const [count, setCount] = useState(1);
  const finished = count > BOOT_LINES.length;

  useEffect(() => {
    const skip = () => setCount(BOOT_LINES.length + 1);

    const interval = window.setInterval(() => setCount((current) => current + 1), LINE_INTERVAL);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  // `finished` flips to true exactly once, so onDone runs exactly once.
  // onDone is left out of the dependencies on purpose: a new callback identity
  // from the parent must not fire it again.
  useEffect(() => {
    if (finished) onDone();
  }, [finished]);

  return (
    <main className="boot" data-testid="boot">
      {/* min-height (see .boot-lines) reserves room for every line, so the hint stays put. */}
      <div className="boot-lines" style={{ "--boot-lines": BOOT_LINES.length } as CSSProperties}>
        {BOOT_LINES.slice(0, count).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className="boot-skip">tap or press any key to skip</p>
    </main>
  );
}
