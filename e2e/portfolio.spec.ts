import { expect, test, type Page } from "@playwright/test";
import {
  EXAMPLE_PATHS,
  PAD_HEIGHT,
  PAD_WIDTH,
  keyPosition,
  type Key,
} from "../src/lib/pattern";
import { STORAGE_KEY } from "../src/lib/unlock";

const { P, T, L } = EXAMPLE_PATHS;

const HELP_HEADING = "AVAILABLE COMMANDS (type or click)";

type Point = { x: number; y: number };

/** Viewport points that trace the given keys on the pad, with `steps` points between keys. */
async function padPoints(page: Page, keys: readonly Key[], steps = 6): Promise<Point[]> {
  const pad = page.getByTestId("pattern-pad");
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  if (!box) throw new Error("pattern pad is not visible");

  const at = (key: Key): Point => {
    const [x, y] = keyPosition(key);
    return { x: box.x + (x / PAD_WIDTH) * box.width, y: box.y + (y / PAD_HEIGHT) * box.height };
  };

  const points = [at(keys[0])];
  for (let index = 1; index < keys.length; index++) {
    const from = at(keys[index - 1]);
    const to = at(keys[index]);
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      points.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    }
  }
  return points;
}

/** Drag the mouse through the given keys on the pad. */
async function draw(page: Page, keys: readonly Key[]) {
  const [start, ...rest] = await padPoints(page, keys);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (const point of rest) await page.mouse.move(point.x, point.y);
  await page.mouse.up();
}

/** Draw with real touch events (Chromium only), so the pad sees pointerType "touch". */
async function drawWithTouch(page: Page, keys: readonly Key[]) {
  const cdp = await page.context().newCDPSession(page);
  const [start, ...rest] = await padPoints(page, keys);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
  for (const point of rest) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

/** Waits until the gate is ready for pattern `step` of 3: the guide shows that letter. */
async function expectStep(page: Page, step: number) {
  await expect(page.getByRole("img", { name: new RegExp(`^Pattern ${step} of 3:`) })).toBeVisible();
}

/** The progress bar has `done` thirds lit, each a run of blocks from the left. */
async function expectProgress(page: Page, done: number) {
  const bar = page.getByTestId("gate-progress");
  await expect(bar).toHaveAttribute("aria-valuenow", String(done));
  const blocks = await bar.locator(".gate-bar-block").count();
  expect(blocks % 3).toBe(0);
  await expect(bar.locator(".gate-bar-block.on")).toHaveCount((blocks / 3) * done);
}

/** Seeds the unlock flag before the page loads. */
async function seedUnlocked(page: Page) {
  await page.addInitScript((key) => window.localStorage.setItem(key, "1"), STORAGE_KEY);
}

test("draw P, T and L, then open a project, and the unlock survives a reload", async ({ page }) => {
  await page.goto("/");

  // The boot sequence finishes on its own, leaving the lock screen.
  await expect(page.getByTestId("pattern-pad")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "PTL" })).toBeVisible();
  await expect(page.getByText("Draw Pattern to Access Restricted Portfolio")).toBeVisible();
  await expectProgress(page, 0);
  await expect(page.getByText("authenticating...")).toBeVisible();
  await expect(page.getByRole("img", { name: "Pattern 1 of 3: the letter P" })).toBeVisible();

  await draw(page, P);
  await expectProgress(page, 1);
  await expect(page.getByRole("img", { name: "Pattern 2 of 3: the letter T" })).toBeVisible();

  await draw(page, T);
  await expectProgress(page, 2);
  await expect(page.getByRole("img", { name: "Pattern 3 of 3: the letter L" })).toBeVisible();

  await draw(page, L);
  await expectProgress(page, 3);
  // Install-style text plays, then the terminal opens.
  await expect(page.getByTestId("install")).toBeVisible();
  await expect(page.getByText("$ npm install portfolio")).toBeVisible();
  await expect(page.getByText(HELP_HEADING)).toBeVisible();
  await expect(page.getByTestId("install")).toHaveCount(0);

  await page.getByRole("button", { name: "projects", exact: true }).click();
  await page.getByRole("button", { name: "open seattle-311", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Seattle 311" })).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/seattle-311\/$/);

  // The project's screenshot is served and decodes, and the deployed site is linked.
  const screenshot = page.getByRole("img", { name: /^The Seattle 311 map/ });
  await expect(screenshot).toBeVisible();
  await expect
    .poll(() => screenshot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  await expect(page.getByRole("link", { name: /^live site/ })).toHaveAttribute(
    "href",
    "https://etcetera8.github.io/seattle-311/",
  );

  // A real unlock was remembered: no boot, no gate.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Seattle 311" })).toBeVisible();
  await expect(page.getByTestId("pattern-pad")).toHaveCount(0);
});

test("the TrainerRoad screen recording loads and plays", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit", "Playwright's Chromium build cannot decode H.264");
  await seedUnlocked(page);
  await page.goto("/projects/trainerroad-onboarding/");

  const video = page.locator("video.media");
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute("aria-label", /^Screen recording of the TrainerRoad onboarding flow/);
  const read = <T>(pick: (el: HTMLVideoElement) => T) => video.evaluate(pick);
  await expect.poll(() => read((el) => el.videoWidth)).toBe(1280);
  // Muted, so it may start by itself.
  await expect.poll(() => read((el) => el.currentTime)).toBeGreaterThan(0);
});

test("the skip link goes straight to the terminal and is remembered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("pattern-pad")).toBeVisible();

  await page.getByRole("button", { name: "Skip the lock screen" }).click();
  await expect(page.getByText(HELP_HEADING)).toBeVisible();
  await expect(page.getByTestId("pattern-pad")).toHaveCount(0);
  await expect(page.getByTestId("install")).toHaveCount(0);

  await page.reload();
  await expect(page.getByText(HELP_HEADING)).toBeVisible();
  await expect(page.getByTestId("pattern-pad")).toHaveCount(0);
});

