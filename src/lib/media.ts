// Media-query checks shared by the components. Each is false where matchMedia is missing.

function matches(query: string): boolean {
  return window.matchMedia?.(query).matches === true;
}

export function prefersReducedMotion(): boolean {
  return matches("(prefers-reduced-motion: reduce)");
}

/** True on devices with a mouse or trackpad. Touch devices must not auto-open the keyboard. */
export function hasFinePointer(): boolean {
  return matches("(pointer: fine)");
}

/** True when any attached pointer is fine, e.g. a tablet with a mouse. */
export function hasAnyFinePointer(): boolean {
  return matches("(any-pointer: fine)");
}
