"use client";

import { useEffect, useState } from "react";
import { Boot } from "@/components/Boot";
import { Gate } from "@/components/Gate";
import { Terminal } from "@/components/Terminal";
import { clearUnlocked, isUnlocked, setUnlocked } from "@/lib/unlock";

/**
 * init: nothing yet. Rendered on the server and on the first client render,
 *       because the unlock flag can only be read in the browser.
 */
type Phase = "init" | "boot" | "gate" | "shell";

export function App({ initialCommand }: { initialCommand: string }) {
  const [phase, setPhase] = useState<Phase>("init");
  // True when the shell was reached by solving the gate in this visit.
  const [fromGate, setFromGate] = useState(false);

  useEffect(() => {
    setPhase(isUnlocked() ? "shell" : "boot");
  }, []);

  function handleUnlock() {
    setUnlocked();
    setFromGate(true);
    setPhase("shell");
  }

  function handleLogout() {
    clearUnlocked();
    setFromGate(false);
    setPhase("boot");
  }

  return (
    <div className="app-root">
      {phase === "boot" && <Boot onDone={() => setPhase("gate")} />}
      {phase === "gate" && <Gate onUnlock={handleUnlock} />}
      {phase === "shell" && (
        <div className={fromGate ? "shell shell-enter" : "shell"}>
          <Terminal initialCommand={initialCommand} onLogout={handleLogout} />
        </div>
      )}
    </div>
  );
}
