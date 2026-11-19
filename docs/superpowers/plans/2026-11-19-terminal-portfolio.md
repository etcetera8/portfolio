# Terminal Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, terminal-styled portfolio site that visitors unlock by drawing the initials P, T and L on a keypad, then navigate by typing or clicking commands.

**Architecture:** Next.js App Router exported to static files. Pattern matching, command parsing and unlock storage are pure TypeScript modules with no UI. A client-side `App` component moves through boot, gate and shell phases; all content is also server-rendered into a hidden block so crawlers and no-JavaScript visitors can read it.

**Tech Stack:** Next.js 16, React 19, TypeScript, plain CSS (one global stylesheet), Vitest + React Testing Library (jsdom), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-19-terminal-portfolio-design.md`

**Notes for the implementer:**

- Package versions resolve to latest at install time. On 2026-11-19 those were next 16.4.6, react 19.3.1, vitest 5.1.1, typescript 7.0.2, @playwright/test 1.65.1. If an API in this plan does not match what was installed, read that package's current docs and adapt; do not downgrade without a reason. One known fallback: if `next build` rejects the TypeScript version, run `npm install -D typescript@5`.
- All tests import `describe`, `it`, `expect`, `vi` from `vitest` explicitly. Vitest globals are not enabled.
- Tests use `fireEvent`, not `user-event`, because several tests run under fake timers.
- All styles live in `src/app/globals.css`. Component tasks append a block to it.
- Do not add libraries that are not in this plan.

**Amendments after the Task 1 review (already applied to the code; later tasks below are updated to match):**

- `next.config.ts` sets `trailingSlash: true`, so pages export as `out/projects/<slug>/index.html` and work on any static host. Project URLs end in a slash: `/projects/seattle-311/`.
- `vitest.config.ts` was renamed `vitest.config.mts`, and `tsconfig.json` includes `**/*.mts`.
- `vitest.setup.ts` no longer has a PointerEvent fallback; jsdom 31 provides `PointerEvent`.
- Both `next/font` calls pass `fallback: ["Menlo", "Consolas", "monospace"]`.
- The noscript style uses `!important` on both rules.
- `globals.css` sets `color-scheme: dark` on `:root` and hides the scanlines under `prefers-contrast: more`.
- `.gitignore` also ignores `.DS_Store` and `.env*.local`.

**Amendments after the Tasks 2-5 review (already applied to the code; the Task 2-5 text below shows the original versions):**

- `appendKey` returns `readonly Key[]`. Consumers hold paths as `readonly Key[]` (Tasks 6 and 7 below are updated).
- `nearestKey`'s `radius` defaults to `HIT_RADIUS`.
- T is accepted with its stem ending at 8 or running down to 0.
- `open` tries its argument as a project name before trying it as a number, and `openUsage.arg` keeps the case the user typed.
- `complete` returns null for input that is already complete apart from trailing whitespace.
- `src/content/types.ts` has one `Link` type (replacing `ProjectLink` and `SiteLink`), and the content arrays are exported as `readonly`.

---

## File map

```
package.json                     scripts and dependencies
next.config.ts                   static export
tsconfig.json                    strict TS, "@/*" -> "src/*"
vitest.config.mts                jsdom, "@" alias, setup file
vitest.setup.ts                  jest-dom matchers, cleanup
playwright.config.ts             builds, serves ./out, desktop + phone projects
e2e/portfolio.spec.ts            browser tests
src/
  app/
    layout.tsx                   fonts, metadata, noscript style
    page.tsx                     "/"
    projects/[slug]/page.tsx     one page per project
    not-found.tsx                404
    globals.css                  every style
  content/
    types.ts                     Project, Article, SiteLink, Media
    about.ts  projects.ts  articles.ts  links.ts
    content.test.ts
  lib/
    pattern.ts                   keypad geometry, stroke recording, shape matching
    commands.ts                  parse input -> CommandResult; tab completion
    unlock.ts                    localStorage flag
    *.test.ts
  test/
    draw.ts                      test helper: draw a path on the pad with pointer events
  components/
    PatternPad.tsx               SVG keypad
    Gate.tsx                     three stages, misses, ghost trace, keyboard equivalent
    Prompt.tsx                   input, history, tab completion
    Terminal.tsx                 transcript, runs commands, syncs URL
    Boot.tsx                     startup lines
    App.tsx                      phase state: init -> boot -> gate -> shell
    StaticContent.tsx            crawler / no-JS content
    outputs/
      Chip.tsx  ExtLink.tsx  MediaSlot.tsx
      HelpOutput.tsx  ProjectsOutput.tsx  ProjectOutput.tsx  TextOutputs.tsx
      Output.tsx                 switch on CommandResult.kind
    *.test.tsx
```

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Modify: `.gitignore`

- [ ] **Step 1: Create a working branch**

```bash
git checkout -b terminal-portfolio
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "portfolio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "serve out -l 3100",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install next react react-dom
npm install -D typescript @types/node @types/react @types/react-dom \
  vitest jsdom @vitejs/plugin-react \
  @testing-library/react @testing-library/dom @testing-library/jest-dom \
  @playwright/test serve
```

Expected: both commands finish with no `ERR!` lines. `package.json` now has `dependencies` and `devDependencies`.

- [ ] **Step 4: Write `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
```

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

Next.js may rewrite a few of these fields on first run. Accept its changes.

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 7: Write `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Older jsdom builds have no PointerEvent. Fall back to MouseEvent so
// clientX / clientY still reach handlers in tests.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventFallback extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  window.PointerEvent = PointerEventFallback as unknown as typeof PointerEvent;
}

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 8: Write `src/app/globals.css`**

```css
/* ---------- base ---------- */
:root {
  --bg: #020502;
  --accent: #00ff66;
  --text: #a5f5c3;
  --dim: #12903f;
  --error: #ff4444;
  --glow: 0 0 2px rgba(0, 255, 102, 0.28);
}

* {
  box-sizing: border-box;
}

html {
  background: var(--bg);
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body), Menlo, Consolas, monospace;
  font-size: 15px;
  line-height: 1.55;
  text-shadow: var(--glow);
  overflow-wrap: anywhere;
}

/* scanlines */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0 2px,
    rgba(0, 0, 0, 0.16) 2px 3px
  );
}

