import { describe, expect, it } from "vitest";
import { HELP_ITEMS, complete, parseCommand } from "@/lib/commands";

const SLUGS = ["trainerroad-onboarding", "seattle-311", "copy-pasta"];

describe("parseCommand", () => {
  it("parses each simple command", () => {
    for (const name of ["help", "about", "resume", "projects", "writing", "links", "contact", "clear", "logout"]) {
      expect(parseCommand(name, SLUGS)).toEqual({ kind: name });
    }
  });

  it("resolves aliases", () => {
    expect(parseCommand("ls", SLUGS)).toEqual({ kind: "help" });
    expect(parseCommand("whoami", SLUGS)).toEqual({ kind: "about" });
    expect(parseCommand("email", SLUGS)).toEqual({ kind: "contact" });
    expect(parseCommand("cv", SLUGS)).toEqual({ kind: "resume" });
  });

  it("ignores case and surrounding whitespace", () => {
    expect(parseCommand("  HeLp  ", SLUGS)).toEqual({ kind: "help" });
    expect(parseCommand("OPEN   Seattle-311", SLUGS)).toEqual({
      kind: "project",
      slug: "seattle-311",
    });
  });

  it("returns empty for blank input", () => {
    expect(parseCommand("", SLUGS)).toEqual({ kind: "empty" });
    expect(parseCommand("   ", SLUGS)).toEqual({ kind: "empty" });
  });

  it("opens a project by name", () => {
    expect(parseCommand("open copy-pasta", SLUGS)).toEqual({ kind: "project", slug: "copy-pasta" });
  });

  it("opens a project by its 1-based number", () => {
    expect(parseCommand("open 1", SLUGS)).toEqual({
      kind: "project",
      slug: "trainerroad-onboarding",
    });
    expect(parseCommand("open 3", SLUGS)).toEqual({ kind: "project", slug: "copy-pasta" });
  });

  it("accepts the word project before the name or number", () => {
    expect(parseCommand("open project 2", SLUGS)).toEqual({ kind: "project", slug: "seattle-311" });
    expect(parseCommand("open project copy-pasta", SLUGS)).toEqual({
      kind: "project",
      slug: "copy-pasta",
    });
    expect(parseCommand("OPEN Project 3", SLUGS)).toEqual({ kind: "project", slug: "copy-pasta" });
  });

  it("returns usage when open has no argument", () => {
    expect(parseCommand("open", SLUGS)).toEqual({ kind: "openUsage", arg: null });
    expect(parseCommand("open project", SLUGS)).toEqual({ kind: "openUsage", arg: null });
  });

  it("returns usage when open matches nothing", () => {
    expect(parseCommand("open nope", SLUGS)).toEqual({ kind: "openUsage", arg: "nope" });
    expect(parseCommand("open 0", SLUGS)).toEqual({ kind: "openUsage", arg: "0" });
    expect(parseCommand("open 4", SLUGS)).toEqual({ kind: "openUsage", arg: "4" });
    expect(parseCommand("open project 9", SLUGS)).toEqual({ kind: "openUsage", arg: "9" });
  });

  it("reports unknown input as typed", () => {
    expect(parseCommand("  Sudo rm -rf /  ", SLUGS)).toEqual({
      kind: "notFound",
      input: "Sudo rm -rf /",
    });
  });

  it("does not treat object property names as commands", () => {
    expect(parseCommand("constructor", SLUGS)).toEqual({ kind: "notFound", input: "constructor" });
    expect(parseCommand("toString", SLUGS)).toEqual({ kind: "notFound", input: "toString" });
  });
});

