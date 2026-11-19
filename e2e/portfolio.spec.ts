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
  await expect(page.getByTestId("gate-status")).toHaveText("ACCESS DENIED");
  await expect(page.getByTestId("gate-status")).toHaveText("AWAITING INPUT");
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

test("the initials can be typed into the field under the pad", async ({ page }) => {
  await page.goto("/");
  const field = page.getByLabel("Type the initials, one letter at a time");
  await expect(field).toBeVisible();

  // Typed at a normal pace, without waiting for each stage to settle.
  await field.pressSequentially("ptl", { delay: 100 });

  await expect(page.getByText(HELP_HEADING)).toBeVisible();
});

test("the gate fits a small phone without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const pad = page.getByTestId("pattern-pad");
  await expect(pad).toBeVisible();

  for (const locator of [
    page.getByTestId("gate-status"),
    pad,
    page.getByLabel("Type the initials, one letter at a time"),
  ]) {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(568);
  }
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
  await expect(page.getByRole("link", { name: /^github\.com\/etcetera8/ })).toBeVisible();

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

test("with reduced motion the boot screen is skipped", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByTestId("pattern-pad")).toBeVisible();
  await expect(page.getByTestId("boot")).toHaveCount(0);
  await context.close();
});

test("without JavaScript the plain content is shown and pages link to each other", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "PARKER T. LINDLEY" })).toBeVisible();
  await expect(page.getByTestId("pattern-pad")).toHaveCount(0);

  await page.getByRole("link", { name: "Seattle 311" }).click();
  await expect(page).toHaveURL(/\/projects\/seattle-311\/$/);
  await expect(page.getByText("A map displaying Seattle area 311 data.")).toBeVisible();

  await page.getByRole("link", { name: "all projects" }).click();
  await expect(page).toHaveURL(/\/$/);
  await context.close();
});

test("an unknown path shows the 404 page", async ({ page }) => {
  const response = await page.goto("/projects/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("no such file or directory")).toBeVisible();
});