a {
  color: var(--accent);
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.banner {
  margin: 0 0 6px;
  font-family: var(--font-display), monospace;
  font-size: clamp(40px, 9vw, 72px);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: 0.04em;
  color: var(--accent);
}

.meta {
  margin: 0 0 20px;
  color: var(--dim);
  text-shadow: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.page {
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 16px 60px;
}
```

- [ ] **Step 9: Write `src/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, VT323 } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const bodyFont = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const description =
  "Parker T. Lindley. Fullstack developer. A portfolio you unlock like a terminal.";

export const metadata: Metadata = {
  title: { default: "Parker T. Lindley", template: "%s // Parker T. Lindley" },
  description,
  openGraph: { title: "Parker T. Lindley", description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#020502",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <noscript>
          <style>{".static-content{display:block}.app-root{display:none}"}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 10: Write a temporary `src/app/page.tsx`**

This is replaced in Task 10.

```tsx
export default function Home() {
  return (
    <main className="page">
      <h1 className="banner">PARKER T. LINDLEY</h1>
      <p className="meta">booting soon.</p>
    </main>
  );
}
```

- [ ] **Step 11: Extend `.gitignore`**

Replace the file contents with:

```
.superpowers/
node_modules/
.next/
out/
next-env.d.ts
*.tsbuildinfo
test-results/
playwright-report/
```

- [ ] **Step 12: Verify the build and the empty test run**

Run: `npm run build`
Expected: exits 0 and `out/index.html` exists (`ls out/index.html`).

Run: `npm run typecheck`
Expected: exits 0 with no output.

Run: `npx vitest run --passWithNoTests`
Expected: "No test files found", exit 0.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js static site with Vitest"
```

---

### Task 2: Content data

**Files:**
- Create: `src/content/types.ts`, `src/content/about.ts`, `src/content/projects.ts`, `src/content/articles.ts`, `src/content/links.ts`
- Test: `src/content/content.test.ts`

- [ ] **Step 1: Write the failing test**

`src/content/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { about } from "@/content/about";
import { articles, moreArticlesHref } from "@/content/articles";
import { links } from "@/content/links";
import { projects } from "@/content/projects";

describe("content", () => {
  it("has the three featured projects in order", () => {
    expect(projects.map((project) => project.slug)).toEqual([
      "trainerroad-onboarding",
      "seattle-311",
      "copy-pasta",
    ]);
  });

  it("uses unique lowercase kebab-case slugs", () => {
    const slugs = projects.map((project) => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("gives every project the text the shell needs", () => {
    for (const project of projects) {
      expect(project.title).not.toBe("");
      expect(project.summary).not.toBe("");
      expect(project.role).not.toBe("");
      expect(project.description).not.toBe("");
      expect(project.stack.length).toBeGreaterThan(0);
    }
  });

  it("only links to https URLs", () => {
    const hrefs = [
      ...projects.flatMap((project) => project.links.map((link) => link.href)),
      ...articles.map((article) => article.href),
      ...links.map((link) => link.href),
      moreArticlesHref,
    ];
    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\//);
    }
  });

  it("features two articles and three personal links", () => {
    expect(articles).toHaveLength(2);
    expect(links.map((link) => link.label)).toEqual(["github", "linkedin", "medium"]);
  });

  it("has a name, tagline and bio", () => {
    expect(about.name).toBe("Parker T. Lindley");
    expect(about.tagline).not.toBe("");
    expect(about.bio).not.toBe("");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content/content.test.ts`
Expected: FAIL, cannot resolve `@/content/about`.

- [ ] **Step 3: Write `src/content/types.ts`**

```ts
export type Media = {
  kind: "video" | "image";
  src: string;
  alt: string;
};

export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  title: string;
  /** One line, shown in the project list. */
  summary: string;
  role: string;
  stack: string[];
  description: string;
  links: ProjectLink[];
  /** Omit until real media exists; a placeholder slot is shown instead. */
  media?: Media;
};

export type Article = {
  title: string;
  year: number;
  href: string;
};

export type SiteLink = {
  label: string;
  href: string;
};
```

- [ ] **Step 4: Write `src/content/about.ts`**

```ts
export const about = {
  name: "Parker T. Lindley",
  tagline: "fullstack dev. rides bikes.",
  // Placeholder bio. Replace with final copy.
  bio: "Parker T. Lindley. Fullstack dev. Rides bikes. Writing code since the dial-up days.",
};
```

- [ ] **Step 5: Write `src/content/projects.ts`**

```ts
import type { Project } from "@/content/types";

export const projects: Project[] = [
  {
    slug: "trainerroad-onboarding",
    title: "TrainerRoad onboarding",
    summary: "shipped onboarding flow",
    // Placeholder copy below. Replace role, stack and description with final text,
    // then add `media` once the recording exists.
    role: "role to be added",
    stack: ["stack to be added"],
    description:
      "Placeholder. A short write-up of the onboarding flow, what I owned, and what it changed will go here.",
    links: [],
  },
  {
    slug: "seattle-311",
    title: "Seattle 311",
    summary: "map of seattle-area 311 data",
    role: "Solo project",
    stack: ["TypeScript"],
    description: "A map displaying Seattle area 311 data.",
    links: [{ label: "source on github", href: "https://github.com/etcetera8/seattle-311" }],
  },
  {
    slug: "copy-pasta",
    title: "Copy Pasta",
    summary: "clipboard history utility with search",
    role: "Solo project",
    stack: ["TypeScript"],
    description:
      "A clipboard utility app. Save copy history for up to seven days and search it. Click a history item to put it back on your clipboard.",
    links: [{ label: "source on github", href: "https://github.com/etcetera8/copy-pasta" }],
  },
];
```

- [ ] **Step 6: Write `src/content/articles.ts`**

```ts
import type { Article } from "@/content/types";

export const articles: Article[] = [
  {
    title: "Adding React Electron Event Handlers from React Code to the App",
    year: 2020,
    href: "https://medium.com/@parkerthomas_2392/adding-react-electron-event-handlers-from-react-code-to-the-app-a119cfa6e582",
  },
  {
    title: "Raspberry Pi closeCall Cycling License Plate Recorder",
    year: 2017,
    href: "https://medium.com/@parkerthomas_2392/if-youve-ever-ridden-a-bicycle-you-re-probably-familiar-with-this-scene-281b3ee70315",
  },
];

export const moreArticlesHref = "https://medium.com/@parkerthomas_2392";
```

- [ ] **Step 7: Write `src/content/links.ts`**

```ts
import type { SiteLink } from "@/content/types";

export const links: SiteLink[] = [
  { label: "github", href: "https://github.com/etcetera8" },
  { label: "linkedin", href: "https://www.linkedin.com/in/parker-lindley/" },
  { label: "medium", href: "https://medium.com/@parkerthomas_2392" },
];
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run src/content/content.test.ts`
Expected: 6 passed.

- [ ] **Step 9: Commit**

```bash
git add src/content
git commit -m "Add typed content for projects, articles, links and about"
```

---

### Task 3: Pattern matching

**Files:**
- Create: `src/lib/pattern.ts`
- Test: `src/lib/pattern.test.ts`

The keypad is a 300 x 400 coordinate space. Keys 1 to 9 sit on a 3 x 3 grid at x = 50/150/250 and y = 50/150/250. Key 0 sits at (150, 350). A stroke is the list of keys visited. A segment is an undirected pair of keys, written `"a-b"` with the smaller number first. A stroke matches a shape when its set of segments equals the shape's set exactly.

- [ ] **Step 1: Write the failing test**

`src/lib/pattern.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  EXAMPLE_PATHS,
  appendKey,
  between,
  keyPosition,
  matchesShape,
  nearestKey,
  segmentKey,
  segmentsOf,
  type Key,
} from "@/lib/pattern";

describe("keyPosition", () => {
  it("places keys on the pad", () => {
    expect(keyPosition(1)).toEqual([50, 50]);
    expect(keyPosition(5)).toEqual([150, 150]);
    expect(keyPosition(9)).toEqual([250, 250]);
    expect(keyPosition(0)).toEqual([150, 350]);
  });
});

describe("nearestKey", () => {
  it("returns the key under the point", () => {
    expect(nearestKey(52, 47, 34)).toBe(1);
    expect(nearestKey(150, 350, 34)).toBe(0);
  });

  it("returns null between keys and on the empty corners", () => {
    expect(nearestKey(100, 100, 34)).toBeNull();
    expect(nearestKey(50, 350, 34)).toBeNull();
  });
});

describe("segmentKey", () => {
  it("is the same in both directions", () => {
    expect(segmentKey(4, 1)).toBe("1-4");
    expect(segmentKey(1, 4)).toBe("1-4");
    expect(segmentKey(8, 0)).toBe("0-8");
  });
});

describe("between", () => {
  it("finds keys a straight move passes over", () => {
    expect(between(1, 3)).toEqual([2]);
    expect(between(1, 7)).toEqual([4]);
    expect(between(1, 9)).toEqual([5]);
    expect(between(2, 0)).toEqual([5, 8]);
    expect(between(0, 2)).toEqual([8, 5]);
  });

  it("is empty for neighbours and for moves that pass over no key", () => {
    expect(between(1, 2)).toEqual([]);
    expect(between(1, 6)).toEqual([]);
    expect(between(7, 0)).toEqual([]);
    expect(between(5, 5)).toEqual([]);
  });
});

describe("appendKey", () => {
  it("starts a path", () => {
    expect(appendKey([], 7)).toEqual([7]);
  });

  it("adds a neighbouring key", () => {
    expect(appendKey([7], 4)).toEqual([7, 4]);
  });

  it("inserts keys that were passed over", () => {
    expect(appendKey([1], 3)).toEqual([1, 2, 3]);
    expect(appendKey([2], 0)).toEqual([2, 5, 8, 0]);
  });

  it("returns the same array when the key is already last", () => {
    const path: Key[] = [1, 4];
    expect(appendKey(path, 4)).toBe(path);
  });

  it("allows going back over a key", () => {
    expect(appendKey([1, 2, 3], 2)).toEqual([1, 2, 3, 2]);
  });
});

describe("segmentsOf", () => {
  it("collapses retraced segments", () => {
    expect([...segmentsOf([1, 2, 3, 2])].sort()).toEqual(["1-2", "2-3"]);
  });
});

describe("matchesShape", () => {
  it("accepts the example path for each initial", () => {
    expect(matchesShape(EXAMPLE_PATHS.P, "P")).toBe(true);
    expect(matchesShape(EXAMPLE_PATHS.T, "T")).toBe(true);
    expect(matchesShape(EXAMPLE_PATHS.L, "L")).toBe(true);
  });

  it("accepts each shape drawn backwards", () => {
    expect(matchesShape([...EXAMPLE_PATHS.P].reverse(), "P")).toBe(true);
    expect(matchesShape([...EXAMPLE_PATHS.T].reverse(), "T")).toBe(true);
    expect(matchesShape([...EXAMPLE_PATHS.L].reverse(), "L")).toBe(true);
  });

  it("accepts a different stroke order", () => {
    expect(matchesShape([4, 5, 6, 3, 2, 1, 4, 7], "P")).toBe(true);
    expect(matchesShape([8, 5, 2, 1, 2, 3], "T")).toBe(true);
    expect(matchesShape([9, 8, 7, 4, 1], "L")).toBe(true);
  });

  it("accepts retracing", () => {
    expect(matchesShape([1, 4, 7, 4, 7, 8, 9], "L")).toBe(true);
  });

  it("rejects a shape with a missing segment", () => {
    expect(matchesShape([7, 4, 1, 2, 3, 6, 5], "P")).toBe(false);
    expect(matchesShape([1, 2, 3], "T")).toBe(false);
  });

  it("rejects a shape with an extra segment", () => {
    expect(matchesShape([1, 4, 7, 8, 9, 6], "L")).toBe(false);
    expect(matchesShape([1, 2, 3, 2, 5, 8, 0], "T")).toBe(false);
  });

  it("rejects the wrong initial", () => {
    expect(matchesShape(EXAMPLE_PATHS.L, "P")).toBe(false);
    expect(matchesShape(EXAMPLE_PATHS.P, "T")).toBe(false);
    expect(matchesShape(EXAMPLE_PATHS.T, "L")).toBe(false);
  });

  it("rejects an empty or single-key path", () => {
    expect(matchesShape([], "L")).toBe(false);
    expect(matchesShape([1], "L")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/pattern.test.ts`
Expected: FAIL, cannot resolve `@/lib/pattern`.

- [ ] **Step 3: Write `src/lib/pattern.ts`**

```ts
export type Key = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Initial = "P" | "T" | "L";

export const PAD_WIDTH = 300;
export const PAD_HEIGHT = 400;
export const HIT_RADIUS = 34;

/** Keys in the order they are drawn on the pad. */
export const KEYS: readonly Key[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/** Column and row of each key. Key 0 sits alone in the fourth row. */
const GRID: Record<Key, readonly [number, number]> = {
  1: [0, 0],
  2: [1, 0],
  3: [2, 0],
  4: [0, 1],
  5: [1, 1],
  6: [2, 1],
  7: [0, 2],
  8: [1, 2],
  9: [2, 2],
  0: [1, 3],
};

export function keyPosition(key: Key): readonly [number, number] {
  const [column, row] = GRID[key];
  return [50 + column * 100, 50 + row * 100];
}

export function nearestKey(x: number, y: number, radius: number): Key | null {
  let best: Key | null = null;
  let bestDistance = radius * radius;
  for (const key of KEYS) {
    const [keyX, keyY] = keyPosition(key);
    const distance = (keyX - x) ** 2 + (keyY - y) ** 2;
    if (distance <= bestDistance) {
      best = key;
      bestDistance = distance;
    }
  }
  return best;
}

export function segmentKey(a: Key, b: Key): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function keyAt(column: number, row: number): Key | null {
  for (const key of KEYS) {
    const [keyColumn, keyRow] = GRID[key];
    if (keyColumn === column && keyRow === row) return key;
  }
  return null;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Keys lying exactly on the straight line from `a` to `b`, in travel order. */
export function between(a: Key, b: Key): Key[] {
  const [fromColumn, fromRow] = GRID[a];
  const [toColumn, toRow] = GRID[b];
  const columnDelta = toColumn - fromColumn;
  const rowDelta = toRow - fromRow;
  const steps = gcd(Math.abs(columnDelta), Math.abs(rowDelta));
  const result: Key[] = [];
  for (let step = 1; step < steps; step++) {
    const key = keyAt(
      fromColumn + (columnDelta / steps) * step,
      fromRow + (rowDelta / steps) * step,
    );
    if (key !== null) result.push(key);
  }
  return result;
}

/** Adds `next` to the path, inserting any keys passed over on the way. */
export function appendKey(path: readonly Key[], next: Key): Key[] {
  if (path.length === 0) return [next];
  const last = path[path.length - 1];
  if (last === next) return path as Key[];
  return [...path, ...between(last, next), next];
}

export function segmentsOf(path: readonly Key[]): Set<string> {
  const segments = new Set<string>();
  for (let index = 1; index < path.length; index++) {
    segments.add(segmentKey(path[index - 1], path[index]));
  }
  return segments;
}

const SHAPES: Record<Initial, readonly string[]> = {
  P: ["1-4", "4-7", "1-2", "2-3", "3-6", "5-6", "4-5"],
  T: ["1-2", "2-3", "2-5", "5-8"],
  L: ["1-4", "4-7", "7-8", "8-9"],
};

/** One valid way to draw each initial. Used for the ghost trace and in tests. */
export const EXAMPLE_PATHS: Record<Initial, readonly Key[]> = {
  P: [7, 4, 1, 2, 3, 6, 5, 4],
  T: [1, 2, 3, 2, 5, 8],
  L: [1, 4, 7, 8, 9],
};

export function matchesShape(path: readonly Key[], initial: Initial): boolean {
  const drawn = segmentsOf(path);
  const target = SHAPES[initial];
  return drawn.size === target.length && target.every((segment) => drawn.has(segment));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/pattern.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pattern.ts src/lib/pattern.test.ts
git commit -m "Add keypad geometry and shape matching for P, T, L"
```

---

### Task 4: Command parsing and tab completion

**Files:**
- Create: `src/lib/commands.ts`
- Test: `src/lib/commands.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/commands.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { HELP_ITEMS, complete, parseCommand } from "@/lib/commands";

const SLUGS = ["trainerroad-onboarding", "seattle-311", "copy-pasta"];

describe("parseCommand", () => {
  it("parses each simple command", () => {
    for (const name of ["help", "about", "projects", "writing", "links", "clear", "logout"]) {
      expect(parseCommand(name, SLUGS)).toEqual({ kind: name });
    }
  });

  it("resolves aliases", () => {
    expect(parseCommand("ls", SLUGS)).toEqual({ kind: "help" });
    expect(parseCommand("whoami", SLUGS)).toEqual({ kind: "about" });
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

  it("returns usage when open has no argument", () => {
    expect(parseCommand("open", SLUGS)).toEqual({ kind: "openUsage", arg: null });
  });

  it("returns usage when open matches nothing", () => {
    expect(parseCommand("open nope", SLUGS)).toEqual({ kind: "openUsage", arg: "nope" });
    expect(parseCommand("open 0", SLUGS)).toEqual({ kind: "openUsage", arg: "0" });
    expect(parseCommand("open 4", SLUGS)).toEqual({ kind: "openUsage", arg: "4" });
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

  it("returns null when the project prefix is ambiguous or unknown", () => {
    expect(complete("open ", SLUGS)).toBeNull();
    expect(complete("open zzz", SLUGS)).toBeNull();
  });
});

describe("HELP_ITEMS", () => {
  it("lists the commands shown by help, each of which parses", () => {
    expect(HELP_ITEMS.map((item) => item.command)).toEqual([
      "about",
      "projects",
      "writing",
      "links",
      "clear",
      "logout",
    ]);
    for (const item of HELP_ITEMS) {
      expect(parseCommand(item.command, SLUGS)).toEqual({ kind: item.command });
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: FAIL, cannot resolve `@/lib/commands`.

- [ ] **Step 3: Write `src/lib/commands.ts`**

```ts
export type CommandResult =
  | { kind: "help" }
  | { kind: "about" }
  | { kind: "projects" }
  | { kind: "project"; slug: string }
  | { kind: "openUsage"; arg: string | null }
  | { kind: "writing" }
  | { kind: "links" }
  | { kind: "clear" }
  | { kind: "logout" }
  | { kind: "empty" }
  | { kind: "notFound"; input: string };

/** Commands listed by `help`, in display order. */
export const HELP_ITEMS = [
  { command: "about", description: "who i am" },
  { command: "projects", description: "things i've built" },
  { command: "writing", description: "articles on medium" },
  { command: "links", description: "github, linkedin, medium" },
  { command: "clear", description: "wipe the screen" },
  { command: "logout", description: "lock the terminal again" },
] as const;

/** Every name tab completion knows about. */
const COMMAND_NAMES = [
  "help",
  "about",
  "projects",
  "open",
  "writing",
  "links",
  "clear",
  "logout",
] as const;

// Maps, not object literals, so input like "constructor" cannot hit Object.prototype.
const SIMPLE = new Map<string, CommandResult>([
  ["help", { kind: "help" }],
  ["about", { kind: "about" }],
  ["projects", { kind: "projects" }],
  ["writing", { kind: "writing" }],
  ["links", { kind: "links" }],
  ["clear", { kind: "clear" }],
  ["logout", { kind: "logout" }],
]);

const ALIASES = new Map<string, string>([
  ["ls", "help"],
  ["whoami", "about"],
]);

function openResult(arg: string | null, slugs: readonly string[]): CommandResult {
  if (arg === null) return { kind: "openUsage", arg: null };
  if (/^\d+$/.test(arg)) {
    const slug = slugs[Number(arg) - 1];
    return slug === undefined ? { kind: "openUsage", arg } : { kind: "project", slug };
  }
  return slugs.includes(arg) ? { kind: "project", slug: arg } : { kind: "openUsage", arg };
}

export function parseCommand(input: string, slugs: readonly string[]): CommandResult {
  const trimmed = input.trim();
  if (trimmed === "") return { kind: "empty" };

  const words = trimmed.toLowerCase().split(/\s+/);
  const name = ALIASES.get(words[0]) ?? words[0];

  if (name === "open") return openResult(words[1] ?? null, slugs);
  return SIMPLE.get(name) ?? { kind: "notFound", input: trimmed };
}

/**
 * Tab completion. Returns the completed input, or null when there is not
 * exactly one match or nothing would change.
 */
export function complete(input: string, slugs: readonly string[]): string | null {
  const text = input.trimStart().toLowerCase();
  if (text === "") return null;

  let completed: string | null = null;

  if (text.startsWith("open ")) {
    const partial = text.slice("open ".length).trim();
    if (partial === "") return null;
    const matches = slugs.filter((slug) => slug.startsWith(partial));
    if (matches.length === 1) completed = `open ${matches[0]}`;
  } else if (!text.includes(" ")) {
    const matches = COMMAND_NAMES.filter((name) => name.startsWith(text));
    if (matches.length === 1) completed = matches[0] === "open" ? "open " : matches[0];
  }

  return completed !== null && completed !== text ? completed : null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/commands.ts src/lib/commands.test.ts
git commit -m "Add command parser and tab completion"
```

---

### Task 5: Unlock storage

**Files:**
- Create: `src/lib/unlock.ts`
- Test: `src/lib/unlock.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/unlock.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearUnlocked, isUnlocked, setUnlocked } from "@/lib/unlock";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("unlock storage", () => {
  it("is locked by default", () => {
    expect(isUnlocked()).toBe(false);
  });

  it("remembers an unlock under the ptl.unlocked key", () => {
    setUnlocked();
    expect(isUnlocked()).toBe(true);
    expect(window.localStorage.getItem("ptl.unlocked")).toBe("1");
  });

  it("locks again when cleared", () => {
    setUnlocked();
    clearUnlocked();
    expect(isUnlocked()).toBe(false);
    expect(window.localStorage.getItem("ptl.unlocked")).toBeNull();
  });

  it("treats any other stored value as locked", () => {
    window.localStorage.setItem("ptl.unlocked", "yes");
    expect(isUnlocked()).toBe(false);
  });

  it("stays locked and does not throw when storage is unavailable", () => {
    const denied = () => {
      throw new Error("storage denied");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(denied);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(denied);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(denied);

    expect(isUnlocked()).toBe(false);
    expect(() => setUnlocked()).not.toThrow();
    expect(() => clearUnlocked()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/unlock.test.ts`
Expected: FAIL, cannot resolve `@/lib/unlock`.

- [ ] **Step 3: Write `src/lib/unlock.ts`**

```ts
const STORAGE_KEY = "ptl.unlocked";

// Storage can be missing or throw (private windows, blocked site data).
// In every such case the gate simply shows again.

export function isUnlocked(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setUnlocked(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Not remembered; nothing else to do.
  }
}

export function clearUnlocked(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Already effectively locked.
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/unlock.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/unlock.ts src/lib/unlock.test.ts
git commit -m "Add unlock flag storage that tolerates missing localStorage"
```

---

### Task 6: PatternPad component

**Files:**
- Create: `src/test/draw.ts`, `src/components/PatternPad.tsx`
- Modify: `src/app/globals.css` (append)
- Test: `src/components/PatternPad.test.tsx`

`PatternPad` draws the keypad, records one stroke, and reports it through `onStroke` on pointer-up. It keeps showing the finished trace; the parent clears it by remounting the pad with a new `key`.

- [ ] **Step 1: Write the test helper `src/test/draw.ts`**

jsdom has no layout, so tests pin the pad's bounding box to the pad's own 300 x 400 coordinate space. Client coordinates then equal pad coordinates.

```ts
import { fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { PAD_HEIGHT, PAD_WIDTH, keyPosition, type Key } from "@/lib/pattern";

export function mockPadRect() {
  return vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: PAD_WIDTH,
    bottom: PAD_HEIGHT,
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    toJSON: () => ({}),
  } as DOMRect);
}

function at(key: Key) {
  const [x, y] = keyPosition(key);
  return { clientX: x, clientY: y, pointerId: 1 };
}

/** Press on the first key, move through the rest, release on the last. */
export function drawPath(pad: Element, keys: readonly Key[]) {
  fireEvent.pointerDown(pad, at(keys[0]));
  for (const key of keys.slice(1)) {
    fireEvent.pointerMove(pad, at(key));
  }
  fireEvent.pointerUp(pad, at(keys[keys.length - 1]));
}
```

- [ ] **Step 2: Write the failing test**

`src/components/PatternPad.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PatternPad } from "@/components/PatternPad";
import { drawPath, mockPadRect } from "@/test/draw";

beforeEach(() => {
  mockPadRect();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function pad() {
  return screen.getByTestId("pattern-pad");
}

describe("PatternPad", () => {
  it("renders ten keys with their digits", () => {
    render(<PatternPad onStroke={() => {}} />);
    expect(pad().querySelectorAll("circle")).toHaveLength(10);
    for (const digit of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) {
      expect(screen.getByText(digit)).toBeInTheDocument();
    }
  });

  it("reports the keys of a finished stroke", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    drawPath(pad(), [1, 4, 7, 8, 9]);
    expect(onStroke).toHaveBeenCalledTimes(1);
    expect(onStroke).toHaveBeenCalledWith([1, 4, 7, 8, 9]);
  });

  it("inserts a key the pointer jumped over", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    drawPath(pad(), [1, 3]);
    expect(onStroke).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("marks visited keys", () => {
    render(<PatternPad onStroke={() => {}} />);
    drawPath(pad(), [1, 4]);
    expect(pad().querySelector('[data-key="1"]')).toHaveClass("on");
    expect(pad().querySelector('[data-key="4"]')).toHaveClass("on");
    expect(pad().querySelector('[data-key="9"]')).not.toHaveClass("on");
  });

  it("ignores a press that never reaches a second key", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(pad(), { clientX: 50, clientY: 50, pointerId: 1 });
    expect(onStroke).not.toHaveBeenCalled();
    expect(pad().querySelector('[data-key="1"]')).not.toHaveClass("on");
  });

  it("ignores a press that starts away from every key", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(pad(), { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(pad(), { clientX: 50, clientY: 150, pointerId: 1 });
    fireEvent.pointerUp(pad(), { clientX: 50, clientY: 150, pointerId: 1 });
    expect(onStroke).not.toHaveBeenCalled();
  });

  it("discards the stroke when the pointer is cancelled", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} />);
    fireEvent.pointerDown(pad(), { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(pad(), { clientX: 50, clientY: 150, pointerId: 1 });
    fireEvent.pointerCancel(pad(), { pointerId: 1 });
    fireEvent.pointerUp(pad(), { clientX: 50, clientY: 150, pointerId: 1 });
    expect(onStroke).not.toHaveBeenCalled();
    expect(pad().querySelector('[data-key="1"]')).not.toHaveClass("on");
  });

  it("does nothing while disabled", () => {
    const onStroke = vi.fn();
    render(<PatternPad onStroke={onStroke} disabled />);
    drawPath(pad(), [1, 4, 7]);
    expect(onStroke).not.toHaveBeenCalled();
  });

  it("draws the ghost trace only when given one", () => {
    const { rerender } = render(<PatternPad onStroke={() => {}} />);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();
    rerender(<PatternPad onStroke={() => {}} ghost={[1, 4, 7, 8, 9]} />);
    expect(screen.getByTestId("pad-ghost")).toHaveAttribute(
      "points",
      "50,50 50,150 50,250 150,250 250,250",
    );
  });

  it("adds the denied class when denied", () => {
    render(<PatternPad onStroke={() => {}} denied />);
    expect(pad()).toHaveClass("denied");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/components/PatternPad.test.tsx`
Expected: FAIL, cannot resolve `@/components/PatternPad`.

- [ ] **Step 4: Write `src/components/PatternPad.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  HIT_RADIUS,
  KEYS,
  PAD_HEIGHT,
  PAD_WIDTH,
  appendKey,
  keyPosition,
  nearestKey,
  type Key,
} from "@/lib/pattern";

type Point = readonly [number, number];

type Props = {
  /** Called on pointer-up with the keys visited, when there are at least two. */
  onStroke: (path: readonly Key[]) => void;
  /** A path to show as a dashed hint, or null for none. */
  ghost?: readonly Key[] | null;
  /** Shows the current trace as an error. */
  denied?: boolean;
  /** Ignores new strokes. */
  disabled?: boolean;
};

function toPoints(path: readonly Key[]): string {
  return path.map((key) => keyPosition(key).join(",")).join(" ");
}

export function PatternPad({ onStroke, ghost = null, denied = false, disabled = false }: Props) {
  // The ref is the source of truth for handlers; state mirrors it for rendering.
  const pathRef = useRef<readonly Key[]>([]);
  const drawingRef = useRef(false);
  const [path, setPath] = useState<readonly Key[]>([]);
  const [pointer, setPointer] = useState<Point | null>(null);

  function update(next: readonly Key[]) {
    pathRef.current = next;
    setPath(next);
  }

  function toPad(event: ReactPointerEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) * PAD_WIDTH) / rect.width,
      ((event.clientY - rect.top) * PAD_HEIGHT) / rect.height,
    ];
  }

  function handleDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (disabled) return;
    const position = toPad(event);
    const key = nearestKey(position[0], position[1], HIT_RADIUS);
    if (key === null) return;
    event.preventDefault();
    try {
      // Keeps move/up events coming if the pointer leaves the pad.
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Capture is a nicety; drawing works without it.
    }
    drawingRef.current = true;
    update([key]);
    setPointer(position);
  }

  function handleMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drawingRef.current) return;
    const position = toPad(event);
    setPointer(position);
    const key = nearestKey(position[0], position[1], HIT_RADIUS);
    if (key !== null) update(appendKey(pathRef.current, key));
  }

  function handleUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setPointer(null);
    if (pathRef.current.length < 2) {
      update([]);
      return;
    }
    onStroke(pathRef.current);
  }

  function handleCancel() {
    drawingRef.current = false;
    setPointer(null);
    update([]);
  }

  const trace = toPoints(path) + (pointer && path.length > 0 ? ` ${pointer.join(",")}` : "");

  return (
    <svg
      className={denied ? "pad denied" : "pad"}
      data-testid="pattern-pad"
      viewBox={`0 0 ${PAD_WIDTH} ${PAD_HEIGHT}`}
      role="img"
      aria-label="Pattern keypad"
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleCancel}
    >
      {ghost && <polyline className="pad-ghost" data-testid="pad-ghost" points={toPoints(ghost)} />}
      <polyline className="pad-trace" points={trace} />
      {KEYS.map((key) => {
        const [x, y] = keyPosition(key);
        const on = path.includes(key);
        return (
          <g key={key}>
            <circle
              className={on ? "pad-key on" : "pad-key"}
              data-key={key}
              cx={x}
              cy={y}
              r={on ? 10 : 7}
            />
            <text className="pad-digit" x={x} y={y + 30}>
              {key}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 5: Append the pad styles to `src/app/globals.css`**

```css
/* ---------- pattern pad ---------- */
.pad {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: crosshair;
}

.pad-key {
  fill: var(--dim);
}

.pad-key.on {
  fill: var(--accent);
}

.pad-digit {
  fill: var(--dim);
  font-size: 13px;
  text-anchor: middle;
}

.pad-trace {
  fill: none;
  stroke: var(--accent);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pad-ghost {
  fill: none;
  stroke: var(--dim);
  stroke-width: 3;
  stroke-dasharray: 5 7;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: march 1.2s linear infinite;
}

.pad.denied {
  animation: shake 0.35s;
}

.pad.denied .pad-trace {
  stroke: var(--error);
}

@keyframes march {
  to {
    stroke-dashoffset: -24;
  }
}

@keyframes shake {
  25% {
    transform: translateX(-7px);
  }
  50% {
    transform: translateX(7px);
  }
  75% {
    transform: translateX(-4px);
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/components/PatternPad.test.tsx`
Expected: 10 passed.

If strokes arrive with `NaN` coordinates, check that `mockPadRect()` ran before the pointer events; without it the pad's width is 0.

- [ ] **Step 7: Commit**

```bash
git add src/test src/components/PatternPad.tsx src/components/PatternPad.test.tsx src/app/globals.css
git commit -m "Add PatternPad keypad component"
```

---

### Task 7: Gate component

**Files:**
- Create: `src/components/Gate.tsx`
- Modify: `src/app/globals.css` (append)
- Test: `src/components/Gate.test.tsx`

The gate walks through P, T, L. A correct stroke shows `OK n/3` then advances. A wrong stroke shows `ACCESS DENIED`, counts a miss for that stage, and leaves the stage where it is. Two misses on a stage turn on the ghost trace. Pressing the stage's letter key passes it.

- [ ] **Step 1: Write the failing test**

`src/components/Gate.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DENY_DELAY, GRANT_DELAY, Gate, PASS_DELAY } from "@/components/Gate";
import { EXAMPLE_PATHS } from "@/lib/pattern";
import { drawPath, mockPadRect } from "@/test/draw";

beforeEach(() => {
  vi.useFakeTimers();
  mockPadRect();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function pad() {
  return screen.getByTestId("pattern-pad");
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function pressKey(key: string) {
  fireEvent.keyDown(window, { key });
}

describe("Gate", () => {
  it("shows the name, the instruction and the first stage", () => {
    render(<Gate onUnlock={() => {}} />);
    expect(screen.getByRole("heading", { name: "PARKER T. LINDLEY" })).toBeInTheDocument();
    expect(screen.getByText("identify yourself: draw the initials")).toBeInTheDocument();
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("AWAITING INPUT");
  });

  it("advances when P is drawn", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    expect(screen.getByRole("status")).toHaveTextContent("OK 1/3");
    wait(PASS_DELAY);
    expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("AWAITING INPUT");
  });

  it("unlocks after P, T and L", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.T);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(screen.getByRole("status")).toHaveTextContent("ACCESS GRANTED");
    expect(onUnlock).not.toHaveBeenCalled();
    wait(GRANT_DELAY);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("denies a wrong shape without resetting the stage", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    drawPath(pad(), EXAMPLE_PATHS.L);
    expect(screen.getByRole("status")).toHaveTextContent("ACCESS DENIED");
    expect(pad()).toHaveClass("denied");
    wait(DENY_DELAY);
    expect(screen.getByText("AUTH 2/3")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("AWAITING INPUT");
    expect(pad()).not.toHaveClass("denied");
  });

  it("shows the ghost trace after two misses on a stage and removes it once passed", () => {
    render(<Gate onUnlock={() => {}} />);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();

    drawPath(pad(), EXAMPLE_PATHS.L);
    wait(DENY_DELAY);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();

    drawPath(pad(), EXAMPLE_PATHS.T);
    wait(DENY_DELAY);
    expect(screen.getByTestId("pad-ghost")).toBeInTheDocument();

    drawPath(pad(), EXAMPLE_PATHS.P);
    wait(PASS_DELAY);
    expect(screen.queryByTestId("pad-ghost")).toBeNull();
  });

  it("accepts the letter keys as an equivalent, in either case", () => {
    const onUnlock = vi.fn();
    render(<Gate onUnlock={onUnlock} />);
    pressKey("p");
    expect(screen.getByRole("status")).toHaveTextContent("OK 1/3");
    wait(PASS_DELAY);
    pressKey("T");
    wait(PASS_DELAY);
    pressKey("l");
    wait(GRANT_DELAY);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("does not count other keys, or the right key with a modifier, as anything", () => {
    render(<Gate onUnlock={() => {}} />);
    pressKey("x");
    pressKey("t");
    fireEvent.keyDown(window, { key: "p", metaKey: true });
    expect(screen.getByRole("status")).toHaveTextContent("AWAITING INPUT");
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
  });

  it("ignores input while feedback is showing", () => {
    render(<Gate onUnlock={() => {}} />);
    drawPath(pad(), EXAMPLE_PATHS.L);
    pressKey("p");
    expect(screen.getByRole("status")).toHaveTextContent("ACCESS DENIED");
    wait(DENY_DELAY);
    expect(screen.getByText("AUTH 1/3")).toBeInTheDocument();
  });

  it("tells screen-reader users about the keyboard equivalent", () => {
    render(<Gate onUnlock={() => {}} />);
    expect(
      screen.getByText("Keyboard alternative: press the P key, then T, then L."),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Gate.test.tsx`
Expected: FAIL, cannot resolve `@/components/Gate`.

- [ ] **Step 3: Write `src/components/Gate.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { PatternPad } from "@/components/PatternPad";
import { about } from "@/content/about";
import { EXAMPLE_PATHS, matchesShape, type Initial, type Key } from "@/lib/pattern";

const STAGES: readonly Initial[] = ["P", "T", "L"];
const HINTS = ["draw the first initial", "draw the middle initial", "draw the last initial"];

export const PASS_DELAY = 550;
export const DENY_DELAY = 650;
export const GRANT_DELAY = 700;

/** Misses on one stage before the ghost trace appears. */
const GHOST_AFTER = 2;

type Status = "idle" | "ok" | "denied" | "granted";

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [stage, setStage] = useState(0);
  const [misses, setMisses] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  // Changing this remounts the pad, which clears its trace.
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  function pass() {
    if (stage === STAGES.length - 1) {
      setStatus("granted");
      timer.current = setTimeout(onUnlock, GRANT_DELAY);
      return;
    }
    setStatus("ok");
    timer.current = setTimeout(() => {
      setStage((current) => current + 1);
      setMisses(0);
      setStatus("idle");
      setAttempt((current) => current + 1);
    }, PASS_DELAY);
  }

  function miss() {
    setStatus("denied");
    setMisses((current) => current + 1);
    timer.current = setTimeout(() => {
      setStatus("idle");
      setAttempt((current) => current + 1);
    }, DENY_DELAY);
  }

  function handleStroke(path: readonly Key[]) {
    if (status !== "idle") return;
    if (matchesShape(path, STAGES[stage])) pass();
    else miss();
  }

  // No dependency list: the handler closes over stage and status, so it is
  // re-registered every render to stay current.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (status !== "idle" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === STAGES[stage].toLowerCase()) pass();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const solved = status === "granted" ? STAGES.length : stage;
  const statusText =
    status === "ok"
      ? `OK ${stage + 1}/3`
      : status === "denied"
        ? "ACCESS DENIED"
        : status === "granted"
          ? "ACCESS GRANTED"
          : "AWAITING INPUT";

  return (
    <main className="gate">
      <h1 className="banner">{about.name.toUpperCase()}</h1>
      <p className="gate-prompt">identify yourself: draw the initials</p>
      <p className="sr-only">Keyboard alternative: press the P key, then T, then L.</p>

      <p className="gate-auth">
        <span>{`AUTH ${stage + 1}/3`}</span>
        <span className="gate-slots" aria-hidden="true">
          {STAGES.map((letter, index) => (
            <span
              key={letter}
              className={index < solved ? "slot done" : index === stage ? "slot now" : "slot"}
            >
              {index < solved ? letter : "_"}
            </span>
          ))}
        </span>
      </p>
      <p className="gate-hint">{`> ${HINTS[stage]}`}</p>

      <PatternPad
        key={attempt}
        onStroke={handleStroke}
        ghost={misses >= GHOST_AFTER ? EXAMPLE_PATHS[STAGES[stage]] : null}
        denied={status === "denied"}
        disabled={status !== "idle"}
      />

      <p className={status === "denied" ? "gate-status denied" : "gate-status"} role="status">
        {statusText}
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Append the gate styles to `src/app/globals.css`**

```css
/* ---------- gate ---------- */
.gate {
  max-width: 440px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 28px 16px 40px;
}

.gate .banner {
  font-size: clamp(34px, 9vw, 52px);
}

.gate-prompt {
  margin: 0 0 16px;
}

.gate-auth {
  display: flex;
  gap: 2ch;
  margin: 0 0 4px;
  color: var(--accent);
}

.gate-slots {
  display: inline-flex;
  gap: 1ch;
}

.slot {
  color: var(--dim);
  text-shadow: none;
}

.slot.now,
.slot.done {
  color: var(--accent);
}

.gate-hint {
  min-height: 1.55em;
  margin: 0 0 8px;
}

.gate-status {
  min-height: 1.55em;
  margin: 8px 0 0;
  text-align: center;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.gate-status.denied {
  color: var(--error);
  text-shadow: none;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/Gate.test.tsx`
Expected: 9 passed.

- [ ] **Step 6: Commit**

```bash
git add src/components/Gate.tsx src/components/Gate.test.tsx src/app/globals.css
git commit -m "Add three-stage gate with ghost trace and keyboard equivalent"
```

---

### Task 8: Output renderers, Prompt and Terminal

**Files:**
- Create: `src/components/outputs/Chip.tsx`, `ExtLink.tsx`, `MediaSlot.tsx`, `HelpOutput.tsx`, `ProjectsOutput.tsx`, `ProjectOutput.tsx`, `TextOutputs.tsx`, `Output.tsx` (all under `src/components/outputs/`)
- Create: `src/components/Prompt.tsx`, `src/components/Terminal.tsx`
- Modify: `src/app/globals.css` (append)
- Test: `src/components/Terminal.test.tsx`

`Terminal` owns the transcript. `Prompt` owns the input line. `Output` turns a `CommandResult` into markup. The tests drive all three through `Terminal`.

- [ ] **Step 1: Write the failing test**

`src/components/Terminal.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Terminal.test.tsx`
Expected: FAIL, cannot resolve `@/components/Terminal`.

- [ ] **Step 3: Write `src/components/outputs/Chip.tsx`**

```tsx
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
```

- [ ] **Step 4: Write `src/components/outputs/ExtLink.tsx`**

```tsx
import type { ReactNode } from "react";

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="ext" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
```

- [ ] **Step 5: Write `src/components/outputs/MediaSlot.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Project } from "@/content/types";

/** Shows a project's media, or a fixed 16:9 placeholder when there is none or it fails. */
export function MediaSlot({ project }: { project: Project }) {
  const [failed, setFailed] = useState(false);
  const media = project.media;

  if (!media || failed) {
    return <div className="media-slot">{`[ media: ${project.title} ]`}</div>;
  }

  if (media.kind === "video") {
    return (
      <video
        className="media"
        src={media.src}
        aria-label={media.alt}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setFailed(true)}
      />
    );
  }

  // A plain <img>: the site is a static export, so next/image optimisation is unavailable.
  return <img className="media" src={media.src} alt={media.alt} onError={() => setFailed(true)} />;
}
```

- [ ] **Step 6: Write `src/components/outputs/HelpOutput.tsx`**

```tsx
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
```

- [ ] **Step 7: Write `src/components/outputs/ProjectsOutput.tsx`**

```tsx
import { Chip } from "@/components/outputs/Chip";
import { projects } from "@/content/projects";

export function ProjectsOutput({ onRun }: { onRun: (command: string) => void }) {
  return (
    <ol className="rows">
      {projects.map((project, index) => (
        <li key={project.slug} className="proj">
          <span className="num">{String(index + 1).padStart(2, "0")}</span>
          <span className="proj-name">{project.slug}</span>
          <span className="proj-desc">
            {project.summary} <span className="tag">{`[${project.stack.join(", ")}]`}</span>
          </span>
          <Chip command={`open ${project.slug}`} onRun={onRun}>
            open
          </Chip>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 8: Write `src/components/outputs/ProjectOutput.tsx`**

```tsx
import { ExtLink } from "@/components/outputs/ExtLink";
import { MediaSlot } from "@/components/outputs/MediaSlot";
import type { Project } from "@/content/types";

export function ProjectOutput({ project }: { project: Project }) {
  return (
    <article className="project">
      <h2 className="project-title">{project.title}</h2>
      <dl className="facts">
        <div>
          <dt>role</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>stack</dt>
          <dd>{project.stack.join(", ")}</dd>
        </div>
      </dl>
      <p>{project.description}</p>
      <MediaSlot project={project} />
      {project.links.length > 0 && (
        <p className="project-links">
          {project.links.map((link) => (
            <ExtLink key={link.href} href={link.href}>
              {link.label}
            </ExtLink>
          ))}
        </p>
      )}
    </article>
  );
}
```

- [ ] **Step 9: Write `src/components/outputs/TextOutputs.tsx`**

```tsx
import { ExtLink } from "@/components/outputs/ExtLink";
import { about } from "@/content/about";
import { articles, moreArticlesHref } from "@/content/articles";
import { links } from "@/content/links";
import { projects } from "@/content/projects";

/** "https://www.example.com/path/" -> "example.com/path" */
function displayUrl(href: string): string {
  return href.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export function AboutOutput() {
  return <p className="out">{about.bio}</p>;
}

export function WritingOutput() {
  return (
    <>
      <ul className="rows">
        {articles.map((article) => (
          <li key={article.href} className="article">
            <span className="year">{article.year}</span>
            <ExtLink href={article.href}>{article.title}</ExtLink>
          </li>
        ))}
      </ul>
      <p className="out">
        <ExtLink href={moreArticlesHref}>more on medium</ExtLink>
      </p>
    </>
  );
}

export function LinksOutput() {
  return (
    <ul className="rows">
      {links.map((link) => (
        <li key={link.href} className="row">
          <span>{link.label}</span>
          <ExtLink href={link.href}>{displayUrl(link.href)}</ExtLink>
        </li>
      ))}
    </ul>
  );
}

export function OpenUsageOutput({ arg }: { arg: string | null }) {
  return (
    <>
      {arg !== null && <p className="out error">{`no project matches "${arg}".`}</p>}
      <p className="out">{"usage: open <name or number>"}</p>
      <p className="out">{`projects: ${projects.map((project) => project.slug).join(", ")}`}</p>
    </>
  );
}

export function NotFoundOutput({ input }: { input: string }) {
  return <p className="out error">{`command not found: ${input}. type help`}</p>;
}
```

- [ ] **Step 10: Write `src/components/outputs/Output.tsx`**

```tsx
import { HelpOutput } from "@/components/outputs/HelpOutput";
import { ProjectOutput } from "@/components/outputs/ProjectOutput";
import { ProjectsOutput } from "@/components/outputs/ProjectsOutput";
import {
  AboutOutput,
  LinksOutput,
  NotFoundOutput,
  OpenUsageOutput,
  WritingOutput,
} from "@/components/outputs/TextOutputs";
import { projects } from "@/content/projects";
import type { CommandResult } from "@/lib/commands";

type Props = {
  result: CommandResult;
  onRun: (command: string) => void;
};

export function Output({ result, onRun }: Props) {
  switch (result.kind) {
    case "help":
      return <HelpOutput onRun={onRun} />;
    case "about":
      return <AboutOutput />;
    case "projects":
      return <ProjectsOutput onRun={onRun} />;
    case "project": {
      const project = projects.find((candidate) => candidate.slug === result.slug);
      return project ? <ProjectOutput project={project} /> : <OpenUsageOutput arg={result.slug} />;
    }
    case "openUsage":
      return <OpenUsageOutput arg={result.arg} />;
    case "writing":
      return <WritingOutput />;
    case "links":
      return <LinksOutput />;
    case "notFound":
      return <NotFoundOutput input={result.input} />;
    case "empty":
    case "clear":
    case "logout":
      // Handled by Terminal; they never reach the transcript.
      return null;
  }
}
```

- [ ] **Step 11: Write `src/components/Prompt.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { complete } from "@/lib/commands";

export const PROMPT_LABEL = "parker@ptl:~$";

type Props = {
  onSubmit: (input: string) => void;
  /** Commands run so far, oldest first. */
  history: readonly string[];
  slugs: readonly string[];
};

export function Prompt({ onSubmit, history, slugs }: Props) {
  const [value, setValue] = useState("");
  // Position in history while browsing with the arrow keys; null when not browsing.
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on arrival only where there is a mouse or trackpad. On touch devices
  // focusing would open the on-screen keyboard over the page.
  useEffect(() => {
    if (window.matchMedia?.("(pointer: fine)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
    setValue("");
    setHistoryIndex(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp") {
      if (history.length === 0) return;
      event.preventDefault();
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setValue(history[next]);
    } else if (event.key === "ArrowDown") {
      if (historyIndex === null) return;
      event.preventDefault();
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(null);
        setValue("");
      } else {
        setHistoryIndex(next);
        setValue(history[next]);
      }
    } else if (event.key === "Tab") {
      // Only swallow Tab when it completes something, so keyboard users can still tab away.
      const completed = complete(value, slugs);
      if (completed !== null) {
        event.preventDefault();
        setValue(completed);
      }
    }
  }

  return (
    <form className="prompt" onSubmit={handleSubmit}>
      <span className="prompt-label">{PROMPT_LABEL}</span>
      <span className="prompt-field">
        {/* The visible text and block cursor. The real input sits on top, transparent. */}
        <span aria-hidden="true">{value}</span>
        <span className="cursor" aria-hidden="true" />
        <input
          ref={inputRef}
          className="prompt-input"
          aria-label="Command"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setHistoryIndex(null);
          }}
          onKeyDown={handleKeyDown}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
        />
      </span>
    </form>
  );
}
```

- [ ] **Step 12: Write `src/components/Terminal.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Output } from "@/components/outputs/Output";
import { PROMPT_LABEL, Prompt } from "@/components/Prompt";
import { about } from "@/content/about";
import { projects } from "@/content/projects";
import { parseCommand, type CommandResult } from "@/lib/commands";

type Entry = {
  id: number;
  input: string;
  result: CommandResult;
};

const SLUGS = projects.map((project) => project.slug);

/** Keeps the address bar pointing at what is on screen, so it can be shared. */
function syncUrl(path: string) {
  if (window.location.pathname !== path) {
    window.history.replaceState(null, "", path);
  }
}

type Props = {
  /** Run once on mount, e.g. "help" or "open seattle-311". */
  initialCommand: string;
  onLogout: () => void;
};

export function Terminal({ initialCommand, onLogout }: Props) {
  const nextId = useRef(1);
  const [entries, setEntries] = useState<Entry[]>(() => [
    { id: 0, input: initialCommand, result: parseCommand(initialCommand, SLUGS) },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const latestEntry = useRef<HTMLElement | null>(null);
  const mounted = useRef(false);

  // Bring the start of new output into view. Skipped on first render so the
  // page does not jump on arrival.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    latestEntry.current?.scrollIntoView?.({ block: "start" });
  }, [entries]);

  function run(raw: string) {
    const input = raw.trim();
    const result = parseCommand(input, SLUGS);
    if (result.kind === "empty") return;

    setHistory((current) => [...current, input]);

    if (result.kind === "logout") {
      onLogout();
      return;
    }
    if (result.kind === "clear") {
      setEntries([]);
      syncUrl("/");
      return;
    }

    const id = nextId.current++;
    setEntries((current) => [...current, { id, input, result }]);
    // Trailing slash matches the exported file layout (next.config.ts: trailingSlash).
    syncUrl(result.kind === "project" ? `/projects/${result.slug}/` : "/");
  }

  return (
    <main className="terminal">
      <header>
        <h1 className="banner">{about.name.toUpperCase()}</h1>
        <p className="meta">{about.tagline}</p>
      </header>

      <div className="transcript" aria-live="polite">
        {entries.map((entry, index) => (
          <section
            key={entry.id}
            className="entry"
            ref={index === entries.length - 1 ? latestEntry : undefined}
          >
            <p className="line">
              <span className="prompt-label">{PROMPT_LABEL}</span> {entry.input}
            </p>
            <Output result={entry.result} onRun={run} />
          </section>
        ))}
      </div>

      <Prompt onSubmit={run} history={history} slugs={SLUGS} />
    </main>
  );
}
```

- [ ] **Step 13: Append the terminal styles to `src/app/globals.css`**

```css
/* ---------- terminal ---------- */
.terminal {
  max-width: 820px;
  margin: 0 auto;
  /* Room below the prompt so new output can scroll to the top of the screen. */
  padding: 28px 16px 40vh;
}

.entry {
  margin: 18px 0 0;
  scroll-margin-top: 12px;
}

.line {
  margin: 0 0 6px;
  color: var(--accent);
}

.out {
  margin: 0 0 6px 2ch;
}

.out.error {
  color: var(--error);
  text-shadow: none;
}

.head {
  margin: 2px 0 8px 2ch;
  color: var(--dim);
  text-shadow: none;
  letter-spacing: 0.06em;
}

.rows {
  margin: 0 0 6px 2ch;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 16ch 1fr;
  gap: 0 2ch;
  align-items: baseline;
  margin: 3px 0;
}

.proj {
  display: grid;
  grid-template-columns: 3ch minmax(0, 24ch) minmax(0, 1fr) auto;
  gap: 0 2ch;
  align-items: baseline;
  margin: 5px 0;
}

.proj-name {
  color: var(--accent);
}

.article {
  display: grid;
  grid-template-columns: 5ch 1fr;
  gap: 0 2ch;
  align-items: baseline;
  margin: 5px 0;
}

.num,
.tag,
.year {
  color: var(--dim);
  text-shadow: none;
}

.chip {
  padding: 0 1ch;
  border: 1px solid var(--dim);
  background: transparent;
  color: var(--accent);
  font: inherit;
  text-shadow: inherit;
  cursor: pointer;
}

.chip:hover,
.chip:focus-visible {
  background: var(--accent);
  color: var(--bg);
  text-shadow: none;
}

.ext {
  text-underline-offset: 3px;
}

.project {
  margin: 0 0 6px 2ch;
}

.project p {
  margin: 0 0 6px;
}

.project-title {
  margin: 4px 0 8px;
  font-family: var(--font-display), monospace;
  font-size: 32px;
  font-weight: 400;
  line-height: 1;
  color: var(--accent);
}

.facts {
  margin: 0 0 10px;
}

.facts div {
  display: grid;
  grid-template-columns: 8ch 1fr;
}

.facts dt {
  color: var(--dim);
  text-shadow: none;
}

.facts dd {
  margin: 0;
}

.project-links {
  display: flex;
  flex-wrap: wrap;
  gap: 2ch;
}

.media-slot,
.media {
  display: block;
  width: 100%;
  max-width: 640px;
  aspect-ratio: 16 / 9;
  margin: 10px 0;
}

.media-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1px dashed var(--dim);
  color: var(--dim);
  text-align: center;
  text-shadow: none;
}

.media {
  border: 1px solid var(--dim);
  object-fit: cover;
}

/* ---------- prompt ---------- */
.prompt {
  display: flex;
  gap: 1ch;
  align-items: baseline;
  margin: 18px 0 0;
  color: var(--accent);
}

.prompt-label {
  flex: none;
  color: var(--accent);
}

.prompt-field {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 1.55em;
  white-space: pre-wrap;
}

.prompt-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: transparent;
  caret-color: transparent;
  font: inherit;
  /* 16px stops iOS zooming the page when the input is focused. */
  font-size: 16px;
}

/* Hollow when the prompt is not focused, solid and blinking when it is. */
.cursor {
  display: inline-block;
  width: 1ch;
  height: 1.1em;
  border: 1px solid var(--accent);
  vertical-align: text-bottom;
}

.prompt-field:focus-within .cursor {
  background: var(--accent);
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (max-width: 560px) {
  .row {
    grid-template-columns: 1fr;
    margin: 8px 0;
  }

  .proj {
    /* minmax(0, ...) lets a long project name wrap instead of widening the page. */
    grid-template-columns: 3ch minmax(0, 1fr) auto;
    margin: 10px 0;
  }

  .proj-desc {
    grid-column: 2 / -1;
    grid-row: 2;
  }
}
```

- [ ] **Step 14: Run the test to verify it passes**

Run: `npx vitest run src/components/Terminal.test.tsx`
Expected: 19 passed.

- [ ] **Step 15: Typecheck**

Run: `npm run typecheck`
Expected: exits 0. If `Output.tsx` reports "not all code paths return a value", every `CommandResult` kind is not covered; add the missing `case`.

- [ ] **Step 16: Commit**

```bash
git add src/components src/app/globals.css
git commit -m "Add terminal, prompt and command output renderers"
```

---

### Task 9: Boot and App

**Files:**
- Create: `src/components/Boot.tsx`, `src/components/App.tsx`
- Modify: `src/app/globals.css` (append)
- Test: `src/components/Boot.test.tsx`, `src/components/App.test.tsx`

`App` starts in `init` (an empty frame), reads the unlock flag after mount, then shows `boot` (locked) or `shell` (unlocked). `boot` leads to `gate`; a solved gate stores the flag and shows `shell`. `logout` clears the flag and returns to `boot`.

- [ ] **Step 1: Write the failing Boot test**

`src/components/Boot.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOT_LINES, Boot, LINE_INTERVAL } from "@/components/Boot";

beforeEach(() => {
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

describe("Boot", () => {
  it("reveals one line at a time, then finishes once", () => {
    const onDone = vi.fn();
    render(<Boot onDone={onDone} />);
    expect(screen.getByText(BOOT_LINES[0])).toBeInTheDocument();
    expect(screen.queryByText(BOOT_LINES[1])).toBeNull();

    wait(LINE_INTERVAL);
    expect(screen.getByText(BOOT_LINES[1])).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    wait(LINE_INTERVAL * BOOT_LINES.length);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("finishes in about a second and a half", () => {
    expect(LINE_INTERVAL * BOOT_LINES.length).toBe(1500);
  });

  it("skips on a key press", () => {
    const onDone = vi.fn();
    render(<Boot onDone={onDone} />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("skips on a click or tap", () => {
    const onDone = vi.fn();
    render(<Boot onDone={onDone} />);
    fireEvent.pointerDown(window);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("finishes immediately when reduced motion is requested", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
    }));
    const onDone = vi.fn();
    render(<Boot onDone={onDone} />);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Boot.test.tsx`
Expected: FAIL, cannot resolve `@/components/Boot`.

- [ ] **Step 3: Write `src/components/Boot.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

export const BOOT_LINES = [
  "PTL-BIOS v2.0.26",
  "memory check ............ 640K OK",
  "loading kernel .......... OK",
  "mounting /home/parker ... OK",
  "starting authd .......... OK",
  "identity required.",
];

export const LINE_INTERVAL = 250;

export function Boot({ onDone }: { onDone: () => void }) {
  // Number of lines showing. One past the end means the sequence is over.
  const [count, setCount] = useState(1);
  const finished = count > BOOT_LINES.length;

  useEffect(() => {
    const skip = () => setCount(BOOT_LINES.length + 1);

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      skip();
      return;
    }

    const interval = window.setInterval(() => setCount((current) => current + 1), LINE_INTERVAL);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  // `finished` flips to true exactly once, so onDone runs exactly once.
  // onDone is left out of the dependencies on purpose: a new callback identity
  // from the parent must not fire it again.
  useEffect(() => {
    if (finished) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  return (
    <main className="boot" data-testid="boot">
      {BOOT_LINES.slice(0, count).map((line) => (
        <p key={line}>{line}</p>
      ))}
      <p className="boot-skip">press any key to skip</p>
    </main>
  );
}
```

- [ ] **Step 4: Run the Boot test to verify it passes**

Run: `npx vitest run src/components/Boot.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Write the failing App test**

`src/components/App.test.tsx`:

```tsx
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
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/components/App.test.tsx`
Expected: FAIL, cannot resolve `@/components/App`.

- [ ] **Step 7: Write `src/components/App.tsx`**

```tsx
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
```

- [ ] **Step 8: Append the boot, wipe and reduced-motion styles to `src/app/globals.css`**

```css
/* ---------- boot ---------- */
.boot {
  max-width: 820px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 28px 16px;
}

.boot p {
  margin: 0;
}

.boot .boot-skip {
  margin-top: 16px;
  color: var(--dim);
  text-shadow: none;
}

/* ---------- shell entrance ---------- */
.shell-enter {
  animation: wipe 0.45s ease-out both;
}

@keyframes wipe {
  from {
    clip-path: inset(0 0 100% 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .cursor,
  .pad.denied,
  .pad-ghost,
  .shell-enter,
  .prompt-field:focus-within .cursor {
    animation: none;
  }
}
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run src/components/Boot.test.tsx src/components/App.test.tsx`
Expected: 12 passed.

- [ ] **Step 10: Commit**

```bash
git add src/components/Boot.tsx src/components/Boot.test.tsx src/components/App.tsx src/components/App.test.tsx src/app/globals.css
git commit -m "Add boot sequence and App phase flow"
```

---

### Task 10: Pages, static content and metadata

**Files:**
- Create: `src/components/StaticContent.tsx`, `src/app/projects/[slug]/page.tsx`, `src/app/not-found.tsx`
- Modify: `src/app/page.tsx` (replace), `src/app/globals.css` (append)
- Test: `src/components/StaticContent.test.tsx`

`StaticContent` is the same content as plain HTML. It is hidden by default and shown by the `<noscript>` style already in `layout.tsx`.

- [ ] **Step 1: Write the failing test**

`src/components/StaticContent.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaticContent } from "@/components/StaticContent";

describe("StaticContent", () => {
  it("contains the bio, every project, the articles and the links", () => {
    render(<StaticContent />);
    expect(
      screen.getByText(
        "Parker T. Lindley. Fullstack dev. Rides bikes. Writing code since the dial-up days.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TrainerRoad onboarding" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seattle 311" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Copy Pasta" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Raspberry Pi closeCall Cycling License Plate Recorder" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "github.com/etcetera8" })).toBeInTheDocument();
  });

  it("shows only the named project when given a slug", () => {
    render(<StaticContent slug="seattle-311" />);
    expect(screen.getByRole("heading", { name: "Seattle 311" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Copy Pasta" })).toBeNull();
  });

  it("carries the class the noscript style reveals", () => {
    const { container } = render(<StaticContent />);
    expect(container.firstElementChild).toHaveClass("static-content");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/StaticContent.test.tsx`
Expected: FAIL, cannot resolve `@/components/StaticContent`.

- [ ] **Step 3: Write `src/components/StaticContent.tsx`**

```tsx
import { ProjectOutput } from "@/components/outputs/ProjectOutput";
import { AboutOutput, LinksOutput, WritingOutput } from "@/components/outputs/TextOutputs";
import { about } from "@/content/about";
import { projects } from "@/content/projects";

/**
 * The site's content as plain HTML, for crawlers and visitors without JavaScript.
 * Hidden by default in globals.css; a <noscript> style in layout.tsx reveals it.
 */
export function StaticContent({ slug }: { slug?: string }) {
  const shown = slug ? projects.filter((project) => project.slug === slug) : projects;

  return (
    <div className="static-content">
      <p className="banner">{about.name.toUpperCase()}</p>
      <p className="meta">{about.tagline}</p>

      <h2 className="static-heading">about</h2>
      <AboutOutput />

      <h2 className="static-heading">projects</h2>
      {shown.map((project) => (
        <ProjectOutput key={project.slug} project={project} />
      ))}

      <h2 className="static-heading">writing</h2>
      <WritingOutput />

      <h2 className="static-heading">links</h2>
      <LinksOutput />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/StaticContent.test.tsx`
Expected: 3 passed.

- [ ] **Step 5: Replace `src/app/page.tsx`**

```tsx
import { App } from "@/components/App";
import { StaticContent } from "@/components/StaticContent";

export default function Home() {
  return (
    <>
      <StaticContent />
      <App initialCommand="help" />
    </>
  );
}
```

- [ ] **Step 6: Write `src/app/projects/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { App } from "@/components/App";
import { StaticContent } from "@/components/StaticContent";
import { projects } from "@/content/projects";

type Props = {
  params: Promise<{ slug: string }>;
};

// Only the slugs below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((candidate) => candidate.slug === slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description,
    openGraph: { title: project.title, description: project.description, type: "article" },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (!projects.some((project) => project.slug === slug)) notFound();

  return (
    <>
      <StaticContent slug={slug} />
      <App initialCommand={`open ${slug}`} />
    </>
  );
}
```

- [ ] **Step 7: Write `src/app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <h1 className="banner">404</h1>
      <p className="line">parker@ptl:~$ cd ???</p>
      <p className="out error">no such file or directory</p>
      <p className="out">
        <Link href="/">cd ~</Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 8: Append the static-content styles to `src/app/globals.css`**

```css
/* ---------- static content (crawlers and no-JavaScript) ---------- */
.static-content {
  display: none;
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 16px 60px;
}

.static-heading {
  margin: 24px 0 8px;
  font: inherit;
  color: var(--accent);
}

.static-heading::before {
  content: "== ";
  color: var(--dim);
}
```

- [ ] **Step 9: Build and check the exported HTML**

Run: `npm run build`
Expected: exits 0. The route list shows `/`, `/_not-found` and three `/projects/...` pages.

Run:

```bash
ls out/index.html out/404.html out/projects/seattle-311/index.html out/projects/copy-pasta/index.html out/projects/trainerroad-onboarding/index.html
grep -c "A map displaying Seattle area 311 data." out/index.html
grep -c "Copy Pasta" out/projects/seattle-311/index.html
grep -o "<title>[^<]*</title>" out/projects/seattle-311/index.html
```

Expected: all five files listed; first count is at least `1`; second count is `0` (the project page carries only its own project; `grep -c` exits 1 when the count is 0, which is fine here); title is `<title>Seattle 311 // Parker T. Lindley</title>`.

- [ ] **Step 10: Run every unit and component test, and typecheck**

Run: `npm test`
Expected: all test files pass.

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 11: Commit**

```bash
git add src/app src/components/StaticContent.tsx src/components/StaticContent.test.tsx
git commit -m "Add home and project pages with crawlable static content"
```

---

### Task 11: Browser tests

**Files:**
- Create: `playwright.config.ts`, `e2e/portfolio.spec.ts`
- `vitest.config.mts` is already limited to `src/`, so Vitest will not pick up the `e2e/` files.

- [ ] **Step 1: Install the browser**

```bash
npx playwright install chromium
```

Expected: Chromium downloads, or reports it is already installed.

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  // Tests run against the real static export, served the way a static host would.
  webServer: {
    command: `npm run build && npx serve out -l ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
```

- [ ] **Step 3: Write `e2e/portfolio.spec.ts`**

```ts
import { expect, test, type Page } from "@playwright/test";

// Pad coordinates of each key, in the pad's 300 x 400 space.
const KEY_POSITIONS: Record<number, [number, number]> = {
  1: [50, 50],
  2: [150, 50],
  3: [250, 50],
  4: [50, 150],
  5: [150, 150],
  6: [250, 150],
  7: [50, 250],
  8: [150, 250],
  9: [250, 250],
  0: [150, 350],
};

const P = [7, 4, 1, 2, 3, 6, 5, 4];
const T = [1, 2, 3, 2, 5, 8];
const L = [1, 4, 7, 8, 9];

const HELP_HEADING = "AVAILABLE COMMANDS (type or click)";

/** Drag through the given keys on the pad. */
async function draw(page: Page, keys: number[]) {
  const pad = page.getByTestId("pattern-pad");
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  if (!box) throw new Error("pattern pad is not visible");

  const at = (key: number) => ({
    x: box.x + (KEY_POSITIONS[key][0] / 300) * box.width,
    y: box.y + (KEY_POSITIONS[key][1] / 400) * box.height,
  });

  const start = at(keys[0]);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (const key of keys.slice(1)) {
    const point = at(key);
    await page.mouse.move(point.x, point.y, { steps: 6 });
  }
  await page.mouse.up();
}

test("draw P, T and L, then open a project", async ({ page }) => {
  await page.goto("/");

  // The boot sequence finishes on its own.
  await expect(page.getByTestId("pattern-pad")).toBeVisible();
  await expect(page.getByText("AUTH 1/3")).toBeVisible();

  await draw(page, P);
  await expect(page.getByText("AUTH 2/3")).toBeVisible();

  await draw(page, T);
  await expect(page.getByText("AUTH 3/3")).toBeVisible();

  await draw(page, L);
  await expect(page.getByText(HELP_HEADING)).toBeVisible();

  await page.getByRole("button", { name: "projects", exact: true }).click();
  await page.getByRole("button", { name: "open seattle-311", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Seattle 311" })).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/seattle-311\/$/);
});

test("a wrong pattern is denied and the stage stays put", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("pattern-pad")).toBeVisible();

  await draw(page, L);
  await expect(page.getByRole("status")).toHaveText("ACCESS DENIED");
  await expect(page.getByRole("status")).toHaveText("AWAITING INPUT");
  await expect(page.getByText("AUTH 1/3")).toBeVisible();
});

test("a direct project link shows the gate, then that project; keys work as an equivalent", async ({
  page,
}) => {
  await page.goto("/projects/copy-pasta/");
  await expect(page.getByTestId("pattern-pad")).toBeVisible();

  await page.keyboard.press("p");
  await expect(page.getByText("AUTH 2/3")).toBeVisible();
  await page.keyboard.press("t");
  await expect(page.getByText("AUTH 3/3")).toBeVisible();
  await page.keyboard.press("l");

  await expect(page.getByRole("heading", { name: "Copy Pasta" })).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/copy-pasta\/$/);
});

test("a stored unlock skips the gate, and logout locks it again", async ({ page }) => {
  // Seed the flag once. The sessionStorage guard stops it being re-seeded on reload.
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("seeded")) {
      window.localStorage.setItem("ptl.unlocked", "1");
      window.sessionStorage.setItem("seeded", "1");
    }
  });

  await page.goto("/");
  await expect(page.getByText(HELP_HEADING)).toBeVisible();
  await expect(page.getByTestId("pattern-pad")).toHaveCount(0);

  await page.getByRole("button", { name: "logout", exact: true }).click();
  await expect(page.getByTestId("pattern-pad")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("pattern-pad")).toBeVisible();
  await expect(page.getByText(HELP_HEADING)).toHaveCount(0);
});

test("typed commands work", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("ptl.unlocked", "1"));
  await page.goto("/");

  const prompt = page.getByLabel("Command");
  await prompt.fill("links");
  await prompt.press("Enter");
  await expect(page.getByRole("link", { name: "github.com/etcetera8" })).toBeVisible();

  await prompt.fill("nonsense");
  await prompt.press("Enter");
  await expect(page.getByText("command not found: nonsense. type help")).toBeVisible();
});

test("the page does not scroll sideways", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("ptl.unlocked", "1"));
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.getByRole("button", { name: "projects", exact: true }).click();
  await expect(page.getByText("copy-pasta", { exact: true })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("an unknown path shows the 404 page", async ({ page }) => {
  const response = await page.goto("/projects/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("no such file or directory")).toBeVisible();
});
```

- [ ] **Step 4: Run the browser tests**

Run: `npm run test:e2e`
Expected: 14 passed (7 tests x 2 projects). The first run builds the site, so it takes a minute or two.

Likely failures and what they mean:

- *Pattern tests fail on `phone` only:* the gate does not fit the phone viewport and the drag starts off-screen. Reduce the vertical space above the pad in `.gate` rather than changing the test.
- *"does not scroll sideways" fails:* something is wider than 320px. Find it with `document.querySelectorAll("*")` filtered by `scrollWidth > clientWidth` in the browser console, and fix the CSS.
- *404 test gets status 200:* the static server is not using `out/404.html`. Confirm that file exists after the build.

Fix the cause, re-run, and repeat until all pass.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e
git commit -m "Add Playwright tests for the gate, shell and routing"
```

---

### Task 12: Final verification

**Files:** none created. Fix anything the checks turn up in the file it belongs to.

- [ ] **Step 1: Run every automated check from a clean state**

```bash
rm -rf .next out
npm run typecheck
npm test
npm run test:e2e
```

Expected: typecheck exits 0; all Vitest files pass; 14 Playwright tests pass.

- [ ] **Step 2: Look at the site by hand**

Run: `npm run dev`, open `http://localhost:3000`.

Check each of these and fix anything that is off:

1. Boot lines appear one at a time, and any key or click skips them.
2. The gate shows the name, the instruction, `AUTH 1/3` and the keypad.
3. Drawing P, T and L with the mouse works, including T with its doubled-back top bar.
4. Two wrong strokes on a stage show the dashed ghost trace.
5. After unlocking, the shell wipes in and `help` is already on screen.
6. Every chip works. `open 1`, `open 2`, `open 3` each show a project with a dashed media placeholder.
7. Up/Down recall commands; Tab completes `pro` to `projects`.
8. Reloading skips the gate. `logout` brings it back.
9. In the browser's device toolbar at 375px wide: the gate fits without scrolling to reach the pad, the pad draws by touch emulation, and nothing scrolls sideways.
10. With "prefers-reduced-motion: reduce" emulated (DevTools, Rendering panel): no boot typing, no blinking cursor, no wipe.
11. With JavaScript disabled: the plain content version is shown and readable.
12. Colours match the spec: near-black background, green accent, faint glow, light scanlines, no rain.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "Polish after manual review"
```

Skip this step if there was nothing to fix.

- [ ] **Step 4: Report**

Summarise for Parker: what was built, the test counts, anything that differs from the spec and why, and the content still to supply (bio, TrainerRoad role/stack/description and recording, project screenshots). Then follow superpowers:finishing-a-development-branch to decide how to integrate the `terminal-portfolio` branch.

---

## Spec coverage

| Spec section | Task |
|---|---|
| Visitor flow (boot, gate, wipe, shell, remembered unlock) | 7, 9 |
| Look (tokens, fonts, scanlines, cursor, reduced motion, 320px) | 1, 6, 7, 8, 9, 11 |
| Keypad, stroke recording, pass-through keys, retracing | 3, 6 |
| Shapes P, T, L and matching | 3 |
| Gate feedback, per-stage misses, ghost trace | 7 |
| Keyboard equivalent | 7, 11 |
| Persistence and storage failure | 5, 9 |
| Commands, aliases, unknown input, `open` usage | 4, 8 |
| Clicking chips, history, tab completion, focus rule | 8 |
| Accessibility (live region, focus styles, sr-only hint) | 1, 7, 8 |
| Content (projects, articles, links, about, media slot) | 2, 8 |
| Routes, URL sync, direct project links | 8, 10, 11 |
| Static content, noscript, metadata | 1, 10 |
| Error handling table | 5, 6, 8, 10, 11 |
| Testing (unit, component, browser) | 2 to 11 |
