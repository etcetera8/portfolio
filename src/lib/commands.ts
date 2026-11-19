export type CommandResult =
  | { kind: "help" }
  | { kind: "about" }
  | { kind: "projects" }
  | { kind: "project"; slug: string }
  | { kind: "openUsage"; arg: string | null }
  | { kind: "writing" }
  | { kind: "links" }
  | { kind: "clear" }
  | { kind: "logout" }
  | { kind: "empty" }
  | { kind: "notFound"; input: string };

/** Commands listed by `help`, in display order. */
export const HELP_ITEMS = [
  { command: "about", description: "who i am" },
  { command: "projects", description: "things i've built" },
  { command: "writing", description: "articles on medium" },
  { command: "links", description: "github, linkedin, medium" },
  { command: "clear", description: "wipe the screen" },
  { command: "logout", description: "lock the terminal again" },
] as const;

/** Every name tab completion knows about. */
const COMMAND_NAMES = [
  "help",
  "about",
  "projects",
  "open",
  "writing",
  "links",
  "clear",
  "logout",
] as const;

// Maps, not object literals, so input like "constructor" cannot hit Object.prototype.
const SIMPLE = new Map<string, CommandResult>([
  ["help", { kind: "help" }],
  ["about", { kind: "about" }],
  ["projects", { kind: "projects" }],
  ["writing", { kind: "writing" }],
  ["links", { kind: "links" }],
  ["clear", { kind: "clear" }],
  ["logout", { kind: "logout" }],
]);

const ALIASES = new Map<string, string>([
  ["ls", "help"],
  ["whoami", "about"],
]);

function openResult(arg: string | null, slugs: readonly string[]): CommandResult {
  if (arg === null) return { kind: "openUsage", arg: null };
  const lower = arg.toLowerCase();
  const byName = slugs.find((slug) => slug === lower);
  if (byName !== undefined) return { kind: "project", slug: byName };
  if (/^\d+$/.test(arg)) {
    const slug = slugs[Number(arg) - 1];
    if (slug !== undefined) return { kind: "project", slug };
  }
  return { kind: "openUsage", arg };
}

export function parseCommand(input: string, slugs: readonly string[]): CommandResult {
  const trimmed = input.trim();
  if (trimmed === "") return { kind: "empty" };

  const words = trimmed.split(/\s+/);
  const first = words[0].toLowerCase();
  const name = ALIASES.get(first) ?? first;

  if (name === "open") return openResult(words[1] ?? null, slugs);
  return SIMPLE.get(name) ?? { kind: "notFound", input: trimmed };
}

/**
 * Tab completion. Returns the completed input, or null when there is not
 * exactly one match or nothing would change.
 */
export function complete(input: string, slugs: readonly string[]): string | null {
  const text = input.trimStart().toLowerCase();
  if (text === "") return null;

  let completed: string | null = null;

  if (text.startsWith("open ")) {
    const partial = text.slice("open ".length).trim();
    if (partial === "") return null;
    const matches = slugs.filter((slug) => slug.startsWith(partial));
    if (matches.length === 1) completed = `open ${matches[0]}`;
  } else if (!text.includes(" ")) {
    const matches = COMMAND_NAMES.filter((name) => name.startsWith(text));
    if (matches.length === 1) completed = matches[0] === "open" ? "open " : matches[0];
  }

  return completed !== null && completed !== text.trimEnd() ? completed : null;
}
