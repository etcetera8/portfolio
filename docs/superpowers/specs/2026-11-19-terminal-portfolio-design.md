# Terminal portfolio: design

Date: 2026-11-19
Status: approved in brainstorming, awaiting spec review

## Purpose

A personal portfolio for Parker T. Lindley that demonstrates front-end capability through the site itself. It presents featured projects, two Medium articles, and personal links inside a retro terminal. Visitors get in by drawing the initials P, T and L on a keypad.

Audience: recruiters, hiring managers and other developers. Many arrive on a phone and give the site a few seconds, so everything reachable by typing must also be reachable by clicking or tapping.

## Visitor flow

1. **Boot.** A fake startup sequence types out for about 1.5 seconds. Any key, click or tap skips it. It plays only when the terminal is locked.
2. **Gate.** The screen shows the name `PARKER T. LINDLEY`, the line `identify yourself: draw the initials`, an `AUTH n/3` indicator, and the keypad. The visitor draws P, then T, then L.
3. **Access granted.** A short screen wipe (no Matrix rain).
4. **Shell.** Banner, status line, and the output of `help` already printed. The visitor types commands or clicks them.

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
- `prefers-reduced-motion: reduce` disables the boot typing, the wipe, the ghost-trace animation and the cursor blink. Content appears immediately.

## The gate

### Keypad

Ten keys laid out like a phone: `1 2 3 / 4 5 6 / 7 8 9`, with `0` centred below. Rendered as SVG so it scales. Uses pointer events, so mouse, touch and pen behave the same. `touch-action: none` on the pad stops the page scrolling during a drag.

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
| T | 1-2, 2-3, 2-5, 5-8, and optionally 0-8 | 1, 2, 3, back to 2, 5, 8 (continuing to 0 is also accepted) |
| L | 1-4, 4-7, 7-8, 8-9 | 1, 4, 7, 8, 9 |

T cannot be drawn in one stroke without retracing, which is why retracing is allowed. T is accepted with its stem ending at 8 or at 0, because the 0 key sits directly below 8 and running the stem through it is a natural way to draw the letter.

### Feedback

- Correct: `OK n/3`, then the next stage. After the third: `ACCESS GRANTED`, then the wipe.
- Wrong: the trace turns red, the pad shakes, `ACCESS DENIED`, and the pad clears after about 450ms. The stage does not reset to 1.
- Feedback is brief (300ms after a correct stroke) so that a visitor who starts the next letter straight away is not ignored.
- The hint and the status line sit above the pad, so they stay visible on small phones, and both are in one live region.
- After two misses on a stage, a dashed ghost trace of the target shape is drawn on the pad and stays until that stage is passed.
- Only the pointer that started a stroke can extend or finish it. A second finger, a right-click or a lost pointer-up never submits a partial pattern.

### Fitting the screen

The whole gate (text, pad and the typed-equivalent line) fits without scrolling down to 320x568. The pad shrinks with viewport height, to a minimum of 180px wide. On short landscape screens the text and pad sit side by side.

### Typed equivalent

Under the pad is a visible line, `or type the initials`, with a one-character input. Typing the letter for the current stage (`p`, then `t`, then `l`, case-insensitive) passes that stage. A wrong letter does nothing and is not a miss. Pressing those keys anywhere on the page, without focusing the input, also works.

A drag cannot be performed without a pointer, so this keeps all three stages required without excluding keyboard-only and screen-reader users. It is a real, focusable control rather than hidden instructions because desktop screen readers intercept single letter keys unless an input has focus, and phone screen-reader users have no keyboard until an input summons one. The visible label does not name the letters, so the puzzle is the same for everyone.

### Persistence

On success, `localStorage["ptl.unlocked"] = "1"`. On load, that value skips boot and gate. `logout` removes it. If `localStorage` is unavailable or throws, the gate simply shows on every visit.

### Not a security boundary

The gate is a toy. All content is present in the delivered HTML so search engines can read it. Nothing private goes on this site.

## The shell

### Commands

| Command | Aliases | Output |
|---|---|---|
| `help` | `ls` | The command list. Each command is a clickable chip with a one-line description. |
| `about` | `whoami` | Bio text. |
| `projects` | | Numbered list of featured projects: name, one-line description, stack tag, `open` chip. |
| `open <name or number>` | | Project detail: title, role, stack, description, media slot, repo and live links. |
| `writing` | | Featured articles (title, year, link) and a "more on Medium" link. |
| `links` | | GitHub, LinkedIn, Medium. |
| `clear` | | Empties the output. |
| `logout` | | Removes the unlock flag and returns to boot. |

- Input is trimmed and case-insensitive.
- Unknown input prints `command not found: <input>. type help`.
- `open` with no argument, or one that matches nothing, prints a usage line listing valid names.
- External links open in a new tab with `rel="noopener noreferrer"`.

### Clicking

Clicking a chip writes the command into the prompt and runs it, so the transcript reads the same as if it had been typed. Chips are `<button>` elements and reachable by Tab.

