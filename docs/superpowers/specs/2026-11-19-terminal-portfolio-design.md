# Terminal portfolio: design

Date: 2026-11-19
Status: implemented on branch `terminal-portfolio`. This document was kept up to date through the build and its reviews, so it describes the site as built.

## Purpose

A personal portfolio for Parker T. Lindley that demonstrates front-end capability through the site itself. It presents featured projects, two Medium articles, and personal links inside a retro terminal. Visitors get in by drawing the initials P, T and L on a keypad.

Audience: recruiters, hiring managers and other developers. Many arrive on a phone and give the site a few seconds, so everything reachable by typing must also be reachable by clicking or tapping.

## Visitor flow

1. **Boot.** A fake startup sequence types out for about 2 seconds. Any key, click or tap skips it. It plays only when the terminal is locked.
2. **Gate.** The screen shows `PTL`, centred, the line `Draw Pattern to Access Restricted Portfolio`, a small picture of the pattern to draw, a progress bar, and the keypad. The visitor draws P, then T, then L. Each correct pattern fills another third of the bar and moves the picture on to the next letter.
3. **Install.** Fake package-install output types out for about 2.5 seconds: `access granted.`, `$ npm install portfolio`, one fetch line each for projects, writing and links, `added N packages in 1.2s`, `initializing terminal ...`. The counts come from the site's real content. Any key, click or tap skips it.
4. **Shell.** A short screen wipe (no Matrix rain), then the banner, status line, and the output of `help` already printed. The visitor types commands or clicks them.

A visitor who has unlocked the gate before in the same browser skips steps 1 to 3. `logout` locks it again.

## Look

Chosen direction: "phosphor, toned down".

