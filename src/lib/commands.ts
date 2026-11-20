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
  { command: "help", description: "show this list" },
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

/** Optional word between `open` and its argument. */
const FILLER = "project";

/**
 * True when "project" after `open` is a filler word, as in "open project 2",
 * rather than the name of a project.
 */
function isFiller(word: string | undefined, slugs: readonly string[]): boolean {
  return word?.toLowerCase() === FILLER && !slugs.includes(FILLER);
}

function openResult(args: readonly string[], slugs: readonly string[]): CommandResult {
  const arg = (isFiller(args[0], slugs) ? args[1] : args[0]) ?? null;
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

  if (name === "open") return openResult(words.slice(1), slugs);
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
    const words = text.trim().split(/\s+/).slice(1);
    // "open project sea" completes the name and keeps the filler word.
    const filler = words.length > 1 && isFiller(words[0], slugs);
    const partial = (filler ? words.slice(1) : words).join(" ");
    if (partial === "") return null;
    const matches = slugs.filter((slug) => slug.startsWith(partial));
    if (matches.length === 1) completed = `open ${filler ? `${FILLER} ` : ""}${matches[0]}`;
  } else if (!text.includes(" ")) {
    const matches = COMMAND_NAMES.filter((name) => name.startsWith(text));
    if (matches.length === 1) completed = matches[0] === "open" ? "open " : matches[0];
  }

  return completed !== null && completed !== text.trimEnd() ? completed : null;
}
