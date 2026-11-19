"use client";

import { useEffect, useRef, useState } from "react";
import { Output } from "@/components/outputs/Output";
import { PROMPT_LABEL, Prompt } from "@/components/Prompt";
import { about } from "@/content/about";
import { projects } from "@/content/projects";
import { parseCommand, type CommandResult } from "@/lib/commands";

type Entry = {
  id: number;
  input: string;
  result: CommandResult;
};

const SLUGS = projects.map((project) => project.slug);

/** Keeps the address bar pointing at what is on screen, so it can be shared. */
function syncUrl(path: string) {
  if (window.location.pathname !== path) {
    window.history.replaceState(null, "", path);
  }
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
  const latestEntry = useRef<HTMLElement | null>(null);
  const mounted = useRef(false);

  // Bring the start of new output into view. Skipped on first render so the
  // page does not jump on arrival.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    latestEntry.current?.scrollIntoView?.({ block: "start" });
  }, [entries]);

  function run(raw: string) {
    const input = raw.trim();
    const result = parseCommand(input, SLUGS);
    if (result.kind === "empty") return;

    setHistory((current) => [...current, input]);

    if (result.kind === "logout") {
      onLogout();
      return;
    }
    if (result.kind === "clear") {
      setEntries([]);
      syncUrl("/");
      return;
    }

    const id = nextId.current++;
    setEntries((current) => [...current, { id, input, result }]);
    // Trailing slash matches the exported file layout (next.config.ts: trailingSlash).
    syncUrl(result.kind === "project" ? `/projects/${result.slug}/` : "/");
  }

  return (
    <main className="terminal">
      <header>
        <h1 className="banner">{about.name.toUpperCase()}</h1>
        <p className="meta">{about.tagline}</p>
      </header>

      <div className="transcript" aria-live="polite">
        {entries.map((entry, index) => (
          <section
            key={entry.id}
            className="entry"
            ref={index === entries.length - 1 ? latestEntry : undefined}
          >
            <p className="line">
              <span className="prompt-label">{PROMPT_LABEL}</span> {entry.input}
            </p>
            <Output result={entry.result} onRun={run} />
          </section>
        ))}
      </div>

      <Prompt onSubmit={run} history={history} slugs={SLUGS} />
    </main>
  );
}
