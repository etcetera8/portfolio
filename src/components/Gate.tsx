"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { PatternGuide } from "@/components/PatternGuide";
import { PatternPad } from "@/components/PatternPad";
import { EXAMPLE_PATHS, matchesShape, type Initial, type Key } from "@/lib/pattern";

const STAGES: readonly Initial[] = ["P", "T", "L"];

export const PASS_DELAY = 300;
export const DENY_DELAY = 450;
export const GRANT_DELAY = 400;

type Status = "idle" | "ok" | "denied" | "granted";

/** Letters typed during feedback that are replayed once the gate is idle again. */
const QUEUE_LIMIT = 3;

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [stage, setStage] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  // Changing this remounts the pad, which clears its trace.
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs are the synchronous source of truth for the handlers and timers (the
  // state above mirrors them for rendering). That keeps a letter replayed from
  // a timer looking at the new stage rather than a stale closure.
  const stageRef = useRef(0);
  // True from a pass or miss until the gate is idle again, and for good once granted.
  const busyRef = useRef(false);
  const grantedRef = useRef(false);
  const pendingLettersRef = useRef<string[]>([]);
  const onUnlockRef = useRef(onUnlock);

  useEffect(() => {
    onUnlockRef.current = onUnlock;
  });

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      pendingLettersRef.current = [];
    };
  }, []);

  function pass() {
    busyRef.current = true;
    if (stageRef.current === STAGES.length - 1) {
      grantedRef.current = true;
      pendingLettersRef.current = [];
      setStatus("granted");
      timer.current = setTimeout(() => onUnlockRef.current(), GRANT_DELAY);
      return;
    }
    setStatus("ok");
    timer.current = setTimeout(() => {
      stageRef.current += 1;
      setStage(stageRef.current);
      returnToIdle();
    }, PASS_DELAY);
  }

  function miss() {
    busyRef.current = true;
    setStatus("denied");
    timer.current = setTimeout(returnToIdle, DENY_DELAY);
  }

  function returnToIdle() {
    setStatus("idle");
    setAttempt((current) => current + 1);
    busyRef.current = false;
    // Replay queued letters until one passes (which makes the gate busy again).
    while (!busyRef.current && pendingLettersRef.current.length > 0) {
      const letter = pendingLettersRef.current.shift();
      if (letter === STAGES[stageRef.current].toLowerCase()) pass();
    }
  }

  /** A letter from the type-in field or the window shortcut. */
  function enterLetter(letter: string) {
    if (grantedRef.current) return;
    if (busyRef.current) {
      if (pendingLettersRef.current.length < QUEUE_LIMIT) pendingLettersRef.current.push(letter);
      return;
    }
    if (letter === STAGES[stageRef.current].toLowerCase()) pass();
  }

  function handleStroke(path: readonly Key[]) {
    if (busyRef.current) return;
    if (matchesShape(path, STAGES[stageRef.current])) pass();
    else miss();
  }

  // No dependency list: the handler is re-registered every render, which is
  // cheap and keeps it from ever closing over stale functions.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // A held key (e.g. the one that skipped boot) must not type into the gate.
      if (event.repeat) return;
      // The type-in field handles its own typing.
      if (event.target instanceof HTMLInputElement) return;
      if (event.key?.length !== 1) return;
      enterLetter(event.key.toLowerCase());
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function handleType(event: ChangeEvent<HTMLInputElement>) {
    const typed = event.target.value.slice(-1).toLowerCase();
    if (typed !== "") enterLetter(typed);
  }

  const letter = STAGES[stage];
  const position = `${stage + 1} of ${STAGES.length}`;
  // Nothing on screen spells out the state, so screen readers get it here.
  const announcement =
    status === "ok"
      ? `Pattern ${position} accepted.`
      : status === "denied"
        ? "Wrong pattern. Try again."
        : status === "granted"
          ? "Access granted."
          : `Pattern ${position}. Draw the letter ${letter}, or type it.`;

  return (
    <main className="gate">
      <div className="gate-text">
        <h1 className="gate-title">{STAGES.join("")}</h1>
        <p className="gate-prompt">Draw Pattern to Access Restricted Portfolio</p>

        <div className="gate-guide">
          <PatternGuide
            path={EXAMPLE_PATHS[letter]}
            label={`Pattern ${position}: the letter ${letter}`}
          />
          <span className="gate-step" data-testid="gate-step" aria-hidden="true">
            {`${stage + 1}/${STAGES.length}`}
          </span>
        </div>

        <p className="sr-only" role="status">
          {announcement}
        </p>
      </div>

      <div className="gate-pad">
        <PatternPad
          key={attempt}
          onStroke={handleStroke}
          denied={status === "denied"}
          disabled={status !== "idle"}
        />
        {/* For people who cannot drag. Unseen until it is reached with the keyboard. */}
        <label className="gate-type">
          <span>or type the letter</span>
          <input
            className="gate-input"
            value=""
            onChange={handleType}
            aria-label="Type the letter shown"
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
