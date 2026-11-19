import type { ReactNode } from "react";

type Props = {
  /** The command this chip runs. Also its accessible name. */
  command: string;
  onRun: (command: string) => void;
  /** Visible text. Defaults to the command. */
  children?: ReactNode;
};

export function Chip({ command, onRun, children }: Props) {
  return (
    <button type="button" className="chip" aria-label={command} onClick={() => onRun(command)}>
      {children ?? command}
    </button>
  );
}
