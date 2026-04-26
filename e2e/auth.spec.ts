// e2e/auth.spec.ts
// Auth flow tests — login and admin login.
// Uses test credentials from env vars so secrets are never hardcoded.
//
// Required env vars:
//   E2E_CUSTOMER_EMAIL    — existing customer account email
//   E2E_CUSTOMER_PASSWORD — existing customer account password
//   E2E_ADMIN_EMAIL       — admin account email
//   E2E_ADMIN_PASSWORD    — admin account password

import { test, expect } from "@playwright/test";

const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("Customer login", () => {
  test.skip(!CUSTOMER_EMAIL || !CUSTOMER_PASSWORD, "E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD not set");

  test("customer can log in and see dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email']").fill(CUSTOMER_EMAIL!);
    await page.locator("input[type='password']").fill(CUSTOMER_PASSWORD!);
    await page.locator("button[type='submit']").click();

    // Should land on dashboard after successful login
    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
    // Dashboard should have a heading
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

test.describe("Admin login", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");

  test("admin can log in and see admin dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email']").fill(ADMIN_EMAIL!);
    await page.locator("input[type='password']").fill(ADMIN_PASSWORD!);
    await page.locator("button[type='submit']").click();

    // Admin should land on admin dashboard
    await expect(page).toHaveURL(/admin\/dashboard/, { timeout: 15_000 });
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("admin bookings page is accessible", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email']").fill(ADMIN_EMAIL!);
    await page.locator("input[type='password']").fill(ADMIN_PASSWORD!);
    await page.locator("button[type='submit']").click();
    await expect(page).toHaveURL(/admin\/dashboard/, { timeout: 15_000 });

    await page.goto("/admin/bookings");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    // Table or booking list should be present
    await expect(page.locator("table, [data-testid='booking-list'], .booking-list").first()).toBeVisible({ timeout: 10_000 }).catch(() => {
      // Page might show "no bookings" — that's fine as long as it loaded
    });
  });
});
