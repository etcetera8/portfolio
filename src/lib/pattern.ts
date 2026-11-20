export type Key = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Initial = "P" | "T" | "L";

export const PAD_WIDTH = 300;
export const PAD_HEIGHT = 300;
export const HIT_RADIUS = 34;

/** Keys in the order they are drawn on the pad. */
export const KEYS: readonly Key[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Column and row of each key. */
const GRID: Record<Key, readonly [number, number]> = {
  1: [0, 0],
  2: [1, 0],
  3: [2, 0],
  4: [0, 1],
  5: [1, 1],
  6: [2, 1],
  7: [0, 2],
  8: [1, 2],
  9: [2, 2],
};

export function keyPosition(key: Key): readonly [number, number] {
  const [column, row] = GRID[key];
  return [50 + column * 100, 50 + row * 100];
}

/**
 * `x` and `y` are in pad units (0..PAD_WIDTH, 0..PAD_HEIGHT). Returns the key
 * whose centre is within `radius` of the point, or null.
 */
export function nearestKey(x: number, y: number, radius: number = HIT_RADIUS): Key | null {
  let best: Key | null = null;
  let bestDistance = radius * radius;
  for (const key of KEYS) {
    const [keyX, keyY] = keyPosition(key);
    const distance = (keyX - x) ** 2 + (keyY - y) ** 2;
    if (distance <= bestDistance) {
      best = key;
      bestDistance = distance;
    }
  }
  return best;
}

export function segmentKey(a: Key, b: Key): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function keyAt(column: number, row: number): Key | null {
  for (const key of KEYS) {
    const [keyColumn, keyRow] = GRID[key];
    if (keyColumn === column && keyRow === row) return key;
  }
  return null;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Keys lying exactly on the straight line from `a` to `b`, in travel order. */
export function between(a: Key, b: Key): Key[] {
  const [fromColumn, fromRow] = GRID[a];
  const [toColumn, toRow] = GRID[b];
  const columnDelta = toColumn - fromColumn;
  const rowDelta = toRow - fromRow;
  const steps = gcd(Math.abs(columnDelta), Math.abs(rowDelta));
  const result: Key[] = [];
  for (let step = 1; step < steps; step++) {
    const key = keyAt(
      fromColumn + (columnDelta / steps) * step,
      fromRow + (rowDelta / steps) * step,
    );
    if (key !== null) result.push(key);
  }
  return result;
}

/** Adds `next` to the path, inserting any keys passed over on the way. */
export function appendKey(path: readonly Key[], next: Key): readonly Key[] {
  if (path.length === 0) return [next];
  const last = path[path.length - 1];
  if (last === next) return path;
  return [...path, ...between(last, next), next];
}

/** One entry per undirected segment, in path order, so a retraced segment appears once. */
export function uniqueSegments(path: readonly Key[]): (readonly [Key, Key])[] {
  const seen = new Set<string>();
  const result: (readonly [Key, Key])[] = [];
  for (let index = 1; index < path.length; index++) {
    const id = segmentKey(path[index - 1], path[index]);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push([path[index - 1], path[index]]);
  }
  return result;
}

export function segmentsOf(path: readonly Key[]): Set<string> {
  const segments = new Set<string>();
  for (let index = 1; index < path.length; index++) {
    segments.add(segmentKey(path[index - 1], path[index]));
  }
  return segments;
}

/** Each initial's segments; a drawing must equal the set exactly. */
const SHAPES: Record<Initial, readonly string[]> = {
  P: ["1-4", "4-7", "1-2", "2-3", "3-6", "5-6", "4-5"],
  T: ["1-2", "2-3", "2-5", "5-8"],
  L: ["1-4", "4-7", "7-8", "8-9"],
};

/** One valid way to draw each initial. Shown in the lock screen's pattern guide and used in tests. */
export const EXAMPLE_PATHS: Record<Initial, readonly Key[]> = {
  P: [7, 4, 1, 2, 3, 6, 5, 4],
  T: [1, 2, 3, 2, 5, 8],
  L: [1, 4, 7, 8, 9],
};

export function matchesShape(path: readonly Key[], initial: Initial): boolean {
  const drawn = segmentsOf(path);
  const target = SHAPES[initial];
  return drawn.size === target.length && target.every((segment) => drawn.has(segment));
}