test("a wrong pattern is denied and the step stays put", async ({ page }) => {
  await page.goto("/");
  const pad = page.getByTestId("pattern-pad");
  await expect(pad).toBeVisible();

  // The denied state lasts under half a second. If a check misses it, draw another
  // wrong stroke and look again.
  await expect(async () => {
    await draw(page, L);
    await expect(page.locator(".gate [role=status]")).toHaveText("Wrong pattern. Try again.", {
      timeout: 400,
    });
  }).toPass({ timeout: 15_000 });

  // Afterwards the pad is clear again and the visitor is still on the first pattern.
  await expect(pad).not.toHaveClass(/denied/);
  await expect(pad.locator(".pad-key.on")).toHaveCount(0);
  await expectProgress(page, 0);
  await expect(page.getByRole("img", { name: "Pattern 1 of 3: the letter P" })).toBeVisible();
});

test("a stroke that ends outside the pad still counts (pointer capture)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("pattern-pad")).toBeVisible();

  const points = await padPoints(page, P);
  const box = (await page.getByTestId("pattern-pad").boundingBox())!;
  const viewport = page.viewportSize()!;
  const outside = [
    { x: 1, y: 1 },
    { x: viewport.width - 1, y: 1 },
    { x: 1, y: viewport.height - 1 },
  ].find(
    (point) =>
      point.x < box.x || point.x > box.x + box.width || point.y < box.y || point.y > box.y + box.height,
  );
  if (!outside) throw new Error("no point outside the pad is in view");

  // Draw the whole P, then leave the pad and release there. Only a captured pointer
  // delivers that pointerup to the pad.
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (const point of points.slice(1)) await page.mouse.move(point.x, point.y);
  await page.mouse.move(outside.x, outside.y, { steps: 4 });
  await page.mouse.up();

  await expectStep(page, 2);
});

test("the pad can be drawn on with real touch input", async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== "chromium" || !isMobile, "needs CDP touch events on a mobile project");
  await page.goto("/");
  await expect(page.getByTestId("pattern-pad")).toBeVisible();

  await drawWithTouch(page, P);
  await expectStep(page, 2);
  await drawWithTouch(page, T);
  await expectStep(page, 3);
  await drawWithTouch(page, L);
  await expect(page.getByText(HELP_HEADING)).toBeVisible();
});

test("a direct project link shows the gate, then that project; keys work as an equivalent", async ({
  page,
}) => {
  await page.goto("/projects/copy-pasta/");
  await expect(page.getByTestId("pattern-pad")).toBeVisible();

  await page.keyboard.press("p");
  await expectStep(page, 2);
  await page.keyboard.press("t");
  await expectStep(page, 3);
  await page.keyboard.press("l");

  await expect(page.getByRole("heading", { name: "Copy Pasta" })).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/copy-pasta\/$/);
});

