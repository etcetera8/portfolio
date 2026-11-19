"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Output } from "@/components/outputs/Output";
import { Prompt, PromptLabel } from "@/components/Prompt";
import { about } from "@/content/about";
import { projects } from "@/content/projects";
import { hasFinePointer } from "@/lib/media";
import { SITE_NAME, tabTitle } from "@/lib/site";
import { parseCommand, type CommandResult } from "@/lib/commands";

type Entry = {
  id: number;
  input: string;
  result: CommandResult;
};

const SLUGS = projects.map((project) => project.slug);

function urlFor(result: CommandResult): string {
  // Trailing slash matches the exported file layout (next.config.ts: trailingSlash).
  return result.kind === "project" ? `/projects/${result.slug}/` : "/";
}

/** Keeps the address bar pointing at what is on screen, so it can be shared. */
function syncUrl(path: string) {
  if (window.location.pathname !== path) {
    window.history.replaceState(null, "", path);
  }
}

/** The tab title follows the address bar. */
function syncTitle(result: CommandResult) {
  const project =
    result.kind === "project" ? projects.find((candidate) => candidate.slug === result.slug) : undefined;
  document.title = project ? tabTitle(project.title) : SITE_NAME;
}

type Props = {
  /** Run once on mount, e.g. "help" or "open seattle-311". */
  initialCommand: string;
  onLogout: () => void;
};

export function Terminal({ initialCommand, onLogout }: Props) {
  const nextId = useRef(1);
  const [entries, setEntries] = useState<Entry[]>(() => [
    { id: 0, input: initialCommand, result: parseCommand(initialCommand, SLUGS) },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [cleared, setCleared] = useState(false);
  const latestEntry = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Id of the entry last scrolled to. The first entry counts as already seen, so arrival
  // does not scroll (and neither does StrictMode's second effect run in development).
  const lastScrolledId = useRef(0);

  // Make the address bar match what is on screen, e.g. after logout and unlock.
  useEffect(() => {
    syncUrl(urlFor(entries[0].result));
    syncTitle(entries[0].result);
  }, []);

  // Bring the start of new output into view.
  useEffect(() => {
    const last = entries[entries.length - 1];
    if (!last || last.id === lastScrolledId.current) return;
    lastScrolledId.current = last.id;
    latestEntry.current?.scrollIntoView?.({ block: "start" });
  }, [entries]);

  function run(raw: string) {
    const input = raw.trim();
    const result = parseCommand(input, SLUGS);
    if (result.kind === "empty") return;

    setHistory((current) => [...current, input]);
    setCleared(false);

    if (result.kind === "logout") {
      // Leave the address bar and tab title at home, as the gate has no project.
      syncUrl("/");
      document.title = SITE_NAME;
      onLogout();
      return;
    }
    if (result.kind === "clear") {
      setEntries([]);
      setCleared(true);
      syncUrl("/");
      document.title = SITE_NAME;
      return;
    }

    const id = nextId.current++;
    setEntries((current) => [...current, { id, input, result }]);
    syncUrl(urlFor(result));
    syncTitle(result);
  }

  function runFromChip(command: string) {
    run(command);
    // A chip keeps focus after a click, which would leave the keyboard dead and make
    // Space or Enter re-run it. Hand focus back to the prompt where that is welcome.
    if (hasFinePointer()) inputRef.current?.focus({ preventScroll: true });
  }

  function handleBackgroundClick(event: MouseEvent<HTMLElement>) {
    if ((event.target as Element).closest("a, button, input, video")) return;
    if (window.getSelection()?.isCollapsed === false) return;
    if (hasFinePointer()) inputRef.current?.focus({ preventScroll: true });
  }

  return (
    // The click handler only adds a mouse shortcut; the prompt is already reachable by keyboard.
    <main className="terminal" onClick={handleBackgroundClick}>
      <header>
        <h1 className="banner">{about.name.toUpperCase()}</h1>
        <p className="meta">{about.tagline}</p>
      </header>

      <div className="transcript" role="log" aria-live="polite">
        {entries.map((entry, index) => (
          <section
            key={entry.id}
            className="entry"
            ref={index === entries.length - 1 ? latestEntry : undefined}
          >
            <p className="line">
              <PromptLabel hidden /> {entry.input}
            </p>
            <Output result={entry.result} onRun={runFromChip} />
          </section>
        ))}
      </div>
      <p className="sr-only" role="status">
        {cleared ? "screen cleared" : ""}
      </p>

      <Prompt onSubmit={run} history={history} slugs={SLUGS} inputRef={inputRef} />
    </main>
  );
}
