import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Older jsdom builds have no PointerEvent. Fall back to MouseEvent so
// clientX / clientY still reach handlers in tests.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventFallback extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  window.PointerEvent = PointerEventFallback as unknown as typeof PointerEvent;
}

afterEach(() => {
  cleanup();
});
