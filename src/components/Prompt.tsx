"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { complete } from "@/lib/commands";

export const PROMPT_LABEL = "parker@ptl:~$";

type Props = {
  onSubmit: (input: string) => void;
  /** Commands run so far, oldest first. */
  history: readonly string[];
  slugs: readonly string[];
};

export function Prompt({ onSubmit, history, slugs }: Props) {
  const [value, setValue] = useState("");
  // Position in history while browsing with the arrow keys; null when not browsing.
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on arrival only where there is a mouse or trackpad. On touch devices
  // focusing would open the on-screen keyboard over the page.
  useEffect(() => {
    if (window.matchMedia?.("(pointer: fine)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
    setValue("");
    setHistoryIndex(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp") {
      if (history.length === 0) return;
      event.preventDefault();
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setValue(history[next]);
    } else if (event.key === "ArrowDown") {
      if (historyIndex === null) return;
      event.preventDefault();
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(null);
        setValue("");
      } else {
        setHistoryIndex(next);
        setValue(history[next]);
      }
    } else if (event.key === "Tab") {
      // Only swallow Tab when it completes something, so keyboard users can still tab away.
      const completed = complete(value, slugs);
      if (completed !== null) {
        event.preventDefault();
        setValue(completed);
      }
    }
  }

  return (
    <form className="prompt" onSubmit={handleSubmit}>
      <span className="prompt-label">{PROMPT_LABEL}</span>
      <span className="prompt-field">
        {/* The visible text and block cursor. The real input sits on top, transparent. */}
        <span aria-hidden="true">{value}</span>
        <span className="cursor" aria-hidden="true" />
        <input
          ref={inputRef}
          className="prompt-input"
          aria-label="Command"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setHistoryIndex(null);
          }}
          onKeyDown={handleKeyDown}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
        />
      </span>
    </form>
  );
}
