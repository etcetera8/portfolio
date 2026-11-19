import { describe, expect, it } from "vitest";
import {
  EXAMPLE_PATHS,
  appendKey,
  between,
  keyPosition,
  matchesShape,
  nearestKey,
  segmentKey,
  segmentsOf,
  type Key,
} from "@/lib/pattern";

describe("keyPosition", () => {
  it("places keys on the pad", () => {
    expect(keyPosition(1)).toEqual([50, 50]);
    expect(keyPosition(5)).toEqual([150, 150]);
    expect(keyPosition(9)).toEqual([250, 250]);
    expect(keyPosition(0)).toEqual([150, 350]);
  });
});

describe("nearestKey", () => {
  it("returns the key under the point", () => {
    expect(nearestKey(52, 47, 34)).toBe(1);
    expect(nearestKey(150, 350, 34)).toBe(0);
  });

  it("returns null between keys and on the empty corners", () => {
    expect(nearestKey(100, 100, 34)).toBeNull();
    expect(nearestKey(50, 350, 34)).toBeNull();
  });
});

describe("segmentKey", () => {
  it("is the same in both directions", () => {
    expect(segmentKey(4, 1)).toBe("1-4");
    expect(segmentKey(1, 4)).toBe("1-4");
    expect(segmentKey(8, 0)).toBe("0-8");
  });
});

describe("between", () => {
  it("finds keys a straight move passes over", () => {
    expect(between(1, 3)).toEqual([2]);
    expect(between(1, 7)).toEqual([4]);
    expect(between(1, 9)).toEqual([5]);
    expect(between(2, 0)).toEqual([5, 8]);
    expect(between(0, 2)).toEqual([8, 5]);
  });

  it("is empty for neighbours and for moves that pass over no key", () => {
    expect(between(1, 2)).toEqual([]);
    expect(between(1, 6)).toEqual([]);
    expect(between(7, 0)).toEqual([]);
    expect(between(5, 5)).toEqual([]);
  });
});

describe("appendKey", () => {
  it("starts a path", () => {
    expect(appendKey([], 7)).toEqual([7]);
  });

  it("adds a neighbouring key", () => {
    expect(appendKey([7], 4)).toEqual([7, 4]);
  });

  it("inserts keys that were passed over", () => {
    expect(appendKey([1], 3)).toEqual([1, 2, 3]);
    expect(appendKey([2], 0)).toEqual([2, 5, 8, 0]);
  });

  it("returns the same array when the key is already last", () => {
    const path: Key[] = [1, 4];
    expect(appendKey(path, 4)).toBe(path);
  });

  it("allows going back over a key", () => {
    expect(appendKey([1, 2, 3], 2)).toEqual([1, 2, 3, 2]);
  });
});

describe("segmentsOf", () => {
  it("collapses retraced segments", () => {
    expect([...segmentsOf([1, 2, 3, 2])].sort()).toEqual(["1-2", "2-3"]);
  });
});

describe("matchesShape", () => {
  it("accepts the example path for each initial", () => {
    expect(matchesShape(EXAMPLE_PATHS.P, "P")).toBe(true);
    expect(matchesShape(EXAMPLE_PATHS.T, "T")).toBe(true);
    expect(matchesShape(EXAMPLE_PATHS.L, "L")).toBe(true);
  });

  it("accepts each shape drawn backwards", () => {
    expect(matchesShape([...EXAMPLE_PATHS.P].reverse(), "P")).toBe(true);
    expect(matchesShape([...EXAMPLE_PATHS.T].reverse(), "T")).toBe(true);
    expect(matchesShape([...EXAMPLE_PATHS.L].reverse(), "L")).toBe(true);
  });

  it("accepts a different stroke order", () => {
    expect(matchesShape([4, 5, 6, 3, 2, 1, 4, 7], "P")).toBe(true);
    expect(matchesShape([8, 5, 2, 1, 2, 3], "T")).toBe(true);
    expect(matchesShape([9, 8, 7, 4, 1], "L")).toBe(true);
  });

  it("accepts retracing", () => {
    expect(matchesShape([1, 4, 7, 4, 7, 8, 9], "L")).toBe(true);
  });

  it("rejects a shape with a missing segment", () => {
    expect(matchesShape([7, 4, 1, 2, 3, 6, 5], "P")).toBe(false);
    expect(matchesShape([1, 2, 3], "T")).toBe(false);
  });

  it("rejects a shape with an extra segment", () => {
    expect(matchesShape([1, 4, 7, 8, 9, 6], "L")).toBe(false);
    expect(matchesShape([1, 2, 3, 2, 5, 8, 0], "T")).toBe(false);
  });

  it("rejects the wrong initial", () => {
    expect(matchesShape(EXAMPLE_PATHS.L, "P")).toBe(false);
    expect(matchesShape(EXAMPLE_PATHS.P, "T")).toBe(false);
    expect(matchesShape(EXAMPLE_PATHS.T, "L")).toBe(false);
  });

  it("rejects an empty or single-key path", () => {
    expect(matchesShape([], "L")).toBe(false);
    expect(matchesShape([1], "L")).toBe(false);
  });
});
