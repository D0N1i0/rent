// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

/**
 * Base URL is read from E2E_BASE_URL env var so tests run against
 * local dev (http://localhost:3000), Vercel preview, or production
 * without code changes.
 */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Default timeout per action
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Don't start the dev server automatically — run `npm run dev` separately
  // or point E2E_BASE_URL at a deployed preview.
});
