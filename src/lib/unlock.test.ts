import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearUnlocked, isUnlocked, setUnlocked } from "@/lib/unlock";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("unlock storage", () => {
  it("is locked by default", () => {
    expect(isUnlocked()).toBe(false);
  });

  it("remembers an unlock under the ptl.unlocked key", () => {
    setUnlocked();
    expect(isUnlocked()).toBe(true);
    expect(window.localStorage.getItem("ptl.unlocked")).toBe("1");
  });

  it("locks again when cleared", () => {
    setUnlocked();
    clearUnlocked();
    expect(isUnlocked()).toBe(false);
    expect(window.localStorage.getItem("ptl.unlocked")).toBeNull();
  });

  it("treats any other stored value as locked", () => {
    window.localStorage.setItem("ptl.unlocked", "yes");
    expect(isUnlocked()).toBe(false);
  });

  it("stays locked and does not throw when storage is unavailable", () => {
    const denied = () => {
      throw new Error("storage denied");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(denied);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(denied);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(denied);

    expect(isUnlocked()).toBe(false);
    expect(() => setUnlocked()).not.toThrow();
    expect(() => clearUnlocked()).not.toThrow();
  });

  it("stays locked and does not throw when reading window.localStorage throws", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });

    expect(isUnlocked()).toBe(false);
    expect(() => setUnlocked()).not.toThrow();
    expect(() => clearUnlocked()).not.toThrow();
  });
});
