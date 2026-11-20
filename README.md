# Portfolio

A terminal-styled personal portfolio. Visitors see a short boot screen, then a lock screen where they draw the initials P, T and L on a keypad; after some package-install text they browse projects, writing and links by typing commands or clicking command chips. The gate is a toy: it is a flourish, not security, and everything it hides is also in the page source.

## Requirements and setup

- Node 22 or newer
- `npm ci`
- `npx playwright install chromium webkit` (needed once, for the browser tests)

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server on port 3000. `NEXT_PUBLIC_SITE_URL` may be unset here. |
| `npm run build` | Production build, exported to `out/`. Fails without `NEXT_PUBLIC_SITE_URL` (see below). |
| `npm run build:local` | Same build with `NEXT_PUBLIC_SITE_URL=http://localhost:3100`, for previewing locally. |
| `npm run preview` | Serves the existing `out/` on port 3100. It does not build; it serves whatever the last build produced. |
| `npm run typecheck` | `tsc --noEmit` over the app, the config and the e2e files. |
| `npm test` | Unit and component tests (Vitest, jsdom). |
| `npm run test:e2e` | Builds the site and runs the Playwright tests against it (see Tests). |
| `npm run check` | Typecheck, unit tests, then e2e tests. |

## `NEXT_PUBLIC_SITE_URL`

The public origin of the deployed site, for example `https://example.com`. It is used for every canonical link, `og:url`, `og:image`, the sitemap and `robots.txt`.

A production build (`npm run build`) fails with an explanatory message if it is unset, so localhost URLs can never be published by accident. It must be an absolute http(s) URL with no path, query or hash, because the site only works at a domain root. One trailing slash is accepted and removed. In development and in unit tests an unset value falls back to `http://localhost:3000`.

```
NEXT_PUBLIC_SITE_URL=https://example.com npm run build
```

## Deploying

`npm run build` writes a static site to `out/`. Upload that directory to any static host.

- Serve it at a domain root (not under a sub-path such as `/portfolio/`).
- Configure the host to serve `404.html` with a 404 status for unknown paths.
- The build needs network access, because it downloads the fonts (IBM Plex Mono and VT323) from Google Fonts.
- Pages are exported as `folder/index.html`, and project URLs end in a slash (`/projects/seattle-311/`).

## Editing content

All content is in `src/content/`:

- `about.ts`: name, tagline and bio.
- `projects.ts`: the projects, in display order. When a project has a deployed site, list it first in `links` with the label `live site`. Adding a project is one new entry; its page, its sitemap entry and its shell commands (`open <slug>`, `open <number>`) follow from it.
- `articles.ts`: writing, with year and link.
- `links.ts`: profile links.

`draft: true` on a project marks its copy as placeholder; no project is a draft at the moment. A draft still appears in the shell, but its page is `noindex`, it is left out of the sitemap, the home page's plain-HTML block shows only its title and summary, and its page description and link-preview text use the summary instead of the description.

To add media to a project, put the file under `public/` (for example `public/media/seattle-311.mp4`, which is served at `/media/seattle-311.mp4`) and add `media` to the project:

```ts
media: { kind: "video", src: "/media/seattle-311.mp4", alt: "Short description of what the video shows" },
```

`kind` is `"video"` or `"image"`. Images display in a 16:9 box, so a 1280x720 screenshot fits exactly. Without `media`, a placeholder slot is shown. A video that fails to load falls back to the placeholder.

## How the unlock works

The lock screen shows "PTL", the line "Draw Pattern to Access Restricted Portfolio", a small picture of the pattern to draw, a progress bar that fills by a third for each correct pattern, and the keypad. Visitors draw P, then T, then L. They can instead type the letters p, t, l, either anywhere on the page or into the "or type the letter" field, which stays invisible until it has keyboard focus. After the third pattern, a few lines of package-install text play (any key or tap skips them) and the terminal opens. A successful unlock is remembered in `localStorage` under the key `ptl.unlocked` (value `"1"`), so later visits go straight to the terminal. The `logout` command clears it. If storage is unavailable the gate simply shows each time. A direct link to a project shows the gate first and then that project.

## Tests

- Unit and component tests sit next to the code as `src/**/*.test.ts(x)` and run with Vitest in jsdom. They cover the pure modules (pattern matching, command parsing, unlock storage, site URL validation, sitemap) and each component's behaviour.
- Browser tests are in `e2e/` and run with Playwright against the real static export (`npm run test:e2e` builds it and serves it on port 3101). They run in Chromium on desktop, Chromium emulating a Pixel 7, and WebKit emulating an iPhone 13. They cover drawing and typing the unlock, real touch input, persistence and logout, commands, layout without sideways scrolling, reduced motion, no-JavaScript content, the 404 page, and canonical, robots and sitemap output.

## Design

The design spec is in `docs/superpowers/specs/2026-11-19-terminal-portfolio-design.md`.
