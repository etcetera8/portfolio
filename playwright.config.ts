import { defineConfig, devices } from "@playwright/test";

// Its own port (`npm run preview` keeps 3100), so a leftover preview server is never tested.
const PORT = 3101;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: ORIGIN,
  },
  // Tests run against the real static export, served the way a static host would.
  webServer: {
    command: `npm run build && npx serve out -l ${PORT}`,
    url: ORIGIN,
    env: { NEXT_PUBLIC_SITE_URL: ORIGIN },
    // Always build and serve fresh, never a stale export.
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
    // WebKit, as the closest available stand-in for iOS Safari.
    { name: "iphone", use: { ...devices["iPhone 13"] } },
  ],
});