test("the letters can be typed into a field that appears on focus, and stay unlocked on reload", async ({
  page,
}) => {
  await page.goto("/");
  const field = page.getByLabel("Type the letter shown");
  await expect(page.getByTestId("pattern-pad")).toBeVisible();

  // Unseen until it is reached with the keyboard.
  const row = page.locator(".gate-type");
  await expect(row).toHaveCSS("opacity", "0");
  await field.focus();
  await expect(row).toHaveCSS("opacity", "1");

  // Typed at a normal pace, without waiting for each stage to settle.
  await field.pressSequentially("ptl", { delay: 100 });

  await expect(page.getByText(HELP_HEADING)).toBeVisible();

  await page.reload();
  await expect(page.getByText(HELP_HEADING)).toBeVisible();
  await expect(page.getByTestId("pattern-pad")).toHaveCount(0);
});

test("the gate fits a small phone without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const pad = page.getByTestId("pattern-pad");
  await expect(pad).toBeVisible();

  for (const locator of [
    page.getByRole("heading", { level: 1, name: "PTL" }),
    page.getByTestId("pattern-guide"),
    page.getByTestId("gate-progress"),
    page.getByRole("button", { name: "Skip the lock screen" }),
    pad,
    page.getByLabel("Type the letter shown"),
  ]) {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(568);
  }
});

test("a stored unlock skips the gate, and logout locks it again", async ({ page }) => {
  // Seed the flag once. The sessionStorage guard stops it being re-seeded on reload.
  await page.addInitScript((key) => {
    if (!window.sessionStorage.getItem("seeded")) {
      window.localStorage.setItem(key, "1");
      window.sessionStorage.setItem("seeded", "1");
    }
  }, STORAGE_KEY);

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
  await seedUnlocked(page);
  await page.goto("/");

  // The email address is in view before any command is run.
  await expect(
    page.locator("header .contact-line").getByRole("link", { name: "parker.t.lindley@gmail.com" }),
  ).toHaveAttribute("href", "mailto:parker.t.lindley@gmail.com");

  const prompt = page.getByLabel("Command");
  await prompt.fill("links");
  await prompt.press("Enter");
  await expect(page.getByRole("link", { name: /^github\.com\/etcetera8/ })).toBeVisible();

  await prompt.fill("contact");
  await prompt.press("Enter");
  await expect(page.getByRole("log").getByRole("link", { name: "parker.t.lindley@gmail.com" })).toBeVisible();

  await prompt.fill("nonsense");
  await prompt.press("Enter");
  await expect(page.getByText("command not found: nonsense. type help")).toBeVisible();

  // "open project 2" is the same as "open 2": the second project in the list.
  await prompt.fill("open project 2");
  await prompt.press("Enter");
  await expect(page.getByRole("heading", { name: "Seattle 311" })).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/seattle-311\/$/);
});

test("clicking a project's name in the list opens it, not only the chip", async ({ page }) => {
  await seedUnlocked(page);
  await page.goto("/");
  await page.getByRole("button", { name: "projects", exact: true }).click();

  // A real click at the name's position. Playwright's own click() would refuse, because
  // the chip's hit area covers the name; that cover is exactly what is being tested.
  const name = page.locator(".proj-name", { hasText: "copy-pasta" });
  await expect(name).toBeVisible();
  await name.scrollIntoViewIfNeeded();
  const box = (await name.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await expect(page.getByRole("heading", { name: "Copy Pasta" })).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/copy-pasta\/$/);
});

