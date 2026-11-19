"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  HIT_RADIUS,
  KEYS,
  PAD_HEIGHT,
  PAD_WIDTH,
  appendKey,
  keyPosition,
  nearestKey,
  type Key,
} from "@/lib/pattern";

type Point = readonly [number, number];

type Props = {
  /** Called on pointer-up with the keys visited, when there are at least two. */
  onStroke: (path: readonly Key[]) => void;
  /** A path to show as a dashed hint, or null for none. */
  ghost?: readonly Key[] | null;
  /** Shows the current trace as an error. */
  denied?: boolean;
  /** Ignores new strokes. */
  disabled?: boolean;
};

function toPoints(path: readonly Key[]): string {
  return path.map((key) => keyPosition(key).join(",")).join(" ");
}

export function PatternPad({ onStroke, ghost = null, denied = false, disabled = false }: Props) {
  // The ref is the source of truth for handlers; state mirrors it for rendering.
  const pathRef = useRef<readonly Key[]>([]);
  const drawingRef = useRef(false);
  const [path, setPath] = useState<readonly Key[]>([]);
  const [pointer, setPointer] = useState<Point | null>(null);

  function update(next: readonly Key[]) {
    pathRef.current = next;
    setPath(next);
  }

  function toPad(event: ReactPointerEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) * PAD_WIDTH) / rect.width,
      ((event.clientY - rect.top) * PAD_HEIGHT) / rect.height,
    ];
  }

  function handleDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (disabled) return;
    const position = toPad(event);
    const key = nearestKey(position[0], position[1], HIT_RADIUS);
    if (key === null) return;
    event.preventDefault();
    try {
      // Keeps move/up events coming if the pointer leaves the pad.
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Capture is a nicety; drawing works without it.
    }
    drawingRef.current = true;
    update([key]);
    setPointer(position);
  }

  function handleMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drawingRef.current) return;
    const position = toPad(event);
    setPointer(position);
    const key = nearestKey(position[0], position[1], HIT_RADIUS);
    if (key !== null) update(appendKey(pathRef.current, key));
  }

  function handleUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setPointer(null);
    if (pathRef.current.length < 2) {
      update([]);
      return;
    }
    onStroke(pathRef.current);
  }

  function handleCancel() {
    drawingRef.current = false;
    setPointer(null);
    update([]);
  }

  const trace = toPoints(path) + (pointer && path.length > 0 ? ` ${pointer.join(",")}` : "");

  return (
    <svg
      className={denied ? "pad denied" : "pad"}
      data-testid="pattern-pad"
      viewBox={`0 0 ${PAD_WIDTH} ${PAD_HEIGHT}`}
      role="img"
      aria-label="Pattern keypad"
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleCancel}
    >
      {ghost && <polyline className="pad-ghost" data-testid="pad-ghost" points={toPoints(ghost)} />}
      <polyline className="pad-trace" points={trace} />
      {KEYS.map((key) => {
        const [x, y] = keyPosition(key);
        const on = path.includes(key);
        return (
          <g key={key}>
            <circle
              className={on ? "pad-key on" : "pad-key"}
              data-key={key}
              cx={x}
              cy={y}
              r={on ? 10 : 7}
            />
            <text className="pad-digit" x={x} y={y + 30}>
              {key}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
