"use client";

import { useEffect, useRef, useState } from "react";
import { PatternPad } from "@/components/PatternPad";
import { about } from "@/content/about";
import { EXAMPLE_PATHS, matchesShape, type Initial, type Key } from "@/lib/pattern";

const STAGES: readonly Initial[] = ["P", "T", "L"];
const HINTS = ["draw the first initial", "draw the middle initial", "draw the last initial"];

export const PASS_DELAY = 550;
export const DENY_DELAY = 650;
export const GRANT_DELAY = 700;

/** Misses on one stage before the ghost trace appears. */
const GHOST_AFTER = 2;

type Status = "idle" | "ok" | "denied" | "granted";

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [stage, setStage] = useState(0);
  const [misses, setMisses] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  // Changing this remounts the pad, which clears its trace.
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  function pass() {
    if (stage === STAGES.length - 1) {
      setStatus("granted");
      timer.current = setTimeout(onUnlock, GRANT_DELAY);
      return;
    }
    setStatus("ok");
    timer.current = setTimeout(() => {
      setStage((current) => current + 1);
      setMisses(0);
      setStatus("idle");
      setAttempt((current) => current + 1);
    }, PASS_DELAY);
  }

  function miss() {
    setStatus("denied");
    setMisses((current) => current + 1);
    timer.current = setTimeout(() => {
      setStatus("idle");
      setAttempt((current) => current + 1);
    }, DENY_DELAY);
  }

  function handleStroke(path: readonly Key[]) {
    if (status !== "idle") return;
    if (matchesShape(path, STAGES[stage])) pass();
    else miss();
  }

  // No dependency list: the handler closes over stage and status, so it is
  // re-registered every render to stay current.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (status !== "idle" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === STAGES[stage].toLowerCase()) pass();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const solved = status === "granted" ? STAGES.length : stage;
  const statusText =
    status === "ok"
      ? `OK ${stage + 1}/3`
      : status === "denied"
        ? "ACCESS DENIED"
        : status === "granted"
          ? "ACCESS GRANTED"
          : "AWAITING INPUT";

  return (
    <main className="gate">
      <h1 className="banner">{about.name.toUpperCase()}</h1>
      <p className="gate-prompt">identify yourself: draw the initials</p>
      <p className="sr-only">Keyboard alternative: press the P key, then T, then L.</p>

      <p className="gate-auth">
        <span>{`AUTH ${stage + 1}/3`}</span>
        <span className="gate-slots" aria-hidden="true">
          {STAGES.map((letter, index) => (
            <span
              key={letter}
              className={index < solved ? "slot done" : index === stage ? "slot now" : "slot"}
            >
              {index < solved ? letter : "_"}
            </span>
          ))}
        </span>
      </p>
      <p className="gate-hint">{`> ${HINTS[stage]}`}</p>

      <PatternPad
        key={attempt}
        onStroke={handleStroke}
        ghost={misses >= GHOST_AFTER ? EXAMPLE_PATHS[STAGES[stage]] : null}
        denied={status === "denied"}
        disabled={status !== "idle"}
      />

      <p className={status === "denied" ? "gate-status denied" : "gate-status"} role="status">
        {statusText}
      </p>
    </main>
  );
}
