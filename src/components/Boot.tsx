"use client";

import { LineSequence } from "@/components/LineSequence";

export const BOOT_LINES = [
  "PTL-BIOS v2.0.26",
  "memory check ............ 640K OK",
  "loading kernel .......... OK",
  "mounting /home/parker ... OK",
  "starting authd .......... OK",
  "identity required.",
];

export const LINE_INTERVAL = 250;

/** The startup text shown before the lock screen. */
export function Boot({ onDone }: { onDone: () => void }) {
  return (
    <LineSequence lines={BOOT_LINES} interval={LINE_INTERVAL} onDone={onDone} testId="boot" />
  );
}