describe("parseCommand details", () => {
  it("tries a slug name before a number", () => {
    expect(parseCommand("open 311", ["a", "311"])).toEqual({ kind: "project", slug: "311" });
  });

  it("opens a project that is itself named project", () => {
    const slugs = ["a", "project"];
    expect(parseCommand("open project", slugs)).toEqual({ kind: "project", slug: "project" });
    expect(parseCommand("open project 1", slugs)).toEqual({ kind: "project", slug: "project" });
    expect(complete("open pro", slugs)).toBe("open project");
  });

  it("keeps the typed case in openUsage", () => {
    expect(parseCommand("open Nope", SLUGS)).toEqual({ kind: "openUsage", arg: "Nope" });
  });

  it("ignores extra words", () => {
    expect(parseCommand("logout now", SLUGS)).toEqual({ kind: "logout" });
    expect(parseCommand("ls -la", SLUGS)).toEqual({ kind: "help" });
    expect(parseCommand("open 2 3", SLUGS)).toEqual({ kind: "project", slug: "seattle-311" });
  });
});

describe("complete details", () => {
  it("returns null when already complete apart from trailing whitespace", () => {
    expect(complete("open copy-pasta ", SLUGS)).toBeNull();
  });

  it("handles open, leading whitespace and ambiguity", () => {
    expect(complete("open", SLUGS)).toBe("open ");
    expect(complete("o", SLUGS)).toBe("open ");
    expect(complete("  pro", SLUGS)).toBe("projects");
    expect(complete("open s", ["seattle-311", "site"])).toBeNull();
  });

  it("completes every command from a unique prefix", () => {
    const names = ["help", "about", "resume", "projects", "open", "writing", "links", "contact", "clear", "logout"];
    for (const name of names) {
      const prefix = name.slice(0, -1);
      expect(complete(prefix, SLUGS)).toBe(name === "open" ? "open " : name);
      expect(parseCommand(name, SLUGS).kind).not.toBe("notFound");
    }
  });
});

describe("complete", () => {
  it("completes a unique command prefix", () => {
    expect(complete("pro", SLUGS)).toBe("projects");
    expect(complete("w", SLUGS)).toBe("writing");
    expect(complete("AB", SLUGS)).toBe("about");
  });

  it("adds a space after open", () => {
    expect(complete("o", SLUGS)).toBe("open ");
  });

  it("returns null when several commands match", () => {
    expect(complete("l", SLUGS)).toBeNull();
  });

  it("returns null when nothing matches or input is empty", () => {
    expect(complete("xyz", SLUGS)).toBeNull();
    expect(complete("", SLUGS)).toBeNull();
  });

  it("returns null when there is nothing left to add", () => {
    expect(complete("projects", SLUGS)).toBeNull();
    expect(complete("open copy-pasta", SLUGS)).toBeNull();
  });

  it("completes a project name after open", () => {
    expect(complete("open sea", SLUGS)).toBe("open seattle-311");
    expect(complete("open t", SLUGS)).toBe("open trainerroad-onboarding");
  });

  it("completes a project name after open project", () => {
    expect(complete("open project sea", SLUGS)).toBe("open project seattle-311");
    expect(complete("open project ", SLUGS)).toBeNull();
    expect(complete("open project zzz", SLUGS)).toBeNull();
  });

  it("does not guess between clear and contact", () => {
    expect(complete("c", SLUGS)).toBeNull();
    expect(complete("cl", SLUGS)).toBe("clear");
    expect(complete("co", SLUGS)).toBe("contact");
  });

  it("returns null when the project prefix is ambiguous or unknown", () => {
    expect(complete("open ", SLUGS)).toBeNull();
    expect(complete("open zzz", SLUGS)).toBeNull();
  });
});

describe("HELP_ITEMS", () => {
  it("lists the commands shown by help, each of which parses", () => {
    expect(HELP_ITEMS.map((item) => item.command)).toEqual([
      "help",
      "about",
      "resume",
      "projects",
      "writing",
      "links",
      "contact",
      "clear",
      "logout",
    ]);
    for (const item of HELP_ITEMS) {
      expect(parseCommand(item.command, SLUGS)).toEqual({ kind: item.command });
    }
  });
});
