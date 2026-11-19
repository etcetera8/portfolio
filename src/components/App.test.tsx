import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/App";
import { GRANT_DELAY, PASS_DELAY } from "@/components/Gate";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function unlockWithKeys() {
  fireEvent.keyDown(window, { key: "Enter" }); // skip boot
  fireEvent.keyDown(window, { key: "p" });
  wait(PASS_DELAY);
  fireEvent.keyDown(window, { key: "t" });
  wait(PASS_DELAY);
  fireEvent.keyDown(window, { key: "l" });
  wait(GRANT_DELAY);
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
    expect(screen.getByText("identify yourself: draw the initials")).toBeInTheDocument();
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
});
