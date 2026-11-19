import { fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { PAD_HEIGHT, PAD_WIDTH, keyPosition, type Key } from "@/lib/pattern";

type PadRect = { left: number; top: number; width: number; height: number };

/**
 * jsdom has no layout, so tests pin the pad's bounding box. The default is the
 * pad's own 300 x 400 coordinate space, where client coordinates equal pad
 * coordinates. Pass a rect to test the client-to-pad mapping.
 */
export function mockPadRect(
  rect: PadRect = { left: 0, top: 0, width: PAD_WIDTH, height: PAD_HEIGHT },
) {
  return vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: rect.left,
    y: rect.top,
    left: rect.left,
    top: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    width: rect.width,
    height: rect.height,
    toJSON: () => ({}),
  } as DOMRect);
}

/** Fields of a real primary-button mouse drag. */
export function mouse(clientX: number, clientY: number, buttons = 1) {
  return {
    clientX,
    clientY,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons,
  };
}

function at(key: Key, buttons = 1) {
  const [x, y] = keyPosition(key);
  return mouse(x, y, buttons);
}

/** Press on the first key, move through the rest, release on the last. */
export function drawPath(pad: Element, keys: readonly Key[]) {
  fireEvent.pointerDown(pad, at(keys[0]));
  for (const key of keys.slice(1)) {
    fireEvent.pointerMove(pad, at(key));
  }
  fireEvent.pointerUp(pad, at(keys[keys.length - 1], 0));
}
