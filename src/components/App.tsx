"use client";

import { useEffect, useState } from "react";
import { Boot } from "@/components/Boot";
import { Gate } from "@/components/Gate";
import { Install } from "@/components/Install";
import { Terminal } from "@/components/Terminal";
import { prefersReducedMotion } from "@/lib/media";
import { clearUnlocked, isUnlocked, setUnlocked } from "@/lib/unlock";

/**
 * init:    nothing yet. Rendered on the server and on the first client render,
 *          because the unlock flag can only be read in the browser.
 * boot:    startup text before the lock screen.
 * gate:    the lock screen.
 * install: package-install text after the gate is solved.
 * shell:   the terminal.
 */
type Phase = "init" | "boot" | "gate" | "install" | "shell";

/** Reduced motion skips the boot screen entirely, so it is never painted. */
function lockedPhase(): Phase {
  return prefersReducedMotion() ? "gate" : "boot";
}

export function App({ initialCommand }: { initialCommand: string }) {
  const [phase, setPhase] = useState<Phase>("init");
  // True when the shell was reached by solving the gate in this visit.
  const [fromGate, setFromGate] = useState(false);
  // Read out by screen readers when the phase changes; empty otherwise.
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    setPhase(isUnlocked() ? "shell" : lockedPhase());
  }, []);

  function enterShell() {
    setFromGate(true);
    setAnnouncement("terminal unlocked");
    setPhase("shell");
  }

  function handleUnlock() {
    // Stored straight away, so a reload during the install text is not locked out again.
    setUnlocked();
    // Like boot, the install text is animation; reduced motion goes straight in.
    if (prefersReducedMotion()) enterShell();
    else setPhase("install");
  }

  function handleLogout() {
    clearUnlocked();
    setFromGate(false);
    setAnnouncement("terminal locked");
    setPhase(lockedPhase());
  }

  return (
    <>
      {/* Outside .app-root, so the frame stays :empty until a phase mounts. */}
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <div className="app-root">
        {phase === "boot" && <Boot onDone={() => setPhase("gate")} />}
        {phase === "gate" && <Gate onUnlock={handleUnlock} />}
        {phase === "install" && <Install onDone={enterShell} />}
        {phase === "shell" && (
          <div className={fromGate ? "shell shell-enter" : "shell"}>
            <Terminal initialCommand={initialCommand} onLogout={handleLogout} />
          </div>
        )}
      </div>
    </>
  );
}
