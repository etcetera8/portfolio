import type { ReactNode } from "react";

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="ext" href={href} target="_blank" rel="noopener noreferrer">
      {children} <span aria-hidden="true">↗</span>
      <span className="sr-only">(opens in new tab)</span>
    </a>
  );
}
