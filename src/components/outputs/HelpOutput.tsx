import { Chip } from "@/components/outputs/Chip";
import { HELP_ITEMS } from "@/lib/commands";

export function HelpOutput({ onRun }: { onRun: (command: string) => void }) {
  return (
    <>
      <p className="head">AVAILABLE COMMANDS (type or click)</p>
      <ul className="rows">
        {HELP_ITEMS.map((item) => (
          <li key={item.command} className="row">
            <span>
              <Chip command={item.command} onRun={onRun} />
            </span>
            <span>{item.description}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
