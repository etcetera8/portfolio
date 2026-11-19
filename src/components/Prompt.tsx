"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, RefObject } from "react";
import { complete } from "@/lib/commands";
import { hasAnyFinePointer, hasFinePointer } from "@/lib/media";

/** The `parker@ptl:~$` label. The host part is hidden on narrow screens. Shared by prompt and transcript. */
export function PromptLabel({ hidden = false }: { hidden?: boolean }) {
  return (
    <span className="prompt-label" aria-hidden={hidden ? "true" : undefined}>
      <span className="prompt-host">parker@ptl:~</span>$
    </span>
  );
}

type Props = {
  onSubmit: (input: string) => void;
  /** Commands run so far, oldest first. */
  history: readonly string[];
  slugs: readonly string[];
  /** Owned by the parent so it can return focus here after a chip click. */
  inputRef: RefObject<HTMLInputElement | null>;
};

export function Prompt({ onSubmit, history, slugs, inputRef }: Props) {
  const [value, setValue] = useState("");
  // Where the real caret is, so the drawn block cursor can follow it.
  const [caret, setCaret] = useState(0);
  // Position in history while browsing with the arrow keys; null when not browsing.
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  // What was typed before browsing history, restored when arrowing back past the newest entry.
  const draft = useRef("");

  useEffect(() => {
    if (hasFinePointer()) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [inputRef]);

  // The caret can move with no key or mouse event (touch caret drag, context-menu Select All).
  useEffect(() => {
    function onSelectionChange() {
      const input = inputRef.current;
      if (input && document.activeElement === input) {
        setCaret(input.selectionStart ?? input.value.length);
      }
    }
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [inputRef]);

  function replaceValue(next: string) {
    setValue(next);
    setCaret(next.length);
  }

  function syncCaret(input: HTMLInputElement) {
    setCaret(input.selectionStart ?? input.value.length);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
    replaceValue("");
    setHistoryIndex(null);
    // Close the on-screen keyboard so the output is visible.
    // any-pointer: a tablet with a keyboard and mouse keeps focus.
    if (!hasAnyFinePointer()) inputRef.current?.blur();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.nativeEvent.isComposing) return;

    if (event.key === "ArrowUp") {
      if (history.length === 0) return;
      event.preventDefault();
      if (historyIndex === null) draft.current = value;
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      replaceValue(history[next]);
    } else if (event.key === "ArrowDown") {
      if (historyIndex === null) return;
      event.preventDefault();
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(null);
        replaceValue(draft.current);
      } else {
        setHistoryIndex(next);
        replaceValue(history[next]);
      }
    } else if (event.key === "Tab") {
      // An empty prompt lets Tab move focus on. Otherwise keep focus here, completing if possible.
      if (value.trim() === "") return;
      event.preventDefault();
      const completed = complete(value, slugs);
      if (completed !== null) replaceValue(completed);
    }
  }

  const at = value.charAt(caret);

  return (
    <form className="prompt" onSubmit={handleSubmit}>
      <PromptLabel />
      <span className="prompt-field">
        {/* The visible text and block cursor. The real input sits on top, transparent. */}
        <span aria-hidden="true" className="prompt-before">
          {value.slice(0, caret)}
        </span>
        <span className="cursor" aria-hidden="true">
          {at === "" ? "\u00a0" : at}
        </span>
        <span aria-hidden="true" className="prompt-after">
          {value.slice(caret + 1)}
        </span>
        <input
          ref={inputRef}
          className="prompt-input"
          aria-label="Command"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            syncCaret(event.target);
            setHistoryIndex(null);
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => syncCaret(event.currentTarget)}
          onSelect={(event) => syncCaret(event.currentTarget)}
          onClick={(event) => syncCaret(event.currentTarget)}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          data-1p-ignore
          data-lpignore="true"
        />
      </span>
    </form>
  );
}
