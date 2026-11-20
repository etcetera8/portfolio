import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/App";
import { GRANT_DELAY, PASS_DELAY } from "@/components/Gate";
import { INSTALL_INTERVAL, INSTALL_LINES } from "@/components/Install";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Skips boot (when it is showing) and solves the gate. Leaves the install text on screen. */
function solveGate() {
  if (screen.queryByTestId("boot")) fireEvent.keyDown(window, { key: "Enter" });
  fireEvent.keyDown(window, { key: "p" });
  wait(PASS_DELAY);
  fireEvent.keyDown(window, { key: "t" });
  wait(PASS_DELAY);
  fireEvent.keyDown(window, { key: "l" });
  wait(GRANT_DELAY);
}

/** Solves the gate and lets the install text run to the end, arriving in the shell. */
function unlockWithKeys() {
  solveGate();
  wait(INSTALL_INTERVAL * INSTALL_LINES.length);
}

function stubReducedMotion() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
  }));
}

const HELP_HEADING = "AVAILABLE COMMANDS (type or click)";

describe("App", () => {
  it("boots when locked", () => {
    render(<App initialCommand="help" />);
    expect(screen.getByTestId("boot")).toBeInTheDocument();
    expect(screen.queryByText(HELP_HEADING)).toBeNull();
  });

  it("shows the gate after boot", () => {
    render(<App initialCommand="help" />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByTestId("boot")).toBeNull();
    expect(screen.getByText("Draw Pattern to Access Restricted Portfolio")).toBeInTheDocument();
  });

  it("plays the install text between the gate and the shell, and remembers the unlock at once", () => {
    render(<App initialCommand="help" />);
    solveGate();
    expect(screen.getByTestId("install")).toBeInTheDocument();
    expect(screen.queryByTestId("pattern-pad")).toBeNull();
    expect(screen.queryByText(HELP_HEADING)).toBeNull();
    // Stored before the text finishes, so a reload now is not locked out again.
    expect(window.localStorage.getItem("ptl.unlocked")).toBe("1");
    expect(screen.queryByText("terminal unlocked")).toBeNull();

    wait(INSTALL_INTERVAL * INSTALL_LINES.length);
    expect(screen.queryByTestId("install")).toBeNull();
    expect(screen.getByText(HELP_HEADING)).toBeInTheDocument();
  });

  it("goes straight to the shell when the lock is skipped, and remembers it", () => {
    render(<App initialCommand="help" />);
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Skip the lock screen" }));
    expect(screen.queryByTestId("pattern-pad")).toBeNull();
    expect(screen.queryByTestId("install")).toBeNull();
    expect(screen.getByText(HELP_HEADING)).toBeInTheDocument();
    expect(screen.getByText("terminal unlocked")).toBeInTheDocument();
    expect(window.localStorage.getItem("ptl.unlocked")).toBe("1");
  });

  it("lets the visitor skip the install text", () => {
    render(<App initialCommand="help" />);
    solveGate();
    fireEvent.pointerDown(window);
    expect(screen.queryByTestId("install")).toBeNull();
    expect(screen.getByText(HELP_HEADING)).toBeInTheDocument();
  });

  it("goes from the gate straight to the shell under reduced motion", () => {
    stubReducedMotion();
    render(<App initialCommand="help" />);
    solveGate();
    expect(screen.queryByTestId("install")).toBeNull();
    expect(screen.getByText(HELP_HEADING)).toBeInTheDocument();
  });

  it("opens the shell and remembers the unlock once the gate is solved", () => {
    render(<App initialCommand="help" />);
    unlockWithKeys();
    expect(screen.getByText(HELP_HEADING)).toBeInTheDocument();
    expect(window.localStorage.getItem("ptl.unlocked")).toBe("1");
  });

  it("goes straight to the shell when already unlocked", () => {
    window.localStorage.setItem("ptl.unlocked", "1");
    render(<App initialCommand="help" />);
    expect(screen.getByText(HELP_HEADING)).toBeInTheDocument();
    expect(screen.queryByTestId("boot")).toBeNull();
    expect(screen.queryByTestId("pattern-pad")).toBeNull();
  });

  it("runs the initial command after unlocking", () => {
    render(<App initialCommand="open copy-pasta" />);
    unlockWithKeys();
    expect(screen.getByRole("heading", { level: 2, name: "Copy Pasta" })).toBeInTheDocument();
  });

  it("locks again on logout", () => {
    window.localStorage.setItem("ptl.unlocked", "1");
    render(<App initialCommand="help" />);
    fireEvent.click(screen.getByRole("button", { name: "logout" }));
    expect(window.localStorage.getItem("ptl.unlocked")).toBeNull();
    expect(screen.getByTestId("boot")).toBeInTheDocument();
    expect(screen.queryByText(HELP_HEADING)).toBeNull();
  });

  it("plays the entrance wipe only when arriving from the gate", () => {
    window.localStorage.setItem("ptl.unlocked", "1");
    const { container, unmount } = render(<App initialCommand="help" />);
    expect(container.querySelector(".shell-enter")).toBeNull();
    unmount();

    window.localStorage.clear();
    const second = render(<App initialCommand="help" />);
    unlockWithKeys();
    expect(second.container.querySelector(".shell-enter")).not.toBeNull();
  });

  it("goes straight to the gate, with no boot screen, under reduced motion", () => {
    stubReducedMotion();
    render(<App initialCommand="help" />);
    expect(screen.queryByTestId("boot")).toBeNull();
    expect(screen.getByTestId("pattern-pad")).toBeInTheDocument();
  });

  it("goes to the gate rather than boot on logout under reduced motion", () => {
    stubReducedMotion();
    window.localStorage.setItem("ptl.unlocked", "1");
    render(<App initialCommand="help" />);
    fireEvent.click(screen.getByRole("button", { name: "logout" }));
    expect(screen.queryByTestId("boot")).toBeNull();
    expect(screen.getByTestId("pattern-pad")).toBeInTheDocument();
  });

  it("announces unlocking and locking", () => {
    render(<App initialCommand="help" />);
    expect(document.querySelector(".sr-only")).toBeEmptyDOMElement();
    unlockWithKeys();
    expect(screen.getByText("terminal unlocked")).toHaveAttribute("role", "status");
    fireEvent.click(screen.getByRole("button", { name: "logout" }));
    expect(screen.getByText("terminal locked")).toHaveAttribute("role", "status");
    expect(screen.queryByText("terminal unlocked")).toBeNull();
  });

  it("does not announce anything when arriving already unlocked", () => {
    window.localStorage.setItem("ptl.unlocked", "1");
    render(<App initialCommand="help" />);
    expect(screen.queryByText("terminal unlocked")).toBeNull();
  });
});

describe("App first paint", () => {
  // The server render must stay an empty frame: the unlock flag only exists in the browser,
  // and .app-root:empty draws the placeholder cursor.
  const EMPTY = '<p class="sr-only" role="status"></p><div class="app-root"></div>';

  it("renders an empty frame on the server", () => {
    expect(renderToString(<App initialCommand="help" />)).toBe(EMPTY);
  });

  it("renders the same empty frame when the unlock flag is set", () => {
    window.localStorage.setItem("ptl.unlocked", "1");
    expect(renderToString(<App initialCommand="help" />)).toBe(EMPTY);
  });
});
