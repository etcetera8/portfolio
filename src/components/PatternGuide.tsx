import {
  KEYS,
  PAD_HEIGHT,
  PAD_WIDTH,
  keyPosition,
  segmentKey,
  uniqueSegments,
  type Key,
} from "@/lib/pattern";

type Props = {
  /** The pattern to show, as the keys it passes through. */
  path: readonly Key[];
  /** What the picture means, for screen readers. */
  label: string;
};

// The pad's own coordinate space, with most of its outer margin trimmed so the
// keys fill the small picture.
const TRIM = 20;
const VIEW_BOX = `${TRIM} ${TRIM} ${PAD_WIDTH - TRIM * 2} ${PAD_HEIGHT - TRIM * 2}`;

/** A small, non-interactive picture of the keypad with one pattern traced on it. */
export function PatternGuide({ path, label }: Props) {
  return (
    <svg
      className="guide"
      data-testid="pattern-guide"
      viewBox={VIEW_BOX}
      role="img"
      aria-label={label}
    >
      {uniqueSegments(path).map(([from, to]) => {
        const [x1, y1] = keyPosition(from);
        const [x2, y2] = keyPosition(to);
        return (
          <line
            key={segmentKey(from, to)}
            className="guide-line"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
          />
        );
      })}
      {KEYS.map((key) => {
        const [x, y] = keyPosition(key);
        const on = path.includes(key);
        return (
          <circle
            key={key}
            className={on ? "guide-key on" : "guide-key"}
            data-key={key}
            cx={x}
            cy={y}
            r={on ? 24 : 15}
          />
        );
      })}
    </svg>
  );
}
