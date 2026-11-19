import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Terminal } from "@/components/Terminal";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

function input() {
  return screen.getByLabelText("Command") as HTMLInputElement;
}

function type(text: string) {
  fireEvent.change(input(), { target: { value: text } });
}

function run(text: string) {
  type(text);
  fireEvent.submit(input().form!);
}

function renderTerminal(initialCommand = "help", onLogout = () => {}) {
  return render(<Terminal initialCommand={initialCommand} onLogout={onLogout} />);
}

describe("Terminal", () => {
  it("starts with the banner and the help output", () => {
    renderTerminal();
    expect(screen.getByRole("heading", { level: 1, name: "PARKER T. LINDLEY" })).toBeInTheDocument();
    expect(screen.getByText("AVAILABLE COMMANDS (type or click)")).toBeInTheDocument();
    for (const name of ["about", "projects", "writing", "links", "clear", "logout"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("runs a command when its chip is clicked", () => {
    renderTerminal();
    fireEvent.click(screen.getByRole("button", { name: "projects" }));
    expect(screen.getByText("trainerroad-onboarding")).toBeInTheDocument();
    expect(screen.getByText("seattle-311")).toBeInTheDocument();
    expect(screen.getByText("copy-pasta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "open seattle-311" })).toHaveTextContent("open");
  });

  it("opens a project by number and puts its URL in the address bar", () => {
    renderTerminal();
    run("open 2");
    expect(screen.getByRole("heading", { level: 2, name: "Seattle 311" })).toBeInTheDocument();
    expect(screen.getByText("A map displaying Seattle area 311 data.")).toBeInTheDocument();
    expect(screen.getByText("[ media: Seattle 311 ]")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/projects/seattle-311/");
  });

  it("opens a project from its chip", () => {
    renderTerminal();
    run("projects");
    fireEvent.click(screen.getByRole("button", { name: "open copy-pasta" }));
    expect(screen.getByRole("heading", { level: 2, name: "Copy Pasta" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/projects/copy-pasta/");
  });

  it("returns the address bar to / for any other command", () => {
    renderTerminal();
    run("open seattle-311");
    run("about");
    expect(window.location.pathname).toBe("/");
  });

  it("opens project links in a new tab safely", () => {
    renderTerminal();
    run("open seattle-311");
    const link = screen.getByRole("link", { name: "source on github" });
    expect(link).toHaveAttribute("href", "https://github.com/etcetera8/seattle-311");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows usage when open has no argument or matches nothing", () => {
    renderTerminal();
    run("open");
    expect(screen.getByText("usage: open <name or number>")).toBeInTheDocument();
    run("open nope");
    expect(screen.getByText('no project matches "nope".')).toBeInTheDocument();
  });

  it("shows about, including through the whoami alias", () => {
    renderTerminal();
    run("whoami");
    expect(
      screen.getByText(
        "Parker T. Lindley. Fullstack dev. Rides bikes. Writing code since the dial-up days.",
      ),
    ).toBeInTheDocument();
  });

  it("lists the featured articles and a link to the rest", () => {
    renderTerminal();
    run("writing");
    expect(
      screen.getByRole("link", {
        name: "Adding React Electron Event Handlers from React Code to the App",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Raspberry Pi closeCall Cycling License Plate Recorder" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "more on medium" })).toHaveAttribute(
      "href",
      "https://medium.com/@parkerthomas_2392",
    );
  });

  it("lists the personal links", () => {
    renderTerminal();
    run("links");
    expect(screen.getByRole("link", { name: "github.com/etcetera8" })).toHaveAttribute(
      "href",
      "https://github.com/etcetera8",
    );
    expect(screen.getByRole("link", { name: "linkedin.com/in/parker-lindley" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "medium.com/@parkerthomas_2392" })).toBeInTheDocument();
  });

  it("reports an unknown command", () => {
    renderTerminal();
    run("bogus");
    expect(screen.getByText("command not found: bogus. type help")).toBeInTheDocument();
  });

  it("ignores blank input", () => {
    renderTerminal();
    run("   ");
    expect(screen.getAllByText("AVAILABLE COMMANDS (type or click)")).toHaveLength(1);
    expect(screen.queryByText(/command not found/)).toBeNull();
  });

  it("clears the transcript", () => {
    renderTerminal();
    run("clear");
    expect(screen.queryByText("AVAILABLE COMMANDS (type or click)")).toBeNull();
    expect(input()).toBeInTheDocument();
  });

  it("calls onLogout", () => {
    const onLogout = vi.fn();
    renderTerminal("help", onLogout);
    run("logout");
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("empties the prompt after running a command", () => {
    renderTerminal();
    run("about");
    expect(input().value).toBe("");
  });

  it("walks command history with the arrow keys", () => {
    renderTerminal();
    run("about");
    run("links");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input().value).toBe("links");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input().value).toBe("about");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input().value).toBe("about");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(input().value).toBe("links");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(input().value).toBe("");
  });

  it("completes commands and project names with Tab", () => {
    renderTerminal();
    type("pro");
    fireEvent.keyDown(input(), { key: "Tab" });
    expect(input().value).toBe("projects");
    type("open sea");
    fireEvent.keyDown(input(), { key: "Tab" });
    expect(input().value).toBe("open seattle-311");
    type("l");
    fireEvent.keyDown(input(), { key: "Tab" });
    expect(input().value).toBe("l");
  });

  it("starts on a project when given an open command", () => {
    renderTerminal("open copy-pasta");
    expect(screen.getByRole("heading", { level: 2, name: "Copy Pasta" })).toBeInTheDocument();
    expect(screen.queryByText("AVAILABLE COMMANDS (type or click)")).toBeNull();
  });

  it("announces new output politely", () => {
    renderTerminal();
    expect(screen.getByText("AVAILABLE COMMANDS (type or click)").closest("[aria-live]")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});