### Typing

- Enter runs the command.
- Up and Down walk the command history for the session.
- Tab completes a command name, or a project name after `open`, when there is exactly one match.
- The prompt is a real `<input>`. It is focused automatically on devices with a fine pointer, and not on touch devices, so the on-screen keyboard does not cover the page on arrival.
- New output scrolls into view.

### Accessibility

- The output region is `aria-live="polite"`.
- Body text and accent colours meet WCAG AA contrast against the background.
- Focus is visible on chips, links and the prompt.

## Content

Content lives in typed data files. Adding a project or article is one entry.

### Projects

| Slug | Title | Stack | Links | Media |
|---|---|---|---|---|
| `trainerroad-onboarding` | TrainerRoad onboarding | placeholder | none yet | placeholder slot for a 10 to 20 second muted MP4/WebM loop |
| `seattle-311` | Seattle 311 | TypeScript | `https://github.com/etcetera8/seattle-311` | placeholder slot for a screenshot |
| `copy-pasta` | Copy Pasta | TypeScript | `https://github.com/etcetera8/copy-pasta` | placeholder slot for a screenshot |

Descriptions for the two repos start from their GitHub descriptions ("A map displaying Seattle area 311 data"; "A clipboard utility app. Save copy history for up to seven days, search copy history."). Role, stack and description for TrainerRoad are placeholder text until Parker supplies them.

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

Placeholder, to be replaced by Parker: "Parker T. Lindley. Fullstack dev. Rides bikes. Writing code since the dial-up days."

## Architecture

Next.js (App Router) with React and TypeScript, built with `output: "export"` to plain static files. No server, no database, no CMS.

### Routes

| Route | Initial command |
|---|---|
| `/` | `help` |
| `/projects/[slug]` | `open <slug>` (one page per project via `generateStaticParams`) |

The export uses trailing slashes (`/projects/<slug>/`, written as `projects/<slug>/index.html`) so project URLs work on any static host without clean-URL rewriting.

Running `open <slug>` in the shell calls `history.replaceState` to `/projects/<slug>/`, so the address bar is always shareable. Any other command sets it back to `/`. A direct visit to a project URL shows the gate first if locked, then lands on that project.

### Rendering and search engines

- Each page server-renders a `StaticContent` block: about, all projects, articles and links as semantic HTML. It is hidden by default and revealed by a `<noscript>` style, so visitors without JavaScript get a readable page and crawlers find the content in the HTML.
- Each page sets title, description and Open Graph tags, so link previews do not depend on the page body.
- The interactive app always renders an empty CRT frame first, on the server and on the first client render. After mount it reads `localStorage` and moves to boot (locked) or straight to the shell (unlocked). This avoids a hydration mismatch and means returning visitors never see the boot text flash.

### Units

```
src/
  app/
    layout.tsx              fonts, metadata, CRT frame
    page.tsx                "/" : StaticContent + App(initialCommand="help")
    projects/[slug]/page.tsx
    globals.css             colour tokens, scanlines, base type
  content/
    about.ts  projects.ts  articles.ts  links.ts
  lib/
    pattern.ts              shapes, segment recording, matching (pure)
    commands.ts             parse input -> typed result (pure)
    unlock.ts               localStorage read/write/clear, safe when unavailable
  components/
    App.tsx                 phase state: boot -> gate -> shell
    Boot.tsx
    Gate.tsx                stage tracking, hints, keyboard equivalent
    PatternPad.tsx          SVG keypad, pointer handling, trace rendering
    Terminal.tsx            transcript, scroll, runs commands
    Prompt.tsx              input, history, tab completion
    StaticContent.tsx
    outputs/                one renderer per command result
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
| Pointer cancelled mid-stroke | Stroke is discarded, pad clears, no miss counted. |
| Media file missing or fails to load | The placeholder slot is shown. |
| JavaScript disabled | `StaticContent` is shown. |

## Testing

- **Unit (Vitest):** `pattern.ts`: each shape passes when drawn forwards, backwards, in a different stroke order and with retracing; near-misses fail (missing segment, extra segment, wrong initial); pass-through keys are inserted. `commands.ts`: every command and alias, case and whitespace handling, `open` by name and by number, bad arguments, unknown input. `unlock.ts`: behaviour when storage throws.
- **Component (React Testing Library):** gate advances through three stages, counts misses per stage, shows the ghost trace after two misses, accepts the typed equivalent; terminal prints output for clicks and typed input; history and tab completion.
- **Browser (Playwright):** one test that drags P, T and L, sees the shell, opens a project and checks the URL; run in Chromium at a desktop size and a phone size, and in WebKit at an iPhone size. One test that a stored unlock skips the gate and `logout` restores it.

## Out of scope

- Real media, final bio text and TrainerRoad project copy (placeholders now, supplied later).
- Choosing a host or domain and deploying. The build output works on any static host.
- CMS, automatic Medium sync, analytics, contact form.
- Extra hidden commands or bonus content.
