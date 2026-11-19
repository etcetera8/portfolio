import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Terminal } from "@/components/Terminal";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** jsdom has no matchMedia; this makes `(pointer: fine)` match or not. */
function stubPointer(fine: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("pointer: fine") ? fine : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

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

function caretTo(index: number) {
  const el = input();
  el.setSelectionRange(index, index);
  fireEvent.select(el);
}

describe("Terminal focus", () => {
  it("focuses the prompt on arrival with a fine pointer", () => {
    stubPointer(true);
    renderTerminal();
    expect(input()).toHaveFocus();
  });

  it("does not focus the prompt on arrival with a coarse pointer", () => {
    stubPointer(false);
    renderTerminal();
    expect(input()).not.toHaveFocus();
  });

  it("returns focus to the prompt after a chip click with a fine pointer", () => {
    stubPointer(true);
    renderTerminal();
    fireEvent.click(screen.getByRole("button", { name: "projects" }));
    expect(input()).toHaveFocus();
  });

  it("leaves focus alone after a chip click with a coarse pointer", () => {
    stubPointer(false);
    renderTerminal();
    const chip = screen.getByRole("button", { name: "projects" });
    chip.focus();
    fireEvent.click(chip);
    expect(input()).not.toHaveFocus();
  });

  it("focuses the prompt when blank space is clicked with a fine pointer", () => {
    stubPointer(true);
    renderTerminal();
    (document.activeElement as HTMLElement).blur();
    fireEvent.click(screen.getByRole("heading", { level: 1 }));
    expect(input()).toHaveFocus();
  });

  it("does not focus the prompt on a blank click with a coarse pointer", () => {
    stubPointer(false);
    renderTerminal();
    fireEvent.click(screen.getByRole("heading", { level: 1 }));
    expect(input()).not.toHaveFocus();
  });

  it("does not steal focus from a link or while text is selected", () => {
    stubPointer(true);
    renderTerminal();
    run("links");
    (document.activeElement as HTMLElement).blur();
    fireEvent.click(screen.getByRole("link", { name: /^github\.com\/etcetera8/ }));
    expect(input()).not.toHaveFocus();

    const selection = vi.spyOn(window, "getSelection").mockReturnValue({
      isCollapsed: false,
    } as Selection);
    fireEvent.click(screen.getByRole("heading", { level: 1 }));
    expect(input()).not.toHaveFocus();
    selection.mockRestore();
  });

  it("blurs the prompt after a submit with a coarse pointer", () => {
    stubPointer(false);
    renderTerminal();
    input().focus();
    run("about");
    expect(input()).not.toHaveFocus();
  });

  it("keeps the prompt focused after a submit with a fine pointer", () => {
    stubPointer(true);
    renderTerminal();
    run("about");
    expect(input()).toHaveFocus();
  });

  it("turns off password-manager prompts on the input", () => {
    renderTerminal();
    expect(input()).toHaveAttribute("data-1p-ignore");
    expect(input()).toHaveAttribute("data-lpignore", "true");
  });
});

describe("Terminal caret", () => {
  function cursor() {
    return document.querySelector(".cursor") as HTMLElement;
  }
  function before() {
    return document.querySelector(".prompt-before") as HTMLElement;
  }

  it("draws an empty cursor at the end of the line", () => {
    renderTerminal();
    type("abot");
    expect(before()).toHaveTextContent("abot");
    expect(cursor()).toBeEmptyDOMElement();
  });

  it("draws the cursor over the character at the caret", () => {
    renderTerminal();
    type("abot");
    caretTo(2);
    expect(before().textContent).toBe("ab");
    expect(cursor().textContent).toBe("o");
    expect(document.querySelector(".prompt-after")?.textContent).toBe("t");
  });

  it("puts the caret at the end after history recall and tab completion", () => {
    renderTerminal();
    run("about");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(before().textContent).toBe("about");
    expect(cursor()).toBeEmptyDOMElement();
    type("pro");
    caretTo(1);
    fireEvent.keyDown(input(), { key: "Tab" });
    expect(before().textContent).toBe("projects");
    expect(cursor()).toBeEmptyDOMElement();
  });

  it("shows only the $ of the label so the field has room on narrow screens", () => {
    renderTerminal();
    const host = document.querySelector(".prompt .prompt-host");
    expect(host).toHaveTextContent("parker@ptl:~");
    expect(host?.parentElement).toHaveTextContent("parker@ptl:~$");
  });
});

describe("Terminal Tab key", () => {
  function tab(shiftKey = false) {
    return fireEvent.keyDown(input(), { key: "Tab", shiftKey });
  }

  it("is swallowed when it completes", () => {
    renderTerminal();
    type("pro");
    expect(tab()).toBe(false);
    expect(input().value).toBe("projects");
  });

  it("is swallowed when the input is ambiguous, leaving the value alone", () => {
    renderTerminal();
    type("l");
    expect(tab()).toBe(false);
    expect(input().value).toBe("l");
  });

  it("is swallowed when the input is already complete", () => {
    renderTerminal();
    type("projects");
    expect(tab()).toBe(false);
    expect(input().value).toBe("projects");
  });

  it("moves focus on normally when the prompt is empty", () => {
    renderTerminal();
    expect(tab()).toBe(true);
  });

  it("leaves Shift+Tab alone", () => {
    renderTerminal();
    type("pro");
    expect(tab(true)).toBe(true);
    expect(input().value).toBe("pro");
  });

  it("ignores Tab during IME composition", () => {
    renderTerminal();
    type("pro");
    expect(fireEvent.keyDown(input(), { key: "Tab", isComposing: true })).toBe(true);
    expect(input().value).toBe("pro");
  });
});

describe("Terminal browser behaviour", () => {
  it("scrolls to new output but not on arrival", () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    renderTerminal();
    expect(scroll).not.toHaveBeenCalled();
    run("about");
    expect(scroll).toHaveBeenCalledTimes(1);
    run("links");
    expect(scroll).toHaveBeenCalledTimes(2);
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it("starts with the address bar matching the initial command", () => {
    window.history.replaceState(null, "", "/somewhere-else/");
    renderTerminal("open copy-pasta");
    expect(window.location.pathname).toBe("/projects/copy-pasta/");
  });

  it("resets the address bar to / on clear", () => {
    renderTerminal();
    run("open seattle-311");
    run("clear");
    expect(window.location.pathname).toBe("/");
  });

  it("replaces the history entry instead of pushing one", () => {
    renderTerminal();
    const before = window.history.length;
    run("open 2");
    expect(window.history.length).toBe(before);
  });

  it("adds no transcript entry for logout", () => {
    const { container } = renderTerminal("help", vi.fn());
    run("logout");
    expect(container.querySelectorAll(".entry")).toHaveLength(1);
  });

  it("recalls the most recent command again after typing", () => {
    renderTerminal();
    run("about");
    run("links");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input().value).toBe("about");
    type("x");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input().value).toBe("links");
  });

  it("recalls the most recent command again after a submit", () => {
    renderTerminal();
    run("about");
    run("links");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    run("help");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input().value).toBe("help");
  });

  it("restores a half-typed line when arrowing back down", () => {
    renderTerminal();
    run("about");
    type("pro");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input().value).toBe("about");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(input().value).toBe("pro");
  });

  it("marks the transcript as a polite log with hidden prompt labels", () => {
    const { container } = renderTerminal();
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log.querySelector(".prompt-label")?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector(".prompt .prompt-label")?.closest("[aria-hidden='true']")).toBeNull();
  });

  it("announces a cleared screen until the next command", () => {
    renderTerminal();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    run("clear");
    expect(screen.getByRole("status")).toHaveTextContent("screen cleared");
    run("about");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
