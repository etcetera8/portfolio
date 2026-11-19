export const STORAGE_KEY = "ptl.unlocked";

// Storage can be missing or throw (private windows, blocked site data).
// In every such case the gate simply shows again.

export function isUnlocked(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setUnlocked(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Not remembered; nothing else to do.
  }
}

export function clearUnlocked(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Already effectively locked.
  }
}
