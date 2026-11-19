import { fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { PAD_HEIGHT, PAD_WIDTH, keyPosition, type Key } from "@/lib/pattern";

export function mockPadRect() {
  return vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: PAD_WIDTH,
    bottom: PAD_HEIGHT,
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    toJSON: () => ({}),
  } as DOMRect);
}

function at(key: Key) {
  const [x, y] = keyPosition(key);
  return { clientX: x, clientY: y, pointerId: 1 };
}

/** Press on the first key, move through the rest, release on the last. */
export function drawPath(pad: Element, keys: readonly Key[]) {
  fireEvent.pointerDown(pad, at(keys[0]));
  for (const key of keys.slice(1)) {
    fireEvent.pointerMove(pad, at(key));
  }
  fireEvent.pointerUp(pad, at(keys[keys.length - 1]));
}
