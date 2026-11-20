"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
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
  /** Shows the current trace as an error. */
  denied?: boolean;
  /** Ignores new strokes. */
  disabled?: boolean;
};

function toPoints(path: readonly Key[]): string {
  return path.map((key) => keyPosition(key).join(",")).join(" ");
}

export function PatternPad({ onStroke, denied = false, disabled = false }: Props) {
  // The ref is the source of truth for handlers; state mirrors it for rendering.
  const pathRef = useRef<readonly Key[]>([]);
  // The pointer that owns the current stroke, or null when none is active.
  const pointerIdRef = useRef<number | null>(null);
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
    if (disabled || pointerIdRef.current !== null) return;
    if (event.button !== 0) return;
    const position = toPad(event);
    const key = nearestKey(position[0], position[1]);
    if (key === null) return;
    event.preventDefault();
    try {
      // Keeps move/up events coming if the pointer leaves the pad.
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Capture is a nicety; drawing works without it.
    }
    pointerIdRef.current = event.pointerId;
    update([key]);
    setPointer(position);
  }

  function handleMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    if (event.pointerType === "mouse" && event.buttons === 0) {
      // The button was released but its pointerup never arrived.
      cancel();
      return;
    }
    const position = toPad(event);
    setPointer(position);
    const key = nearestKey(position[0], position[1]);
    if (key !== null) update(appendKey(pathRef.current, key));
  }

  function handleUp(event: ReactPointerEvent<SVGSVGElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    pointerIdRef.current = null;
    setPointer(null);
    if (pathRef.current.length < 2) {
      update([]);
      return;
    }
    onStroke(pathRef.current);
  }

  function cancel() {
    pointerIdRef.current = null;
    setPointer(null);
    update([]);
  }

  function handleCancel(event: ReactPointerEvent<SVGSVGElement>) {
    if (pointerIdRef.current === event.pointerId) cancel();
  }

  // After a normal pointerup the owner is already null, so the browser's
  // follow-up lostpointercapture lands here and is ignored.
  function handleLostCapture(event: ReactPointerEvent<SVGSVGElement>) {
    if (pointerIdRef.current === event.pointerId) cancel();
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
      onLostPointerCapture={handleLostCapture}
    >
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
            <text className="pad-digit" x={x + 16} y={y + 22}>
              {key}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