| Token | Value |
|---|---|
| Background | `#020502` |
| Accent (prompt, commands, banner) | `#00ff66` |
| Body text | `#a5f5c3` |
| Dim text (hints, numbering, tags) | `#12903f` (slightly brighter than the mockup's `#0f7f3e` so it meets AA contrast) |
| Error | `#ff4444` |
| Glow | `text-shadow: 0 0 2px rgba(0,255,102,.28)` |
| Scanlines | 1px dark line every 3px at 16% opacity, fixed overlay, `pointer-events: none` |

- Banner and headings: VT323. Body: IBM Plex Mono. Both loaded with `next/font/google` so they are self-hosted at build time.
- Blinking block cursor at the prompt.
- No background rain anywhere.
- Single column on narrow screens. No horizontal scrolling at 320px width.
- `prefers-reduced-motion: reduce` skips the boot screen and the install text entirely and disables the wipe, the pad shake and the cursor blink. Content appears immediately.

## The gate

### Screen

Top to bottom: the title `PTL` in the display font, centred; the prompt `Draw Pattern to Access Restricted Portfolio`; the pattern guide; the progress bar; the keypad. There is no name banner, hint line or visible status line.

The pattern guide is a small, non-interactive picture of the keypad (all nine keys as dots) with the current letter's example path traced on it. Screen readers get the guide as an image labelled `Pattern N of 3: the letter X`.

The progress bar sits under the guide: 24 blocks in an outlined track, 8 for each pattern. When a pattern is accepted its 8 blocks light one after another, left to right, starting at once rather than after the feedback pause. Under the bar, `authenticating` with dots that appear one by one on a loop shows that something is happening, with the percentage (`0%`, `33%`, `67%`, `100%`) on the right. When the third pattern is accepted the label becomes `identity confirmed`. Screen readers get the bar as a progress bar labelled `Patterns completed`, from 0 to 3. With reduced motion the blocks light at once and the dots do not animate.

### Keypad

Nine keys in a 3 by 3 grid: `1 2 3 / 4 5 6 / 7 8 9`. Rendered as SVG so it scales. Uses pointer events, so mouse, touch and pen behave the same. `touch-action: none` on the pad stops the page scrolling during a drag.

### Recording a stroke

- A stroke starts on pointer-down within the hit radius of a key and ends on pointer-up.
- Moving within the hit radius of another key adds a segment between the last key and that key.
- If the straight line between two keys passes exactly over a third key (for example 1 to 3 passes 2, 1 to 7 passes 4, 2 to 8 passes 5), the move is recorded as two segments through the middle key.
- A segment is undirected. Retracing a segment already drawn is allowed and adds nothing.
- A stroke with fewer than two keys is ignored.

### Shapes

A stroke passes when its set of segments equals the target set exactly. Direction and stroke order do not matter.

| Initial | Segments | One way to draw it |
|---|---|---|
| P | 1-4, 4-7, 1-2, 2-3, 3-6, 5-6, 4-5 | 7, 4, 1, 2, 3, 6, 5, 4 |
| T | 1-2, 2-3, 2-5, 5-8 | 1, 2, 3, back to 2, 5, 8 |
| L | 1-4, 4-7, 7-8, 8-9 | 1, 4, 7, 8, 9 |

T cannot be drawn in one stroke without retracing, which is why retracing is allowed.

### Feedback

- Correct: the progress bar starts filling its next third at once, and the guide moves to the next letter after 300ms. After the third, the install text starts 900ms later, once the bar has filled.
- Wrong: the trace turns red, the pad shakes, and the pad clears after about 450ms. The stage does not reset to 1.
- Feedback is brief so that a visitor who starts the next letter straight away is not ignored.
- Nothing is written on screen for a pass or a miss; the guide, the progress bar and the pad carry it. Screen readers get a single hidden live line: `Pattern N of 3. Draw the letter X, or type it.` when idle, then `Pattern N of 3 accepted.`, `Wrong pattern. Try again.` or `Access granted.`
- There is no ghost trace on the pad. The guide shows the pattern from the start, so misses are not counted.
- Only the pointer that started a stroke can extend or finish it. A second finger, a right-click or a lost pointer-up never submits a partial pattern.

### Fitting the screen

The whole gate (title, prompt, guide, pad and the typed-equivalent line) fits without scrolling down to 320x568. The pad shrinks with viewport height, to a minimum of 180px wide, and the guide is smaller on screens under 700px tall. On short landscape screens the text and pad sit side by side.

### Typed equivalent

Under the pad is a line, `or type the letter`, with a one-character input. It is invisible until it has keyboard focus (the Tab key or a screen reader reaches it), so the screen stays simple for visitors who draw. Typing the letter for the current stage (`p`, then `t`, then `l`, case-insensitive) passes that stage. A wrong letter does nothing and is not shown as a denial. Letters typed while feedback is showing are queued, so typing all three at normal speed works. Pressing those keys anywhere on the page, without focusing the input, also works.

A drag cannot be performed without a pointer, so this keeps all three stages required without excluding keyboard-only and screen-reader users. It is a real, focusable control rather than hidden instructions because desktop screen readers intercept single letter keys unless an input has focus, and phone screen-reader users have no keyboard until an input summons one. The label does not name the letter; the guide and the screen-reader line do, for everyone alike.

### Persistence

On success, `localStorage["ptl.unlocked"] = "1"`. It is written as soon as the third pattern passes, before the install text, so a reload during the install text is not locked out again. On load, that value skips boot, gate and install. `logout` removes it. If `localStorage` is unavailable or throws, the gate simply shows on every visit.

### Not a security boundary

The gate is a toy. All content is present in the delivered HTML so search engines can read it. Nothing private goes on this site.

## The shell

### Commands

| Command | Aliases | Output |
|---|---|---|
| `help` | `ls` | The commands that need no argument (`help` itself, `about`, `projects`, `writing`, `links`, `clear`, `logout`), each as a clickable chip with a one-line description. `open` is reached through the chips in the `projects` list. |
| `about` | `whoami` | Bio text. |
| `projects` | | Numbered list of featured projects: name, one-line description, stack tag, `open` chip. |
| `open <name or number>` | | Project detail: title, role, stack, description, media slot, repo and live links. |
| `writing` | | Featured articles (title, year, link) and a "more on Medium" link. |
| `links` | | GitHub, LinkedIn, Medium. |
| `clear` | | Empties the output. |
| `logout` | | Removes the unlock flag, resets the address bar and tab title to the home page, and returns to boot. |

- Input is trimmed and case-insensitive.
- Unknown input prints `command not found: <input>. type help`.
- `open` with no argument, or one that matches nothing, prints a usage line listing valid names.
- The word `project` may come between `open` and its argument: `open project 2` is the same as `open 2`. Tab completion works after it too.
- External links open in a new tab with `rel="noopener noreferrer"`.

### Clicking

Clicking a chip runs its command, and the transcript reads the same as if it had been typed. Chips are `<button>` elements and reachable by Tab. On touch screens chips are at least 41px tall, and in the project list the whole row opens the project. After a chip click on a desktop, focus returns to the prompt so the visitor can keep typing.

### Typing

- Enter runs the command.
- Up and Down walk the command history. History lasts until `logout` or a page reload. A half-typed line is kept and restored when the visitor arrows back down.
- Tab completes a command name, or a project name after `open`, when there is exactly one match. With text in the prompt, Tab never leaves the prompt; on an empty prompt it moves focus on as normal.
- The block cursor sits at the caret, including when the caret is moved into the middle of the line.
- The prompt is a real `<input>`. It is focused automatically on devices with a fine pointer, and not on touch devices, so the on-screen keyboard does not cover the page on arrival.
- New output scrolls into view.

### Accessibility

- The transcript is a polite live `log` region. `clear` announces "screen cleared".
- Entering and leaving the shell is announced ("terminal unlocked", "terminal locked").
- External links show an arrow and tell screen readers they open in a new tab.
- Body text and accent colours meet WCAG AA contrast against the background.
- Focus is visible on chips, links and the prompt.

## Content

Content lives in typed data files. Adding a project or article is one entry.

### Projects

| Slug | Title | Stack | Links | Media |
|---|---|---|---|---|
| `trainerroad-onboarding` | TrainerRoad onboarding | React, TypeScript, MobX, C#, .NET | none | 100-second muted screen recording of the flow, 1280x736 H.264 MP4 |
| `seattle-311` | Seattle 311 | TypeScript | live site `https://etcetera8.github.io/seattle-311/`, then `https://github.com/etcetera8/seattle-311` | screenshot of the live site |
| `copy-pasta` | Copy Pasta | TypeScript | live site `https://copypastaformac.com/`, then `https://github.com/etcetera8/copy-pasta` | screenshot of the live site |

Descriptions for the two repos start from their GitHub descriptions ("A map displaying Seattle area 311 data"; "A clipboard utility app. Save copy history for up to seven days, search copy history."). For TrainerRoad, Parker led the project and wrote almost all of it; the role reads "Project lead and primary developer". Its recording has the date-of-birth values on the Profile step painted over.

When a project has a deployed site, its `live site` link comes first, before the source link.

A media slot is a fixed 16:9 box with a dashed border and a label. Real media replaces it without changing layout. A project's `media` field is optional and takes `{ kind: "video" | "image", src, alt }`.

### Articles

1. "Adding React Electron Event Handlers from React Code to the App" (2020)
   `https://medium.com/@parkerthomas_2392/adding-react-electron-event-handlers-from-react-code-to-the-app-a119cfa6e582`
2. "Raspberry Pi closeCall Cycling License Plate Recorder" (2017)
   `https://medium.com/@parkerthomas_2392/if-youve-ever-ridden-a-bicycle-you-re-probably-familiar-with-this-scene-281b3ee70315`

More on Medium: `https://medium.com/@parkerthomas_2392`

### Links

- GitHub: `https://github.com/etcetera8`
- LinkedIn: `https://www.linkedin.com/in/parker-lindley/`
- Medium: `https://medium.com/@parkerthomas_2392`

### About

"Impressive. You made it in. I'm Parker T. Lindley, etcetera8 is my gh alias. I've been hacking across the stack for 8+ years. TypeScript, React, C#, .NET are my traditional background but I've dabbled all across the spectrum of various languages. I love pulling things apart and finding out how they work and what makes them tick."

## Architecture

Next.js (App Router) with React and TypeScript, built with `output: "export"` to plain static files. No server, no database, no CMS.

### Routes

| Route | Initial command |
|---|---|
| `/` | `help` |
| `/projects/[slug]` | `open <slug>` (one page per project via `generateStaticParams`) |

The export uses trailing slashes (`/projects/<slug>/`, written as `projects/<slug>/index.html`) so project URLs work on any static host without clean-URL rewriting.

Running `open <slug>` in the shell calls `history.replaceState` to `/projects/<slug>/` and sets the tab title to the project's, so the address bar is always shareable. Any other command, including `logout`, sets both back to the home page's.

The site must be served from the root of its domain. Subpath hosting is not supported. A direct visit to a project URL shows the gate first if locked, then lands on that project.

### Rendering and search engines

- Each page server-renders a `StaticContent` block as semantic HTML: about, projects, articles and links. The home page lists every project; a project page shows only its own project and a link back. It is hidden by default and revealed by a `<noscript>` style, so visitors without JavaScript get a readable page and crawlers find the content in the HTML.
- Each page sets title, description, a canonical URL and Open Graph tags (including a shared 1200x630 preview image), so link previews do not depend on the page body. Absolute URLs are built from `NEXT_PUBLIC_SITE_URL`. A production build fails with an explanatory message if it is unset or is not a bare origin, so a deployed site can never carry `localhost` links. `npm run build:local` sets it to the local preview address.
- The static block links the home page to each project page and back, and the build emits `sitemap.xml` and `robots.txt`, so crawlers can reach every page.
- A project marked `draft: true` in its content entry is `noindex` and left out of the sitemap while its copy is placeholder, and the home page's static block shows only its title and one-line summary. It still appears in full in the shell.
- Until the app mounts, the page shows a single `_` in the accent colour instead of a blank screen.
- The interactive app always renders an empty CRT frame first, on the server and on the first client render. After mount it reads `localStorage` and moves to boot (locked) or straight to the shell (unlocked). Boot and install are the same line-reveal component with different text. This avoids a hydration mismatch and means returning visitors never see the boot text flash.

### Units

```
src/
  app/
    layout.tsx              fonts, shared metadata, noscript style
    page.tsx                "/" : StaticContent + App(initialCommand="help")
    projects/[slug]/page.tsx  one static page per project, own metadata
    not-found.tsx           404
    sitemap.ts  robots.ts   crawl files, built from SITE_URL
    opengraph-image.png  icon.png
    globals.css             every style: tokens, scanlines, gate, terminal
  content/
    types.ts  about.ts  projects.ts  articles.ts  links.ts
  lib/
    pattern.ts              keypad geometry, stroke recording, matching (pure)
    commands.ts             parse input -> typed result; tab completion (pure)
    unlock.ts               localStorage read/write/clear, safe when unavailable
    site.ts                 SITE_URL, SITE_NAME, shared metadata helpers
  components/
    App.tsx                 phase state: init -> boot -> gate -> install -> shell
    LineSequence.tsx        text revealed a line at a time, skippable
    Boot.tsx                startup text, before the gate
    Install.tsx             package-install text, after the gate
    Gate.tsx                title, prompt, stages, typed equivalent
    PatternGuide.tsx        small picture of the pattern to draw
    PatternPad.tsx          SVG keypad, pointer handling, trace rendering
    Terminal.tsx            transcript, scroll, runs commands, URL and title
    Prompt.tsx              input, caret, history, tab completion
    StaticContent.tsx       crawler and no-JavaScript content
    outputs/                one renderer per command result
  test/
    draw.ts                 test helper: draw a path with pointer events
e2e/
  portfolio.spec.ts         browser tests
```

Boundaries:

- `lib/pattern.ts` knows nothing about the DOM. `PatternPad` converts pointer positions to key numbers and hands key sequences to it.
- `lib/commands.ts` returns a typed result such as `{ kind: "projects" }` or `{ kind: "project", slug }` or `{ kind: "notFound", input }`. It never returns JSX. `outputs/` turns results into markup.
- `Gate` reports success through a single `onUnlock` callback. `App` owns the phase and the unlock flag.
- Components read content only through `src/content`.

## Error handling

| Case | Behaviour |
|---|---|
| `localStorage` unavailable | Gate shows on every visit. No error surfaced. |
| Unknown project slug in URL | Next.js 404 page, styled as terminal output with a link home. |
| Unknown command | "command not found" line. |
| Pointer cancelled mid-stroke | Stroke is discarded, pad clears, nothing is denied. |
| Media file missing or fails to load | The placeholder slot is shown. |
| JavaScript disabled | `StaticContent` is shown. |

## Testing

- **Unit (Vitest):** `pattern.ts`: each shape passes when drawn forwards, backwards, in a different stroke order and with retracing; near-misses fail (missing segment, extra segment, wrong initial); pass-through keys are inserted. `commands.ts`: every command and alias, case and whitespace handling, `open` by name and by number, with and without the word `project`, bad arguments, unknown input. `unlock.ts`: behaviour when storage throws.
- **Component (React Testing Library):** gate shows the title, prompt, guide and progress bar and advances them through three stages, denies a wrong pattern without moving back, accepts the typed equivalent; the guide traces each letter; the install text reveals, skips and hands over to the shell; terminal prints output for clicks and typed input; history and tab completion.
- **Browser (Playwright):** run against the real static export in Chromium at a desktop size and a phone size, and in WebKit at an iPhone size. Covers drawing P, T and L and opening a project; a real unlock surviving a reload; denial; the guide, progress bar and install text at each step; the typed field appearing on focus; direct project links; the typed equivalent; the gate fitting a 320x568 screen; `logout`; typed commands; no sideways scroll at 320px; reduced motion; the no-JavaScript page; page metadata, sitemap and robots; the 404 page; and, in Chromium's phone emulation, drawing with real touch events.

Not covered by automation, and to be checked by hand: drawing with a finger on real iOS and Android devices, the typed field with a phone keyboard, screen readers, and link previews in real messaging apps.

## Out of scope

- Choosing a host or domain and deploying. The build output works on any static host.
- CMS, automatic Medium sync, analytics, contact form.
- Extra hidden commands or bonus content.
