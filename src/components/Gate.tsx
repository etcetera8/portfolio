"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { PatternPad } from "@/components/PatternPad";
import { about } from "@/content/about";
import { EXAMPLE_PATHS, matchesShape, type Initial, type Key } from "@/lib/pattern";

const STAGES: readonly Initial[] = ["P", "T", "L"];
const HINTS = ["draw the first initial", "draw the middle initial", "draw the last initial"];

export const PASS_DELAY = 300;
export const DENY_DELAY = 450;
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
  // Set synchronously, so two inputs in one tick cannot both pass or miss.
  const busyRef = useRef(false);
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  function pass() {
    if (busyRef.current) return;
    busyRef.current = true;
    if (stage === STAGES.length - 1) {
      setStatus("granted");
      timer.current = setTimeout(() => onUnlockRef.current(), GRANT_DELAY);
      return;
    }
    setStatus("ok");
    timer.current = setTimeout(() => {
      setStage((current) => current + 1);
      setMisses(0);
      setStatus("idle");
      setAttempt((current) => current + 1);
      busyRef.current = false;
    }, PASS_DELAY);
  }

  function miss() {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus("denied");
    setMisses((current) => current + 1);
    timer.current = setTimeout(() => {
      setStatus("idle");
      setAttempt((current) => current + 1);
      busyRef.current = false;
    }, DENY_DELAY);
  }

  function handleStroke(path: readonly Key[]) {
    if (busyRef.current || status !== "idle") return;
    if (matchesShape(path, STAGES[stage])) pass();
    else miss();
  }

  // No dependency list: the handler closes over stage and status, so it is
  // re-registered every render to stay current.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (busyRef.current || status !== "idle") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // The type-in field handles its own typing.
      if (event.target instanceof HTMLInputElement) return;
      if (event.key?.toLowerCase() === STAGES[stage].toLowerCase()) pass();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function handleType(event: ChangeEvent<HTMLInputElement>) {
    const typed = event.target.value.slice(-1).toLowerCase();
    if (!busyRef.current && status === "idle" && typed === STAGES[stage].toLowerCase()) pass();
  }

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
      <div className="gate-text">
        <h1 className="banner">{about.name.toUpperCase()}</h1>
        <p className="gate-prompt">identify yourself: draw the initials</p>

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

        <div className="gate-readout" role="status">
          <p className="gate-hint">{`> ${HINTS[stage]}`}</p>
          <p className={status === "denied" ? "gate-status denied" : "gate-status"}>{statusText}</p>
        </div>
      </div>

      <div className="gate-pad">
        <PatternPad
          key={attempt}
          onStroke={handleStroke}
          ghost={misses >= GHOST_AFTER && status !== "denied" ? EXAMPLE_PATHS[STAGES[stage]] : null}
          denied={status === "denied"}
          disabled={status !== "idle"}
        />
        <label className="gate-type">
          <span>or type the initials</span>
          <input
            className="gate-input"
            value=""
            onChange={handleType}
            aria-label="Type the initials, one letter at a time"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={1}
            enterKeyHint="next"
            disabled={status === "granted"}
          />
        </label>
      </div>
    </main>
  );
}