test("the page does not scroll sideways", async ({ page }) => {
  await seedUnlocked(page);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");

  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  const prompt = page.getByLabel("Command");

  await page.getByRole("button", { name: "projects", exact: true }).click();
  await expect(page.getByText("copy-pasta", { exact: true })).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);

  // The résumé: long bullet points, and skill rows that stack on a narrow screen.
  await prompt.fill("resume");
  await prompt.press("Enter");
  await expect(page.getByRole("heading", { name: "Senior Software Engineer @ TrainerRoad" })).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
  // Its PDF is really served, as a PDF.
  const pdf = await page.request.get(
    (await page.getByRole("log").getByRole("link", { name: /^pdf version/ }).getAttribute("href"))!,
  );
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

  // Long unbroken text, in the echoed input and the error.
  const long = "x".repeat(70);
  await prompt.fill(long);
  await prompt.press("Enter");
  await expect(page.getByText(`command not found: ${long}`)).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);

  // The longest project name, and its placeholder media slot.
  await prompt.fill("open trainerroad-onboarding");
  await prompt.press("Enter");
  await expect(page.getByRole("heading", { name: "TrainerRoad onboarding" })).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);

  // A project with a real screenshot and two links.
  await prompt.fill("open 2");
  await prompt.press("Enter");
  await expect(page.getByRole("heading", { name: "Seattle 311" })).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("neither the boot text nor the install text is ever shown", async ({ page }) => {
    // Records any sighting of either sequence, including ones that last a single frame.
    await page.addInitScript(() => {
      const seen = { boot: false, install: false };
      Object.assign(window, { __sequencesSeen: seen });
      const check = () => {
        if (document.querySelector('[data-testid="boot"]')) seen.boot = true;
        if (document.querySelector('[data-testid="install"]')) seen.install = true;
      };
      new MutationObserver(check).observe(document, { childList: true, subtree: true });
      check();
    });

    await page.goto("/");
    await expect(page.getByTestId("pattern-pad")).toBeVisible();
    await page.keyboard.press("p");
    await expectStep(page, 2);
    await page.keyboard.press("t");
    await expectStep(page, 3);
    await page.keyboard.press("l");
    await expect(page.getByText(HELP_HEADING)).toBeVisible();

    const seen = await page.evaluate(
      () =>
        (window as unknown as { __sequencesSeen: { boot: boolean; install: boolean } })
          .__sequencesSeen,
    );
    expect(seen).toEqual({ boot: false, install: false });
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the plain content is shown and pages link to each other", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "PARKER T. LINDLEY" })).toBeVisible();
    await expect(page.getByTestId("pattern-pad")).toHaveCount(0);
    // The (empty) app frame is hidden by the noscript style.
    await expect(page.locator(".app-root")).toBeHidden();

    await page.getByRole("link", { name: "Seattle 311" }).click();
    await expect(page).toHaveURL(/\/projects\/seattle-311\/$/);
    await expect(page.getByText(/^An interactive 3D map of Seattle's 311 service requests\./)).toBeVisible();

    await page.getByRole("link", { name: "all projects" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test("an unknown path shows the 404 page", async ({ page }) => {
  const response = await page.goto("/projects/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("no such file or directory")).toBeVisible();
});

test("canonical, robots, sitemap and robots.txt are right", async ({ page, request, baseURL }) => {
  const origin = baseURL!.replace(/\/$/, "");
  const head = async (path: string) => {
    await page.goto(path);
    return {
      canonical: await page.locator("link[rel=canonical]").getAttribute("href"),
      robots: await page.locator("meta[name=robots]").count(),
      robotsContent: await page
        .locator("meta[name=robots]")
        .evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")).join(", ")),
      ogUrl: await page.locator("meta[property='og:url']").getAttribute("content"),
    };
  };

  const home = await head("/");
  expect(home.canonical).toBe(`${origin}/`);
  expect(home.ogUrl).toBe(`${origin}/`);
  expect(home.robotsContent).not.toContain("noindex");

  const project = await head("/projects/seattle-311/");
  expect(project.canonical).toBe(`${origin}/projects/seattle-311/`);
  expect(project.ogUrl).toBe(`${origin}/projects/seattle-311/`);
  expect(project.robotsContent).not.toContain("noindex");

  const recorded = await head("/projects/trainerroad-onboarding/");
  expect(recorded.canonical).toBe(`${origin}/projects/trainerroad-onboarding/`);
  expect(recorded.robotsContent).not.toContain("noindex");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(urls).toContain(`${origin}/`);
  expect(urls).toContain(`${origin}/projects/seattle-311/`);
  expect(urls).toContain(`${origin}/projects/trainerroad-onboarding/`);
  for (const url of urls) {
    expect(url.startsWith(`${origin}/`)).toBe(true);
    expect(url.endsWith("/")).toBe(true);
  }

  const robotsTxt = await (await request.get("/robots.txt")).text();
  expect(robotsTxt).toContain(`Sitemap: ${origin}/sitemap.xml`);
});
